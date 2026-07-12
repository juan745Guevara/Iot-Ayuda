// Resumen de sitios por estado de ocupación (hero de Home)

import { calcularOcupacion, claseOcupacion } from '../utils/aforo';

const STATS = [
  { key: 'total', label: 'Sitios activos', color: 'stat-total' },
  { key: 'verde', label: 'Disponibles', color: 'stat-ok' },
  { key: 'amarillo', label: 'Moderados', color: 'stat-warn' },
  { key: 'rojo', label: 'Llenos', color: 'stat-danger' },
];

export default function StatsBar({ sitios }) {
  const counts = { total: sitios.length, verde: 0, amarillo: 0, rojo: 0 };

  sitios.forEach((s) => {
    const c = claseOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo));
    counts[c]++;
  });

  return (
    <div className="stats-bar stats-bar-pro">
      {STATS.map(({ key, label, color }) => (
        <div key={key} className={`stat-card ${color}`}>
          <div className="stat-card-valor">{counts[key]}</div>
          <div className="stat-card-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
