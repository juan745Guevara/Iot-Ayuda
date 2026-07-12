/**
 * Añade tablas de estadísticas e historial inicial en BD existentes.
 * Uso: node db/migrate-stats.js
 */
const fs = require('fs');
const path = require('path');
const db = require('./index');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);

  const sitios = await db.query('SELECT id, aforo_actual FROM sitios');

  for (const s of sitios.rows) {
    const tieneHistorial = await db.query(
      'SELECT 1 FROM historial_aforo WHERE sitio_id = $1 LIMIT 1',
      [s.id]
    );

    if (tieneHistorial.rows.length === 0 && s.aforo_actual >= 0) {
      await db.query(
        'INSERT INTO historial_aforo (sitio_id, aforo_actual) VALUES ($1, $2)',
        [s.id, s.aforo_actual]
      );
      await db.query(
        `INSERT INTO stats_diario (sitio_id, fecha, visitas, aforo_maximo_dia)
         VALUES ($1, CURRENT_DATE, $2, $2)
         ON CONFLICT (sitio_id, fecha) DO NOTHING`,
        [s.id, s.aforo_actual]
      );
      console.log(`  Historial inicial sitio ${s.id} (aforo ${s.aforo_actual})`);
    }
  }

  console.log('Tablas de estadísticas listas.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
