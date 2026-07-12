export const META_SITIOS = {
  1: { tipo: 'Catarata · Tingo María', detalle: ['Distrito Río Tambo', '12 km del centro', '650 m.s.n.m.'] },
  2: { tipo: 'Cueva · Tingo María', detalle: ['Carretera Central', '5 km del centro', '580 m.s.n.m.'] },
  3: { tipo: 'Jardín Botánico · Tingo María', detalle: ['Av. Raymondi', 'Centro urbano', '660 m.s.n.m.'] },
  4: { tipo: 'Cueva · Tingo María', detalle: ['Río Huallaga', '8 km del centro', '520 m.s.n.m.'] },
  5: { tipo: 'Complejo turístico · Tingo María', detalle: ['Km 4 carretera Huanuco', '4 km', '600 m.s.n.m.'] },
  6: { tipo: 'Laguna · Tingo María', detalle: ['Zona alta', '15 km del centro', '900 m.s.n.m.'] },
  7: { tipo: 'Bosque natural · Tingo María', detalle: ['San Daniel, Leoncio Prado', '45 km', '420 m.s.n.m.'] },
  8: { tipo: 'Mirador · Padre Abad', detalle: ['Padre Abad, Ucayali', '60 km', '380 m.s.n.m.'] },
  9: { tipo: 'Termales · Tingo María', detalle: ['Quincemil', '30 km', '550 m.s.n.m.'] },
  10: { tipo: 'Complejo turístico · Tingo María', detalle: ['Km 2 carretera central', '2 km', '620 m.s.n.m.'] },
  11: { tipo: 'Museo · Tingo María', detalle: ['Plaza de Armas', 'Centro', '660 m.s.n.m.'] },
  12: { tipo: 'Parque Nacional · Tingo María', detalle: ['Entrada principal', '10 km', '700 m.s.n.m.'] },
};

export function getMetaSitio(id) {
  return META_SITIOS[id] || { tipo: 'Atractivo turístico · Tingo María', detalle: [] };
}
