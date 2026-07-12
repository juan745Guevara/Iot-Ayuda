import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import { getUsuario, guardarSesion } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const u = getUsuario();
    if (u?.rol === 'admin') navigate('/admin');
    else if (u) navigate('/seguridad');
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión');
        return;
      }
      guardarSesion(data.token, data.usuario);
      navigate(data.usuario.rol === 'admin' ? '/admin' : '/seguridad');
    } catch {
      setError('No se pudo conectar al servidor');
    }
  }

  return (
    <>
      <Header subtitle="Acceso restringido">
        <Link to="/" className="btn-nav btn-nav-outline">Volver al inicio</Link>
      </Header>
      <div className="login-page">
        <div className="login-grid">
          <div className="login-branding">
            <span className="eyebrow eyebrow-light">Panel operativo</span>
            <h2>Gestión de aforo y seguridad</h2>
            <p>
              Acceso exclusivo para administradores y personal de seguridad
              asignado a cada sitio turístico.
            </p>
            <ul className="login-features">
              <li>Cámara en vivo por sitio</li>
              <li>Alertas de capacidad</li>
              <li>Control de alarma remota</li>
            </ul>
          </div>
          <div className="card form-card login-card">
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales institucionales.</p>
            <form onSubmit={handleSubmit}>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seg.ahuashiyacu@iot.local"
                autoComplete="email"
              />
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button type="submit" className="full-width btn-primary">Entrar al panel</button>
              {error && <div className="error-msg" role="alert">{error}</div>}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
