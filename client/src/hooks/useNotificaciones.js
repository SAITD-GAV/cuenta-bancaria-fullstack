import { useCallback, useEffect, useRef, useState } from 'react';

/** Cola de notificaciones tipo "toast" que desaparecen solas. */
export function useNotificaciones(duracion = 4500) {
  const [notificaciones, setNotificaciones] = useState([]);
  const temporizadores = useRef(new Map());

  const cerrar = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id));
    temporizadores.current.delete(id);
    setNotificaciones((lista) => lista.filter((n) => n.id !== id));
  }, []);

  const notificar = useCallback(
    (tipo, mensaje) => {
      const id = crypto.randomUUID();
      setNotificaciones((lista) => [...lista.slice(-2), { id, tipo, mensaje }]);
      temporizadores.current.set(id, setTimeout(() => cerrar(id), duracion));
    },
    [cerrar, duracion]
  );

  useEffect(() => {
    const mapa = temporizadores.current;
    return () => mapa.forEach((t) => clearTimeout(t));
  }, []);

  return { notificaciones, notificar, cerrar };
}
