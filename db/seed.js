/**
 * Inicializa la base de datos: crea tablas e inserta datos de ejemplo.
 * Uso: node db/seed.js
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./index');

async function seed() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(schema);

  const sitios = await db.query('SELECT COUNT(*) FROM sitios');
  if (parseInt(sitios.rows[0].count, 10) === 0) {
    await db.query(`
      INSERT INTO sitios (nombre, ubicacion, aforo_maximo, esp8266_client_id, esp32cam_client_id)
      VALUES
        ('Catarata de Ahuashiyacu', 'Tingo María, Huánuco', 80, 'esp8266-sitio-1', 'esp32cam-sitio-1'),
        ('Cuevas de Toledo', 'Tingo María, Huánuco', 40, 'esp8266-sitio-2', 'esp32cam-sitio-2'),
        ('Jardín Botánico', 'Tingo María, Huánuco', 60, 'esp8266-sitio-3', 'esp32cam-sitio-3')
    `);
    console.log('Sitios de ejemplo creados.');
  }

  const usuarios = await db.query('SELECT COUNT(*) FROM usuarios');
  if (parseInt(usuarios.rows[0].count, 10) === 0) {
    const adminHash = await bcrypt.hash('admin123', 10);
    const segHash = await bcrypt.hash('seg123', 10);

    const admin = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ('Administrador', 'admin@iot.local', $1, 'admin')
       RETURNING id`,
      [adminHash]
    );

    const seguridad = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ('Personal Seguridad', 'seguridad@iot.local', $1, 'seguridad')
       RETURNING id`,
      [segHash]
    );

    // Asignar sitios 1 y 2 al usuario de seguridad
    await db.query(
      `INSERT INTO seguridad_sitios (usuario_id, sitio_id) VALUES ($1, 1), ($1, 2)`,
      [seguridad.rows[0].id]
    );

    console.log('Usuarios creados:');
    console.log('  admin@iot.local / admin123 (rol: admin)');
    console.log('  seguridad@iot.local / seg123 (rol: seguridad, sitios 1 y 2)');
  }

  console.log('Base de datos lista.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error al inicializar BD:', err.message);
  process.exit(1);
});
