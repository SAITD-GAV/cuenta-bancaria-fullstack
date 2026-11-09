import Navbar from './components/Navbar.jsx';
import SaldoCard from './components/SaldoCard.jsx';
import FormOperacion from './components/FormOperacion.jsx';
import HistorialTransacciones from './components/HistorialTransacciones.jsx';
import Notificaciones from './components/Notificaciones.jsx';
import { IconoAlerta } from './components/Iconos.jsx';
import { useCuenta } from './hooks/useCuenta.js';
import { useNotificaciones } from './hooks/useNotificaciones.js';

export default function App() {
  const {
    cuentas,
    cuentaId,
    cuenta,
    historial,
    cargando,
    cargandoHistorial,
    error,
    errorHistorial,
    seleccionarCuenta,
    alCompletarOperacion,
    reintentar,
  } = useCuenta();
  const { notificaciones, notificar, cerrar } = useNotificaciones();

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Fondo decorativo */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-0 h-72 bg-gradient-to-b from-slate-950 via-indigo-950 to-transparent" />

      <div className="relative">
        <Navbar cuentas={cuentas} cuentaId={cuentaId} titular={cuenta?.titular} onCambiarCuenta={seleccionarCuenta} />
        <Notificaciones notificaciones={notificaciones} onCerrar={cerrar} />

        <main className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
          <div className="mb-6 animate-fade-up">
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Hola{cuenta ? `, ${cuenta.titular.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="mt-1 text-sm font-medium text-indigo-200/80">Gestiona tu dinero de forma simple y segura.</p>
          </div>

          {error && (
            <div role="alert" className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200">
              <IconoAlerta className="size-5 shrink-0" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={reintentar}
                className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white outline-none transition hover:bg-rose-500 focus-visible:ring-4 focus-visible:ring-rose-500/30"
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <SaldoCard cuenta={cuenta} cargando={cargando} historial={historial} />
              <FormOperacion cuenta={cuenta} cuentas={cuentas} onExito={alCompletarOperacion} notificar={notificar} />
            </div>
            <div className="lg:col-span-7">
              <HistorialTransacciones
                movimientos={historial}
                cargando={cargandoHistorial}
                error={errorHistorial}
                onReintentar={reintentar}
              />
            </div>
          </div>
        </main>

        <footer className="pb-8 text-center text-xs font-medium text-slate-400">
          Ingeniería Web · Sistema de gestión de cuenta bancaria simplificada
        </footer>
      </div>
    </div>
  );
}
