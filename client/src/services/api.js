/**
 * Capa de acceso a la API REST. Centraliza fetch, JSON y manejo de errores:
 * cualquier respuesta no exitosa lanza un Error con el mensaje que envía el backend.
 */
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

async function solicitar(ruta, { method = 'GET', body, signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('No se pudo conectar con el servidor. Verifica que la API esté en ejecución.');
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Ocurrió un error inesperado.');
    error.status = respuesta.status;
    throw error;
  }
  return datos;
}

export const api = {
  listarCuentas: (signal) => solicitar('/cuenta', { signal }),
  obtenerCuenta: (id, signal) => solicitar(`/cuenta/${encodeURIComponent(id)}`, { signal }),
  obtenerHistorial: (id, signal, limit = 30) =>
    solicitar(`/cuenta/${encodeURIComponent(id)}/historial?limit=${limit}`, { signal }),
  depositar: (cuentaId, monto, descripcion) =>
    solicitar('/cuenta/deposito', { method: 'POST', body: { cuentaId, monto, descripcion } }),
  retirar: (cuentaId, monto, descripcion) =>
    solicitar('/cuenta/retiro', { method: 'POST', body: { cuentaId, monto, descripcion } }),
  transferir: (cuentaOrigen, cuentaDestino, monto, descripcion) =>
    solicitar('/cuenta/transferencia', { method: 'POST', body: { cuentaOrigen, cuentaDestino, monto, descripcion } }),
};
