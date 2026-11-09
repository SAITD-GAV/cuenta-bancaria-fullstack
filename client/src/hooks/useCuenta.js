import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

const CLAVE_CUENTA = 'cuentaSeleccionada';

const leerCuentaGuardada = () => {
  try {
    return localStorage.getItem(CLAVE_CUENTA);
  } catch {
    return null;
  }
};

/**
 * Hook que concentra TODO el estado de datos de la aplicación:
 *  - lista de cuentas y cuenta seleccionada
 *  - saldo/datos de la cuenta e historial
 *  - estados de carga y error
 * Los datos se sincronizan con useEffect al cambiar de cuenta o tras cada operación
 * (versionDatos), de modo que la interfaz se actualiza sin recargar la página.
 */
export function useCuenta() {
  const [cuentas, setCuentas] = useState([]);
  const [cuentaId, setCuentaId] = useState(leerCuentaGuardada);
  const [cuenta, setCuenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [error, setError] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [versionDatos, setVersionDatos] = useState(0);

  // 1) Carga la lista de cuentas (y recarga tras cada operación para mantener saldos al día).
  useEffect(() => {
    const controlador = new AbortController();
    api
      .listarCuentas(controlador.signal)
      .then((lista) => {
        setCuentas(lista);
        setError(null);
        setCuentaId((actual) => (lista.some((c) => c.numeroCuenta === actual) ? actual : lista[0]?.numeroCuenta ?? null));
        if (lista.length === 0) setCargando(false);
      })
      .catch((e) => {
        if (e.name === 'AbortError') return;
        setError(e.message);
        setCargando(false);
        setCargandoHistorial(false);
      });
    return () => controlador.abort();
  }, [versionDatos]);

  // 2) Carga saldo + historial de la cuenta seleccionada.
  useEffect(() => {
    if (!cuentaId) return undefined;
    const controlador = new AbortController();

    try {
      localStorage.setItem(CLAVE_CUENTA, cuentaId);
    } catch {
      /* almacenamiento no disponible: se ignora */
    }

    api
      .obtenerCuenta(cuentaId, controlador.signal)
      .then((datos) => {
        setCuenta(datos);
        setError(null);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargando(false);
      });

    api
      .obtenerHistorial(cuentaId, controlador.signal)
      .then((datos) => {
        setHistorial(datos);
        setErrorHistorial(null);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setErrorHistorial(e.message);
      })
      .finally(() => {
        if (!controlador.signal.aborted) setCargandoHistorial(false);
      });

    return () => controlador.abort();
  }, [cuentaId, versionDatos]);

  const seleccionarCuenta = useCallback((id) => {
    setCargando(true);
    setCargandoHistorial(true);
    setCuenta(null);
    setHistorial([]);
    setCuentaId(id);
  }, []);

  /** Se llama tras una operación exitosa: refleja el saldo al instante y refresca el resto. */
  const alCompletarOperacion = useCallback((cuentaActualizada) => {
    if (cuentaActualizada) setCuenta(cuentaActualizada); // actualización inmediata del saldo
    setVersionDatos((v) => v + 1); //                       sincroniza historial y lista de cuentas
  }, []);

  const reintentar = useCallback(() => {
    setError(null);
    setCargando(true);
    setCargandoHistorial(true);
    setVersionDatos((v) => v + 1);
  }, []);

  return {
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
  };
}
