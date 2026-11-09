import mongoose from 'mongoose';
import { Cuenta } from '../models/Cuenta.js';
import { Transaccion, TIPOS } from '../models/Transaccion.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { badRequest, notFound } from '../utils/ApiError.js';
import { validarDescripcion, validarMonto, validarNumeroCuenta } from '../utils/dinero.js';
import { serializarCuenta, serializarTransaccion } from '../utils/serializadores.js';

/* ------------------------------------------------------------------ */
/* Atomicidad                                                          */
/* ------------------------------------------------------------------ */
/**
 * Ejecuta `fn` dentro de una transacción ACID cuando MongoDB corre como replica set
 * (USE_TRANSACTIONS=true). En un MongoDB local standalone no existen transacciones,
 * por eso las operaciones usan actualizaciones atómicas condicionales ($inc con filtro
 * de saldo suficiente) + compensación (reversión) si un paso posterior falla.
 */
async function ejecutarAtomico(fn) {
  if (process.env.USE_TRANSACTIONS !== 'true') return fn(undefined);

  const session = await mongoose.startSession();
  try {
    let resultado;
    await session.withTransaction(async () => {
      resultado = await fn(session);
    });
    return resultado;
  } finally {
    await session.endSession();
  }
}

const opciones = (session) => (session ? { session } : {});

const cuentaNoExiste = (numero) => notFound(`La cuenta "${numero}" no existe.`);

/* ------------------------------------------------------------------ */
/* GET /api/cuenta  (listado, usado para elegir cuenta / destino)      */
/* ------------------------------------------------------------------ */
export const listarCuentas = asyncHandler(async (_req, res) => {
  const cuentas = await Cuenta.find().sort({ numeroCuenta: 1 });
  res.json(cuentas.map(serializarCuenta));
});

/* ------------------------------------------------------------------ */
/* GET /api/cuenta/:id  -> saldo y datos de la cuenta                  */
/* ------------------------------------------------------------------ */
export const obtenerCuenta = asyncHandler(async (req, res) => {
  const numero = validarNumeroCuenta(req.params.id, 'id');
  const cuenta = await Cuenta.findOne({ numeroCuenta: numero });
  if (!cuenta) throw cuentaNoExiste(numero);
  res.json(serializarCuenta(cuenta));
});

/* ------------------------------------------------------------------ */
/* POST /api/cuenta/deposito                                           */
/* body: { cuentaId, monto, descripcion? }                             */
/* ------------------------------------------------------------------ */
export const depositar = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const numero = validarNumeroCuenta(body.cuentaId, 'cuentaId');
  const monto = validarMonto(body.monto);
  const descripcion = validarDescripcion(body.descripcion);

  const { cuenta, tx } = await ejecutarAtomico(async (session) => {
    const cuenta = await Cuenta.findOneAndUpdate(
      { numeroCuenta: numero },
      { $inc: { saldoCentavos: monto } },
      { new: true, ...opciones(session) }
    );
    if (!cuenta) throw cuentaNoExiste(numero);

    try {
      const tx = await new Transaccion({
        tipo: 'deposito',
        montoCentavos: monto,
        cuentaDestino: numero,
        saldoDestinoPosterior: cuenta.saldoCentavos,
        descripcion,
      }).save(opciones(session));
      return { cuenta, tx };
    } catch (error) {
      // Compensación: si no se pudo registrar el movimiento, se revierte el saldo.
      if (!session) await Cuenta.updateOne({ numeroCuenta: numero }, { $inc: { saldoCentavos: -monto } });
      throw error;
    }
  });

  res.status(201).json({
    mensaje: 'Depósito realizado con éxito.',
    cuenta: serializarCuenta(cuenta),
    transaccion: serializarTransaccion(tx, numero),
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/cuenta/retiro                                             */
/* body: { cuentaId, monto, descripcion? }                             */
/* ------------------------------------------------------------------ */
export const retirar = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const numero = validarNumeroCuenta(body.cuentaId, 'cuentaId');
  const monto = validarMonto(body.monto);
  const descripcion = validarDescripcion(body.descripcion);

  const { cuenta, tx } = await ejecutarAtomico(async (session) => {
    // El filtro { saldoCentavos >= monto } + $inc es UNA sola operación atómica:
    // dos retiros simultáneos jamás pueden dejar el saldo en negativo.
    const cuenta = await Cuenta.findOneAndUpdate(
      { numeroCuenta: numero, saldoCentavos: { $gte: monto } },
      { $inc: { saldoCentavos: -monto } },
      { new: true, ...opciones(session) }
    );

    if (!cuenta) {
      const existe = await Cuenta.exists({ numeroCuenta: numero }).session(session ?? null);
      if (!existe) throw cuentaNoExiste(numero);
      throw badRequest('Saldo insuficiente para realizar el retiro.');
    }

    try {
      const tx = await new Transaccion({
        tipo: 'retiro',
        montoCentavos: monto,
        cuentaOrigen: numero,
        saldoOrigenPosterior: cuenta.saldoCentavos,
        descripcion,
      }).save(opciones(session));
      return { cuenta, tx };
    } catch (error) {
      if (!session) await Cuenta.updateOne({ numeroCuenta: numero }, { $inc: { saldoCentavos: monto } });
      throw error;
    }
  });

  res.status(201).json({
    mensaje: 'Retiro realizado con éxito.',
    cuenta: serializarCuenta(cuenta),
    transaccion: serializarTransaccion(tx, numero),
  });
});

