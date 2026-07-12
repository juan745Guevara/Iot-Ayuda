// Detalle público de un sitio: gauge, stats del día e historial

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import GaugeAforo from '../components/GaugeAforo';
import ChartHistorial from '../components/ChartHistorial';
import { useSocket } from '../hooks/useSocket';
import { getMetaSitio } from '../utils/metaSitios';
import { calcularOcupacion, claseOcupacion, etiquetaOcupacion, claseBarra } from '../utils/aforo';

export default function SitioDetalle() {
  const { id } = useParams();
  const sitioId = parseInt(id, 10);
  const socket = useSocket();
  const [sitio, setSitio] = useState(null);
  const [stats, setStats] = useState(null);
  const [historial, setHistorial] = useState({ labels: [], data: [], limite: 0 });
  const [periodo, setPeriodo] = useState('dia');

  // Cargar sitio, estadísticas e historial (se repite al cambiar periodo o aforo)
  async function cargarDatos() {
    const [rSitio, rStats, rHist] = await Promise.all([
      fetch(`/api/sitios/${sitioId}`),
      fetch(`/api/sitios/${sitioId}/estadisticas`),
      fetch(`/api/sitios/${sitioId}/historial?periodo=${periodo}`),
    ]);
    if (rSitio.ok) setSitio(await rSitio.json());
    if (rStats.ok) setStats(await rStats.json());
    if (rHist.ok) setHistorial(await rHist.json());
  }

  useEffect(() => {
    if (!sitioId) return;
    cargarDatos();
  }, [sitioId, periodo]);

  // Actualizar en tiempo real cuando MQTT cambia el aforo
  useEffect(() => {
    socket.emit('join_sitio', { sitio_id: sitioId });
    const onAforo = (data) => {
      if (data.sitio_id === sitioId) cargarDatos();
    };
    socket.on('aforo', onAforo);
    return () => socket.off('aforo', onAforo);
  }, [socket, sitioId]);

  if (!sitio || !stats) {
    return <div className="sitio-loading">Cargando sitio...</div>;
  }

  const meta = getMetaSitio(sitioId);
  const pct = calcularOcupacion(stats.aforo_actual, stats.aforo_maximo);
  const clase = claseOcupacion(pct);
  const disp = stats.aforo_maximo - stats.aforo_actual;

  return (
    <>
      <Header subtitle="Detalle del sitio">
        <span className="live-badge">
          <span className="live-dot" />
          En vivo
        </span>
        <Link to="/login" className="btn-nav">Acceso personal</Link>
      </Header>

      <section className="hero hero-sitio">
        <div className="hero-bg-shape hero-bg-shape-1" />
        <div className="hero-inner hero-sitio-content">
          <Link to="/" className="volver-link">← Volver a sitios</Link>
          <span className="eyebrow eyebrow-light">{meta.tipo}</span>
          <h1>{sitio.nombre}</h1>
          <div className="sitio-detalle-lineas">
            {(meta.detalle.length ? meta.detalle : [sitio.ubicacion]).map((d, i) => (
              <span key={d} className="sitio-meta-chip">
                {i === 0 ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 12h18M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {d}
              </span>
            ))}
          </div>
          <div className="estado-hero">
            <span className={`badge badge-${clase}`}>{etiquetaOcupacion(pct)}</span>
          </div>
        </div>
      </section>

      <main className="with-hero page-main sitio-main">
        <div className="sitio-dashboard-grid">
          <div className="card sitio-panel">
            <h3 className="sitio-panel-title">Aforo en tiempo real</h3>
            <GaugeAforo actual={stats.aforo_actual} maximo={stats.aforo_maximo} />
          </div>

          <div className="sitio-stats-col">
            <div className="stats-bar sitio-stats-bar">
              <div className="stat-item">
                <div className="stat-valor stat-verde">{stats.disponibles}</div>
                <div className="stat-label">Disponibles</div>
                <div className="stat-sub">de {stats.aforo_maximo} plazas</div>
              </div>
              <div className="stat-item">
                <div className="stat-valor stat-naranja">{stats.maximo_hoy}</div>
                <div className="stat-label">Máximo hoy</div>
                <div className="stat-sub">{stats.hora_maximo ? `a las ${stats.hora_maximo}` : 'sin registro aún'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-valor stat-azul">{stats.visitas_hoy}</div>
                <div className="stat-label">Visitas hoy</div>
                <div className="stat-sub">
                  {stats.visitas_ayer > 0
                    ? `${stats.pct_vs_ayer >= 0 ? '+' : ''}${stats.pct_vs_ayer}% vs ayer`
                    : `${stats.visitas_hoy} ingresos hoy`}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-valor stat-rojo">{stats.alertas_hoy}</div>
                <div className="stat-label">Alertas hoy</div>
                <div className="stat-sub">{stats.alertas_hoy ? 'por capacidad' : 'sin incidentes'}</div>
              </div>
            </div>

            <div className="card sitio-panel">
              <h3 className="sitio-panel-title">Distribución de aforo</h3>
              <div className="aforo-bar sitio-dist-bar">
                <div className={`aforo-bar-fill ${claseBarra(pct)}`} style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
              </div>
              <div className="dist-legend">
                <span>Ocupado {stats.aforo_actual} ({pct}%)</span>
                <span>Disponible {disp} ({100 - pct}%)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card sitio-panel sitio-historial">
          <div className="historial-header">
            <h3 className="sitio-panel-title" style={{ margin: 0 }}>Historial de aforo</h3>
            <div className="filtros-estado">
              {['dia', 'semana', 'mes'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`filtro-btn ${periodo === p ? 'activo' : ''}`}
                  onClick={() => setPeriodo(p)}
                >
                  {p === 'dia' ? 'Día' : p === 'semana' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
          <ChartHistorial labels={historial.labels} data={historial.data} limite={historial.limite} />
        </div>
      </main>
    </>
  );
}
