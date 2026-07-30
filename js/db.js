/* =========================================================
   WORKINON — "BACKEND" LOCAL (sin servidor)
   ---------------------------------------------------------
   Este archivo reemplaza al backend de Java + Spring Boot + MySQL
   para poder publicar WorkinON como sitio 100% estático (por
   ejemplo en Vercel, que no ejecuta código Java).

   ¿Cómo funciona?
   Toda la "base de datos" vive en localStorage del navegador
   (persiste aunque cierres la pestaña o recargues la página, pero
   es propia de cada navegador/dispositivo, no se comparte entre
   usuarios reales como pasaría con MySQL en un servidor).

   La función mockApiFetch(path, options) imita exactamente las
   mismas rutas que antes atendía Spring Boot (/api/auth/login,
   /api/proyectos, /api/solicitudes, etc.) y regresa los mismos
   objetos que regresaba el backend real, para que el resto de
   script.js (toda la lógica de pantallas) no tenga que cambiar.
   ========================================================= */

const DB_KEY = 'workinon_db_v1';
const SESSION_KEY = 'workinon_session_v1';

/* ---------- DATOS SEMILLA (igual que sql/schema.sql) ---------- */
function seedDB() {
  return {
    categorias: [
      { idCategoria: 1, nombre: 'Tecnología' },
      { idCategoria: 2, nombre: 'Redes' },
      { idCategoria: 3, nombre: 'Salud' },
      { idCategoria: 4, nombre: 'Ciencia de Datos' }
    ],
    perfiles: [
      { idPerfil: 1, nombre: 'Programador' },
      { idPerfil: 2, nombre: 'Diseñador Gráfico' },
      { idPerfil: 3, nombre: 'Analista de Datos' },
      { idPerfil: 4, nombre: 'Técnico en Redes' }
    ],
    medallas: [
      { idMedalla: 1, nombre: 'Programador', descripcion: 'Evalúa conocimientos prácticos de programación.' },
      { idMedalla: 2, nombre: 'Redes', descripcion: 'Evalúa conocimientos de administración de redes.' },
      { idMedalla: 3, nombre: 'Base de datos', descripcion: 'Evalúa diseño y consultas de bases de datos.' },
      { idMedalla: 4, nombre: 'Backend', descripcion: 'Evalúa desarrollo de servicios backend.' },
      { idMedalla: 5, nombre: 'Frontend', descripcion: 'Evalúa conocimientos de desarrollo de interfaces web.' },
      { idMedalla: 6, nombre: 'DevOps', descripcion: 'Evalúa conocimientos de integración y despliegue continuo.' }
    ],
    proyectos: [
      { idProyecto: 1, idUsuario: 1, idCategoria: 1, nombre: 'Coffeelovers', descripcion: 'Una plataforma para amantes del café que conecta cafeterías locales con clientes frecuentes a través de recomendaciones inteligentes y programas de fidelidad.', vacantesDisponibles: 5, fechaCreacion: '2026-05-02', estado: true },
      { idProyecto: 2, idUsuario: 1, idCategoria: 2, nombre: 'Calico', descripcion: 'Rediseño de infraestructura de red para oficinas híbridas, enfocado en seguridad, monitoreo en tiempo real y alta disponibilidad.', vacantesDisponibles: 4, fechaCreacion: '2026-06-10', estado: true },
      { idProyecto: 3, idUsuario: 1, idCategoria: 4, nombre: 'Blimond', descripcion: 'Sistema de gestión y calendarización empresarial con reportes automatizados y dashboards de productividad por equipo.', vacantesDisponibles: 7, fechaCreacion: '2026-03-18', estado: true },
      { idProyecto: 4, idUsuario: 1, idCategoria: 3, nombre: 'Educational App', descripcion: 'Aplicación educativa para el sector salud, con módulos interactivos de capacitación clínica y seguimiento de certificaciones.', vacantesDisponibles: 6, fechaCreacion: '2026-01-22', estado: true }
    ],
    proyectoHabilidades: [
      { idProyecto: 1, idPerfil: 1 }, { idProyecto: 1, idPerfil: 2 },
      { idProyecto: 2, idPerfil: 4 },
      { idProyecto: 3, idPerfil: 1 }, { idProyecto: 3, idPerfil: 3 },
      { idProyecto: 4, idPerfil: 2 }
    ],
    solicitudes: [],
    solicitudHabilidades: [],  // { idSolicitud, idPerfil }
    reportes: [],
    evaluaciones: [],
    usuarioMedallas: [],       // { idUsuario, idMedalla }
    // Usuario de ejemplo dueño de los proyectos semilla. La contraseña
    // es solo para que puedas iniciar sesión como este usuario y probar
    // el flujo de "dueño de proyecto" (ver solicitantes, crear
    // evaluaciones, etc.) sin tener que crear proyectos desde cero.
    usuarios: [
      { idUsuario: 1, nombre: 'WorkinON Demo', correo: 'demo@workinon.com', contrasena: 'demo1234', descripcion: 'Cuenta de ejemplo con proyectos ya publicados', fotoPerfil: '', fechaRegistro: '2026-01-01' }
    ],
    seq: { usuario: 2, proyecto: 5, solicitud: 1, reporte: 1, evaluacion: 1 }
  };
}

