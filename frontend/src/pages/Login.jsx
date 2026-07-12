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
      <Header>
        <Link to="/">← Volver al inicio</Link>
      </Header>
      <div className="login-page">
        <div className="card form-card">
          <h2>Iniciar sesión</h2>
          <p>Acceso para personal de seguridad y administradores.</p>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seg.ahuashiyacu@iot.local" />
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="full-width">Entrar</button>
            {error && <div className="error-msg">{error}</div>}
          </form>
        </div>
      </div>
    </>
  );
}
