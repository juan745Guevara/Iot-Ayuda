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
      <Header>
        <Link to="/login" className="btn-nav">Acceso Seguridad</Link>
      </Header>

      <section className="hero">
        <div className="hero-content">
          <h1>Monitoreo de aforo en tiempo real</h1>
          <p>Consulta la ocupación actual de los sitios turísticos de la región</p>
        </div>
      </section>

      <main className="with-hero">
        <StatsBar sitios={sitios} />
        <BuscadorSitios onChange={setBusqueda} />
        <p className="contador-resultados">
          {filtrados.length === sitios.length
            ? `Mostrando ${sitios.length} sitio${sitios.length !== 1 ? 's' : ''} turístico${sitios.length !== 1 ? 's' : ''}`
            : `${filtrados.length} de ${sitios.length} sitio${sitios.length !== 1 ? 's' : ''}`}
        </p>
        <div className="grid">
          {filtrados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔎</div>
              <h3>No se encontraron sitios</h3>
              <p>Prueba con otro nombre, ubicación o filtro.</p>
            </div>
          ) : (
            filtrados.map((s) => <SitioCard key={s.id} sitio={s} />)
          )}
        </div>
      </main>
    </>
  );
}