function loadDB() {
  let raw = null;
  try { raw = localStorage.getItem(DB_KEY); } catch (_) { /* localStorage no disponible */ }
  if (!raw) {
    const fresh = seedDB();
    saveDB(fresh);
    return fresh;
  }
  try {
    return JSON.parse(raw);
  } catch (_) {
    const fresh = seedDB();
    saveDB(fresh);
    return fresh;
  }
}

function saveDB(db) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (_) { /* espacio lleno o navegador en modo privado */ }
}

function nextId(db, entidad) {
  const id = db.seq[entidad];
  db.seq[entidad] = id + 1;
  return id;
}

/* ---------- SESIÓN (para no perder el login al recargar) ---------- */
function mockGetSession() {
  try { return localStorage.getItem(SESSION_KEY); } catch (_) { return null; }
}
function mockSetSession(idUsuario) {
  try { localStorage.setItem(SESSION_KEY, String(idUsuario)); } catch (_) { /* noop */ }
}
function mockClearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (_) { /* noop */ }
}

async function mockUpdatePasswordByCorreo(correo, nuevaContrasena) {
  const db = loadDB();
  const usuario = db.usuarios.find(u => u.correo.toLowerCase() === (correo || '').trim().toLowerCase());
  if (!usuario) throw apiError('No encontramos una cuenta con ese correo');
  if (!nuevaContrasena || nuevaContrasena.length < 8) throw apiError('La contraseña debe tener al menos 8 caracteres');
  usuario.contrasena = nuevaContrasena;
  saveDB(db);
  return { ok: true };
}

/* ---------- UTILIDADES ---------- */
function apiError(mensaje) {
  const err = new Error(mensaje);
  err.isApiError = true;
  return err;
}

function usuarioPublico(u) {
  // Igual que hacía el backend real: nunca regresamos la contraseña.
  return { idUsuario: u.idUsuario, nombre: u.nombre, correo: u.correo, descripcion: u.descripcion || '', fotoPerfil: u.fotoPerfil || '' };
}

function contarMiembrosAceptados(db, idProyecto) {
  return db.solicitudes.filter(s => s.idProyecto === idProyecto && s.estado === 'aceptada').length;
}

function habilidadesDeProyecto(db, idProyecto) {
  const ids = db.proyectoHabilidades.filter(ph => ph.idProyecto === idProyecto).map(ph => ph.idPerfil);
  return db.perfiles.filter(p => ids.includes(p.idPerfil));
}

function proyectoCompleto(db, p) {
  const usuario = db.usuarios.find(u => u.idUsuario === p.idUsuario);
  const categoria = db.categorias.find(c => c.idCategoria === p.idCategoria);
  return {
    idProyecto: p.idProyecto,
    nombre: p.nombre,
    descripcion: p.descripcion,
    vacantesDisponibles: p.vacantesDisponibles,
    fechaCreacion: p.fechaCreacion,
    estado: p.estado,
    usuario: usuario ? { idUsuario: usuario.idUsuario, nombre: usuario.nombre } : null,
    categoria: categoria ? { idCategoria: categoria.idCategoria, nombre: categoria.nombre } : null,
    habilidades: habilidadesDeProyecto(db, p.idProyecto),
    miembrosAceptados: contarMiembrosAceptados(db, p.idProyecto)
  };
}

