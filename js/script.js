/* =========================================================
   WORKINON — APP LOGIC (prototipo, sin backend)
   ========================================================= */

/* ---------- DATA MOCK ---------- */
/* ---------- CONEXIÓN CON EL "BACKEND" LOCAL (js/db.js) ---------- */
// Esta versión de WorkinON no depende de un servidor Java: no hay
// nada que instalar ni correr. Todo vive en el navegador, guardado
// en localStorage a través de js/db.js (mockApiFetch), que imita las
// mismas rutas /api/... que antes atendía Spring Boot, para que toda
// esta pantalla de abajo (login, proyectos, solicitudes, medallas...)
// funcione exactamente igual, sin cambiar su lógica.
async function apiFetch(path, options = {}) {
  try {
    return await mockApiFetch(path, options);
  } catch (err) {
    throw new Error(err && err.message ? err.message : 'Ocurrió un error inesperado');
  }
}

// Datos de respaldo (se muestran solo si el backend no está disponible).
let PROJECTS = [
  {
    key: 'coffeelovers', name: 'Coffeelovers', company: 'Independiente',
    tags: ['C++', 'HTML'], category: 'tecnología', team: '3/5',
    date: '2026-05-02', sortWeight: { reciente: 9, vacantes: 2, tiempo: 3, miembros: 5 },
    img: 'linear-gradient(135deg,#0b1d33,#123a5e)',
    desc: 'Una plataforma para amantes del café que conecta cafeterías locales con clientes frecuentes a través de recomendaciones inteligentes y programas de fidelidad.'
  },
  {
    key: 'calico', name: 'Calico', company: 'Cisco',
    tags: ['Redes', 'Cisco'], category: 'redes', team: '2/4',
    date: '2026-06-10', sortWeight: { reciente: 10, vacantes: 4, tiempo: 2, miembros: 4 },
    img: 'linear-gradient(135deg,#274156,#4c7091)',
    desc: 'Rediseño de infraestructura de red para oficinas híbridas, enfocado en seguridad, monitoreo en tiempo real y alta disponibilidad.'
  },
  {
    key: 'blimond', name: 'Blimond', company: 'SoftwareGest',
    tags: ['Java', 'Front', 'BD'], category: 'ciencia de datos', team: '6/7',
    date: '2026-03-18', sortWeight: { reciente: 6, vacantes: 1, tiempo: 6, miembros: 7 },
    img: 'linear-gradient(135deg,#101825,#1c2b3d)',
    desc: 'Sistema de gestión y calendarización empresarial con reportes automatizados y dashboards de productividad por equipo.'
  },
  {
    key: 'workinon', name: 'App WorkinON', company: 'WorkinON',
    tags: ['UX', 'JS'], category: 'tecnología', team: '4/5',
    date: '2026-06-20', sortWeight: { reciente: 10, vacantes: 1, tiempo: 4, miembros: 5 },
    img: 'linear-gradient(135deg,#0668d9,#04205e)',
    desc: 'La propia plataforma colaborativa WorkinON: conecta a estudiantes y profesionales para crear proyectos reales, evaluarse mutuamente y ganar reconocimientos.'
  },
  {
    key: 'edutech', name: 'Educational App', company: 'EduTech',
    tags: ['Salud', 'UX'], category: 'salud', team: '5/6',
    date: '2026-01-22', sortWeight: { reciente: 3, vacantes: 3, tiempo: 8, miembros: 6 },
    img: 'linear-gradient(135deg,#1b3a2f,#2f6b4f)',
    desc: 'Aplicación educativa para el sector salud, con módulos interactivos de capacitación clínica y seguimiento de certificaciones.'
  }
];

const MEDALS = [
  { key: 'programador', name: 'Programador', icon: '💻', earned: false, idMedalla: null },
  { key: 'redes', name: 'Redes', icon: '🛡️', earned: false, idMedalla: null },
  { key: 'basededatos', name: 'Base de datos', icon: '🗄️', earned: false, idMedalla: null },
  { key: 'backend', name: 'Backend', icon: '⚙️', earned: false, idMedalla: null },
  { key: 'frontend', name: 'Frontend', icon: '🎨', earned: false, idMedalla: null },
  { key: 'devops', name: 'DevOps', icon: '🚀', earned: false, idMedalla: null },
];

let currentUser = { idUsuario: null, name: '', correo: '', role: '', avatar: '' };
let backTarget = 'home';
let currentJoinProject = null;
let currentEvalType = 'formulario';
let currentMedal = null;

/* ---------- HELPERS ---------- */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $all(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function toast(message, type = 'info') {
  const stack = $('#toastStack');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
  el.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

/* ---------- SCREEN NAVIGATION ---------- */
function showScreen(name, opts = {}) {
  const isAuthScreen = name === 'auth';
  $('#screen-auth').classList.toggle('is-active', isAuthScreen);
  $('#app-shell').classList.toggle('is-active', !isAuthScreen);

  if (!isAuthScreen) {
    $all('.main-content .screen').forEach(s => s.classList.remove('is-active'));
    const target = $(`#screen-${name}`);
    if (target) target.classList.add('is-active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (opts.backTarget) backTarget = opts.backTarget;
  }
  closeSidebar();
}

$all('[data-goto-screen]').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.getAttribute('data-goto-screen');
    if (name === 'details' && btn.dataset.projectKey) {
      renderDetails(btn.dataset.projectKey);
    }
    showScreen(name);
    // Refresca siempre con datos reales del servidor al entrar a estas
    // pantallas, en vez de confiar en lo que se cargó la última vez.
    if (name === 'home' || name === 'search' || name === 'profile') {
      loadProyectos();
    }
  });
});

$all('[data-back-target]').forEach(btn => {
  btn.addEventListener('click', () => showScreen(backTarget));
});

/* ---------- AUTH TABS ---------- */
function setAuthPanel(name) {
  $all('.auth-tab').forEach(t => {
    const match = t.dataset.authTab === name;
    t.classList.toggle('is-active', match);
    t.setAttribute('aria-selected', match);
  });
  $all('.auth-form').forEach(f => f.classList.toggle('is-active', f.dataset.authPanel === name));
}
$all('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => setAuthPanel(tab.dataset.authTab));
});
$all('[data-goto-recover]').forEach(el => el.addEventListener('click', (e) => {
  e.preventDefault(); setAuthPanel('recover1');
}));
$all('[data-goto-login]').forEach(el => el.addEventListener('click', () => setAuthPanel('login')));

