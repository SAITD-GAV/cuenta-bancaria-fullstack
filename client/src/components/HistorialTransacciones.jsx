import { useState } from 'react';
import { formatearFecha, formatearMoneda } from '../utils/formato.js';
import { IconoAlerta, IconoFlechaAbajo, IconoFlechaArriba, IconoReloj, IconoTransferir } from './Iconos.jsx';

const FILTROS = [
  { clave: 'todos', etiqueta: 'Todos' },
  { clave: 'deposito', etiqueta: 'Depósitos' },
  { clave: 'retiro', etiqueta: 'Retiros' },
  { clave: 'transferencia', etiqueta: 'Transferencias' },
];

const ETIQUETA_TIPO = { deposito: 'Depósito', retiro: 'Retiro', transferencia: 'Transferencia' };

const ESTILO_ENTRADA = 'bg-emerald-50 text-emerald-600 ring-emerald-100';
const ESTILO_SALIDA = 'bg-rose-50 text-rose-600 ring-rose-100';

function iconoDe(movimiento) {
  if (movimiento.tipo === 'transferencia') return IconoTransferir;
  return movimiento.direccion === 'entrada' ? IconoFlechaAbajo : IconoFlechaArriba;
}

function detalleDe(m) {
  if (m.tipo === 'transferencia' && m.contraparte) {
    const quien = m.contraparte.titular ? `${m.contraparte.titular} (${m.contraparte.numeroCuenta})` : m.contraparte.numeroCuenta;
    return m.direccion === 'salida' ? `Para ${quien}` : `De ${quien}`;
  }
  return m.descripcion || (m.tipo === 'deposito' ? 'Ingreso a la cuenta' : 'Salida de la cuenta');
}

/**
 * Lista de movimientos recientes con filtro por tipo.
 * Props:
 *  - movimientos: arreglo devuelto por GET /api/cuenta/:id/historial
 *  - cargando / error: estados de la petición
 *  - onReintentar(): callback para volver a pedir los datos
 */
export default function HistorialTransacciones({ movimientos, cargando, error, onReintentar }) {
  const [filtro, setFiltro] = useState('todos');
  const visibles = filtro === 'todos' ? movimientos : movimientos.filter((m) => m.tipo === filtro);

  return (
    <section aria-label="Historial de movimientos" className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Historial de movimientos</h2>
          <p className="mt-0.5 text-sm text-slate-500">Tus últimas transacciones, de la más reciente a la más antigua.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {visibles.length} {visibles.length === 1 ? 'movimiento' : 'movimientos'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo">
        {FILTROS.map(({ clave, etiqueta }) => (
          <button
            key={clave}
            type="button"
            aria-pressed={filtro === clave}
            onClick={() => setFiltro(clave)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              filtro === clave ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="mt-4" aria-live="polite" aria-busy={cargando}>
        {error ? (
          <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl bg-rose-50 p-8 text-center ring-1 ring-rose-100">
            <IconoAlerta className="size-8 text-rose-500" />
            <p className="text-sm font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={onReintentar}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white outline-none transition hover:bg-rose-500 focus-visible:ring-4 focus-visible:ring-rose-500/30"
            >
              Reintentar
            </button>
          </div>
        ) : cargando ? (
          <ul className="space-y-3" aria-label="Cargando movimientos">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex animate-pulse items-center gap-3 rounded-2xl p-3">
                <div className="size-11 rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>
                <div className="h-5 w-20 rounded bg-slate-200" />
              </li>
            ))}
          </ul>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <IconoReloj className="size-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Aún no hay movimientos</p>
            <p className="text-xs text-slate-400">Realiza un depósito, retiro o transferencia para verlo aquí.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibles.map((m, i) => {
              const Icono = iconoDe(m);
              const entrada = m.direccion === 'entrada';
              return (
                <li
                  key={m.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  className="flex animate-fade-up items-center gap-3 py-3.5 sm:gap-4"
                >
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${entrada ? ESTILO_ENTRADA : ESTILO_SALIDA}`}>
                    <Icono className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-900">{ETIQUETA_TIPO[m.tipo]}</p>
                    <p className="truncate text-xs font-medium text-slate-500">{detalleDe(m)}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">{formatearFecha(m.fecha)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-extrabold tabular-nums sm:text-base ${entrada ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {entrada ? '+' : '−'} {formatearMoneda(m.monto)}
                    </p>
                    {m.saldoPosterior != null && (
                      <p className="text-[11px] font-medium text-slate-400">Saldo {formatearMoneda(m.saldoPosterior)}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
