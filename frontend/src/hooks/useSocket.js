// Cliente Socket.IO compartido entre páginas (una sola conexión)

import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

// Singleton: reutilizar la misma conexión al cambiar de ruta
function getSocket() {
  if (!socketInstance) {
    socketInstance = io({ path: '/socket.io' });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    return () => {
      // No desconectar al desmontar: la conexión es global
    };
  }, []);

  return socketRef.current;
}