/* ---------- VALIDATION ---------- */
function validateField(input, customCheck) {
  const field = input.closest('.field');
  if (!field) return true;
  let valid = input.checkValidity();
  if (valid && customCheck) valid = customCheck();
  field.classList.toggle('is-invalid', !valid);
  field.classList.toggle('is-valid', valid && input.value.trim() !== '');
  return valid;
}

function attachLiveValidation(form) {
  $all('input, select, textarea', form).forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      const field = input.closest('.field');
      if (field && field.classList.contains('is-invalid')) validateField(input);
    });
  });
}
$all('form').forEach(attachLiveValidation);

function validateForm(form, customChecks = {}) {
  let allValid = true;
  $all('input, select, textarea', form).forEach(input => {
    const check = customChecks[input.id];
    const valid = validateField(input, check);
    if (!valid) allValid = false;
  });
  return allValid;
}

/* ---------- LOGIN ---------- */
$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) { toast('Revisa los campos marcados en rojo', 'error'); return; }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const usuario = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        correo: $('#login-email').value.trim(),
        contrasena: $('#login-password').value
      })
    });
    currentUser.idUsuario = usuario.idUsuario;
    currentUser.name = usuario.nombre;
    currentUser.correo = usuario.correo;
    currentUser.role = usuario.descripcion || 'Nuevo en WorkinON';
    currentUser.avatar = usuario.fotoPerfil || '';
    mockSetSession(usuario.idUsuario);
    toast('¡Bienvenido de vuelta!', 'success');
    syncProfile();
    setTimeout(() => {
      showScreen('home');
      loadProyectos();
    }, 300);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- REGISTER ---------- */
$('#form-register').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const pass = $('#reg-password'), pass2 = $('#reg-password2');
  const checks = { 'reg-password2': () => pass.value === pass2.value && pass2.value !== '' };
  if (!validateForm(form, checks)) { toast('Revisa los campos marcados en rojo', 'error'); return; }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const usuario = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('#reg-name').value.trim(),
        correo: $('#reg-email').value.trim(),
        contrasena: pass.value
      })
    });
    currentUser.idUsuario = usuario.idUsuario;
    currentUser.name = usuario.nombre;
    currentUser.correo = usuario.correo;
    currentUser.role = 'Nuevo en WorkinON';
    currentUser.avatar = '';
    mockSetSession(usuario.idUsuario);
    toast('Cuenta creada con éxito. Ya se guardó en tu navegador', 'success');
    syncProfile();
    setTimeout(() => {
      showScreen('home');
      loadProyectos();
    }, 300);
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- RECOVER PASSWORD ---------- */
// Como no hay servidor de correo real, el "código de verificación" es
// solo un paso de confirmación en pantalla; pero la contraseña nueva
// SÍ se guarda de verdad en la base local (localStorage), ligada al
// correo que se ingresó en el primer paso.
let recoverState = { correo: '', nuevaContrasena: '' };

$('#form-recover1').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const pass = $('#rec-password'), pass2 = $('#rec-password2');
  const checks = { 'rec-password2': () => pass.value === pass2.value && pass2.value !== '' };
  if (!validateForm(form, checks)) { toast('Revisa los campos marcados en rojo', 'error'); return; }
  recoverState.correo = $('#rec-email').value.trim();
  recoverState.nuevaContrasena = pass.value;
  toast('Código de verificación enviado a tu correo', 'success');
  setAuthPanel('recover2');
});

$('#form-recover2').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  if (!validateForm(form)) { toast('Ingresa el código de verificación', 'error'); return; }
  try {
    await mockUpdatePasswordByCorreo(recoverState.correo, recoverState.nuevaContrasena);
    toast('Contraseña actualizada correctamente', 'success');
    form.reset();
    $('#rec-email').value = ''; $('#rec-password').value = ''; $('#rec-password2').value = '';
    setAuthPanel('login');
  } catch (err) {
    toast(err.message, 'error');
  }
});

/* ---------- SIDEBAR / MENU ---------- */
function openSidebar() {
  $('#sidebar').classList.add('is-open');
  $('#sidebar-backdrop').classList.add('is-open');
}
function closeSidebar() {
  $('#sidebar').classList.remove('is-open');
  $('#sidebar-backdrop').classList.remove('is-open');
}
$('#btn-menu').addEventListener('click', openSidebar);
$('#sidebar-close').addEventListener('click', closeSidebar);
$('#sidebar-backdrop').addEventListener('click', closeSidebar);
$('#btn-logout').addEventListener('click', () => {
  closeSidebar();
  currentUser = { idUsuario: null, name: '', correo: '', role: '', avatar: '' };
  mockClearSession();
  notifications = [];
  renderNotifications();
  $('#notif-dot').style.display = 'none';
  toast('Sesión cerrada', 'success');
  setTimeout(() => showScreen('auth'), 300);
});

/* ---------- NOTIFICATIONS PANEL (reales, no de muestra) ---------- */
let notifications = [];

function addNotification(title, message) {
  notifications.unshift({
    title, message,
    time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    read: false
  });
  renderNotifications();
  $('#notif-dot').style.display = 'block';
}

