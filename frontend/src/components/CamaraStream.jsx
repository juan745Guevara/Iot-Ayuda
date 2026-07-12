// Muestra frames JPEG en base64 recibidos por Socket.IO (room camara_{id})

import { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { getToken } from '../utils/auth';

export default function CamaraStream({ sitioId }) {
  const socket = useSocket();
  const [frame, setFrame] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = getToken();
    socket.emit('join_camara', { sitio_id: sitioId, token });

    const onFrame = (data) => {
      if (data.sitio_id === sitioId) setFrame(data.frame);
    };
    const onError = (data) => {
      if (data?.sitio_id === sitioId || !data?.sitio_id) setError(data.error);
    };
    const onOk = () => setError(null);

    socket.on('frame', onFrame);
    socket.on('error_camara', onError);
    socket.on('camara_ok', onOk);

    return () => {
      socket.off('frame', onFrame);
      socket.off('error_camara', onError);
      socket.off('camara_ok', onOk);
    };
  }, [socket, sitioId]);

  return (
    <div className="camara-container camara-grande">
      {error ? (
        <div className="camara-placeholder">⚠️ {error}</div>
      ) : frame ? (
        <img src={`data:image/jpeg;base64,${frame}`} alt="Cámara en vivo" />
      ) : (
        <div className="camara-placeholder">Conectando cámara...</div>
      )}
    </div>
  );
}
