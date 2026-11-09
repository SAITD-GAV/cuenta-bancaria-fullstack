import { IconoAlerta, IconoCerrar, IconoCheck } from './Iconos.jsx';

const ESTILOS = {
  exito: { caja: 'bg-emerald-600 text-white shadow-emerald-900/30', Icono: IconoCheck },
  error: { caja: 'bg-rose-600 text-white shadow-rose-900/30', Icono: IconoAlerta },
};

/**
 * Contenedor de notificaciones (toasts) con retroalimentación visual de éxito/error.
 * Props: notificaciones: [{ id, tipo, mensaje }], onCerrar(id)
 */
export default function Notificaciones({ notificaciones, onCerrar }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 mx-auto flex w-full max-w-md flex-col gap-2 px-4"
    >
      {notificaciones.map(({ id, tipo, mensaje }) => {
        const { caja, Icono } = ESTILOS[tipo] ?? ESTILOS.exito;
        return (
          <div
            key={id}
            role={tipo === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex animate-toast-in items-start gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-2xl ${caja}`}
          >
            <Icono className="mt-0.5 size-5 shrink-0" />
            <p className="flex-1">{mensaje}</p>
            <button
              type="button"
              onClick={() => onCerrar(id)}
              aria-label="Cerrar notificación"
              className="rounded-lg p-1 opacity-80 outline-none transition hover:bg-white/20 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white"
            >
              <IconoCerrar />
            </button>
          </div>
        );
      })}
    </div>
  );
}
