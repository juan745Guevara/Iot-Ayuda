export const META_SITIOS = {
  1: { tipo: 'Catarata · Tingo María', detalle: ['Distrito Río Tambo', '12 km del centro'] },
  2: { tipo: 'Cueva · Tingo María', detalle: ['Carretera Central', '5 km del centro'] },
  3: { tipo: 'Jardín Botánico · Tingo María', detalle: ['Av. Raymondi', 'Centro urbano'] },
  4: { tipo: 'Cueva · Tingo María', detalle: ['Río Huallaga', '8 km del centro'] },
  5: { tipo: 'Complejo turístico · Tingo María', detalle: ['Km 4 carretera Huánuco', '4 km del centro'] },
  6: { tipo: 'Laguna · Tingo María', detalle: ['Zona alta', '15 km del centro'] },
  7: { tipo: 'Bosque natural · Tingo María', detalle: ['San Daniel, Leoncio Prado', '45 km del centro'] },
  8: { tipo: 'Mirador · Padre Abad', detalle: ['Padre Abad, Ucayali', '60 km del centro'] },
  9: { tipo: 'Termales · Tingo María', detalle: ['Quincemil', '30 km del centro'] },
  10: { tipo: 'Complejo turístico · Tingo María', detalle: ['Km 2 carretera central', '2 km del centro'] },
  11: { tipo: 'Museo · Tingo María', detalle: ['Plaza de Armas', 'Centro urbano'] },
  12: { tipo: 'Parque Nacional · Tingo María', detalle: ['Entrada principal', '10 km del centro'] },
};

export function getMetaSitio(id) {
  return META_SITIOS[id] || { tipo: 'Atractivo turístico · Tingo María', detalle: [] };
}
