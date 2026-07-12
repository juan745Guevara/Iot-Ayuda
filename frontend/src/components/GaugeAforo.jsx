import { calcularOcupacion, claseOcupacion, colorGauge } from '../utils/aforo';

const CIRC = 2 * Math.PI * 88;

export default function GaugeAforo({ actual, maximo }) {
  const pct = calcularOcupacion(actual, maximo);
  const offset = CIRC - (pct / 100) * CIRC;

  return (
    <div className="gauge-wrap">
      <div className="gauge-ring-container">
        <svg className="gauge-svg" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="88" fill="none" stroke="#e0ebe6" strokeWidth="14" />
          <circle
            cx="100" cy="100" r="88" fill="none"
            stroke={colorGauge(pct)} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={CIRC} strokeDashoffset={offset}
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
          />
        </svg>
        <div className="gauge-center">
          <div className="gauge-numero">{actual}</div>
          <div className="gauge-de">de</div>
          <div className="gauge-maximo">{maximo}</div>
        </div>
      </div>
      <div className="gauge-pct">{pct}% ocupado</div>
    </div>
  );
}
