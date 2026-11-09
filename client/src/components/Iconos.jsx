/** Iconos SVG en línea (sin dependencias externas). Heredan el color con currentColor. */
const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconoBanco = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="m3 10 9-6 9 6" />
    <path d="M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18" />
  </svg>
);

export const IconoFlechaAbajo = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </svg>
);

export const IconoFlechaArriba = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const IconoTransferir = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="M4 8h14l-3-3M20 16H6l3 3" />
  </svg>
);

export const IconoCheck = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="m5 12 5 5 9-10" />
  </svg>
);

export const IconoAlerta = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);

export const IconoCerrar = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconoReloj = ({ className = 'size-5' }) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconoEscudo = ({ className = 'size-4' }) => (
  <svg {...base} className={className}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const IconoSpinner = ({ className = 'size-5' }) => (
  <svg {...base} className={`${className} animate-spin`}>
    <path d="M21 12a9 9 0 1 1-6.2-8.55" />
  </svg>
);
