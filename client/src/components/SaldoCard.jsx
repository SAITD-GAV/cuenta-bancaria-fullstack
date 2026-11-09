import { IconoEscudo, IconoFlechaAbajo, IconoFlechaArriba } from './Iconos.jsx';
import { formatearMoneda } from '../utils/formato.js';

const Esqueleto = ({ className }) => <div className={`animate-pulse rounded-lg bg-white/15 ${className}`} />;

/**
 * Tarjeta principal con el saldo actual. Se actualiza al instante tras cada operación
 * porque recibe la cuenta por props desde el estado del padre.
 * Props:
 *  - cuenta: { numeroCuenta, titular, saldo, moneda } | null
 *  - cargando: boolean
 *  - historial: movimientos recientes (para el resumen de ingresos/egresos)
 */
export default function SaldoCard({ cuenta, cargando, historial }) {
  const ingresos = historial.filter((m) => m.direccion === 'entrada').reduce((s, m) => s + m.monto, 0);
  const egresos = historial.filter((m) => m.direccion === 'salida').reduce((s, m) => s + m.monto, 0);

  return (
    <section
      aria-label="Saldo de la cuenta"
      aria-busy={cargando}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-950 p-6 text-white shadow-2xl shadow-indigo-950/50 ring-1 ring-white/10 sm:p-7"
    >
      {/* Decoración */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-10 size-56 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200/80">Saldo disponible</p>
            {cargando || !cuenta ? (
              <Esqueleto className="mt-3 h-12 w-56" />
            ) : (
              <p
                key={cuenta.saldo}
                data-testid="saldo-actual"
                className="mt-2 animate-pop truncate text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl"
              >
                {formatearMoneda(cuenta.saldo)}
              </p>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-50 ring-1 ring-white/20">
            <IconoEscudo className="size-3.5" />
            Activa
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between gap-4 border-t border-white/15 pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200/70">Titular</p>
            {cargando || !cuenta ? (
              <Esqueleto className="mt-1.5 h-5 w-40" />
            ) : (
              <p className="truncate text-base font-bold">{cuenta.titular}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-200/70">N.º de cuenta</p>
            {cargando || !cuenta ? (
              <Esqueleto className="ml-auto mt-1.5 h-5 w-24" />
            ) : (
              <p className="font-mono text-base font-semibold tracking-wider">{cuenta.numeroCuenta}</p>
            )}
          </div>
        </div>

        <p className="mt-5 text-[11px] font-semibold uppercase tracking-widest text-indigo-200/70">Resumen de movimientos recientes</p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
              <IconoFlechaAbajo className="size-3.5" /> Ingresos
            </p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums">{formatearMoneda(ingresos)}</p>
          </div>
          <div className="rounded-2xl bg-black/20 p-3 ring-1 ring-white/10">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
              <IconoFlechaArriba className="size-3.5" /> Egresos
            </p>
            <p className="mt-1 truncate text-sm font-bold tabular-nums">{formatearMoneda(egresos)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
