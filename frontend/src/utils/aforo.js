export function calcularOcupacion(actual, maximo) {
  if (!maximo) return 0;
  return Math.round((actual / maximo) * 100);
}

export function claseOcupacion(porcentaje) {
  if (porcentaje < 60) return 'verde';
  if (porcentaje < 85) return 'amarillo';
  return 'rojo';
}

export function etiquetaOcupacion(porcentaje) {
  if (porcentaje < 60) return 'Disponible';
  if (porcentaje < 85) return 'Moderado';
  return 'Lleno';
}

export function colorGauge(pct) {
  if (pct < 60) return '#1a7a5e';
  if (pct < 85) return '#e9a319';
  return '#d64545';
}

export function claseBarra(pct) {
  if (pct < 60) return 'estado-verde';
  if (pct < 85) return 'estado-amarillo';
  return 'estado-rojo';
}
