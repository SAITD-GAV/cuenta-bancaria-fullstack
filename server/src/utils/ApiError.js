/**
 * Error controlado de la API. Lleva el código HTTP que debe devolverse al cliente.
 */
export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const badRequest = (mensaje) => new ApiError(400, mensaje);
export const notFound = (mensaje) => new ApiError(404, mensaje);
