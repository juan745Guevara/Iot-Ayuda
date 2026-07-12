// Rutas del dashboard de seguridad: sitios asignados al guardia logueado

const express = require('express');
const db = require('../db');
const { authRequired, requireRol } = require('../middleware/auth');

const router = express.Router();

// GET /api/seguridad/mis-sitios — sitios que puede monitorear el usuario
router.get('/mis-sitios', authRequired, requireRol('seguridad', 'admin'), async (req, res) => {
  try {
    let result;

    if (req.user.rol === 'admin') {
      // Admin ve todos los sitios activos
      result = await db.query(
        `SELECT id, nombre, ubicacion, aforo_maximo, aforo_actual
         FROM sitios WHERE activo = true ORDER BY nombre`
      );
    } else {
      // Guardia: solo sitios de la tabla seguridad_sitios
      result = await db.query(
        `SELECT s.id, s.nombre, s.ubicacion, s.aforo_maximo, s.aforo_actual
         FROM sitios s
         INNER JOIN seguridad_sitios ss ON ss.sitio_id = s.id
         WHERE ss.usuario_id = $1 AND s.activo = true
         ORDER BY s.nombre`,
        [req.user.id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener sitios de seguridad:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