function renderNotifications() {
  const list = $('#notif-list');
  if (notifications.length === 0) {
    list.innerHTML = '<p class="notif-empty" id="notif-empty">Aún no tienes notificaciones. Aquí verás avisos de solicitudes, evaluaciones y más.</p>';
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item ${n.read ? '' : 'is-unread'}">
      <strong>${n.title}</strong>
      <span>${n.message}</span>
      <time>${n.time}</time>
    </div>`).join('');
}

const notifPanel = $('#notif-panel');
$('#btn-notifications').addEventListener('click', (e) => {
  e.stopPropagation();
  notifPanel.classList.toggle('is-open');
  if (notifPanel.classList.contains('is-open')) {
    notifications.forEach(n => n.read = true);
    renderNotifications();
    $('#notif-dot').style.display = 'none';
  }
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.notif-wrap')) notifPanel.classList.remove('is-open');
});

/* ---------- MODALS ---------- */
function openModal(id) {
  $('#modal-backdrop').classList.add('is-open');
  $(id).classList.add('is-open');
}
function closeModals() {
  $('#modal-backdrop').classList.remove('is-open');
  $all('.modal').forEach(m => m.classList.remove('is-open'));
}
$('#modal-backdrop').addEventListener('click', closeModals);
$('#modal-confirm-cancel').addEventListener('click', closeModals);

function showSuccessModal(text) {
  $('#modal-success-text').textContent = text;
  openModal('#modal-success');
}
$('#modal-success-close').addEventListener('click', closeModals);

/* ---------- CARGA DE DATOS REALES DESDE EL BACKEND ---------- */
const CATEGORY_GRADIENTS = [
  'linear-gradient(135deg,#0668d9,#04205e)',
  'linear-gradient(135deg,#274156,#4c7091)',
  'linear-gradient(135deg,#101825,#1c2b3d)',
  'linear-gradient(135deg,#1b3a2f,#2f6b4f)'
];

function backendProjectToCard(p, index) {
  const vacantes = p.vacantesDisponibles ?? '?';
  // miembrosAceptados viene del back-end (cuenta real de solicitudes con
  // estado "aceptada" para este proyecto). Si no llegó por alguna razón,
  // mostramos 0 en vez de "?" para no inventar un dato.
  const miembros = Number.isFinite(p.miembrosAceptados) ? p.miembrosAceptados : 0;
  const categoriaNombre = p.categoria ? p.categoria.nombre : 'General';
  const creadorNombre = p.usuario ? p.usuario.nombre : 'WorkinON';
  const habilidades = Array.isArray(p.habilidades) ? p.habilidades : [];
  const nombresHabilidades = habilidades.map(h => h.nombre);
  return {
    key: String(p.idProyecto),
    idProyecto: p.idProyecto,
    // idUsuario del creador: lo necesita "Mi perfil" para filtrar
    // "Tus proyectos". Antes no se copiaba y por eso nunca aparecía nada ahí.
    idUsuario: p.usuario ? p.usuario.idUsuario : null,
    name: p.nombre,
    company: creadorNombre,
    tags: nombresHabilidades.length ? nombresHabilidades : [categoriaNombre],
    category: categoriaNombre.toLowerCase(),
    team: `${miembros}/${vacantes}`,
    vacantes: Number(vacantes) || 0,
    miembros,
    date: p.fechaCreacion,
    sortWeight: { reciente: 10 - index, vacantes: Number(vacantes) || 0, tiempo: index, miembros },
    img: CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length],
    desc: p.descripcion,
    habilidades: habilidades
  };
}

async function loadProyectos() {
  try {
    const data = await apiFetch('/proyectos');
    if (Array.isArray(data)) {
      PROJECTS = data.map(backendProjectToCard);
    }
  } catch (err) {
    // Antes esto fallaba en silencio (solo en la consola) y la persona
    // nunca se enteraba de que estaba viendo datos de ejemplo en vez de
    // los proyectos reales. Ahora sí se avisa.
    toast('No se pudieron cargar los proyectos reales del servidor: ' + err.message, 'error');
    console.warn('No se pudo conectar con el backend, usando datos de ejemplo:', err.message);
  }
  renderHome();
  if ($('#screen-search').classList.contains('is-active')) applyFilters();
  renderProfilePanels();
}

async function loadCategorias() {
  try {
    const categorias = await apiFetch('/categorias');
    const select = $('#proj-category');
    if (Array.isArray(categorias) && categorias.length) {
      select.innerHTML = '<option value="">Selecciona una categoría</option>' +
        categorias.map(c => `<option value="${c.idCategoria}">${c.nombre}</option>`).join('');
    }
  } catch (err) {
    console.warn('No se pudo cargar el catálogo de categorías, usando opciones de ejemplo:', err.message);
  }
}

let PERFILES = [];

async function loadPerfiles() {
  try {
    const data = await apiFetch('/perfiles');
    if (Array.isArray(data)) PERFILES = data;
  } catch (err) {
    console.warn('No se pudo cargar el catálogo de habilidades:', err.message);
  }
  renderHabilidadesCheckboxes('#proj-habilidades-group', PERFILES);
}

// Le pega el idMedalla real de la base de datos a cada elemento de
// MEDALS, haciendo match por nombre (ej. "Programador" del front-end
// con la fila "Programador" de la tabla medalla). Sin esto no
// podríamos avisarle al back-end qué medalla se ganó.
async function loadMedallasCatalogo() {
  try {
    const catalogo = await apiFetch('/medallas');
    if (!Array.isArray(catalogo)) return;
    for (let i = 0; i < MEDALS.length; i++) {
      for (let j = 0; j < catalogo.length; j++) {
        if (catalogo[j].nombre.toLowerCase() === MEDALS[i].name.toLowerCase()) {
          MEDALS[i].idMedalla = catalogo[j].idMedalla;
          break;
        }
      }
    }
  } catch (err) {
    console.warn('No se pudo cargar el catálogo de medallas:', err.message);
  }
}

// Trae las medallas que el usuario que inició sesión YA ganó (guardadas
// en la base de datos) y actualiza MEDALS.earned para que se vean
// correctas aunque se recargue la página o se vuelva a iniciar sesión.
async function cargarMisMedallas() {
  if (!currentUser.idUsuario) return;
  let misMedallas = [];
  try {
    const data = await apiFetch(`/medallas/usuario/${currentUser.idUsuario}`);
    misMedallas = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('No se pudieron cargar tus medallas:', err.message);
    return;
  }
  for (let i = 0; i < MEDALS.length; i++) {
    let ganada = false;
    for (let j = 0; j < misMedallas.length; j++) {
      if (misMedallas[j].nombre.toLowerCase() === MEDALS[i].name.toLowerCase()) {
        ganada = true;
        break;
      }
    }
    MEDALS[i].earned = ganada;
  }
  renderMedals();
}

/** Dibuja un grupo de casillas de habilidades dentro del contenedor indicado. */
function renderHabilidadesCheckboxes(containerSelector, habilidades) {
  const container = $(containerSelector);
  if (!container) return;
  if (!habilidades || habilidades.length === 0) {
    container.innerHTML = '<p class="muted-sm">No hay habilidades disponibles todavía.</p>';
    return;
  }
  container.innerHTML = habilidades.map(h => `
    <label class="checkbox-pill">
      <input type="checkbox" value="${h.idPerfil}">
      <span>${h.nombre}</span>
    </label>`).join('');
  $all('input[type="checkbox"]', container).forEach(cb => {
    cb.addEventListener('change', () => {
      cb.closest('.checkbox-pill').classList.toggle('is-checked', cb.checked);
    });
  });
}

/** Lee qué casillas de habilidades están marcadas dentro de un contenedor. */
function leerHabilidadesSeleccionadas(containerSelector) {
  const seleccionadas = [];
  $all(containerSelector + ' input[type="checkbox"]:checked').forEach(cb => {
    seleccionadas.push(Number(cb.value));
  });
  return seleccionadas;
}

/* ---------- HOME / PROJECT RENDERING ---------- */
function projectCardHTML(p) {
  return `
    <div class="project-card" data-goto-details="${p.key}">
      <div class="project-card-img" style="background:${p.img}"></div>
      <div class="project-card-body">
        <h4>${p.name}</h4>
        <div class="tag-row">${p.tags.map(t => `<span class="tag tag-gray">${t}</span>`).join('')}</div>
        <div class="project-card-foot">
          <span>Equipo: ${p.team}</span>
          <button class="btn btn-primary btn-small" data-details-btn="${p.key}">Detalles</button>
        </div>
      </div>
    </div>`;
}

function renderHome() {
  $('#home-project-grid').innerHTML = PROJECTS.slice(0, 3).map(projectCardHTML).join('');
  bindProjectCards();
}

function bindProjectCards() {
  $all('[data-goto-details]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-details-btn]')) return;
      renderDetails(card.dataset.gotoDetails);
      showScreen('details', { backTarget: currentScreenName() });
    });
  });
  $all('[data-details-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderDetails(btn.dataset.detailsBtn);
      showScreen('details', { backTarget: currentScreenName() });
    });
  });
}

function currentScreenName() {
  const active = $('.main-content .screen.is-active');
  return active ? active.id.replace('screen-', '') : 'home';
}

/* ---------- SEARCH ---------- */
let activeCategory = 'todos';

function applyFilters() {
  const query = $('#search-input').value.trim().toLowerCase();
  const sort = $('#filter-sort').value;

  let list = PROJECTS.filter(p => {
    const matchesCategory = activeCategory === 'todos' || p.category === activeCategory;
    const matchesQuery = !query || p.name.toLowerCase().includes(query) || p.tags.join(' ').toLowerCase().includes(query) || p.company.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  list.sort((a, b) => b.sortWeight[sort] - a.sortWeight[sort]);

  const grid = $('#search-project-grid');
  const empty = $('#search-empty');
  grid.innerHTML = list.map(projectCardHTML).join('');
  bindProjectCards();
  empty.classList.toggle('is-hidden', list.length > 0);
  $('#results-count').textContent = `${list.length} proyecto${list.length === 1 ? '' : 's'} encontrado${list.length === 1 ? '' : 's'}`;
}

$all('[data-filter-category]').forEach(chip => {
  chip.addEventListener('click', () => {
    $all('[data-filter-category]').forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    activeCategory = chip.dataset.filterCategory;
    applyFilters();
  });
});
$('#search-input').addEventListener('input', applyFilters);
$('#filter-sort').addEventListener('change', applyFilters);
$('#btn-clear-filters').addEventListener('click', () => {
  $('#search-input').value = '';
  $('#filter-sort').value = 'reciente';
  activeCategory = 'todos';
  $all('[data-filter-category]').forEach(c => c.classList.toggle('is-active', c.dataset.filterCategory === 'todos'));
  applyFilters();
});

/* ---------- PROJECT DETAILS ---------- */
function teamMemberRowHTML(m, esLider) {
  const detalle = [m.grado, m.procedencia].filter(Boolean).join(' · ');
  return `
    <div class="team-member-row">
      <div>
        <div class="team-member-name">${esLider ? '👑 ' : '🧑‍💻 '}${m.nombre || 'Usuario'}</div>
        ${detalle ? `<div class="team-member-role">${detalle}</div>` : ''}
      </div>
      ${esLider ? '<span class="tag tag-blue">Líder</span>' : ''}
    </div>`;
}

// Trae y pinta la sección "Miembros del equipo": el back-end decide si
// el usuario puede verla (dueño del proyecto o alguien ya aceptado).
// Si no tiene acceso, mostramos un mensaje explicando por qué en vez de
// intentar adivinar quién debería verlo desde el front-end.
async function cargarMiembrosEquipo(p) {
  const cont = $('#details-team');
  if (!cont) return;
  if (!currentUser.idUsuario) {
    cont.innerHTML = '<div class="team-locked">Inicia sesión para ver quién forma parte de este equipo.</div>';
    return;
  }
  try {
    const data = await apiFetch(`/proyectos/${p.idProyecto}/miembros?idUsuario=${currentUser.idUsuario}`);
    const filas = [];
    if (data.propietario && data.propietario.idUsuario) {
      filas.push(teamMemberRowHTML(data.propietario, true));
    }
    (data.miembros || []).forEach(m => filas.push(teamMemberRowHTML(m, false)));
    cont.innerHTML = `<h3>Miembros del equipo</h3><div class="team-member-list">${filas.join('')}</div>`;
  } catch (err) {
    cont.innerHTML = '<div class="team-locked">Solo el líder del proyecto o los miembros ya aceptados pueden ver el equipo. Solicita unirte para conocerlos.</div>';
  }
}

// Busca si el usuario que inició sesión ya tiene una solicitud enviada a
// este proyecto, y en qué estado quedó ("pendiente", "aceptada" o
// "rechazada"). Devuelve null si nunca ha solicitado unirse.
// Mismo patrón que buscar un producto por nombre en un for: recorremos
// todas las solicitudes del usuario y nos quedamos con la que coincide
// con el idProyecto que estamos viendo.
async function buscarMiSolicitud(idProyecto) {
  if (!currentUser.idUsuario) return null;
  let misSolicitudes = [];
  try {
    const data = await apiFetch(`/solicitudes/usuario/${currentUser.idUsuario}`);
    misSolicitudes = Array.isArray(data) ? data : [];
  } catch (err) {
    return null;
  }
  for (let i = 0; i < misSolicitudes.length; i++) {
    const s = misSolicitudes[i];
    if (s.proyecto && String(s.proyecto.idProyecto) === String(idProyecto)) {
      return s;
    }
  }
  return null;
}

// Arma el HTML de la zona de acciones (donde antes siempre salía
// "Solicitar unión"), según quién esté viendo el proyecto:
//  - El dueño/líder: no tiene sentido que se solicite unir a sí mismo,
//    en su lugar ve un botón para revisar a sus solicitantes.
//  - Un usuario que ya tiene una solicitud "pendiente": botón deshabilitado,
//    para no dejarlo mandar una segunda solicitud mientras espera respuesta.
//  - Un usuario ya "aceptado": aviso de que ya es parte del equipo, sin botón.
//  - Un usuario "rechazado" (o que nunca ha solicitado): puede solicitar
//    unirse normalmente (el back-end ya permite volver a intentarlo si
//    fue rechazado).
function accionesDetailsHTML(esDueno, miSolicitud) {
  if (esDueno) {
    return `
      <p class="details-status-note">Eres el líder de este proyecto.</p>
      <div class="details-actions">
        <button class="btn btn-primary" id="btn-ver-solicitantes">Ver solicitantes</button>
      </div>`;
  }

  const estado = miSolicitud ? (miSolicitud.estado || '').toLowerCase() : null;

  if (estado === 'pendiente') {
    return `
      <div class="details-actions">
        <button class="btn btn-primary" disabled>Solicitud pendiente de revisión</button>
        <button class="btn btn-primary" id="btn-open-report-project">Reportar proyecto</button>
      </div>`;
  }

  if (estado === 'aceptada') {
    return `
      <p class="details-status-note">✓ Ya eres parte de este equipo.</p>
      <div class="details-actions">
        <button class="btn btn-primary" id="btn-open-report-project">Reportar proyecto</button>
      </div>`;
  }

  // estado === 'rechazada' o nunca ha solicitado: puede solicitar unirse.
  return `
    <div class="details-actions">
      <button class="btn btn-primary" id="btn-open-join">Solicitar unión</button>
      <button class="btn btn-primary" id="btn-open-report-project">Reportar proyecto</button>
    </div>`;
}

async function renderDetails(key) {
  const p = PROJECTS.find(x => x.key === key) || PROJECTS[0];
  currentJoinProject = p;
  const etiquetaHabilidades = (p.habilidades && p.habilidades.length)
    ? 'Habilidades requeridas'
    : 'Tecnologías';

  const esDueno = !!(currentUser.idUsuario && String(currentUser.idUsuario) === String(p.idUsuario));
  // Si es el dueño no tiene caso pedirle al back-end su propia solicitud
  // a su propio proyecto (nunca va a existir una).
  const miSolicitud = esDueno ? null : await buscarMiSolicitud(p.idProyecto);

  $('#details-card').innerHTML = `
    <div class="project-card-img" style="background:${p.img}; height:180px; border-radius:14px; margin-bottom:24px;"></div>
    <h2>${p.name}</h2>
    <p class="desc">${p.desc}</p>
    <div class="details-meta">
      <div><span>Categoría</span><strong>${p.category.charAt(0).toUpperCase() + p.category.slice(1)}</strong></div>
      <div><span>Dueño del proyecto</span><strong>${p.company}</strong></div>
      <div><span>Equipo</span><strong>${p.team}</strong></div>
      <div><span>${etiquetaHabilidades}</span><strong>${p.tags.join(', ')}</strong></div>
    </div>
    <div class="team-section" id="details-team"></div>
    ${accionesDetailsHTML(esDueno, miSolicitud)}
  `;
  cargarMiembrosEquipo(p);

  const btnJoin = $('#btn-open-join');
  if (btnJoin) {
    btnJoin.addEventListener('click', () => {
      $('#join-title').textContent = `Solicitud de unión — ${p.name}`;
      $('#join-as').innerHTML = `Solicitando como: <strong>${currentUser.name}</strong> (${currentUser.correo || 'correo de tu cuenta'})`;
      renderHabilidadesCheckboxes('#join-habilidades-group', p.habilidades || []);
      if (!p.habilidades || p.habilidades.length === 0) {
        $('#join-habilidades-group').innerHTML = '<p class="muted-sm">Este proyecto no especificó habilidades requeridas.</p>';
      }
      showScreen('join', { backTarget: 'details' });
    });
  }

  const btnReport = $('#btn-open-report-project');
  if (btnReport) {
    btnReport.addEventListener('click', () => {
      showScreen('report', { backTarget: 'details' });
      $('#report-type').value = 'proyecto';
      $('#report-target').value = p.name;
    });
  }

  // Botón exclusivo del dueño: lo manda directo a la lista de
  // solicitantes de ESTE proyecto (reutiliza el mismo flujo que ya
  // existía en "Evaluar candidatos", solo que sin tener que elegir el
  // proyecto de nuevo de un select).
  const btnVerSolicitantes = $('#btn-ver-solicitantes');
  if (btnVerSolicitantes) {
    btnVerSolicitantes.addEventListener('click', () => {
      showScreen('create-evaluation', { backTarget: 'details' });
      resetEvalFlow();
      $('#eval-project-select').value = p.idProyecto;
      cargarSolicitantes(p.idProyecto);
    });
  }
}

/* ---------- JOIN REQUEST FORM ---------- */
$('#form-join').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) { toast('Completa correctamente el formulario', 'error'); return; }
  if (!currentUser.idUsuario) { toast('Inicia sesión de nuevo para continuar', 'error'); return; }
  openModal('#modal-confirm');
  $('#modal-confirm-text').textContent = 'Estás seguro que deseas enviar la solicitud. Una vez enviada, el líder del proyecto podrá revisarla.';
  $('#modal-confirm-accept').onclick = async () => {
    closeModals();
    try {
      await apiFetch('/solicitudes', {
        method: 'POST',
        body: JSON.stringify({
          idUsuario: currentUser.idUsuario,
          idProyecto: currentJoinProject ? currentJoinProject.idProyecto : null,
          procedencia: $('#join-procedencia').value.trim(),
          grado: $('#join-grado').value.trim(),
          perfilExperiencia: $('#join-profile').value.trim(),
          idsHabilidades: leerHabilidadesSeleccionadas('#join-habilidades-group')
        })
      });
      e.target.reset();
      $all('.checkbox-pill', $('#join-habilidades-group')).forEach(p => p.classList.remove('is-checked'));
      $all('.field', e.target).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
      showSuccessModal('Se ha enviado tu solicitud de unión y quedó guardada en la base de datos');
      addNotification('Solicitud enviada', `Enviaste tu solicitud para unirte a "${currentJoinProject ? currentJoinProject.name : 'un proyecto'}"`);
      setTimeout(() => showScreen(backTarget), 200);
    } catch (err) {
      toast(err.message, 'error');
    }
  };
});

/* ---------- CREATE PROJECT FORM ---------- */
$('#form-create-project').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) { toast('Completa correctamente el formulario', 'error'); return; }
  if (!currentUser.idUsuario) { toast('Inicia sesión de nuevo para continuar', 'error'); return; }
  openModal('#modal-confirm');
  $('#modal-confirm-text').textContent = 'Estás seguro que deseas crear este proyecto. Una vez creado, otros usuarios podrán verlo y solicitar unirse.';
  $('#modal-confirm-accept').onclick = async () => {
    closeModals();
    try {
      await apiFetch('/proyectos', {
        method: 'POST',
        body: JSON.stringify({
          idUsuario: currentUser.idUsuario,
          idCategoria: Number($('#proj-category').value),
          nombre: $('#proj-name').value.trim(),
          descripcion: $('#proj-desc').value.trim(),
          vacantesDisponibles: Number($('#proj-size').value),
          idsHabilidades: leerHabilidadesSeleccionadas('#proj-habilidades-group')
        })
      });
      const nombreCreado = $('#proj-name').value.trim();
      e.target.reset();
      $all('.checkbox-pill', $('#proj-habilidades-group')).forEach(p => p.classList.remove('is-checked'));
      $all('input[type="checkbox"]', $('#proj-habilidades-group')).forEach(cb => cb.checked = false);
      $all('.field', e.target).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
      await loadProyectos();
      showSuccessModal('¡Tu proyecto se publicó con éxito y ya está guardado en la base de datos!');
      addNotification('Proyecto publicado', `"${nombreCreado}" ya está visible para otros usuarios`);
      setTimeout(() => showScreen('home'), 200);
    } catch (err) {
      toast(err.message, 'error');
    }
  };
});

/* ---------- PROFILE TABS ---------- */
$all('[data-profile-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    $all('[data-profile-tab]').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    $all('[data-profile-panel]').forEach(p => p.classList.toggle('is-active', p.dataset.profilePanel === tab.dataset.profileTab));
  });
});

function medalCardHTML(m) {
  return `
    <div class="medal-card" data-medal-key="${m.key}">
      <div class="medal-icon">${m.icon}</div>
      <h4>${m.name}</h4>
      <span class="medal-status ${m.earned ? 'earned' : 'locked'}">${m.earned ? 'Conseguida' : 'Bloqueada'}</span>
    </div>`;
}
function renderMedals() {
  $('#medals-grid').innerHTML = MEDALS.map(medalCardHTML).join('');
  $('#profile-medal-grid').innerHTML = MEDALS.filter(m => m.earned).map(medalCardHTML).join('');
  bindMedalCards();
}
function bindMedalCards() {
  $all('[data-medal-key]').forEach(card => {
    card.addEventListener('click', () => {
      const m = MEDALS.find(x => x.key === card.dataset.medalKey);
      openMedalDetail(m);
    });
  });
}

function openMedalDetail(m) {
  currentMedal = m;
  $('#medal-detail-title').textContent = `Medalla ${m.name}`;
  $('#medal-detail-desc').textContent = `Esta evaluación está diseñada para calificar tus conocimientos prácticos en ${m.name}. Mide tu comprensión teórica, criterio técnico y capacidad de resolver problemas reales dentro del área.`;
  $('#medal-exam-title').textContent = `Medalla ${m.name}`;
  $('#medal-intro-card').classList.remove('is-hidden');
  $('#medal-exam-card').classList.add('is-hidden');
  showScreen('medal-detail', { backTarget: 'medals' });
}
$('#btn-start-medal-exam').addEventListener('click', () => {
  $('#medal-intro-card').classList.add('is-hidden');
  $('#medal-exam-card').classList.remove('is-hidden');
});
$('#form-medal-exam').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) { toast('Escribe tu solución antes de entregar', 'error'); return; }
  if (!currentUser.idUsuario) { toast('Inicia sesión de nuevo para continuar', 'error'); return; }
  if (!currentMedal || !currentMedal.idMedalla) {
    toast('No se pudo identificar la medalla, intenta de nuevo', 'error');
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    // Antes esto solo hacía "currentMedal.earned = true" en memoria, por
    // eso se perdía al recargar la página. Ahora se lo decimos al
    // back-end para que quede guardado en la base de datos, ligado a tu
    // usuario (tabla usuario_medalla).
    await apiFetch('/medallas/otorgar', {
      method: 'POST',
      body: JSON.stringify({ idUsuario: currentUser.idUsuario, idMedalla: currentMedal.idMedalla })
    });
    e.target.reset();
    currentMedal.earned = true;
    renderMedals();
    showSuccessModal('¡Se ha completado la medalla!');
    addNotification('¡Nueva medalla!', `Obtuviste la medalla "${currentMedal.name}"`);
    setTimeout(() => showScreen('medals'), 200);
  } catch (err) {
    toast('No se pudo guardar la medalla: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- PROFILE EDIT ---------- */
function syncProfile() {
  $('#profile-name').textContent = currentUser.name || 'Tu nombre';
  $('#profile-role').textContent = currentUser.role || 'Cuéntanos sobre ti en "Editar perfil"';
  $('#edit-name').value = currentUser.name || '';
  $('#edit-desc').value = currentUser.role || '';
  const imgs = ['#profile-avatar', '#edit-avatar-preview', '#topbar-avatar'];
  const fallbacks = ['#profile-avatar-fallback', '#edit-avatar-fallback', '#topbar-avatar-fallback'];
  imgs.forEach((sel, i) => {
    const img = $(sel);
    if (currentUser.avatar) {
      img.src = currentUser.avatar;
      img.classList.remove('is-hidden');
      $(fallbacks[i]).classList.add('is-hidden');
    } else {
      img.classList.add('is-hidden');
      $(fallbacks[i]).classList.remove('is-hidden');
    }
  });
  renderProfilePanels();
  cargarMisMedallas();
}

function renderProfilePanels() {
  // "Tus proyectos": solo los que realmente creó este usuario (dato real del backend).
  const proyectosPanel = $('#profile-proyectos-panel');
  const misProyectos = currentUser.idUsuario
    ? PROJECTS.filter(p => String(p.idUsuario) === String(currentUser.idUsuario))
    : [];
  if (misProyectos.length === 0) {
    proyectosPanel.innerHTML = '<p class="profile-empty">Aún no has creado ningún proyecto. Ve a "Crear" en el menú para publicar el primero.</p>';
  } else {
    proyectosPanel.innerHTML = misProyectos.map(p => `
      <div class="dark-card">
        <h3>${p.name}</h3>
        <div class="tag-row"><span class="tag tag-blue">${p.category || 'General'}</span><span class="tag tag-solid">Líder</span></div>
        <div class="dark-card-foot">
          <span>Equipo: ${p.team}</span>
          <button class="btn btn-primary btn-small" data-goto-details="${p.key}">Ver detalles</button>
        </div>
      </div>`).join('');
    bindProjectCards();
  }

  // "Colaboraciones": proyectos de otras personas donde ya te aceptaron.
  // "Tus evaluaciones" sigue sin datos reales conectados en el sistema,
  // así que se mantiene el estado vacío honesto.
  cargarColaboraciones();
  $('#profile-evaluaciones-panel').innerHTML =
    '<p class="profile-empty">Aún no tienes evaluaciones recibidas.</p>';
}

async function cargarColaboraciones() {
  const cont = $('#profile-colaboraciones-panel');
  if (!cont) return;
  if (!currentUser.idUsuario) {
    cont.innerHTML = '<p class="profile-empty">Inicia sesión para ver tus colaboraciones.</p>';
    return;
  }
  cont.innerHTML = '<p class="profile-empty">Cargando…</p>';
  try {
    const solicitudes = await apiFetch(`/solicitudes/usuario/${currentUser.idUsuario}`);
    const aceptadas = (Array.isArray(solicitudes) ? solicitudes : [])
      .filter(s => (s.estado || '').toLowerCase() === 'aceptada' && s.proyecto);

    if (aceptadas.length === 0) {
      cont.innerHTML = '<p class="profile-empty">Aún no colaboras en ningún proyecto de otra persona. Cuando te acepten en uno, aparecerá aquí.</p>';
      return;
    }

    cont.innerHTML = aceptadas.map(s => {
      const proy = s.proyecto;
      const categoriaNombre = proy.categoria ? proy.categoria.nombre : 'General';
      const liderNombre = proy.usuario ? proy.usuario.nombre : 'WorkinON';
      return `
        <div class="dark-card">
          <h3>${proy.nombre}</h3>
          <div class="tag-row"><span class="tag tag-blue">${categoriaNombre}</span><span class="tag tag-solid">Colaborador</span></div>
          <div class="dark-card-foot">
            <span>Líder: ${liderNombre}</span>
            <button class="btn btn-primary btn-small" data-goto-details="${proy.idProyecto}">Ver detalles</button>
          </div>
        </div>`;
    }).join('');
    bindProjectCards();
  } catch (err) {
    cont.innerHTML = '<p class="profile-empty">No se pudieron cargar tus colaboraciones.</p>';
  }
}
$('#btn-upload-avatar').addEventListener('click', () => $('#avatar-file').click());
$('#avatar-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    currentUser.avatar = ev.target.result;
    syncProfile();
    toast('Imagen cargada. No olvides guardar los cambios', 'success');
  };
  reader.readAsDataURL(file);
});
$('#form-profile-edit').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) { toast('Completa correctamente el formulario', 'error'); return; }
  openModal('#modal-confirm');
  $('#modal-confirm-text').textContent = 'Estás seguro que deseas guardar. Una vez guardado, todos los usuarios podrán ver la modificación.';
  $('#modal-confirm-accept').onclick = async () => {
    closeModals();
    try {
      await apiFetch(`/usuarios/${currentUser.idUsuario}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: $('#edit-name').value.trim(),
          descripcion: $('#edit-desc').value.trim(),
          fotoPerfil: currentUser.avatar || ''
        })
      });
      currentUser.name = $('#edit-name').value.trim();
      currentUser.role = $('#edit-desc').value.trim();
      syncProfile();
      showSuccessModal('Perfil actualizado correctamente');
      setTimeout(() => showScreen('profile'), 200);
    } catch (err) {
      toast(err.message, 'error');
    }
  };
});

