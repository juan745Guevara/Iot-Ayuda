// Persiste cambios de aforo: sitio, historial, stats diarias y alertas

const db = require('../db');

// Registra un cambio de aforo desde MQTT (ESP8266 o setear manual)
async function registrarCambioAforo(sitioId, nuevoAforo) {
  const sitioRes = await db.query(
    'SELECT aforo_actual, aforo_maximo FROM sitios WHERE id = $1',
    [sitioId]
  );

  if (sitioRes.rows.length === 0) return null;

  const anterior = sitioRes.rows[0].aforo_actual;
  const maximo = sitioRes.rows[0].aforo_maximo;
  nuevoAforo = Math.max(0, nuevoAforo); // No permitir aforo negativo

  // Sin cambio real → no escribir en BD ni emitir Socket.IO
  if (anterior === nuevoAforo) {
    return { sitio_id: sitioId, aforo_actual: nuevoAforo, cambio: false };
  }

  // Actualizar aforo actual del sitio
  await db.query('UPDATE sitios SET aforo_actual = $1 WHERE id = $2', [nuevoAforo, sitioId]);

  // Guardar punto en historial para gráficos
  await db.query(
    'INSERT INTO historial_aforo (sitio_id, aforo_actual) VALUES ($1, $2)',
    [sitioId, nuevoAforo]
  );

  // Ingresos = diferencia positiva (salidas no restan visitas del día)
  const ingresos = Math.max(0, nuevoAforo - anterior);

  // Acumular visitas y pico del día en stats_diario
  await db.query(
    `INSERT INTO stats_diario (sitio_id, fecha, visitas, aforo_maximo_dia)
     VALUES ($1, CURRENT_DATE, $2, $3)
     ON CONFLICT (sitio_id, fecha) DO UPDATE SET
       visitas = stats_diario.visitas + EXCLUDED.visitas,
       aforo_maximo_dia = GREATEST(stats_diario.aforo_maximo_dia, EXCLUDED.aforo_maximo_dia)`,
    [sitioId, ingresos, nuevoAforo]
  );

  const pct = maximo ? (nuevoAforo / maximo) * 100 : 0;
  const pctAnt = maximo ? (anterior / maximo) * 100 : 0;

  // Alerta al cruzar 60% (moderado) o 85% (lleno)
  if (pct >= 60 && pctAnt < 60) {
    await db.query(
      'INSERT INTO alertas_aforo (sitio_id, tipo, aforo_actual) VALUES ($1, $2, $3)',
      [sitioId, 'moderado', nuevoAforo]
    );
  }
  if (pct >= 85 && pctAnt < 85) {
    await db.query(
      'INSERT INTO alertas_aforo (sitio_id, tipo, aforo_actual) VALUES ($1, $2, $3)',
      [sitioId, 'lleno', nuevoAforo]
    );
  }

  return { sitio_id: sitioId, aforo_actual: nuevoAforo, cambio: true };
}

module.exports = { registrarCambioAforo };
