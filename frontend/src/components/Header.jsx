import { Link } from 'react-router-dom';

function LogoMark() {
  return (
    <svg className="brand-logo-svg" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="8" fill="rgba(255,255,255,0.15)" />
      <path d="M8 22V10h4.2l3.4 7.2L19 10h4v12h-3.2v-7.1L15.8 22h-2.1l-3.9-7.1V22H8z" fill="white" />
    </svg>
  );
}

export default function Header({ title = 'Aforo Turístico', subtitle, children }) {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <LogoMark />
        <div className="brand-text">
          <span className="brand-title">{title}</span>
          {subtitle && <span className="brand-subtitle">{subtitle}</span>}
        </div>
      </Link>
      <nav>{children}</nav>
    </header>
  );
}
