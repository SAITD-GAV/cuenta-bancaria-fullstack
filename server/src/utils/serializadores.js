import { aSoles } from './dinero.js';

export const serializarCuenta = (cuenta) => ({
  id: String(cuenta._id),
  numeroCuenta: cuenta.numeroCuenta,
  titular: cuenta.titular,
  saldo: aSoles(cuenta.saldoCentavos),
  moneda: cuenta.moneda,
  actualizadaEn: cuenta.updatedAt,
});

/**
 * Serializa una transacción desde la perspectiva de la cuenta consultada
 * (si no se indica, se devuelve la vista neutra sin dirección).
 */
export function serializarTransaccion(tx, numeroCuenta, titulares = {}) {
  const base = {
    id: String(tx._id),
    tipo: tx.tipo,
    monto: aSoles(tx.montoCentavos),
    fecha: tx.fecha,
    cuentaOrigen: tx.cuentaOrigen ?? null,
    cuentaDestino: tx.cuentaDestino ?? null,
    descripcion: tx.descripcion ?? null,
  };
  if (!numeroCuenta) return base;

  const esOrigen = tx.cuentaOrigen === numeroCuenta;
  const direccion = tx.tipo === 'deposito' ? 'entrada' : tx.tipo === 'retiro' ? 'salida' : esOrigen ? 'salida' : 'entrada';
  const contraparteNumero = tx.tipo === 'transferencia' ? (esOrigen ? tx.cuentaDestino : tx.cuentaOrigen) : null;
  const saldoPosterior = esOrigen ? tx.saldoOrigenPosterior : tx.saldoDestinoPosterior;

  return {
    ...base,
    direccion,
    saldoPosterior: saldoPosterior == null ? null : aSoles(saldoPosterior),
    contraparte: contraparteNumero
      ? { numeroCuenta: contraparteNumero, titular: titulares[contraparteNumero] ?? null }
      : null,
  };
}
