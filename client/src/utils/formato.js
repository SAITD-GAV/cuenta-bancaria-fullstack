const formatoMoneda = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
});

const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatearMoneda = (valor) => formatoMoneda.format(valor ?? 0);

export const formatearFecha = (fecha) => formatoFecha.format(new Date(fecha)).replace(/\./g, '');

/** Iniciales para el avatar del titular (máx. 2 letras). */
export const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
