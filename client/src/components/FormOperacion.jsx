import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { formatearMoneda } from '../utils/formato.js';
import { IconoAlerta, IconoFlechaAbajo, IconoFlechaArriba, IconoSpinner, IconoTransferir } from './Iconos.jsx';

const OPERACIONES = {
  deposito: { etiqueta: 'Depositar', boton: 'Realizar depósito', Icono: IconoFlechaAbajo },
  retiro: { etiqueta: 'Retirar', boton: 'Realizar retiro', Icono: IconoFlechaArriba },
  transferencia: { etiqueta: 'Transferir', boton: 'Enviar transferencia', Icono: IconoTransferir },
};

const MONTOS_RAPIDOS = [50, 100, 200, 500];

const claseCampo =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/15 disabled:cursor-not-allowed disabled:bg-slate-100';

/**
 * Formulario de operaciones (depósito, retiro y transferencia).
 * Props:
 *  - cuenta: cuenta activa (origen de la operación)
 *  - cuentas: todas las cuentas (para elegir destino)
 *  - onExito(cuentaActualizada): callback al padre para sincronizar saldo e historial
 *  - notificar(tipo, mensaje): muestra una notificación
 */
export default function FormOperacion({ cuenta, cuentas, onExito, notificar }) {
  const [tipo, setTipo] = useState('deposito');
  const [monto, setMonto] = useState('');
  const [destino, setDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const destinos = cuentas.filter((c) => c.numeroCuenta !== cuenta?.numeroCuenta);

  // Al cambiar de operación se limpia el monto y el error; al cambiar de cuenta, solo el error.
  useEffect(() => {
    setMonto('');
    setErrorForm(null);
  }, [tipo]);

  useEffect(() => {
    setErrorForm(null);
  }, [cuenta?.numeroCuenta]);

  useEffect(() => {
    setDestino((actual) => (destinos.some((c) => c.numeroCuenta === actual) ? actual : destinos[0]?.numeroCuenta ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuenta?.numeroCuenta, cuentas]);

  const validar = () => {
    const valor = Number(monto);
    if (monto === '' || !Number.isFinite(valor) || valor <= 0) return 'Ingresa un monto mayor a cero.';
    if (Math.abs(valor * 100 - Math.round(valor * 100)) > 1e-6) return 'El monto admite como máximo 2 decimales.';
    if (tipo !== 'deposito' && Math.round(valor * 100) > Math.round(cuenta.saldo * 100)) {
      return `Saldo insuficiente. Tu saldo disponible es ${formatearMoneda(cuenta.saldo)}.`;
    }
    if (tipo === 'transferencia' && !destino) return 'Selecciona una cuenta de destino.';
    return null;
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    if (!cuenta || enviando) return;

    const problema = validar();
    if (problema) {
      setErrorForm(problema);
      return;
    }

    const valor = Number(monto);
    const nota = descripcion.trim() || undefined;
    setEnviando(true);
    setErrorForm(null);
    try {
      const respuesta =
        tipo === 'deposito'
          ? await api.depositar(cuenta.numeroCuenta, valor, nota)
          : tipo === 'retiro'
            ? await api.retirar(cuenta.numeroCuenta, valor, nota)
            : await api.transferir(cuenta.numeroCuenta, destino, valor, nota);

      notificar('exito', `${respuesta.mensaje} Monto: ${formatearMoneda(valor)}.`);
      setMonto('');
      setDescripcion('');
      onExito(respuesta.cuenta);
    } catch (error) {
      setErrorForm(error.message);
      notificar('error', error.message);
    } finally {
      setEnviando(false);
    }
  };

  const { boton, Icono } = OPERACIONES[tipo];
  const idError = 'error-formulario';

  return (
    <section aria-label="Nueva operación" className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 sm:p-6">
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Nueva operación</h2>
      <p className="mt-0.5 text-sm text-slate-500">Elige el tipo de movimiento y completa los datos.</p>

      <div role="tablist" aria-label="Tipo de operación" className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
        {Object.entries(OPERACIONES).map(([clave, { etiqueta, Icono: IconoTab }]) => {
          const activo = tipo === clave;
          return (
            <button
              key={clave}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => setTipo(clave)}
              className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                activo ? 'bg-white text-indigo-700 shadow-md shadow-slate-900/10' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconoTab className="hidden size-4 sm:block" />
              <span className="truncate">{etiqueta}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={manejarEnvio} noValidate className="mt-5 space-y-4" aria-busy={enviando}>
        {tipo === 'transferencia' && (
          <div>
            <label htmlFor="destino" className="mb-1.5 block text-sm font-bold text-slate-700">
              Cuenta destino
            </label>
            <select
              id="destino"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              disabled={enviando || destinos.length === 0}
              className={`${claseCampo} cursor-pointer`}
            >
              {destinos.length === 0 && <option value="">No hay otras cuentas</option>}
              {destinos.map((c) => (
                <option key={c.numeroCuenta} value={c.numeroCuenta}>
                  {c.numeroCuenta} · {c.titular}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="monto" className="mb-1.5 block text-sm font-bold text-slate-700">
            Monto
          </label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base font-bold text-slate-400">
              S/
            </span>
            <input
              id="monto"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              disabled={enviando || !cuenta}
              aria-invalid={Boolean(errorForm)}
              aria-describedby={errorForm ? idError : undefined}
              className={`${claseCampo} pl-11 text-lg font-bold tabular-nums`}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {MONTOS_RAPIDOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonto(String(m))}
                disabled={enviando || !cuenta}
                className="rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-bold text-indigo-700 outline-none ring-1 ring-indigo-100 transition hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
              >
                + {m}
              </button>
            ))}
          </div>
          {tipo !== 'deposito' && cuenta && (
            <p className="mt-2 text-xs font-medium text-slate-500">
              Disponible: <span className="font-bold text-slate-700">{formatearMoneda(cuenta.saldo)}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="descripcion" className="mb-1.5 block text-sm font-bold text-slate-700">
            Concepto <span className="font-medium text-slate-400">(opcional)</span>
          </label>
          <input
            id="descripcion"
            type="text"
            maxLength={120}
            placeholder="Ej. Pago de servicios"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            disabled={enviando || !cuenta}
            className={claseCampo}
          />
        </div>

        {errorForm && (
          <div
            id={idError}
            role="alert"
            className="flex animate-fade-up items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200"
          >
            <IconoAlerta className="mt-0.5 size-4 shrink-0" />
            <span>{errorForm}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={enviando || !cuenta}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-base font-extrabold text-white shadow-lg shadow-indigo-600/30 outline-none transition hover:from-indigo-500 hover:to-violet-500 focus-visible:ring-4 focus-visible:ring-indigo-500/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? <IconoSpinner /> : <Icono />}
          {enviando ? 'Procesando…' : boton}
        </button>
      </form>
    </section>
  );
}
