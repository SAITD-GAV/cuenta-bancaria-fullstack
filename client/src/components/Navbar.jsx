import { IconoBanco } from './Iconos.jsx';
import { iniciales } from '../utils/formato.js';

/**
 * Barra superior: marca + selector de cuenta (simula la sesión del usuario).
 * Props:
 *  - cuentas: lista de cuentas disponibles
 *  - cuentaId: número de la cuenta activa
 *  - titular: nombre del titular activo
 *  - onCambiarCuenta(id): callback del padre al elegir otra cuenta
 */
export default function Navbar({ cuentas, cuentaId, titular, onCambiarCuenta }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-900/40">
            <IconoBanco />
          </span>
          <div className="leading-tight">
            <p className="text-base font-extrabold tracking-tight text-white">Banca Simple</p>
            <p className="hidden text-xs font-medium text-slate-400 sm:block">Gestión de cuenta bancaria</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="hidden size-10 place-items-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-200 ring-1 ring-indigo-400/30 sm:grid"
          >
            {iniciales(titular) || '··'}
          </span>
          <div>
            <label htmlFor="selector-cuenta" className="sr-only">
              Cuenta activa
            </label>
            <select
              id="selector-cuenta"
              value={cuentaId ?? ''}
              onChange={(e) => onCambiarCuenta(e.target.value)}
              disabled={cuentas.length === 0}
              className="max-w-[11.5rem] cursor-pointer rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-slate-100 outline-none transition hover:border-indigo-400/50 focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
            >
              {cuentas.length === 0 && <option value="">Sin cuentas</option>}
              {cuentas.map((c) => (
                <option key={c.numeroCuenta} value={c.numeroCuenta}>
                  {c.numeroCuenta} · {c.titular}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
