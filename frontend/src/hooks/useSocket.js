import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

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
      // Mantener conexión global entre páginas
    };
  }, []);

  return socketRef.current;
}
