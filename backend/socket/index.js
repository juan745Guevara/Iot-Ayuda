const jwt = require('jsonwebtoken');
const config = require('../config');
const { verificarAccesoSitio } = require('../routes/sitios');
const { publicarAlarma } = require('../mqtt/client');

function initSocket(io) {
  io.on('connection', (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // Unirse a room de aforo de un sitio (público)
    socket.on('join_sitio', (data) => {
      const sitioId = parseInt(data?.sitio_id, 10);
      if (!isNaN(sitioId)) {
        socket.join(`sitio_${sitioId}`);
      }
    });

    // Unirse a todos los sitios activos (página pública)
    socket.on('join_todos_sitios', async () => {
      try {
        const db = require('../db');
        const result = await db.query('SELECT id FROM sitios WHERE activo = true');
        result.rows.forEach((row) => socket.join(`sitio_${row.id}`));
      } catch (err) {
        console.error('Error al unir a sitios:', err.message);
      }
    });

    // Unirse a stream de cámara (requiere JWT + rol + asignación)
    socket.on('join_camara', async (data) => {
      const sitioId = parseInt(data?.sitio_id, 10);
      const token = data?.token;

      if (!token || isNaN(sitioId)) {
        socket.emit('error_camara', { error: 'Token y sitio_id requeridos' });
        return;
      }

      try {
        const user = jwt.verify(token, config.jwtSecret);

        if (user.rol !== 'seguridad' && user.rol !== 'admin') {
          socket.emit('error_camara', { error: 'Rol no autorizado' });
          return;
        }

        const tieneAcceso = await verificarAccesoSitio(user, sitioId);
        if (!tieneAcceso) {
          socket.emit('error_camara', { error: 'Sin acceso a este sitio' });
          return;
        }

        socket.join(`camara_${sitioId}`);
        socket.emit('camara_ok', { sitio_id: sitioId });
      } catch {
        socket.emit('error_camara', { error: 'Token inválido' });
      }
    });

    // Enviar alarma desde dashboard de seguridad
    socket.on('alarma', (data) => {
      const sitioId = parseInt(data?.sitio_id, 10);
      if (!isNaN(sitioId)) {
        publicarAlarma(sitioId, data?.mensaje || '1');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });
}

module.exports = { initSocket };
