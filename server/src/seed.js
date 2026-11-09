import 'dotenv/config';
import { conectarDB, desconectarDB } from './config/db.js';
import { Cuenta } from './models/Cuenta.js';
import { Transaccion } from './models/Transaccion.js';
import { aCentimos } from './utils/dinero.js';

/**
 * Script seed: vacía las colecciones y crea cuentas de prueba con un historial
 * coherente (cada saldo posterior coincide con el saldo real de la cuenta).
 */
const CUENTAS = [
  { numeroCuenta: '1001-0001', titular: 'Ana Torres Salas' },
  { numeroCuenta: '1001-0002', titular: 'Luis Quispe Ramos' },
  { numeroCuenta: '1001-0003', titular: 'María Rojas Paucar' },
  { numeroCuenta: '1001-0004', titular: 'Carlos Mendoza Lazo' },
  { numeroCuenta: '1001-0005', titular: 'Rosa Huamán Vilca' },
];

// Operaciones históricas: [díasAtrás, tipo, origen, destino, monto, descripción]
const OPERACIONES = [
  [30, 'deposito', null, '1001-0001', 3000, 'Apertura de cuenta'],
  [30, 'deposito', null, '1001-0002', 1500, 'Apertura de cuenta'],
  [29, 'deposito', null, '1001-0003', 8000, 'Apertura de cuenta'],
  [29, 'deposito', null, '1001-0004', 600, 'Apertura de cuenta'],
  [28, 'deposito', null, '1001-0005', 15000, 'Apertura de cuenta'],
  [21, 'retiro', '1001-0001', null, 250, 'Retiro en cajero'],
  [18, 'transferencia', '1001-0003', '1001-0002', 400, 'Pago de alquiler'],
  [14, 'deposito', null, '1001-0004', 120.5, 'Depósito en ventanilla'],
  [11, 'retiro', '1001-0002', null, 180.25, 'Compras del mes'],
  [9, 'transferencia', '1001-0005', '1001-0001', 1200, 'Préstamo familiar'],
  [6, 'retiro', '1001-0004', null, 300, 'Pago de servicios'],
  [4, 'transferencia', '1001-0001', '1001-0004', 150, 'Cena compartida'],
  [2, 'deposito', null, '1001-0003', 950, 'Pago de honorarios'],
  [1, 'transferencia', '1001-0002', '1001-0005', 75.9, 'Devolución'],
];

async function sembrar() {
  await conectarDB();
  await Promise.all([Cuenta.deleteMany({}), Transaccion.deleteMany({})]);

  // Se simula el libro mayor en memoria para que el historial sea 100% coherente.
  const saldos = Object.fromEntries(CUENTAS.map((c) => [c.numeroCuenta, 0]));
  const transacciones = [];
  const hoy = Date.now();

  OPERACIONES.forEach(([dias, tipo, origen, destino, monto, descripcion], i) => {
    const centimos = aCentimos(monto);
    if (origen) saldos[origen] -= centimos;
    if (destino) saldos[destino] += centimos;
    if (Object.values(saldos).some((s) => s < 0)) {
      throw new Error(`Seed inválido: la operación #${i + 1} deja un saldo negativo.`);
    }
    transacciones.push({
      tipo,
      montoCentavos: centimos,
      cuentaOrigen: origen,
      cuentaDestino: destino,
      saldoOrigenPosterior: origen ? saldos[origen] : null,
      saldoDestinoPosterior: destino ? saldos[destino] : null,
      descripcion,
      fecha: new Date(hoy - dias * 86_400_000 - i * 60_000),
    });
  });

  await Cuenta.insertMany(CUENTAS.map((c) => ({ ...c, saldoCentavos: saldos[c.numeroCuenta] })));
  await Transaccion.insertMany(transacciones);

  console.log(`✔ Seed completado: ${CUENTAS.length} cuentas y ${transacciones.length} movimientos.`);
  console.table(CUENTAS.map((c) => ({ cuenta: c.numeroCuenta, titular: c.titular, saldo: (saldos[c.numeroCuenta] / 100).toFixed(2) })));
}

try {
  await sembrar();
} catch (error) {
  console.error('✖ Error ejecutando el seed:', error.message);
  process.exitCode = 1;
} finally {
  await desconectarDB();
}
