import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BuscadorSitios, { filtrarSitiosLista } from '../components/BuscadorSitios';
import SeguridadSitioCard, { SeguridadSitioFull } from '../components/SeguridadSitioCard';
import { useSocket } from '../hooks/useSocket';
import { getToken, getUsuario, cerrarSesion, authHeaders } from '../utils/auth';
import { claseOcupacion, calcularOcupacion } from '../utils/aforo';

export default function SeguridadDashboard() {
  const navigate = useNavigate();
  const socket = useSocket();
  const usuario = getUsuario();
  const [sitios, setSitios] = useState([]);
  const [busqueda, setBusqueda] = useState({ query: '', filtro: 'todos' });
  const [alarmaMsg, setAlarmaMsg] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token || !usuario || (usuario.rol !== 'seguridad' && usuario.rol !== 'admin')) {
      navigate('/login');
      return;
    }

    fetch('/api/seguridad/mis-sitios', { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) { cerrarSesion(); return []; }
        return r.json();
      })
      .then((data) => setSitios(data.map((s) => ({
        ...s,
        _estado: claseOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo)),
      }))));
  }, [navigate, usuario]);

  useEffect(() => {
    sitios.forEach((s) => {
      socket.emit('join_sitio', { sitio_id: s.id });
      socket.emit('join_camara', { sitio_id: s.id, token: getToken() });
    });

    const onAforo = (data) => {
      setSitios((prev) => prev.map((s) => {
        if (s.id !== data.sitio_id) return s;
        const u = { ...s, aforo_actual: data.aforo_actual };
        u._estado = claseOcupacion(calcularOcupacion(u.aforo_actual, u.aforo_maximo));
        return u;
      }));
    };
    socket.on('aforo', onAforo);
    return () => socket.off('aforo', onAforo);
  }, [socket, sitios.length]);

  const filtrados = useMemo(() => filtrarSitiosLista(sitios, busqueda), [sitios, busqueda]);
  const sitioUnico = sitios.length === 1;

  function enviarAlarma(sitioId) {
    socket.emit('alarma', { sitio_id: sitioId, mensaje: '1' });
    setAlarmaMsg(sitioId);
    setTimeout(() => setAlarmaMsg(null), 2000);
  }

  if (!usuario) return null;

  return (
    <>
      <Header icon="🛡️" title="Panel de Seguridad">
        <span className="nav-user">{usuario.nombre}</span>
        <button type="button" className="btn-nav btn-nav-ghost" onClick={() => { cerrarSesion(); navigate('/login'); }}>
          Cerrar sesión
        </button>
      </Header>

      <main className={`main-seguridad ${sitioUnico ? 'main-un-sitio' : ''}`}>
        {!sitioUnico && (
          <>
            <BuscadorSitios placeholder="Buscar sitio asignado..." onChange={setBusqueda} />
            <p className="contador-resultados">{filtrados.length} de {sitios.length} sitio(s)</p>
          </>
        )}

        {sitios.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Sin sitios asignados</h3>
            <p>Contacta al administrador.</p>
          </div>
        ) : sitioUnico ? (
          <SeguridadSitioFull
            sitio={sitios[0]}
            onAlarma={enviarAlarma}
            alarmaEnviada={alarmaMsg === sitios[0].id}
          />
        ) : (
          <div className="grid">
            {filtrados.map((s) => (
              <SeguridadSitioCard
                key={s.id}
                sitio={s}
                onAlarma={enviarAlarma}
                alarmaEnviada={alarmaMsg === s.id}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
