// Utilidades compartidas del frontend

function getToken() {
  return localStorage.getItem('token');
}

function getUsuario() {
  const data = localStorage.getItem('usuario');
  return data ? JSON.parse(data) : null;
}

function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = '/login.html';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

function calcularOcupacion(actual, maximo) {
  if (!maximo) return 0;
  return Math.round((actual / maximo) * 100);
}

function claseOcupacion(porcentaje) {
  if (porcentaje < 60) return 'verde';
  if (porcentaje < 85) return 'amarillo';
  return 'rojo';
}

function etiquetaOcupacion(porcentaje) {
  if (porcentaje < 60) return 'Disponible';
  if (porcentaje < 85) return 'Moderado';
  return 'Lleno';
}

function renderBarraAforo(actual, maximo) {
  const pct = calcularOcupacion(actual, maximo);
  const clase = claseOcupacion(pct);
  return `
    <div class="aforo-display">
      <span class="numero">${actual}</span>
      <span class="separador">/</span>
      <span class="maximo">${maximo}</span>
      <span class="label-personas">personas</span>
    </div>
    <div class="aforo-bar">
      <div class="aforo-bar-fill estado-${clase}" style="width: ${Math.min(pct, 100)}%"></div>
    </div>
    <span class="badge badge-${clase}">${etiquetaOcupacion(pct)} · ${pct}%</span>
  `;
}

function renderSitioCard(s, opciones = {}) {
  const { modoSeguridad = false } = opciones;
  const camaraHtml = modoSeguridad ? `
    <h3>Cámara en vivo</h3>
    <div class="camara-container" id="camara-${s.id}">
      <div class="camara-placeholder">Conectando cámara...</div>
    </div>
    <div class="toolbar">
      <button class="danger" onclick="enviarAlarma(${s.id})">Activar alarma</button>
    </div>
  ` : '';

  const claseExtra = modoSeguridad ? ' sitio-seguridad' : '';

  return `
    <div class="card${claseExtra}" id="sitio-${s.id}" data-nombre="${escaparAttr(s.nombre)}" data-ubicacion="${escaparAttr(s.ubicacion || '')}" data-estado="${claseOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo))}">
      <div class="card-header">
        <h2>${escaparHtml(s.nombre)}</h2>
        <span class="badge badge-${claseOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo))}">
          ${etiquetaOcupacion(calcularOcupacion(s.aforo_actual, s.aforo_maximo))}
        </span>
      </div>
      <div class="ubicacion">📍 ${escaparHtml(s.ubicacion || 'Sin ubicación')}</div>
      <div class="card-body">
        <div class="aforo-info">
          ${renderBarraAforo(s.aforo_actual, s.aforo_maximo)}
        </div>
        ${camaraHtml}
      </div>
    </div>
  `;
}

function escaparHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function escaparAttr(texto) {
  return String(texto).replace(/"/g, '&quot;');
}

function filtrarSitios(query, filtroEstado) {
  const cards = document.querySelectorAll('.card[id^="sitio-"]');
  const q = query.trim().toLowerCase();
  let visibles = 0;

  cards.forEach((card) => {
    const nombre = (card.dataset.nombre || '').toLowerCase();
    const ubicacion = (card.dataset.ubicacion || '').toLowerCase();
    const estado = card.dataset.estado || '';

    const coincideTexto = !q || nombre.includes(q) || ubicacion.includes(q);
    const coincideEstado = !filtroEstado || filtroEstado === 'todos' || estado === filtroEstado;

    const mostrar = coincideTexto && coincideEstado;
    card.classList.toggle('oculta', !mostrar);
    if (mostrar) visibles++;
  });

  return visibles;
}

function actualizarContador(visibles, total) {
  const el = document.getElementById('contador-resultados');
  if (!el) return;

  if (visibles === total) {
    el.textContent = `Mostrando ${total} sitio${total !== 1 ? 's' : ''} turístico${total !== 1 ? 's' : ''}`;
  } else {
    el.textContent = `${visibles} de ${total} sitio${total !== 1 ? 's' : ''}`;
  }

  const empty = document.getElementById('empty-state');
  if (empty) {
    empty.style.display = visibles === 0 ? 'block' : 'none';
  }
}

function initBuscador(totalSitios) {
  const input = document.getElementById('busqueda');
  const filtros = document.querySelectorAll('.filtro-btn');
  let filtroEstado = 'todos';

  function aplicar() {
    const visibles = filtrarSitios(input?.value || '', filtroEstado);
    actualizarContador(visibles, totalSitios);
  }

  if (input) {
    input.addEventListener('input', aplicar);
  }

  filtros.forEach((btn) => {
    btn.addEventListener('click', () => {
      filtros.forEach((b) => b.classList.remove('activo'));
      btn.classList.add('activo');
      filtroEstado = btn.dataset.filtro;
      aplicar();
    });
  });

  aplicar();
}

function actualizarStatsBar(sitios) {
  const bar = document.getElementById('stats-bar');
  if (!bar) return;

  const total = sitios.length;
  let disponibles = 0, moderados = 0, llenos = 0;

  sitios.forEach((s) => {
    const pct = calcularOcupacion(s.aforo_actual, s.aforo_maximo);
    const clase = claseOcupacion(pct);
    if (clase === 'verde') disponibles++;
    else if (clase === 'amarillo') moderados++;
    else llenos++;
  });

  bar.innerHTML = `
    <div class="stat-item">
      <div class="stat-valor">${total}</div>
      <div class="stat-label">Sitios</div>
    </div>
    <div class="stat-item">
      <div class="stat-valor" style="color:#27ae60">${disponibles}</div>
      <div class="stat-label">Disponibles</div>
    </div>
    <div class="stat-item">
      <div class="stat-valor" style="color:#e9a319">${moderados}</div>
      <div class="stat-label">Moderados</div>
    </div>
    <div class="stat-item">
      <div class="stat-valor" style="color:#d64545">${llenos}</div>
      <div class="stat-label">Llenos</div>
    </div>
  `;
}

function actualizarCardAforo(sitioId, aforoActual, sitiosMap) {
  const sitio = sitiosMap[sitioId];
  if (!sitio) return;

  sitio.aforo_actual = aforoActual;
  const card = document.getElementById(`sitio-${sitioId}`);
  if (!card) return;

  const clase = claseOcupacion(calcularOcupacion(aforoActual, sitio.aforo_maximo));
  card.dataset.estado = clase;

  card.querySelector('.aforo-info').innerHTML = renderBarraAforo(aforoActual, sitio.aforo_maximo);

  const badgeHeader = card.querySelector('.card-header .badge');
  if (badgeHeader) {
    badgeHeader.className = `badge badge-${clase}`;
    badgeHeader.textContent = etiquetaOcupacion(calcularOcupacion(aforoActual, sitio.aforo_maximo));
  }

  // Re-aplicar filtro si hay buscador activo
  const input = document.getElementById('busqueda');
  const filtroActivo = document.querySelector('.filtro-btn.activo');
  if (input) {
    const total = Object.keys(sitiosMap).length;
    const visibles = filtrarSitios(input.value, filtroActivo?.dataset.filtro || 'todos');
    actualizarContador(visibles, total);
  }

  actualizarStatsBar(Object.values(sitiosMap));
}
