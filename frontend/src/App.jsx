import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import SitioDetalle from './pages/SitioDetalle';
import SeguridadDashboard from './pages/SeguridadDashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sitio/:id" element={<SitioDetalle />} />
          <Route path="/seguridad" element={<SeguridadDashboard />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