function solicitudCompleta(db, s) {
  const usuario = db.usuarios.find(u => u.idUsuario === s.idUsuario);
  const proyecto = db.proyectos.find(p => p.idProyecto === s.idProyecto);
  return {
    idSolicitud: s.idSolicitud,
    procedencia: s.procedencia,
    grado: s.grado,
    perfilExperiencia: s.perfilExperiencia,
    estado: s.estado,
    fechaSolicitud: s.fechaSolicitud,
    usuario: usuario ? { idUsuario: usuario.idUsuario, nombre: usuario.nombre } : null,
    proyecto: proyecto ? proyectoCompleto(db, proyecto) : null
  };
}

/* ---------- RUTAS ---------- */
async function mockApiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = null;
  if (options.body) {
    try { body = JSON.parse(options.body); } catch (_) { body = null; }
  }

  // Separamos la ruta de los parámetros de búsqueda (?idUsuario=...)
  const [rawPath, queryString] = path.split('?');
  const params = new URLSearchParams(queryString || '');
  const segments = rawPath.split('/').filter(Boolean);

  const db = loadDB();

  /* ----- AUTH ----- */
  if (method === 'POST' && rawPath === '/auth/register') {
    const nombre = (body && body.nombre || '').trim();
    const correo = (body && body.correo || '').trim();
    const contrasena = body && body.contrasena || '';
    if (nombre.length < 3) throw apiError('El nombre debe tener al menos 3 caracteres');
    if (!correo.includes('@')) throw apiError('Ingresa un correo electrónico válido');
    if (contrasena.length < 8) throw apiError('La contraseña debe tener al menos 8 caracteres');
    if (db.usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase())) {
      throw apiError('Ese correo ya está registrado');
    }
    const nuevo = {
      idUsuario: nextId(db, 'usuario'),
      nombre, correo, contrasena,
      descripcion: '', fotoPerfil: '',
      fechaRegistro: new Date().toISOString().slice(0, 10)
    };
    db.usuarios.push(nuevo);
    saveDB(db);
    return usuarioPublico(nuevo);
  }

  if (method === 'POST' && rawPath === '/auth/login') {
    const correo = (body && body.correo || '').trim();
    const contrasena = body && body.contrasena || '';
    const usuario = db.usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase());
    if (!usuario || usuario.contrasena !== contrasena) {
      throw apiError('Correo o contraseña incorrectos');
    }
    return usuarioPublico(usuario);
  }

  /* ----- CATÁLOGOS ----- */
  if (method === 'GET' && rawPath === '/categorias') return db.categorias;
  if (method === 'GET' && rawPath === '/perfiles') return db.perfiles;
  if (method === 'GET' && rawPath === '/medallas') return db.medallas;

  if (method === 'GET' && segments[0] === 'medallas' && segments[1] === 'usuario') {
    const idUsuario = Number(segments[2]);
    const idsGanadas = db.usuarioMedallas.filter(um => um.idUsuario === idUsuario).map(um => um.idMedalla);
    return db.medallas.filter(m => idsGanadas.includes(m.idMedalla));
  }

  if (method === 'POST' && rawPath === '/medallas/otorgar') {
    const idUsuario = Number(body.idUsuario);
    const idMedalla = Number(body.idMedalla);
    const yaExiste = db.usuarioMedallas.some(um => um.idUsuario === idUsuario && um.idMedalla === idMedalla);
    if (!yaExiste) {
      db.usuarioMedallas.push({ idUsuario, idMedalla });
      saveDB(db);
    }
    return { ok: true };
  }

  /* ----- PROYECTOS ----- */
  if (method === 'GET' && rawPath === '/proyectos') {
    return db.proyectos
      .slice()
      .sort((a, b) => b.idProyecto - a.idProyecto)
      .map(p => proyectoCompleto(db, p));
  }

  if (method === 'POST' && rawPath === '/proyectos') {
    const idUsuario = Number(body.idUsuario);
    const idCategoria = Number(body.idCategoria);
    const nombre = (body.nombre || '').trim();
    const descripcion = (body.descripcion || '').trim();
    const vacantesDisponibles = Number(body.vacantesDisponibles);
    if (nombre.length < 3) throw apiError('El nombre del proyecto es muy corto');
    if (descripcion.length < 15) throw apiError('La descripción es muy corta');
    if (!db.categorias.some(c => c.idCategoria === idCategoria)) throw apiError('Selecciona una categoría válida');
    if (!vacantesDisponibles || vacantesDisponibles < 1) throw apiError('Ingresa un tamaño de equipo válido');

    const nuevo = {
      idProyecto: nextId(db, 'proyecto'),
      idUsuario, idCategoria, nombre, descripcion, vacantesDisponibles,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      estado: true
    };
    db.proyectos.push(nuevo);
    (body.idsHabilidades || []).forEach(idPerfil => {
      db.proyectoHabilidades.push({ idProyecto: nuevo.idProyecto, idPerfil: Number(idPerfil) });
    });
    saveDB(db);
    return proyectoCompleto(db, nuevo);
  }

  if (method === 'GET' && segments[0] === 'proyectos' && segments[2] === 'miembros') {
    const idProyecto = Number(segments[1]);
    const idUsuarioSolicitante = Number(params.get('idUsuario'));
    const proyecto = db.proyectos.find(p => p.idProyecto === idProyecto);
    if (!proyecto) throw apiError('Proyecto no encontrado');

    const esDueno = proyecto.idUsuario === idUsuarioSolicitante;
    const esAceptado = db.solicitudes.some(s => s.idProyecto === idProyecto && s.idUsuario === idUsuarioSolicitante && s.estado === 'aceptada');
    if (!esDueno && !esAceptado) {
      throw apiError('Solo el líder o los miembros aceptados pueden ver el equipo');
    }

    const propietario = db.usuarios.find(u => u.idUsuario === proyecto.idUsuario);
    const miembros = db.solicitudes
      .filter(s => s.idProyecto === idProyecto && s.estado === 'aceptada')
      .map(s => {
        const u = db.usuarios.find(us => us.idUsuario === s.idUsuario);
        return { nombre: u ? u.nombre : 'Usuario', grado: s.grado, procedencia: s.procedencia };
      });
    return {
      propietario: propietario ? { idUsuario: propietario.idUsuario, nombre: propietario.nombre } : {},
      miembros
    };
  }

  /* ----- SOLICITUDES ----- */
  if (method === 'POST' && rawPath === '/solicitudes') {
    const idUsuario = Number(body.idUsuario);
    const idProyecto = Number(body.idProyecto);
    const proyecto = db.proyectos.find(p => p.idProyecto === idProyecto);
    if (!proyecto) throw apiError('El proyecto ya no existe');
    if (proyecto.idUsuario === idUsuario) throw apiError('No puedes solicitar unirte a tu propio proyecto');

    const grado = (body.grado || '').trim();
    const perfilExperiencia = (body.perfilExperiencia || '').trim();
    if (grado.length < 3) throw apiError('Ingresa tu grado universitario');
    if (perfilExperiencia.length < 10) throw apiError('Cuéntanos un poco más sobre tu experiencia');

    const existente = db.solicitudes.find(s => s.idUsuario === idUsuario && s.idProyecto === idProyecto);
    if (existente && existente.estado !== 'rechazada') {
      throw apiError('Ya tienes una solicitud enviada para este proyecto');
    }

    let solicitud;
    if (existente) {
      // Si fue rechazada antes, permitimos volver a intentarlo (igual que el backend real).
      existente.estado = 'pendiente';
      existente.grado = grado;
      existente.perfilExperiencia = perfilExperiencia;
      existente.procedencia = (body.procedencia || '').trim();
      existente.fechaSolicitud = new Date().toISOString().slice(0, 10);
      solicitud = existente;
    } else {
      solicitud = {
        idSolicitud: nextId(db, 'solicitud'),
        idUsuario, idProyecto,
        procedencia: (body.procedencia || '').trim(),
        grado, perfilExperiencia,
        estado: 'pendiente',
        fechaSolicitud: new Date().toISOString().slice(0, 10)
      };
      db.solicitudes.push(solicitud);
    }
    db.solicitudHabilidades = db.solicitudHabilidades.filter(sh => sh.idSolicitud !== solicitud.idSolicitud);
    (body.idsHabilidades || []).forEach(idPerfil => {
      db.solicitudHabilidades.push({ idSolicitud: solicitud.idSolicitud, idPerfil: Number(idPerfil) });
    });
    saveDB(db);
    return solicitudCompleta(db, solicitud);
  }

  if (method === 'GET' && segments[0] === 'solicitudes' && segments[1] === 'usuario') {
    const idUsuario = Number(segments[2]);
    return db.solicitudes
      .filter(s => s.idUsuario === idUsuario)
      .map(s => solicitudCompleta(db, s));
  }

  if (method === 'GET' && segments[0] === 'solicitudes' && segments[1] === 'proyecto') {
    const idProyecto = Number(segments[2]);
    return db.solicitudes
      .filter(s => s.idProyecto === idProyecto)
      .map(s => solicitudCompleta(db, s));
  }

  if (method === 'PATCH' && segments[0] === 'solicitudes' && segments.length === 2) {
    const idSolicitud = Number(segments[1]);
    const solicitud = db.solicitudes.find(s => s.idSolicitud === idSolicitud);
    if (!solicitud) throw apiError('Solicitud no encontrada');
    const proyecto = db.proyectos.find(p => p.idProyecto === solicitud.idProyecto);
    if (!proyecto || proyecto.idUsuario !== Number(body.idUsuarioRevisor)) {
      throw apiError('No tienes permiso para revisar esta solicitud');
    }
    solicitud.estado = body.estado;
    saveDB(db);
    return solicitudCompleta(db, solicitud);
  }

  /* ----- EVALUACIONES ----- */
  if (method === 'POST' && rawPath === '/evaluaciones') {
    const evaluacion = {
      idEvaluacion: nextId(db, 'evaluacion'),
      tipo: body.tipo,
      nombreProyecto: body.nombreProyecto,
      instrucciones: body.instrucciones,
      duracionMinutos: Number(body.duracionMinutos)
    };
    db.evaluaciones.push(evaluacion);
    saveDB(db);
    return { tipo: evaluacion.tipo, duracionSugeridaMinutos: evaluacion.duracionMinutos };
  }

  /* ----- REPORTES ----- */
  if (method === 'POST' && rawPath === '/reportes') {
    const idUsuario = Number(body.idUsuario);
    const motivo = (body.motivo || '').trim();
    if (!motivo) throw apiError('Ingresa el motivo del reporte');
    const reporte = {
      idReporte: nextId(db, 'reporte'),
      idUsuario,
      idProyecto: body.idProyecto ? Number(body.idProyecto) : null,
      motivo,
      fechaReporte: new Date().toISOString().slice(0, 10)
    };
    db.reportes.push(reporte);
    saveDB(db);
    return reporte;
  }

  /* ----- PERFIL (nombre / descripción / avatar) ----- */
  if (method === 'PUT' && segments[0] === 'usuarios' && segments.length === 2) {
    const idUsuario = Number(segments[1]);
    const usuario = db.usuarios.find(u => u.idUsuario === idUsuario);
    if (!usuario) throw apiError('Usuario no encontrado');
    if (typeof body.nombre === 'string' && body.nombre.trim()) usuario.nombre = body.nombre.trim();
    if (typeof body.descripcion === 'string') usuario.descripcion = body.descripcion.trim();
    if (typeof body.fotoPerfil === 'string') usuario.fotoPerfil = body.fotoPerfil;
    saveDB(db);
    return usuarioPublico(usuario);
  }

  throw apiError(`Ruta no reconocida en el backend local: ${method} ${path}`);
}
