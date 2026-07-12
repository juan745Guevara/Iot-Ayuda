/**
 * Inicializa la base de datos: crea tablas e inserta datos de ejemplo.
 * Uso: node db/seed.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./index');
const { insertarSitiosFaltantes } = require('./sitios-demo');
const { insertarSeguridadPorSitio, PASSWORD_DEMO } = require('./seguridad-demo');

async function seed() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schema);

  console.log('Insertando sitios turísticos...');
  const insertados = await insertarSitiosFaltantes(db);
  if (insertados > 0) {
    console.log(`${insertados} sitio(s) creado(s).`);
  } else {
    console.log('Todos los sitios ya existían.');
  }

  const usuarios = await db.query('SELECT COUNT(*) FROM usuarios WHERE rol = $1', ['admin']);
  if (parseInt(usuarios.rows[0].count, 10) === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ('Administrador', 'admin@iot.local', $1, 'admin')`,
      [adminHash]
    );
    console.log('Admin: admin@iot.local / admin123');
  }

  console.log('\nPersonal de seguridad (1 guardia por sitio)...');
  const creados = await insertarSeguridadPorSitio(db, bcrypt);
  console.log(`${creados} cuenta(s) nueva(s). Contraseña de todas: ${PASSWORD_DEMO}`);

  const total = await db.query('SELECT COUNT(*) FROM sitios');
  const seg = await db.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'seguridad'");
  console.log(`\nTotal: ${total.rows[0].count} sitios, ${seg.rows[0].count} guardias`);
  console.log('Base de datos lista.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error al inicializar BD:', err.message);
  process.exit(1);
});
