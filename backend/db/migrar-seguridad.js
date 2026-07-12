/**
 * Migra a modelo 1 guardia = 1 sitio turístico.
 * Uso: node db/migrar-seguridad.js
 */
const bcrypt = require('bcryptjs');
const db = require('./index');
const { insertarSeguridadPorSitio, PASSWORD_DEMO } = require('./seguridad-demo');

async function main() {
  console.log('Migrando personal de seguridad (1:1 con sitios)...');
  const creados = await insertarSeguridadPorSitio(db, bcrypt);
  console.log(`\n${creados} cuenta(s) nueva(s).`);
  console.log(`Contraseña de todas las cuentas seg.*: ${PASSWORD_DEMO}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
