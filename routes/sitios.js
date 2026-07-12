const express = require('express');
const db = require('../db');
const { authRequired, requireRol } = require('../middleware/auth');

const router = express.Router();

// Lista pública de sitios activos
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, ubicacion, aforo_maximo, aforo_actual, activo
       FROM sitios WHERE activo = true ORDER BY nombre`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar sitios:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Detalle público de un sitio
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, ubicacion, aforo_maximo, aforo_actual, activo
       FROM sitios WHERE id = $1 AND activo = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener sitio:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Aforo actual de un sitio (público)
router.get('/:id/aforo', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, nombre, aforo_actual, aforo_maximo
       FROM sitios WHERE id = $1 AND activo = true`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    const sitio = result.rows[0];
    res.json({
      sitio_id: sitio.id,
      nombre: sitio.nombre,
      aforo_actual: sitio.aforo_actual,
      aforo_maximo: sitio.aforo_maximo,
    });
  } catch (err) {
    console.error('Error al obtener aforo:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Info de cámara (solo seguridad/admin con acceso al sitio)
router.get('/:id/camara', authRequired, requireRol('seguridad', 'admin'), async (req, res) => {
  try {
    const sitioId = parseInt(req.params.id, 10);
    const tieneAcceso = await verificarAccesoSitio(req.user, sitioId);

    if (!tieneAcceso) {
      return res.status(403).json({ error: 'No tienes acceso a este sitio' });
    }

    const result = await db.query(
      'SELECT id, nombre FROM sitios WHERE id = $1 AND activo = true',
      [sitioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    res.json({
      sitio_id: result.rows[0].id,
      nombre: result.rows[0].nombre,
      stream: 'socket',
      evento: 'frame',
      room: `camara_${sitioId}`,
    });
  } catch (err) {
    console.error('Error al obtener info de cámara:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

async function verificarAccesoSitio(user, sitioId) {
  if (user.rol === 'admin') return true;

  const result = await db.query(
    'SELECT 1 FROM seguridad_sitios WHERE usuario_id = $1 AND sitio_id = $2',
    [user.id, sitioId]
  );

  return result.rows.length > 0;
}

module.exports = router;
module.exports.verificarAccesoSitio = verificarAccesoSitio;
