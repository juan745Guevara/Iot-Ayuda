import { Link } from 'react-router-dom';

export default function Header({ icon = '🌿', title = 'Aforo Turístico', children }) {
  return (
    <header>
      <Link to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="brand-icon">{icon}</div>
        <span>{title}</span>
      </Link>
      <nav>{children}</nav>
    </header>
  );
}
