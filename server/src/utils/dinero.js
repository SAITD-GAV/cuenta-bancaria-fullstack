import { badRequest } from './ApiError.js';

/**
 * El dinero se guarda en CÉNTIMOS (enteros) para evitar errores de redondeo
 * de punto flotante (0.1 + 0.2 !== 0.3). La API expone soles con 2 decimales.
 */
export const MONTO_MAXIMO = 1_000_000;

export const aCentimos = (soles) => Math.round(soles * 100);
export const aSoles = (centimos) => centimos / 100;

/**
 * Valida un monto recibido en el body y lo devuelve en céntimos.
 * Rechaza: no numéricos, <= 0, NaN/Infinity, más de 2 decimales y montos absurdos.
 */
export function validarMonto(valor) {
  if (typeof valor !== 'number' && typeof valor !== 'string') {
    throw badRequest('El monto es obligatorio y debe ser un número.');
  }
  if (typeof valor === 'string' && valor.trim() === '') {
    throw badRequest('El monto es obligatorio y debe ser un número.');
  }

  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    throw badRequest('El monto debe ser un número válido.');
  }
  if (numero <= 0) {
    throw badRequest('El monto debe ser mayor a cero.');
  }

  const centimos = Math.round(numero * 100);
  if (Math.abs(numero * 100 - centimos) > 1e-6) {
    throw badRequest('El monto admite como máximo 2 decimales.');
  }
  if (centimos < 1) {
    throw badRequest('El monto mínimo es 0.01.');
  }
  if (numero > MONTO_MAXIMO) {
    throw badRequest(`El monto máximo por operación es ${MONTO_MAXIMO.toLocaleString('en-US')}.`);
  }
  return centimos;
}

const PATRON_CUENTA = /^[A-Za-z0-9-]{3,30}$/;

/** Valida el identificador (número) de cuenta recibido por body o URL. */
export function validarNumeroCuenta(valor, campo = 'cuenta') {
  if (typeof valor !== 'string' || !PATRON_CUENTA.test(valor.trim())) {
    throw badRequest(`El campo "${campo}" es obligatorio y debe ser un número de cuenta válido.`);
  }
  return valor.trim();
}

/** Valida el concepto opcional de una operación. */
export function validarDescripcion(valor) {
  if (valor === undefined || valor === null || valor === '') return undefined;
  if (typeof valor !== 'string') {
    throw badRequest('La descripción debe ser texto.');
  }
  const limpia = valor.trim();
  if (limpia.length > 120) {
    throw badRequest('La descripción no puede superar los 120 caracteres.');
  }
  return limpia || undefined;
}
