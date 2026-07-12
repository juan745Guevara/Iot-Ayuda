import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import StatsBar from '../components/StatsBar';
import BuscadorSitios, { filtrarSitiosLista } from '../components/BuscadorSitios';
import SitioCard from '../components/SitioCard';
import { useSocket } from '../hooks/useSocket';
import { claseOcupacion, calcularOcupacion } from '../utils/aforo';

export default function Home() {
  const socket = useSocket();
  const [sitios, setSitios] = useState([]);
  const [busqueda, setBusqueda] = useState({ query: '', filtro: 'todos' });

  useEffect(() => {
    fetch('/api/sitios')
      .then((r) => r.json())
      .then((data) => {
        setSitios(data.map((s) => ({
          ...s,
          _estado: claseOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo)),
        })));
      });
  }, []);

  useEffect(() => {
    socket.emit('join_todos_sitios');
    const onAforo = (data) => {
      setSitios((prev) => prev.map((s) => {
        if (s.id !== data.sitio_id) return s;
        const updated = { ...s, aforo_actual: data.aforo_actual };
        updated._estado = claseOcupacion(calcularOcupacion(updated.aforo_actual, updated.aforo_maximo));
        return updated;
      }));
    };
    socket.on('aforo', onAforo);
    return () => socket.off('aforo', onAforo);
  }, [socket]);

  const filtrados = useMemo(() => filtrarSitiosLista(sitios, busqueda), [sitios, busqueda]);

  return (
    <>
      <Header subtitle="Tingo María, Perú">
        <span className="live-badge">
          <span className="live-dot" />
          En vivo
        </span>
        <Link to="/login" className="btn-nav">Acceso personal</Link>
      </Header>

      <section className="hero hero-home">
        <div className="hero-bg-shape hero-bg-shape-1" />
        <div className="hero-bg-shape hero-bg-shape-2" />
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Plataforma de monitoreo turístico</span>
            <h1>Ocupación en tiempo real de sitios turísticos</h1>
            <p>
              Consulta el aforo actualizado de cada destino. Datos transmitidos
              automáticamente desde sensores IoT instalados en cada establecimiento.
            </p>
          </div>
          <StatsBar sitios={sitios} />
        </div>
      </section>

      <main className="with-hero page-main">
        <div className="sitios-panel">
          <div className="sitios-panel-head">
            <div className="sitios-panel-info">
              <h2 className="sitios-panel-title">Sitios turísticos</h2>
              <p className="sitios-panel-desc">
                {filtrados.length !== sitios.length
                  ? `Mostrando ${filtrados.length} de ${sitios.length} sitios`
                  : 'Selecciona un destino para ver estadísticas detalladas'}
              </p>
            </div>
          </div>
          <BuscadorSitios embedded onChange={setBusqueda} />
        </div>

        <div className="grid sitios-grid">
          {filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔎</div>
              <h3>No se encontraron sitios</h3>
              <p>Prueba con otro nombre, ubicación o filtro de estado.</p>
            </div>
          ) : (
            filtrados.map((s) => <SitioCard key={s.id} sitio={s} />)
          )}
        </div>
      </main>
    </>
  );
}
