// Añade sitios del catálogo demo que aún no existen en la BD
// Uso: node db/add-sitios.js  o  npm run db:add-sitios

const db = require('./index');
const { insertarSitiosFaltantes } = require('./sitios-demo');

async function main() {
  console.log('Buscando sitios nuevos...');
  const insertados = await insertarSitiosFaltantes(db);

  if (insertados === 0) {
    console.log('No hay sitios nuevos por añadir.');
  } else {
    console.log(`\n${insertados} sitio(s) añadido(s).`);
  }

  const total = await db.query('SELECT COUNT(*) FROM sitios');
  console.log(`Total en BD: ${total.rows[0].count} sitios`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
