import CamaraStream from './CamaraStream';
import BarraAforo from './BarraAforo';
import { calcularOcupacion, claseOcupacion, etiquetaOcupacion } from '../utils/aforo';

export function SeguridadSitioFull({ sitio, onAlarma, alarmaEnviada }) {
  const pct = calcularOcupacion(sitio.aforo_actual, sitio.aforo_maximo);
  const clase = claseOcupacion(pct);

  return (
    <div className="card card-un-sitio sitio-seguridad">
      <div className="card-un-sitio-top">
        <div>
          <span className="sitio-unico-label">Tu sitio asignado</span>
          <h2>{sitio.nombre}</h2>
          <div className="ubicacion">📍 {sitio.ubicacion || 'Sin ubicación'}</div>
        </div>
        <span className={`badge badge-${clase}`}>{etiquetaOcupacion(pct)}</span>
      </div>
      <div className="card-un-sitio-panel">
        <BarraAforo actual={sitio.aforo_actual} maximo={sitio.aforo_maximo} />
        <button type="button" className="danger btn-alarma-full" onClick={() => onAlarma(sitio.id)}>
          {alarmaEnviada ? '✓ Alarma enviada' : 'Activar alarma'}
        </button>
      </div>
      <div className="card-un-sitio-camara">
        <h3>Cámara en vivo</h3>
        <CamaraStream sitioId={sitio.id} />
      </div>
    </div>
  );
}

export default function SeguridadSitioCard({ sitio, onAlarma, alarmaEnviada }) {
  return (
    <div className="card sitio-seguridad sitio-seguridad-card">
      <div className="card-header sitio-seguridad-header">
        <h2>{sitio.nombre}</h2>
      </div>
      <div className="ubicacion sitio-seguridad-ubicacion">📍 {sitio.ubicacion}</div>
      <BarraAforo actual={sitio.aforo_actual} maximo={sitio.aforo_maximo} />
      <h3>Cámara en vivo</h3>
      <CamaraStream sitioId={sitio.id} />
      <button type="button" className="danger sitio-seguridad-alarma" onClick={() => onAlarma(sitio.id)}>
        {alarmaEnviada ? '✓ Alarma enviada' : 'Activar alarma'}
      </button>
    </div>
  );
}
