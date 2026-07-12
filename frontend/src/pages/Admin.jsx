// Panel admin: crear sitios y asignar guardias (rol admin)

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { getToken, getUsuario, cerrarSesion, authHeaders } from '../utils/auth';

export default function Admin() {
  const navigate = useNavigate();
  const [sitios, setSitios] = useState([]);
  const [seguridad, setSeguridad] = useState([]);
  const [msgSitio, setMsgSitio] = useState('');
  const [msgAsignar, setMsgAsignar] = useState('');
  const [formSitio, setFormSitio] = useState({
    nombre: '', ubicacion: '', aforo_maximo: 50, esp8266_client_id: '', esp32cam_client_id: '',
  });
  const [asignar, setAsignar] = useState({ usuario_id: '', sitio_id: '' });

  useEffect(() => {
    const u = getUsuario();
    if (!getToken() || u?.rol !== 'admin') {
      navigate('/login');
      return;
    }
    cargarDatos();
  }, [navigate]);

  async function cargarDatos() {
    const [rS, rSeg] = await Promise.all([
      fetch('/api/admin/sitios', { headers: authHeaders() }),
      fetch('/api/admin/usuarios-seguridad', { headers: authHeaders() }),
    ]);
    if (rS.ok) setSitios(await rS.json());
    if (rSeg.ok) setSeguridad(await rSeg.json());
  }

  async function crearSitio(e) {
    e.preventDefault();
    setMsgSitio('');
    const res = await fetch('/api/admin/sitios', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...formSitio,
        aforo_maximo: parseInt(formSitio.aforo_maximo, 10),
        esp8266_client_id: formSitio.esp8266_client_id || null,
        esp32cam_client_id: formSitio.esp32cam_client_id || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setMsgSitio(data.error); return; }
    setMsgSitio(`Sitio "${data.nombre}" creado (ID: ${data.id})`);
    setFormSitio({ nombre: '', ubicacion: '', aforo_maximo: 50, esp8266_client_id: '', esp32cam_client_id: '' });
    cargarDatos();
  }

  async function asignarSeguridad(e) {
    e.preventDefault();
    setMsgAsignar('');
    const res = await fetch('/api/admin/asignar-seguridad', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        usuario_id: parseInt(asignar.usuario_id, 10),
        sitio_id: parseInt(asignar.sitio_id, 10),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setMsgAsignar(data.error); return; }
    setMsgAsignar('Asignación realizada');
    cargarDatos();
  }

  return (
    <>
      <Header title="Administración" subtitle="Gestión del sistema">
        <Link to="/seguridad" className="btn-nav btn-nav-outline">Dashboard</Link>
        <button type="button" className="btn-nav btn-nav-ghost" onClick={() => { cerrarSesion(); navigate('/login'); }}>
          Cerrar sesión
        </button>
      </Header>

      <main className="page-main admin-page">
        <div className="page-intro">
          <h1 className="page-title">Panel de administración</h1>
          <p className="page-subtitle">Configura sitios turísticos, dispositivos IoT y asignaciones de personal.</p>
        </div>

        <div className="admin-grid">
          <div className="card admin-panel">
            <h2 className="section-title">Crear sitio turístico</h2>
            <form onSubmit={crearSitio} className="admin-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Nombre</label>
                  <input required value={formSitio.nombre} onChange={(e) => setFormSitio({ ...formSitio, nombre: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Ubicación</label>
                  <input value={formSitio.ubicacion} onChange={(e) => setFormSitio({ ...formSitio, ubicacion: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Aforo máximo</label>
                  <input type="number" value={formSitio.aforo_maximo} onChange={(e) => setFormSitio({ ...formSitio, aforo_maximo: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>ESP8266 Client ID</label>
                  <input value={formSitio.esp8266_client_id} onChange={(e) => setFormSitio({ ...formSitio, esp8266_client_id: e.target.value })} placeholder="esp8266-sitio-1" />
                </div>
              </div>
              <div className="form-field">
                <label>ESP32-CAM Client ID</label>
                <input value={formSitio.esp32cam_client_id} onChange={(e) => setFormSitio({ ...formSitio, esp32cam_client_id: e.target.value })} placeholder="esp32cam-sitio-1" />
              </div>
              <button type="submit" className="btn-primary">Crear sitio</button>
              {msgSitio && <div className={msgSitio.startsWith('Sitio') ? 'success-msg' : 'error-msg'}>{msgSitio}</div>}
            </form>
          </div>

          <div className="card admin-panel">
            <h2 className="section-title">Asignar guardia (1:1)</h2>
            <p className="panel-hint">Cada guardia queda asignado a un único sitio.</p>
            <form onSubmit={asignarSeguridad} className="admin-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Usuario de seguridad (ID)</label>
                  <input type="number" required value={asignar.usuario_id} onChange={(e) => setAsignar({ ...asignar, usuario_id: e.target.value })} />
                </div>
                <div className="form-field">
                  <label>Sitio (ID)</label>
                  <input type="number" required value={asignar.sitio_id} onChange={(e) => setAsignar({ ...asignar, sitio_id: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn-primary">Asignar</button>
              {msgAsignar && <div className={msgAsignar.includes('realizada') ? 'success-msg' : 'error-msg'}>{msgAsignar}</div>}
            </form>
          </div>

          <div className="card admin-panel admin-panel-wide">
            <h2 className="section-title">Sitios registrados</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Aforo</th><th>ESP8266</th><th>ESP32-CAM</th></tr>
                </thead>
                <tbody>
                  {sitios.map((s) => (
                    <tr key={s.id}>
                      <td><span className="table-id">{s.id}</span></td>
                      <td><strong>{s.nombre}</strong></td>
                      <td><span className="table-aforo">{s.aforo_actual}/{s.aforo_maximo}</span></td>
                      <td><code className="table-code">{s.esp8266_client_id || '—'}</code></td>
                      <td><code className="table-code">{s.esp32cam_client_id || '—'}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card admin-panel admin-panel-wide">
            <h2 className="section-title">Personal de seguridad</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Sitio asignado</th></tr>
                </thead>
                <tbody>
                  {seguridad.map((u) => (
                    <tr key={u.id}>
                      <td><span className="table-id">{u.id}</span></td>
                      <td><strong>{u.nombre}</strong></td>
                      <td>{u.email}</td>
                      <td>{(u.sitios || []).map((s) => s.nombre || s.sitio_id).join(', ') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
