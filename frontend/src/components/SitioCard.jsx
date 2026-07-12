import { Link } from 'react-router-dom';
import { calcularOcupacion, claseOcupacion, etiquetaOcupacion } from '../utils/aforo';
import BarraAforo from './BarraAforo';

export default function SitioCard({ sitio, linkTo = `/sitio/${sitio.id}` }) {
  const pct = calcularOcupacion(sitio.aforo_actual, sitio.aforo_maximo);
  const clase = claseOcupacion(pct);

  return (
    <Link to={linkTo} className="card-link">
      <article className="card card-clickable card-sitio" data-estado={clase}>
        <div className={`card-status-strip estado-${clase}`} />
        <div className="card-header">
          <div>
            <h2>{sitio.nombre}</h2>
            <div className="ubicacion">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              {sitio.ubicacion || 'Sin ubicación'}
            </div>
          </div>
          <span className={`badge badge-${clase}`}>{etiquetaOcupacion(pct)}</span>
        </div>
        <div className="card-body">
          <BarraAforo actual={sitio.aforo_actual} maximo={sitio.aforo_maximo} />
        </div>
        <div className="card-ver-detalle">
          Ver panel de aforo
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </article>
    </Link>
  );
}
