// Sitios turísticos de demostración (Tingo María y alrededores)

const SITIOS_DEMO = [
  {
    nombre: 'Catarata de Ahuashiyacu',
    ubicacion: 'Distrito de Río Tambo, Tingo María',
    aforo_maximo: 80,
    aforo_actual: 24,
    esp8266_client_id: 'esp8266-sitio-1',
    esp32cam_client_id: 'esp32cam-sitio-1',
  },
  {
    nombre: 'Cuevas de Toledo',
    ubicacion: 'Carretera Central, Tingo María',
    aforo_maximo: 40,
    aforo_actual: 38,
    esp8266_client_id: 'esp8266-sitio-2',
    esp32cam_client_id: 'esp32cam-sitio-2',
  },
  {
    nombre: 'Jardín Botánico',
    ubicacion: 'Av. Raymondi, Tingo María',
    aforo_maximo: 60,
    aforo_actual: 12,
    esp8266_client_id: 'esp8266-sitio-3',
    esp32cam_client_id: 'esp32cam-sitio-3',
  },
  {
    nombre: 'Cueva de las Lechuzas',
    ubicacion: 'Río Huallaga, Tingo María',
    aforo_maximo: 35,
    aforo_actual: 18,
    esp8266_client_id: 'esp8266-sitio-4',
    esp32cam_client_id: 'esp32cam-sitio-4',
  },
  {
    nombre: 'Complejo Turístico Blue Water',
    ubicacion: 'Km 4, carretera a Huanuco',
    aforo_maximo: 120,
    aforo_actual: 67,
    esp8266_client_id: 'esp8266-sitio-5',
    esp32cam_client_id: 'esp32cam-sitio-5',
  },
  {
    nombre: 'Laguna El Otorongo',
    ubicacion: 'Zona alta, Tingo María',
    aforo_maximo: 50,
    aforo_actual: 8,
    esp8266_client_id: 'esp8266-sitio-6',
    esp32cam_client_id: 'esp32cam-sitio-6',
  },
  {
    nombre: 'Bosque de Cataratas San Daniel',
    ubicacion: 'San Daniel, Leoncio Prado',
    aforo_maximo: 70,
    aforo_actual: 45,
    esp8266_client_id: 'esp8266-sitio-7',
    esp32cam_client_id: 'esp32cam-sitio-7',
  },
  {
    nombre: 'Mirador Boquerón del Padre Abad',
    ubicacion: 'Padre Abad, Ucayali',
    aforo_maximo: 45,
    aforo_actual: 22,
    esp8266_client_id: 'esp8266-sitio-8',
    esp32cam_client_id: 'esp32cam-sitio-8',
  },
  {
    nombre: 'Termales de Quincemil',
    ubicacion: 'Quincemil, Leoncio Prado',
    aforo_maximo: 90,
    aforo_actual: 72,
    esp8266_client_id: 'esp8266-sitio-9',
    esp32cam_client_id: 'esp32cam-sitio-9',
  },
  {
    nombre: 'Complejo Turístico Villa Verde',
    ubicacion: 'Carretera Central km 2, Tingo María',
    aforo_maximo: 100,
    aforo_actual: 31,
    esp8266_client_id: 'esp8266-sitio-10',
    esp32cam_client_id: 'esp32cam-sitio-10',
  },
  {
    nombre: 'Museo Municipal de Tingo María',
    ubicacion: 'Plaza de Armas, Tingo María',
    aforo_maximo: 30,
    aforo_actual: 5,
    esp8266_client_id: 'esp8266-sitio-11',
    esp32cam_client_id: 'esp32cam-sitio-11',
  },
  {
    nombre: 'Parque Nacional Tingo María',
    ubicacion: 'Entrada principal, Leoncio Prado',
    aforo_maximo: 150,
    aforo_actual: 98,
    esp8266_client_id: 'esp8266-sitio-12',
    esp32cam_client_id: 'esp32cam-sitio-12',
  },
];

async function insertarSitiosFaltantes(db) {
  let insertados = 0;

  for (const s of SITIOS_DEMO) {
    const existe = await db.query(
      'SELECT id FROM sitios WHERE nombre = $1 OR esp8266_client_id = $2',
      [s.nombre, s.esp8266_client_id]
    );

    if (existe.rows.length > 0) continue;

    await db.query(
      `INSERT INTO sitios (nombre, ubicacion, aforo_maximo, aforo_actual, esp8266_client_id, esp32cam_client_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [s.nombre, s.ubicacion, s.aforo_maximo, s.aforo_actual, s.esp8266_client_id, s.esp32cam_client_id]
    );
    insertados++;
    console.log(`  + ${s.nombre}`);
  }

  return insertados;
}

module.exports = { SITIOS_DEMO, insertarSitiosFaltantes };
