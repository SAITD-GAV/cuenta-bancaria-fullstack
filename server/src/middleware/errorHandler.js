import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

/** Envuelve controladores async para que cualquier error llegue al manejador central. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Ruta inexistente -> 404 en JSON. */
export function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

/** Manejador central de errores: 400 (datos inválidos), 404 (no encontrado), 500 (interno). */
// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  // JSON mal formado en el body
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
  }
  if (err instanceof mongoose.Error.ValidationError || err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Datos inválidos.', detalle: err.message });
  }

  console.error('[ERROR 500]', err);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}
