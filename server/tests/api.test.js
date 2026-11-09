import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { crearApp } from '../src/app.js';
import { Cuenta } from '../src/models/Cuenta.js';
import { Transaccion } from '../src/models/Transaccion.js';

let mongo;
let servidor;
let base;

const api = async (metodo, ruta, body) => {
  const res = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};

before(async () => {
  // Si se define TEST_MONGODB_URI se usa esa base; si no, se levanta MongoDB en memoria.
  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
  }
  await mongoose.connect(uri);
  servidor = crearApp().listen(0);
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  servidor?.close();
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([Cuenta.deleteMany({}), Transaccion.deleteMany({})]);
  await Cuenta.insertMany([
    { numeroCuenta: 'A-001', titular: 'Ana', saldoCentavos: 100_00 },
    { numeroCuenta: 'B-002', titular: 'Beto', saldoCentavos: 50_00 },
  ]);
});

test('GET /api/cuenta/:id devuelve saldo y datos', async () => {
  const { status, data } = await api('GET', '/api/cuenta/A-001');
  assert.equal(status, 200);
  assert.equal(data.saldo, 100);
  assert.equal(data.titular, 'Ana');
});

test('GET cuenta inexistente -> 404', async () => {
  const { status } = await api('GET', '/api/cuenta/NOPE-9');
  assert.equal(status, 404);
});

test('depósito suma al saldo y registra la transacción', async () => {
  const { status, data } = await api('POST', '/api/cuenta/deposito', { cuentaId: 'A-001', monto: 25.5 });
  assert.equal(status, 201);
  assert.equal(data.cuenta.saldo, 125.5);
  assert.equal(await Transaccion.countDocuments({ tipo: 'deposito' }), 1);
});

test('depósito con datos inválidos -> 400', async () => {
  for (const monto of [0, -5, 'abc', null, '', 10.123, true, [5], { $gt: 0 }, 2_000_000]) {
    const { status } = await api('POST', '/api/cuenta/deposito', { cuentaId: 'A-001', monto });
    assert.equal(status, 400, `monto ${JSON.stringify(monto)} debía ser 400`);
  }
  const { status } = await api('POST', '/api/cuenta/deposito', { monto: 10 });
  assert.equal(status, 400);
  assert.equal((await Cuenta.findOne({ numeroCuenta: 'A-001' })).saldoCentavos, 100_00);
});

test('depósito a cuenta inexistente -> 404', async () => {
  const { status } = await api('POST', '/api/cuenta/deposito', { cuentaId: 'ZZZ-1', monto: 10 });
  assert.equal(status, 404);
});

test('JSON mal formado -> 400', async () => {
  const { status } = await api('POST', '/api/cuenta/deposito', '{ roto');
  assert.equal(status, 400);
});

test('retiro descuenta saldo; superar el saldo -> 400 y no cambia nada', async () => {
  const ok = await api('POST', '/api/cuenta/retiro', { cuentaId: 'A-001', monto: 40 });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.cuenta.saldo, 60);

  const mal = await api('POST', '/api/cuenta/retiro', { cuentaId: 'A-001', monto: 60.01 });
  assert.equal(mal.status, 400);
  assert.equal((await Cuenta.findOne({ numeroCuenta: 'A-001' })).saldoCentavos, 60_00);
  assert.equal(await Transaccion.countDocuments({ tipo: 'retiro' }), 1);
});

test('retiro del saldo exacto deja la cuenta en cero (nunca negativo)', async () => {
  const { status, data } = await api('POST', '/api/cuenta/retiro', { cuentaId: 'A-001', monto: 100 });
  assert.equal(status, 201);
  assert.equal(data.cuenta.saldo, 0);
});

// Las pruebas de concurrencia requieren un MongoDB real (la atomicidad de $inc sobre un
// documento es una garantía de mongod). Se omiten solo con TEST_SKIP_CONCURRENCY=1.
const SIN_CONCURRENCIA = process.env.TEST_SKIP_CONCURRENCY === '1';