/* ---------- CREATE EVALUATION FLOW ---------- */
// Llena el selector con los proyectos que el usuario que inició sesión
// realmente creó (antes tenía 3 proyectos de ejemplo fijos que no
// existían en la base de datos).
function poblarSelectorProyectosPropios() {
  const select = $('#eval-project-select');
  const misProyectos = currentUser.idUsuario
    ? PROJECTS.filter(p => String(p.idUsuario) === String(currentUser.idUsuario))
    : [];
  const opciones = misProyectos.map(p => `<option value="${p.idProyecto}">${p.name}</option>`).join('');
  select.innerHTML = `<option value="">Selecciona un proyecto</option>${opciones}`;
  if (misProyectos.length === 0) {
    select.innerHTML += '<option value="" disabled>Aún no has creado ningún proyecto</option>';
  }
}

function resetEvalFlow() {
  $('#eval-step-select').classList.remove('is-hidden');
  $('#eval-step-applicants').classList.add('is-hidden');
  $('#eval-step-type').classList.add('is-hidden');
  $('#eval-step-form').classList.add('is-hidden');
  poblarSelectorProyectosPropios();
  $('#eval-project-select').value = '';
}

function applicantCardHTML(s) {
  const nombre = s.usuario ? s.usuario.nombre : 'Candidato';
  const detalle = [s.grado, s.procedencia].filter(Boolean).join(' · ') || 'Sin más detalles';
  return `
    <div class="applicant-card" data-solicitud-id="${s.idSolicitud}">
      <div>
        <div class="applicant-name">🧑‍💻 ${nombre}</div>
        <div class="applicant-role">${detalle}</div>
      </div>
      <div class="applicant-actions">
        <button class="btn btn-ghost btn-small" data-reject="${s.idSolicitud}">Rechazar</button>
        <button class="btn btn-primary btn-small" data-accept="${s.idSolicitud}">Aceptar</button>
      </div>
    </div>`;
}

