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

// Estadísticas reales del día (público)
router.get('/:id/estadisticas', async (req, res) => {
  const sitioId = parseInt(req.params.id, 10);

  try {
    const sitio = await db.query(
      'SELECT id, nombre, aforo_actual, aforo_maximo FROM sitios WHERE id = $1 AND activo = true',
      [sitioId]
    );
    if (sitio.rows.length === 0) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    const s = sitio.rows[0];

    const statsHoy = await db.query(
      'SELECT visitas, aforo_maximo_dia FROM stats_diario WHERE sitio_id = $1 AND fecha = CURRENT_DATE',
      [sitioId]
    );

    const statsAyer = await db.query(
      'SELECT visitas FROM stats_diario WHERE sitio_id = $1 AND fecha = CURRENT_DATE - 1',
      [sitioId]
    );

    const pico = await db.query(
      `SELECT aforo_actual, recorded_at FROM historial_aforo
       WHERE sitio_id = $1 AND recorded_at >= CURRENT_DATE
       ORDER BY aforo_actual DESC, recorded_at ASC LIMIT 1`,
      [sitioId]
    );

    const alertas = await db.query(
      'SELECT COUNT(*)::int AS total FROM alertas_aforo WHERE sitio_id = $1 AND created_at >= CURRENT_DATE',
      [sitioId]
    );

    const visitasHoy = statsHoy.rows[0]?.visitas ?? 0;
    const visitasAyer = statsAyer.rows[0]?.visitas ?? 0;
    const maximoDia = statsHoy.rows[0]?.aforo_maximo_dia ?? s.aforo_actual;
    let pctVsAyer = 0;
    if (visitasAyer > 0) {
      pctVsAyer = Math.round(((visitasHoy - visitasAyer) / visitasAyer) * 100);
    }

    const horaPico = pico.rows[0]
      ? new Date(pico.rows[0].recorded_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
      : null;

    res.json({
      sitio_id: sitioId,
      aforo_actual: s.aforo_actual,
      aforo_maximo: s.aforo_maximo,
      disponibles: s.aforo_maximo - s.aforo_actual,
      visitas_hoy: visitasHoy,
      visitas_ayer: visitasAyer,
      pct_vs_ayer: pctVsAyer,
      maximo_hoy: maximoDia,
      hora_maximo: horaPico,
      alertas_hoy: alertas.rows[0].total,
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Historial de aforo para gráficos (público)
router.get('/:id/historial', async (req, res) => {
  const sitioId = parseInt(req.params.id, 10);
  const periodo = req.query.periodo || 'dia';

  try {
    const sitio = await db.query(
      'SELECT aforo_actual, aforo_maximo FROM sitios WHERE id = $1 AND activo = true',
      [sitioId]
    );
    if (sitio.rows.length === 0) {
      return res.status(404).json({ error: 'Sitio no encontrado' });
    }

    let result;

    if (periodo === 'dia') {
      result = await db.query(
        `SELECT EXTRACT(HOUR FROM recorded_at)::int AS hora,
                MAX(aforo_actual) AS valor
         FROM historial_aforo
         WHERE sitio_id = $1 AND recorded_at >= CURRENT_DATE
         GROUP BY 1 ORDER BY 1`,
        [sitioId]
      );

      const labels = [];
      const data = [];
      const mapa = {};
      result.rows.forEach((r) => { mapa[r.hora] = r.valor; });

      for (let h = 6; h <= 22; h++) {
        labels.push(`${String(h).padStart(2, '0')}:00`);
        data.push(mapa[h] !== undefined ? mapa[h] : null);
      }

      return res.json({ periodo, labels, data, limite: sitio.rows[0].aforo_maximo });
    }

    if (periodo === 'semana') {
      result = await db.query(
        `SELECT TO_CHAR(recorded_at, 'Dy') AS dia,
                DATE(recorded_at) AS fecha,
                MAX(aforo_actual) AS valor
         FROM historial_aforo
         WHERE sitio_id = $1 AND recorded_at >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY DATE(recorded_at), TO_CHAR(recorded_at, 'Dy')
         ORDER BY fecha`,
        [sitioId]
      );
    } else {
      result = await db.query(
        `SELECT TO_CHAR(recorded_at, 'DD Mon') AS dia,
                DATE(recorded_at) AS fecha,
                MAX(aforo_actual) AS valor
         FROM historial_aforo
         WHERE sitio_id = $1 AND recorded_at >= CURRENT_DATE - INTERVAL '29 days'
         GROUP BY DATE(recorded_at), TO_CHAR(recorded_at, 'DD Mon')
         ORDER BY fecha`,
        [sitioId]
      );
    }

    const diasEs = { Sun: 'Dom', Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb' };

    res.json({
      periodo,
      labels: result.rows.map((r) => diasEs[r.dia?.trim()] || r.dia),
      data: result.rows.map((r) => r.valor),
      limite: sitio.rows[0].aforo_maximo,
    });
  } catch (err) {
    console.error('Error al obtener historial:', err.message);
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
