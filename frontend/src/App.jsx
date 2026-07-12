import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import SitioDetalle from './pages/SitioDetalle';
import SeguridadDashboard from './pages/SeguridadDashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sitio/:id" element={<SitioDetalle />} />
        <Route path="/seguridad" element={<SeguridadDashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
