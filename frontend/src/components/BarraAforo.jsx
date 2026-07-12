// Barra de progreso con números actual/máximo y badge de estado

import { calcularOcupacion, claseOcupacion, etiquetaOcupacion } from '../utils/aforo';

export default function BarraAforo({ actual, maximo }) {
  const pct = calcularOcupacion(actual, maximo);
  const clase = claseOcupacion(pct);

  return (
    <div className="aforo-info">
      <div className="aforo-display">
        <span className="numero">{actual}</span>
        <span className="separador">/</span>
        <span className="maximo">{maximo}</span>
        <span className="label-personas">personas</span>
      </div>
      <div className="aforo-bar">
        <div className={`aforo-bar-fill estado-${clase}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`badge badge-${clase}`}>{etiquetaOcupacion(pct)} · {pct}%</span>
    </div>
  );
}