async function revisarSolicitud(idSolicitud, nuevoEstado, nombreCandidato) {
  return apiFetch(`/solicitudes/${idSolicitud}`, {
    method: 'PATCH',
    body: JSON.stringify({ idUsuarioRevisor: currentUser.idUsuario, estado: nuevoEstado })
  });
}

// Trae y pinta la lista de solicitantes PENDIENTES de un proyecto.
// La separamos en su propia función para poder llamarla tanto desde el
// selector de "Evaluar candidatos" como desde el botón "Ver solicitantes"
// que ahora aparece en la pantalla de detalles cuando eres el dueño.
async function cargarSolicitantes(idProyecto) {
  $('#applicant-list').innerHTML = '<p class="profile-empty">Cargando solicitantes…</p>';
  $('#eval-step-select').classList.add('is-hidden');
  $('#eval-step-applicants').classList.remove('is-hidden');

  let solicitudes = [];
  try {
    const todas = await apiFetch(`/solicitudes/proyecto/${idProyecto}`);
    solicitudes = Array.isArray(todas) ? todas.filter(s => (s.estado || '').toLowerCase() === 'pendiente') : [];
  } catch (err) {
    $('#applicant-list').innerHTML = '';
    toast(err.message, 'error');
    return;
  }

  if (solicitudes.length === 0) {
    $('#applicant-list').innerHTML = '<p class="profile-empty">Aún no tienes solicitudes pendientes para este proyecto.</p>';
    return;
  }

  $('#applicant-list').innerHTML = solicitudes.map(applicantCardHTML).join('');

  $all('[data-accept]').forEach(btn => btn.addEventListener('click', async () => {
    const card = btn.closest('.applicant-card');
    const nombre = card.querySelector('.applicant-name').textContent.trim();
    try {
      await revisarSolicitud(btn.dataset.accept, 'aceptada', nombre);
      showSuccessModal(`¡Felicidades a ${nombre}! Ha sido aceptado en el proyecto.`);
      addNotification('Solicitante aceptado', `Aceptaste a ${nombre}. Ahora puedes asignarle una evaluación.`);
      // Recargamos los proyectos para que el conteo "Equipo: x/y" se
      // actualice en toda la app con el nuevo miembro aceptado
      // (loadProyectos ya vuelve a pintar home, búsqueda y perfil).
      loadProyectos();
      $('#eval-step-applicants').classList.add('is-hidden');
      $('#eval-step-type').classList.remove('is-hidden');
    } catch (err) {
      toast(err.message, 'error');
    }
  }));
  $all('[data-reject]').forEach(btn => btn.addEventListener('click', async () => {
    const card = btn.closest('.applicant-card');
    const nombre = card.querySelector('.applicant-name').textContent.trim();
    try {
      await revisarSolicitud(btn.dataset.reject, 'rechazada', nombre);
      card.style.opacity = '0.35';
      toast('Solicitud rechazada', 'info');
      addNotification('Solicitante rechazado', `Rechazaste a ${nombre}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  }));
}

$('#btn-eval-comenzar').addEventListener('click', () => {
  const idProyecto = $('#eval-project-select').value;
  if (!idProyecto) {
    toast('Selecciona un proyecto para continuar', 'error');
    return;
  }
  cargarSolicitantes(idProyecto);
});

const EVAL_TYPE_LABELS = {
  formulario: 'Formulario', codigo: 'Código', corregir: 'Corrige un Código', trabajo: 'Trabajo Propio'
};
$all('[data-eval-type]').forEach(btn => {
  btn.addEventListener('click', () => {
    currentEvalType = btn.dataset.evalType;
    $('#eval-form-title').textContent = `Crear "${EVAL_TYPE_LABELS[currentEvalType]}"`;
    $('#eval-step-type').classList.add('is-hidden');
    $('#eval-step-form').classList.remove('is-hidden');
  });
});
$('#form-eval-create').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) { toast('Completa correctamente el formulario', 'error'); return; }

  const proyectoSelect = $('#eval-project-select');
  const nombreProyecto = proyectoSelect.selectedOptions[0] ? proyectoSelect.selectedOptions[0].textContent : 'Proyecto';

  try {
    const resultado = await apiFetch('/evaluaciones', {
      method: 'POST',
      body: JSON.stringify({
        tipo: currentEvalType,
        nombreProyecto,
        instrucciones: $('#eval-instructions').value.trim(),
        duracionMinutos: Number($('#eval-duration').value)
      })
    });
    e.target.reset();
    showSuccessModal(`Evaluación de tipo "${resultado.tipo}" creada y enviada al candidato (duración sugerida: ${resultado.duracionSugeridaMinutos} min)`);
    addNotification('Evaluación creada', `Se creó una evaluación de tipo "${resultado.tipo}" para ${nombreProyecto}`);
    resetEvalFlow();
    setTimeout(() => showScreen('home'), 200);
  } catch (err) {
    toast(err.message, 'error');
  }
});

/* Reset eval flow whenever entering that screen */
$all('[data-goto-screen="create-evaluation"]').forEach(el => el.addEventListener('click', resetEvalFlow));

/* ---------- REPORT FORM ---------- */
$('#form-report').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm(e.target)) { toast('Completa correctamente el formulario', 'error'); return; }
  if (!currentUser.idUsuario) { toast('Inicia sesión de nuevo para continuar', 'error'); return; }

  const tipo = $('#report-type').value;
  const objetivo = $('#report-target').value.trim();
  const motivoCompleto = `[Reporte de ${tipo === 'proyecto' ? 'proyecto' : 'usuario'}: ${objetivo}] ${$('#report-reason').value.trim()}`;
  // Si estamos reportando el proyecto que se está viendo en Detalles, mandamos su id real.
  const idProyecto = (tipo === 'proyecto' && currentJoinProject && currentJoinProject.name === objetivo)
    ? currentJoinProject.idProyecto : null;

  try {
    await apiFetch('/reportes', {
      method: 'POST',
      body: JSON.stringify({
        idUsuario: currentUser.idUsuario,
        idProyecto,
        motivo: motivoCompleto
      })
    });
    e.target.reset();
    $all('.field', e.target).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
    showSuccessModal('Tu reporte ha sido enviado y guardado en la base de datos.');
    addNotification('Reporte enviado', 'Nuestro equipo revisará tu reporte pronto');
    setTimeout(() => showScreen('home'), 200);
  } catch (err) {
    toast(err.message, 'error');
  }
});

/* ---------- PASSWORD VISIBILITY TOGGLE ---------- */
$all('[data-toggle-pass]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = $('#' + btn.dataset.togglePass);
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

/* ---------- INIT ---------- */
async function initApp() {
  renderHome();
  renderMedals();
  applyFilters();
  syncProfile();
  loadCategorias();
  loadPerfiles();
  await loadMedallasCatalogo();
  await loadProyectos();

  // Si ya había una sesión guardada en este navegador (localStorage),
  // entramos directo a la app en vez de mostrar la pantalla de login.
  const sesionGuardada = mockGetSession();
  const idUsuarioSesion = sesionGuardada ? Number(sesionGuardada) : null;
  if (idUsuarioSesion) {
    try {
      const db = loadDB();
      const usuario = db.usuarios.find(u => u.idUsuario === idUsuarioSesion);
      if (usuario) {
        currentUser.idUsuario = usuario.idUsuario;
        currentUser.name = usuario.nombre;
        currentUser.correo = usuario.correo;
        currentUser.role = usuario.descripcion || 'Nuevo en WorkinON';
        currentUser.avatar = usuario.fotoPerfil || '';
        syncProfile();
        showScreen('home');
        loadProyectos();
        return;
      }
    } catch (_) { /* si algo falla, mostramos login normalmente */ }
  }
  showScreen('auth');
}

initApp();
