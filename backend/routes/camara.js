// Recibe frames JPEG del ESP32-CAM y los reenvía por Socket.IO

const express = require('express');
const db = require('../db');

function crearRouterCamara(io) {
  const router = express.Router();

  // POST /api/camara/:sitio_id/frame — body binario JPEG + header X-Client-Id
  router.post(
    '/:sitio_id/frame',
    express.raw({ type: ['image/jpeg', 'application/octet-stream'], limit: '512kb' }),
    async (req, res) => {
      const sitioId = parseInt(req.params.sitio_id, 10);
      const clientId = req.headers['x-client-id'];

      if (!clientId) {
        return res.status(400).json({ error: 'Header X-Client-Id requerido' });
      }

      try {
        const result = await db.query(
          'SELECT id, esp32cam_client_id FROM sitios WHERE id = $1 AND activo = true',
          [sitioId]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Sitio no encontrado' });
        }

        const sitio = result.rows[0];

        // Validar que el ESP32-CAM pertenece a este sitio
        if (sitio.esp32cam_client_id !== clientId) {
          return res.status(403).json({ error: 'Client ID no autorizado' });
        }

        if (!req.body || req.body.length === 0) {
          return res.status(400).json({ error: 'Frame vacío' });
        }

        const base64Frame = req.body.toString('base64');

        // Emitir al room de cámara del sitio (navegadores con join_camara)
        io.to(`camara_${sitioId}`).emit('frame', {
          sitio_id: sitioId,
          frame: base64Frame,
          timestamp: Date.now(),
        });

        res.json({ ok: true });
      } catch (err) {
        console.error('Error al recibir frame:', err.message);
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  );

  return router;
}

module.exports = crearRouterCamara;
