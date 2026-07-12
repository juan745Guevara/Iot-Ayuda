import { useState } from 'react';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'verde', label: 'Disponible' },
  { id: 'amarillo', label: 'Moderado' },
  { id: 'rojo', label: 'Lleno' },
];

function SearchIcon() {
  return (
    <svg className="icono-busqueda-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function BuscadorSitios({ onChange, placeholder = 'Buscar por nombre o ubicación...', embedded = false }) {
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState('todos');

  function emitir(q, f) {
    onChange?.({ query: q, filtro: f });
  }

  return (
    <div className={embedded ? 'busqueda-embedded' : 'toolbar-busqueda'}>
      <div className="busqueda-wrapper">
        <SearchIcon />
        <input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            emitir(e.target.value, filtro);
          }}
        />
      </div>
      <div className="filtros-estado">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`filtro-btn ${filtro === f.id ? 'activo' : ''} ${filtro === f.id && f.id !== 'todos' ? f.id : ''}`}
            onClick={() => {
              setFiltro(f.id);
              emitir(query, f.id);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function filtrarSitiosLista(sitios, { query, filtro }) {
  const q = query.trim().toLowerCase();
  return sitios.filter((s) => {
    const estado = s._estado || '';
    const nombre = (s.nombre || '').toLowerCase();
    const ubicacion = (s.ubicacion || '').toLowerCase();
    const coincideTexto = !q || nombre.includes(q) || ubicacion.includes(q);
    const coincideEstado = filtro === 'todos' || estado === filtro;
    return coincideTexto && coincideEstado;
  });
}