test('retiros concurrentes no generan saldo negativo', { skip: SIN_CONCURRENCIA }, async () => {
  const resultados = await Promise.all(
    Array.from({ length: 10 }, () => api('POST', '/api/cuenta/retiro', { cuentaId: 'A-001', monto: 30 }))
  );
  const exitosos = resultados.filter((r) => r.status === 201).length;
  assert.equal(exitosos, 3); // 100 / 30 = 3 retiros posibles
  assert.equal((await Cuenta.findOne({ numeroCuenta: 'A-001' })).saldoCentavos, 10_00);
});

test('transferencia mueve fondos entre ambas cuentas', async () => {
  const { status, data } = await api('POST', '/api/cuenta/transferencia', {
    cuentaOrigen: 'A-001',
    cuentaDestino: 'B-002',
    monto: 30,
    descripcion: 'Almuerzo',
  });
  assert.equal(status, 201);
  assert.equal(data.cuenta.saldo, 70);
  assert.equal((await Cuenta.findOne({ numeroCuenta: 'B-002' })).saldoCentavos, 80_00);
});

test('transferencia: destino inexistente -> 404, fondos insuficientes -> 400, misma cuenta -> 400', async () => {
  const sinDestino = await api('POST', '/api/cuenta/transferencia', { cuentaOrigen: 'A-001', cuentaDestino: 'X-999', monto: 5 });
  assert.equal(sinDestino.status, 404);

  const sinFondos = await api('POST', '/api/cuenta/transferencia', { cuentaOrigen: 'B-002', cuentaDestino: 'A-001', monto: 50.01 });
  assert.equal(sinFondos.status, 400);

  const misma = await api('POST', '/api/cuenta/transferencia', { cuentaOrigen: 'A-001', cuentaDestino: 'A-001', monto: 5 });
  assert.equal(misma.status, 400);

  assert.equal((await Cuenta.findOne({ numeroCuenta: 'A-001' })).saldoCentavos, 100_00);
  assert.equal((await Cuenta.findOne({ numeroCuenta: 'B-002' })).saldoCentavos, 50_00);
  assert.equal(await Transaccion.countDocuments(), 0);
});

test('la suma total de dinero se conserva tras transferencias concurrentes', { skip: SIN_CONCURRENCIA }, async () => {
  await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      api('POST', '/api/cuenta/transferencia', i % 2 ? { cuentaOrigen: 'A-001', cuentaDestino: 'B-002', monto: 7 } : { cuentaOrigen: 'B-002', cuentaDestino: 'A-001', monto: 11 })
    )
  );
  const cuentas = await Cuenta.find();
  assert.equal(cuentas.reduce((s, c) => s + c.saldoCentavos, 0), 150_00);
  assert.ok(cuentas.every((c) => c.saldoCentavos >= 0));
});

test('historial: orden descendente, dirección y contraparte', async () => {
  await api('POST', '/api/cuenta/deposito', { cuentaId: 'A-001', monto: 10 });
  await api('POST', '/api/cuenta/transferencia', { cuentaOrigen: 'A-001', cuentaDestino: 'B-002', monto: 20 });

  const { status, data } = await api('GET', '/api/cuenta/A-001/historial');
  assert.equal(status, 200);
  assert.equal(data.length, 2);
  assert.equal(data[0].tipo, 'transferencia');
  assert.equal(data[0].direccion, 'salida');
  assert.equal(data[0].contraparte.titular, 'Beto');
  assert.equal(data[0].saldoPosterior, 90);
  assert.equal(data[1].direccion, 'entrada');

  const destino = await api('GET', '/api/cuenta/B-002/historial');
  assert.equal(destino.data[0].direccion, 'entrada');
  assert.equal(destino.data[0].contraparte.titular, 'Ana');

  const filtrado = await api('GET', '/api/cuenta/A-001/historial?tipo=deposito');
  assert.equal(filtrado.data.length, 1);
});

test('historial de cuenta inexistente -> 404; ruta desconocida -> 404', async () => {
  assert.equal((await api('GET', '/api/cuenta/NOPE-1/historial')).status, 404);
  assert.equal((await api('GET', '/api/nada')).status, 404);
});
