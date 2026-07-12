// Panel admin: CRUD sitios, asignar guardias y publicar alarmas MQTT

const express = require('express');
const db = require('../db');
const { authRequired, requireRol } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren rol admin
router.use(authRequired, requireRol('admin'));

// GET /api/admin/sitios — todos los sitios (incluye inactivos)
router.get('/sitios', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, ubicacion, aforo_maximo, aforo_actual,
              esp8266_client_id, esp32cam_client_id, activo, created_at
       FROM sitios ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error admin sitios:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/sitios — crear nuevo sitio turístico
router.post('/sitios', async (req, res) => {
  const {
    nombre,
    ubicacion,
    aforo_maximo,
    esp8266_client_id,
    esp32cam_client_id,
  } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const result = await db.query(
      `INSERT INTO sitios (nombre, ubicacion, aforo_maximo, esp8266_client_id, esp32cam_client_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        nombre,
        ubicacion || null,
        aforo_maximo || 50,
        esp8266_client_id || null,
        esp32cam_client_id || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Client ID duplicado' });
    }
    console.error('Error al crear sitio:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/asignar-seguridad — modelo 1 guardia : 1 sitio
router.post('/asignar-seguridad', async (req, res) => {
  const { usuario_id, sitio_id } = req.body;

  if (!usuario_id || !sitio_id) {
    return res.status(400).json({ error: 'usuario_id y sitio_id son requeridos' });
  }

  try {
    const usuario = await db.query(
      "SELECT id, rol FROM usuarios WHERE id = $1 AND rol = 'seguridad'",
      [usuario_id]
    );

    if (usuario.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario de seguridad no encontrado' });
    }

    const sitio = await db.query('SELECT id FROM sitios WHERE id = $1', [sitio_id]);
    if (sitio.rows.length === 0) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    // Quitar asignaciones previas del guardia y del sitio (relación 1:1)
    await db.query('DELETE FROM seguridad_sitios WHERE usuario_id = $1', [usuario_id]);
    await db.query('DELETE FROM seguridad_sitios WHERE sitio_id = $1', [sitio_id]);

    await db.query(
      `INSERT INTO seguridad_sitios (usuario_id, sitio_id)
       VALUES ($1, $2)`,
      [usuario_id, sitio_id]
    );

    res.json({ ok: true, usuario_id, sitio_id, mensaje: 'Asignación 1:1 actualizada' });
  } catch (err) {
    console.error('Error al asignar seguridad:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/usuarios-seguridad — listado con sitio asignado
router.get('/usuarios-seguridad', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.nombre, u.email,
              COALESCE(
                json_agg(json_build_object('sitio_id', s.id, 'nombre', s.nombre))
                FILTER (WHERE s.id IS NOT NULL), '[]'
              ) AS sitios
       FROM usuarios u
       LEFT JOIN seguridad_sitios ss ON ss.usuario_id = u.id
       LEFT JOIN sitios s ON s.id = ss.sitio_id
       WHERE u.rol = 'seguridad'
       GROUP BY u.id
       ORDER BY u.nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar usuarios seguridad:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/alarma/:sitio_id — disparar alarma MQTT (pruebas desde admin)
router.post('/alarma/:sitio_id', async (req, res) => {
  const sitioId = parseInt(req.params.sitio_id, 10);
  const { getMqttClient } = require('../mqtt/client');
  const mqttClient = getMqttClient();

  if (!mqttClient) {
    return res.status(503).json({ error: 'MQTT no disponible' });
  }

  mqttClient.publish(`aforo/${sitioId}/alarma`, req.body.mensaje || '1');
  res.json({ ok: true });
});

module.exports = router;