/* ------------------------------------------------------------------ */
/* POST /api/cuenta/transferencia                                      */
/* body: { cuentaOrigen, cuentaDestino, monto, descripcion? }          */
/* ------------------------------------------------------------------ */
export const transferir = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const origen = validarNumeroCuenta(body.cuentaOrigen, 'cuentaOrigen');
  const destino = validarNumeroCuenta(body.cuentaDestino, 'cuentaDestino');
  const monto = validarMonto(body.monto);
  const descripcion = validarDescripcion(body.descripcion);

  if (origen === destino) {
    throw badRequest('La cuenta de origen y la de destino no pueden ser la misma.');
  }

  const { cuentaOrigen, tx } = await ejecutarAtomico(async (session) => {
    const opts = opciones(session);

    // 1) La cuenta destino debe existir (404 si no).
    const existeDestino = await Cuenta.exists({ numeroCuenta: destino }).session(session ?? null);
    if (!existeDestino) throw cuentaNoExiste(destino);

    // 2) Débito atómico en origen, solo si hay fondos suficientes.
    const origenActualizado = await Cuenta.findOneAndUpdate(
      { numeroCuenta: origen, saldoCentavos: { $gte: monto } },
      { $inc: { saldoCentavos: -monto } },
      { new: true, ...opts }
    );
    if (!origenActualizado) {
      const existeOrigen = await Cuenta.exists({ numeroCuenta: origen }).session(session ?? null);
      if (!existeOrigen) throw cuentaNoExiste(origen);
      throw badRequest('Saldo insuficiente para realizar la transferencia.');
    }

    // 3) Crédito en destino. Si falla, se compensa el débito.
    let destinoActualizado;
    try {
      destinoActualizado = await Cuenta.findOneAndUpdate(
        { numeroCuenta: destino },
        { $inc: { saldoCentavos: monto } },
        { new: true, ...opts }
      );
      if (!destinoActualizado) throw cuentaNoExiste(destino);
    } catch (error) {
      if (!session) await Cuenta.updateOne({ numeroCuenta: origen }, { $inc: { saldoCentavos: monto } });
      throw error;
    }

    // 4) Registro del movimiento. Si falla, se revierten ambos saldos.
    try {
      const tx = await new Transaccion({
        tipo: 'transferencia',
        montoCentavos: monto,
        cuentaOrigen: origen,
        cuentaDestino: destino,
        saldoOrigenPosterior: origenActualizado.saldoCentavos,
        saldoDestinoPosterior: destinoActualizado.saldoCentavos,
        descripcion,
      }).save(opts);
      return { cuentaOrigen: origenActualizado, tx };
    } catch (error) {
      if (!session) {
        await Cuenta.updateOne({ numeroCuenta: origen }, { $inc: { saldoCentavos: monto } });
        await Cuenta.updateOne({ numeroCuenta: destino }, { $inc: { saldoCentavos: -monto } });
      }
      throw error;
    }
  });

  res.status(201).json({
    mensaje: 'Transferencia realizada con éxito.',
    cuenta: serializarCuenta(cuentaOrigen),
    transaccion: serializarTransaccion(tx, origen),
  });
});

/* ------------------------------------------------------------------ */
/* GET /api/cuenta/:id/historial?limit=20&tipo=deposito                */
/* ------------------------------------------------------------------ */
export const obtenerHistorial = asyncHandler(async (req, res) => {
  const numero = validarNumeroCuenta(req.params.id, 'id');
  const cuenta = await Cuenta.exists({ numeroCuenta: numero });
  if (!cuenta) throw cuentaNoExiste(numero);

  const limite = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  const filtro = { $or: [{ cuentaOrigen: numero }, { cuentaDestino: numero }] };
  if (typeof req.query.tipo === 'string' && TIPOS.includes(req.query.tipo)) {
    filtro.tipo = req.query.tipo;
  }

  const transacciones = await Transaccion.find(filtro).sort({ fecha: -1, _id: -1 }).limit(limite).lean();

  // Nombres de los titulares de las contrapartes (para mostrar "Transferencia a ...").
  const numeros = new Set();
  transacciones.forEach((t) => {
    if (t.cuentaOrigen) numeros.add(t.cuentaOrigen);
    if (t.cuentaDestino) numeros.add(t.cuentaDestino);
  });
  const cuentas = await Cuenta.find({ numeroCuenta: { $in: [...numeros] } }, 'numeroCuenta titular').lean();
  const titulares = Object.fromEntries(cuentas.map((c) => [c.numeroCuenta, c.titular]));

  res.json(transacciones.map((t) => serializarTransaccion(t, numero, titulares)));
});
