// Cuentas guardia demo: un email por sitio (contraseña compartida seg123)

const PASSWORD_DEMO = 'seg123';

const SEGURIDAD_DEMO = [
  { nombre: 'Seg. Catarata Ahuashiyacu', email: 'seg.ahuashiyacu@iot.local', sitio_id: 1 },
  { nombre: 'Seg. Cuevas de Toledo', email: 'seg.toledo@iot.local', sitio_id: 2 },
  { nombre: 'Seg. Jardín Botánico', email: 'seg.jardin@iot.local', sitio_id: 3 },
  { nombre: 'Seg. Cueva Lechuzas', email: 'seg.lechuzas@iot.local', sitio_id: 4 },
  { nombre: 'Seg. Blue Water', email: 'seg.bluewater@iot.local', sitio_id: 5 },
  { nombre: 'Seg. Laguna Otorongo', email: 'seg.otorongo@iot.local', sitio_id: 6 },
  { nombre: 'Seg. San Daniel', email: 'seg.sandaniel@iot.local', sitio_id: 7 },
  { nombre: 'Seg. Mirador Boquerón', email: 'seg.boqueron@iot.local', sitio_id: 8 },
  { nombre: 'Seg. Termales Quincemil', email: 'seg.quincemil@iot.local', sitio_id: 9 },
  { nombre: 'Seg. Villa Verde', email: 'seg.villaverde@iot.local', sitio_id: 10 },
  { nombre: 'Seg. Museo Municipal', email: 'seg.museo@iot.local', sitio_id: 11 },
  { nombre: 'Seg. Parque Nacional', email: 'seg.parque@iot.local', sitio_id: 12 },
];

// Crea o actualiza guardias y los asigna 1:1 a cada sitio
async function insertarSeguridadPorSitio(db, bcrypt) {
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  let creados = 0;

  for (const seg of SEGURIDAD_DEMO) {
    const sitio = await db.query('SELECT id, nombre FROM sitios WHERE id = $1', [seg.sitio_id]);
    if (sitio.rows.length === 0) continue;

    let usuario = await db.query('SELECT id FROM usuarios WHERE email = $1', [seg.email]);

    if (usuario.rows.length === 0) {
      usuario = await db.query(
        `INSERT INTO usuarios (nombre, email, password_hash, rol)
         VALUES ($1, $2, $3, 'seguridad')
         RETURNING id`,
        [seg.nombre, seg.email, passwordHash]
      );
      creados++;
      console.log(`  + ${seg.email} → ${sitio.rows[0].nombre}`);
    } else {
      await db.query('UPDATE usuarios SET nombre = $1 WHERE id = $2', [seg.nombre, usuario.rows[0].id]);
    }

    const usuarioId = usuario.rows[0].id;

    // Un guardia = un solo sitio
    await db.query('DELETE FROM seguridad_sitios WHERE usuario_id = $1', [usuarioId]);
    // Un sitio = un solo guardia asignado
    await db.query('DELETE FROM seguridad_sitios WHERE sitio_id = $1', [seg.sitio_id]);

    await db.query(
      'INSERT INTO seguridad_sitios (usuario_id, sitio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [usuarioId, seg.sitio_id]
    );
  }

  // Limpiar cuenta genérica antigua: dejarla solo en sitio 1 o sin asignaciones extra
  const viejo = await db.query("SELECT id FROM usuarios WHERE email = 'seguridad@iot.local'");
  if (viejo.rows.length > 0) {
    const id = viejo.rows[0].id;
    await db.query('DELETE FROM seguridad_sitios WHERE usuario_id = $1', [id]);
    console.log('  ~ seguridad@iot.local sin sitios (usar cuentas por sitio)');
  }

  return creados;
}

module.exports = { SEGURIDAD_DEMO, PASSWORD_DEMO, insertarSeguridadPorSitio };
