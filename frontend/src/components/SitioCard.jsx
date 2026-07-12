import { Link } from 'react-router-dom';
import { calcularOcupacion, claseOcupacion, etiquetaOcupacion } from '../utils/aforo';
import BarraAforo from './BarraAforo';

export default function SitioCard({ sitio, linkTo = `/sitio/${sitio.id}` }) {
  const pct = calcularOcupacion(sitio.aforo_actual, sitio.aforo_maximo);
  const clase = claseOcupacion(pct);

  return (
    <Link to={linkTo} className="card-link">
      <div className="card card-clickable" data-estado={clase}>
        <div className="card-header">
          <h2>{sitio.nombre}</h2>
          <span className={`badge badge-${clase}`}>{etiquetaOcupacion(pct)}</span>
        </div>
        <div className="ubicacion">📍 {sitio.ubicacion || 'Sin ubicación'}</div>
        <div className="card-body">
          <BarraAforo actual={sitio.aforo_actual} maximo={sitio.aforo_maximo} />
        </div>
        <div className="card-ver-detalle">Ver panel de aforo →</div>
      </div>
    </Link>
  );
}
