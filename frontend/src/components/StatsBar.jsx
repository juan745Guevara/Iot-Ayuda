import { calcularOcupacion, claseOcupacion } from '../utils/aforo';

export default function StatsBar({ sitios }) {
  let disponibles = 0;
  let moderados = 0;
  let llenos = 0;

  sitios.forEach((s) => {
    const c = claseOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo));
    if (c === 'verde') disponibles++;
    else if (c === 'amarillo') moderados++;
    else llenos++;
  });

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-valor">{sitios.length}</div>
        <div className="stat-label">Sitios</div>
      </div>
      <div className="stat-item">
        <div className="stat-valor" style={{ color: '#27ae60' }}>{disponibles}</div>
        <div className="stat-label">Disponibles</div>
      </div>
      <div className="stat-item">
        <div className="stat-valor" style={{ color: '#e9a319' }}>{moderados}</div>
        <div className="stat-label">Moderados</div>
      </div>
      <div className="stat-item">
        <div className="stat-valor" style={{ color: '#d64545' }}>{llenos}</div>
        <div className="stat-label">Llenos</div>
      </div>
    </div>
  );
}
