// Extraído de <script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, update, push, remove, set, onDisconnect, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

function setDbStatus(s){
  const el=document.getElementById('db-status'),lb=document.getElementById('db-label');
  if(!el||!lb) return; el.className=s;
  lb.textContent={connecting:'Conectando',online:'Online',offline:'Sin conexion'}[s]||s;
}
setTimeout(()=>{const el=document.getElementById('db-status');if(el&&el.classList.contains('connecting'))setDbStatus('offline');},8000);

const app = initializeApp({
  apiKey: "AIzaSyBtTGAJ1X3yrvj-Dx-fsNmfe_Zw09yfrZo",
  authDomain: "medicamentos-8352a.firebaseapp.com",
  databaseURL: "https://medicamentos-8352a-default-rtdb.firebaseio.com",
  projectId: "medicamentos-8352a",
  storageBucket: "medicamentos-8352a.firebasestorage.app",
  messagingSenderId: "828746191058",
  appId: "1:828746191058:web:00f74a7502f7ce2121dd0b"
});
const db = getDatabase(app);

// ── PRESENCIA / USUARIOS ONLINE ─────────────────────────────────────────────
const PRESENCE_ID = sessionStorage.getItem('tomauno_presence_id') || ('web_' + Date.now() + '_' + Math.random().toString(36).slice(2,8));
sessionStorage.setItem('tomauno_presence_id', PRESENCE_ID);
try {
  const presenceRef = ref(db, 'tomauno/presence/' + PRESENCE_ID);
  set(presenceRef, {online:true, ts:Date.now(), ua:navigator.userAgent.slice(0,80)});
  onDisconnect(presenceRef).remove();
  setInterval(() => update(presenceRef, {online:true, ts:Date.now()}).catch(()=>{}), 30000);
  onValue(ref(db, 'tomauno/presence'), snap => {
    const now = Date.now();
    const vals = snap.exists() ? Object.values(snap.val() || {}) : [];
    const online = vals.filter(v => v && v.ts && now - v.ts < 90000).length;
    ['online-count'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent = online; });
  });
} catch(e) {}

// ── ADMIN ACCESS ──────────────────────────────────────────────────────────────
const PIN = '3233';
let adminOk = false;
let clicks = 0, clickTimer = null;

window.handleLogoClick = (e) => {
  e.preventDefault();
  clicks++;
  clearTimeout(clickTimer);
  clickTimer = setTimeout(() => clicks = 0, 2000);
  if (clicks >= 5) { clicks = 0; adminOk ? toggleAdmin(true) : showPin(); }
};

function showPin() {
  document.getElementById('mcontent').innerHTML =
    '<div style="max-width:280px;margin:0 auto;text-align:left;">' +
    '<div class="mtitle" style="font-size:26px;margin-bottom:12px;text-align:center;line-height:1;">🔐 ACCESO</div>' +
    '<label class="flbl" style="text-align:center;display:block;">PIN ADM</label>' +
    '<input class="finput" id="pin-inp" type="password" placeholder="••••" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.25em;margin-bottom:10px;" onkeydown="if(event.key===\'Enter\')window.submitPin()"/>' +
    '<button class="btn-main" style="padding:11px;margin-top:4px;" onclick="window.submitPin()">Entrar</button>' +
    '</div>';
  const ov = document.getElementById('moverlay');
  ov.style.display = 'flex';
  const box = ov.querySelector('.mbox');
  if(box){ box.style.maxWidth='380px'; box.style.padding='26px 24px 30px'; box.dataset.compactPin='1'; }
  setTimeout(() => document.getElementById('pin-inp')?.focus(), 80);
}

window.submitPin = () => {
  const v = document.getElementById('pin-inp')?.value;
  if (v === PIN) { adminOk = true; closeModal(); toggleAdmin(true); toast('✅ Bienvenido', true); }
  else toast('❌ PIN incorrecto');
};

function toggleAdmin(show) {
  if(show){ window._adminWasActive=true; adminOk=true; try{localStorage.setItem('tomauno-admin-notify','1');}catch(e){} }
  if(adminOk){ try{ update(ref(db,'tomauno/status'), {adminOnline:true, adminLast: Date.now()}); }catch(e){} }
  setTimeout(updateAdminLiveIndicator, 80);
  document.getElementById('admin-section').style.display = show ? 'block' : 'none';
  ['hero','sec-cursos','sec-eventos','sec-servicios','sec-galeria','sec-testimonios','sec-faq','sec-ubicacion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'none' : '';
  });
  const footer = document.querySelector('footer');
  if (footer) footer.style.display = show ? 'none' : '';
  window.scrollTo(0, 0);
  if (show) history.pushState({admin:true}, '', '#admin');
  else history.replaceState({}, '', window.location.pathname + window.location.search);
}
window.addEventListener('popstate', () => {
  if (document.getElementById('admin-section').style.display !== 'none') toggleAdmin(false);
  if (document.getElementById('moverlay').style.display === 'flex') closeModal();
});
window.cerrarAdmin = () => toggleAdmin(false);
setInterval(() => { if (adminOk || isAdminNotifier()) { try{ update(ref(db,'tomauno/status'), {adminOnline:true, adminLast:Date.now()}); }catch(e){} } updateAdminLiveIndicator(); }, 25000);
window.addEventListener('beforeunload', () => { if(adminOk){ try{ update(ref(db,'tomauno/status'), {adminOnline:false, adminLast:Date.now()}); }catch(e){} } });

// ── STATE ─────────────────────────────────────────────────────────────────────
try{ window._adminWasActive = localStorage.getItem('tomauno-admin-notify') === '1'; }catch(e){}
function isAdminNotifier(){ try { return !!(adminOk || window._adminWasActive || localStorage.getItem('tomauno-admin-notify') === '1'); } catch(e) { return !!(adminOk || window._adminWasActive); } }
function updateAdminLiveIndicator(){
  const el=document.getElementById('admin-live-indicator'), tx=document.getElementById('admin-live-text');
  if(!el||!tx) return;
  if(isAdminNotifier()){
    const online = isAdminOnline ? isAdminOnline() : true;
    el.className = 'admin-live-indicator ' + (online ? 'on' : 'off');
    tx.textContent = (online ? 'ADM *' : 'ADM !') + (asistenteModo && asistenteModo() === 'automatico' ? ' · AUTO *' : '');
  } else {
    el.className = 'admin-live-indicator';
  }
}
setInterval(updateAdminLiveIndicator, 5000);

let cursos = {}, inscripciones = {}, serviciosDB = {}, servicioRegsDB = {}, testimoniosDB = {}, prevCount = 0, prevEventosCount = 0, prevTestCount = 0, prevServiciosCount = 0, prevEvRegsCount = 0, eventosDB = {}, evInscDB = {};

onValue(ref(db, 'tomauno/cursos'), s => {
  setDbStatus('online');
  cursos = s.exists() ? s.val() : {};
  renderCursos(); renderAdminCursos(); renderFiltros(); updateStats(); renderFiltroTestimonios();
});

onValue(ref(db, 'tomauno/inscripciones'), s => {
  inscripciones = s.exists() ? s.val() : {};
  const c = Object.keys(inscripciones).length;
  if (c > prevCount && prevCount > 0) {
    const entries = Object.entries(inscripciones).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0));
    const newestPair = entries[0];
    const newest = newestPair ? newestPair[1] : null;
    const nombre = newest ? (newest.nombre || 'Alguien') : 'Alguien';
    const curso = newest ? (newest.cursoTitulo || '') : '';
    if(isAdminNotifier()){beep();showNotifBanner('Nueva inscripción', nombre + (curso ? ' · ' + curso : ''), '👥', () => window.irAPlanillaCurso(newest?.cursoId));showNotif();}
  }
  prevCount = c;
  renderCursos(); renderAdminCursos(); renderAlumnos(); renderFiltros(); updateStats();
});

onValue(ref(db, 'tomauno/servicios'), s => {
  const oldServiciosCount = prevServiciosCount;
  serviciosDB = s.exists() ? s.val() : {};
  const totalServicios = Object.keys(serviciosDB).length;
  if (totalServicios > oldServiciosCount && oldServiciosCount > 0 && isAdminNotifier()) {
    const newest = Object.values(serviciosDB).sort((a,b)=>(b.creado||0)-(a.creado||0))[0];
    beep(); showNotif(); showNotifBanner('Nuevo servicio registrado', newest?.titulo || 'Servicio sin título', '🛠️', () => window.irAAdminTab('servicios-adm'));
  }
  prevServiciosCount = totalServicios;
  renderServiciosAdmin();
  renderServiciosPublicos();
  updateStats();
});

onValue(ref(db, 'tomauno/servicioRegs'), s => {
  servicioRegsDB = s.exists() ? s.val() : {};
  renderServiciosPublicos();
  renderServiciosAdmin();
});


onValue(ref(db, 'tomauno/testimonios'), s => {
  testimoniosDB = s.exists() ? s.val() : {};
  const c = Object.keys(testimoniosDB).length;
  if (c > prevTestCount && prevTestCount > 0) {
    const newest = Object.values(testimoniosDB).sort((a,b)=>(b.creado||0)-(a.creado||0))[0];
    if (isAdminNotifier()) {
      beep();
      showNotifBanner('Nueva reseña pendiente', (newest?.name || 'Alumno') + ' · ' + (newest?.course || 'Sin curso'), '⭐', () => window.irAAdminTab('testimonios-adm'));
      showNotif();
    }
  }
  prevTestCount = c;
  renderTestimonios();
  renderTestimoniosAdmin();
  updateStats();
});

// ── STATS ─────────────────────────────────────────────────────────────────────
function updateStats() {
  const activeCursos = Object.values(cursos).filter(c => !c.finalizado && !c.oculto).length;
  const activeEventos = Object.values(eventosDB || {}).filter(e => e.estado === 'activo' && !e.oculto).length;
  const totalInsc = Object.keys(inscripciones).length;
  const el = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  el('stat-cursos', activeCursos);
  el('stat-insc', totalInsc);
  el('stat-eventos', activeEventos);
  el('adm-stat-cursos', activeCursos);
  el('adm-stat-insc', totalInsc);
  el('adm-stat-servicios', Object.keys(serviciosDB).length);
  el('adm-stat-test', Object.keys(testimoniosDB).length);
  const badge = document.getElementById('badge-alumnos');
  if (badge) badge.textContent = totalInsc;
  renderStatsVistas();
}

// ── RENDER CURSOS ─────────────────────────────────────────────────────────────
function renderCursos() {
  const g = document.getElementById('cursos-grid');
  if (!g) return;
  const lista = Object.entries(cursos).filter(([,c]) => !c.oculto).sort((a, b) => {
    if (a[1].finalizado && !b[1].finalizado) return 1;
    if (!a[1].finalizado && b[1].finalizado) return -1;
    return (b[1].creado || 0) - (a[1].creado || 0);
  });
  const countEl = document.getElementById('cursos-count');
  if (countEl) countEl.textContent = lista.length + ' curso' + (lista.length !== 1 ? 's' : '');
  if (!lista.length) {
    g.innerHTML = '<div style="color:var(--text3);padding:60px 0;text-align:center;font-size:14px;">No hay cursos publicados aún</div>';
    return;
  }
  // Contar inscriptos por curso de manera correcta
  const inscPorCurso = {};
  Object.values(inscripciones).forEach(i => {
    if (i.cursoId) inscPorCurso[i.cursoId] = (inscPorCurso[i.cursoId] || 0) + 1;
  });

  g.innerHTML = lista.map(([k, c], i) => {
    const insc = inscPorCurso[k] || 0;
    const full = c.cupos > 0 && insc >= c.cupos;
    const ses = c.tipo === 'sesiones';
    const badgeClass = c.finalizado ? 'end' : full ? 'full' : ses ? 'ses' : 'open';
    const badgeTxt = c.finalizado ? '🏁 Finalizado' : full ? '🔴 Sin cupos' : ses ? ('📅 Turnos · ' + insc) : '✦ Activo';
    const searchData = ((c.titulo || '') + ' ' + (c.desc || '') + ' ' + (c.fecha || '') + ' ' + (c.lugar || '') + ' ' + (c.ig || '')).toLowerCase();
    return '<div class="ccard' + (c.finalizado ? ' fin' : '') + '" style="animation:up .45s ' + (i * .07) + 's both;cursor:pointer;" draggable="true" data-id="' + k + '" data-search="' + searchData.replace(/"/g, '') + '" ondragstart="window.dragStart(event,\'' + k + '\')" onclick="window.abrirDetalle(\'' + k + '\')">' +
      '<div class="cimg">' +
      (c.img
        ? '<img src="' + c.img + '" alt="' + (c.titulo || '').replace(/"/g, '') + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/><div class="cimg-placeholder" style="display:none"><span class="icon">📷</span><span class="brand">TOMA<em>UNO</em></span></div>'
        : '<div class="cimg-placeholder"><span class="icon">' + (c.icon || '📷') + '</span><span class="brand">TOMA<em>UNO</em></span></div>') +
      '<span class="cbadge ' + badgeClass + '">' + badgeTxt + '</span>' +
      (c.cupos > 0 ? '<span class="ccupos-badge">👥 ' + insc + '/' + c.cupos + '</span>' : '') +
      '</div>' +
      '<div class="cbody">' +
      '<div class="ctitle">' + (c.titulo || 'Sin título') + '</div>' +
      '<div class="cdesc">' + (c.desc || '').replace(/\n/g, ' ') + '</div>' +
      '<div class="cmeta">' +
      (c.fecha ? '<span class="chip">📅 ' + fFecha(c.fecha) + '</span>' : '') +
      (c.hora ? '<span class="chip">⏰ ' + c.hora + '</span>' : '') +
      (c.lugar ? '<span class="chip">📍 ' + (c.lugar.split('-')[0].trim()) + '</span>' : '') +
      (!c.cupos ? '<span class="chip">👥 ' + insc + ' inscripto' + (insc !== 1 ? 's' : '') + '</span>' : '') +
      '</div>' +
      '<div class="cfoot">' +
      '<div class="cprice' + (!c.costo ? ' free' : '') + '">' + (c.costo ? '$ ' + Number(c.costo).toLocaleString('es-AR') : 'GRATIS') + '</div>' +
      '<div class="cfoot-btns">' +
      '<button class="cbtn-info" onclick="event.stopPropagation();window.abrirDetalle(\'' + k + '\')">Más info</button>' +
      '<button class="cbtn" ' + (c.finalizado || full ? 'disabled' : '') + ' onclick="event.stopPropagation();' + (ses ? 'window.abrirSesiones(\'' + k + '\')' : 'window.abrirInscripcion(\'' + k + '\')') + '">' +
      (c.finalizado ? 'Finalizado' : full ? 'Sin cupos' : ses ? '📅 Turnos' : '✍️ Inscribirme') +
      '</button>' +
      '</div></div></div></div>';
  }).join('');
}

// ── DETALLE ───────────────────────────────────────────────────────────────────
window.abrirDetalle = (id) => {
  const c = cursos[id]; if (!c) return;
  // Contar inscriptos SOLO de este curso
  const insc = Object.values(inscripciones).filter(x => x.cursoId === id).length;
  const full = c.cupos > 0 && insc >= c.cupos;
  const ses = c.tipo === 'sesiones';
  const esExterno = c.dniOrg && c.dniOrg !== 'tomauno';
  document.getElementById('mcontent').innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
    (!esExterno ? '<span style="background:rgba(232,0,10,.15);color:var(--red);border:1px solid rgba(232,0,10,.3);font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px;letter-spacing:.08em;">✦ CERTIFICADO TOMAUNO</span>' : '<span style="background:rgba(90,60,220,.12);color:#a78bfa;border:1px solid rgba(90,60,220,.25);font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px;">ORGANIZADOR EXTERNO</span>') +
    '</div>' +
    (c.img ? '<img src="' + c.img + '" style="width:100%;border-radius:var(--radius-sm);margin-bottom:16px;max-height:420px;object-fit:contain;background:#0a0a0a;display:block;cursor:zoom-in;" onclick="window.verFlyerFull(this.src)" onerror="this.style.display=\'none\'"/>' : '') +
    '<div class="mtitle">' + (c.titulo || 'Sin título') + '</div>' +
    '<div class="msub">' + insc + ' inscripto' + (insc !== 1 ? 's' : '') + (c.cupos > 0 ? ' · ' + (c.cupos - insc) + ' cupos restantes' : '') + '</div>' +
    '<div class="cmeta" style="margin-bottom:18px;">' +
    (c.fecha ? '<span class="chip">📅 ' + fFecha(c.fecha) + '</span>' : '') +
    (c.hora ? '<span class="chip">⏰ ' + c.hora + '</span>' : '') +
    (c.lugar ? '<span class="chip">📍 ' + c.lugar + '</span>' : '') +
    (c.costo ? '<span class="chip accent">💰 $ ' + Number(c.costo).toLocaleString('es-AR') + '</span>' : '<span class="chip" style="color:#00d25a;">✦ GRATIS</span>') +
    '</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.7;white-space:pre-line;margin-bottom:18px;">' + (c.desc || '') + '</div>' +
    '<div class="det-links">' +
    (c.ig ? '<a rel="noopener noreferrer" href="https://instagram.com/' + c.ig + '" target="_blank" class="det-link ig">📸 @' + c.ig + '</a>' : '') +
    (c.wp ? '<a rel="noopener noreferrer" href="https://wa.me/549' + c.wp.replace(/\D/g, '') + '" target="_blank" class="det-link wp">💬 Consultar</a>' : '') +
    (c.extraUrl ? '<a rel="noopener noreferrer" href="' + safeUrl(c.extraUrl) + '" target="_blank" class="extra-link-btn">🔗 ' + escHtml(c.extraText || 'Ver más información') + '</a>' : '') +
    '</div>' +
    (!c.finalizado && !full ?
      '<button class="btn-main" style="margin-top:16px;" onclick="' + (ses ? 'window.abrirSesiones(\'' + id + '\')' : 'window.abrirInscripcion(\'' + id + '\')') + '">' +
      (ses ? '📅 Elegir mi turno' : '✍️ Quiero inscribirme') + '</button>' : '') +
    '<div style="display:flex;gap:10px;margin-top:8px;">' +
    '<button class="btn-out" style="flex:1;" onclick="window.closeModal()">Cerrar</button>' +
    '<button class="btn-out" style="flex:1;border-color:rgba(232,0,10,.3);color:var(--red);" onclick="window.compartirCurso(\'' + id + '\')">🔗 Compartir</button>' +
    '</div>';
  openModal();
};

// ── INSCRIPCION ───────────────────────────────────────────────────────────────
window.abrirInscripcion = (id) => {
  const c = cursos[id]; if (!c) return;
  const cr = Object.assign({dni:true, edad:true, ig:true, email:false, altura:false, medidas:false}, c.camposReq || {});
  const esSes = c.tipo === 'sesiones';
  const dniField = (!esSes && cr.dni !== false) ? '<input class="finput" id="f-dni" placeholder="DNI *" type="number"/>' : '<input type="hidden" id="f-dni" value="0"/>';
  const edadField = cr.edad !== false ? '<input class="finput" id="f-edad" placeholder="Edad *" type="number" oninput="window.chkMenor()"/>' : '<input type="hidden" id="f-edad" value="18"/>';
  const igField = cr.ig !== false ? '<input class="finput" id="f-ig" placeholder="Instagram (sin @)"/>' : '';
  const emailField = cr.email ? '<input class="finput" id="f-email" placeholder="Email *" type="email"/>' : '';
  const alturaRow = (cr.altura || cr.medidas)
    ? '<div class="frow2" style="gap:8px;margin-bottom:8px;">' + (cr.altura ? '<input class="finput" id="f-altura" placeholder="Altura (ej: 1,62)" style="margin:0;"/>' : '') + (cr.medidas ? '<input class="finput" id="f-medidas" placeholder="Medidas (ej: 78/59/79)" style="margin:0;"/>' : '') + '</div>'
    : '';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">INSCRIPCIÓN</div>' +
    '<div class="msub">' + (c.titulo || '') + (c.fecha ? ' · ' + fFecha(c.fecha) : '') + '</div>' +
    '<div class="mlbl">Datos personales</div>' +
    '<input class="finput" id="f-nom" placeholder="Nombre y apellido *"/>' +
    dniField + edadField + '<input class="finput" id="f-localidad" placeholder="Localidad (opcional)"/>' + igField + emailField + alturaRow +
    '<input class="finput" id="f-wp" placeholder="WhatsApp * ej: 3764123456" type="tel"/>' +
    '<div id="tutor-box" style="display:none;">' +
    '<div class="mlbl" style="color:#f5c842;">⚠️ Menor de edad — Datos del tutor/a</div>' +
    '<div class="tutor-box"><input class="finput" id="f-tnombre" placeholder="Nombre del tutor/a"/><input class="finput" id="f-twp" placeholder="WhatsApp del tutor/a *" type="tel"/></div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--text3);margin:6px 0 14px;">* Campos obligatorios</div>' +
    '<button class="btn-main" onclick="window.confirmarInsc(\'' + id + '\')">✅ Confirmar inscripción</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.chkMenor = () => {
  const edadInput = document.getElementById('f-edad') || document.getElementById('fev-edad');
  const e = parseInt(edadInput?.value) || 0;
  const b = document.getElementById('tutor-box');
  if (b) b.style.display = e > 0 && e < 18 ? 'block' : 'none';
};

window.confirmarInsc = async (id) => {
  const nom = document.getElementById('f-nom')?.value.trim();
  const dni = document.getElementById('f-dni')?.value.trim();
  const edad = parseInt(document.getElementById('f-edad')?.value) || 0;
  const ig = document.getElementById('f-ig')?.value.trim() || '';
  const localidad = document.getElementById('f-localidad')?.value.trim() || '';
  const wp = document.getElementById('f-wp')?.value.trim();
  const tn = document.getElementById('f-tnombre')?.value.trim() || '';
  const twp = document.getElementById('f-twp')?.value.trim() || '';
  if (!nom) { toast('⚠️ El nombre es obligatorio'); return; }
  if (!wp) { toast('⚠️ El número de celular es obligatorio'); return; }
  const c = cursos[id];
  const cr = Object.assign({dni:true, edad:true, ig:true}, c.camposReq || {});
  if (cr.dni !== false && !dni) { toast('⚠️ Completá el DNI'); return; }
  if (cr.edad !== false && !edad) { toast('⚠️ Completá la edad'); return; }
  if (edad < 18 && !twp) { toast('⚠️ Ingresá el WP del tutor'); return; }
  const altura = document.getElementById('f-altura')?.value.trim() || '';
  const medidas = document.getElementById('f-medidas')?.value.trim() || '';
  const email = document.getElementById('f-email')?.value.trim() || '';
  await push(ref(db, 'tomauno/inscripciones'), {
    cursoId: id, cursoTitulo: c.titulo || '',
    nombre: nom, dni: dni || '', edad: edad, ig: ig, wp: wp,
    tutorNombre: tn || null, tutorWp: twp || null,
    localidad: localidad,
    altura: altura, medidas: medidas, email: email,
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}),
    pagos: genPagos(c)
  });
  const waText = [
    '🔴 *NUEVA PRE-INSCRIPCIÓN WEB TOMAUNO*',
    '📚 *Curso:* ' + (c.titulo || '') + (c.fecha ? ' - ' + fFecha(c.fecha) : '') + (c.hora ? ' ' + c.hora : ''),
    '👤 *Nombre:* ' + nom,
    '📄 *DNI:* ' + (dni || '-'),
    '🎂 *Edad:* ' + edad,
  ];
  if (localidad) waText.push('📍 Localidad: ' + localidad);
  if (ig) waText.push('📸 IG: @' + ig);
  if (altura) waText.push('📏 Altura: ' + altura);
  if (medidas) waText.push('📐 Medidas: ' + medidas);
  if (email) waText.push('📧 Email: ' + email);
  waText.push('📱 WP Alumno: ' + wp);
  if (twp) waText.push('👨‍👩‍👧 WP Tutor: ' + twp);
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(waText.join('\n'));
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:12px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">✅</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">¡DATOS REGISTRADOS!</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Tu inscripción fue guardada correctamente.<br/>Al presionar Aceptar se enviarán tus datos al WhatsApp de Javier.</div>' +
    '<button class="btn-main" id="wa-confirm-btn">✅ Aceptar — Enviar a WhatsApp</button>' +
    '</div>';
  document.getElementById('wa-confirm-btn').onclick = () => {
    window.open(window._pendingWaUrl, '_blank');
    closeModal();
    toast('🎉 ¡Listo! Te contactamos pronto');
  };
};

function genPagos(c) {
  if (c.pagoTipo === 'cuotas' && c.meses > 0) {
    const mm = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const n = new Date();
    const montoBase = Number(c.costo) || 0;
    const p = [{label:'Inscripción', estado:'pendiente', monto:montoBase || '', nota:''}];
    for (let i = 0; i < c.meses; i++) {
      const d = new Date(n.getFullYear(), n.getMonth() + i, 1);
      p.push({label: mm[d.getMonth()] + ' ' + d.getFullYear(), estado:'pendiente', monto:montoBase || '', nota:''});
    }
    return p;
  }
  return [{label:'Pago único', estado:'pendiente', monto:Number(c.costo) || '', nota:''}];
}

// ── SESIONES / TURNOS ─────────────────────────────────────────────────────────
window.abrirSesiones = (id) => {
  const c = cursos[id]; if (!c) return;
  const slots = genSlots(c);
  const ocup = Object.values(inscripciones).filter(i => i.cursoId === id && i.turno);
  const libres = slots.filter(s => !ocup.find(i => i.turno === s)).length;
  let html = '<div class="mtitle">ELEGÍ TU TURNO</div>' +
    '<div class="msub">' + (c.titulo || '') + (c.fecha ? ' · ' + fFecha(c.fecha) : '') + ' · <span style="color:#4caf7d;">' + libres + ' disponibles</span></div>' +
    '<div class="slots-grid">';
  slots.forEach(s => {
    const q = ocup.find(i => i.turno === s);
    html += '<div class="slot ' + (q ? 'ocupado' : 'libre') + '" data-id="' + id + '" data-slot="' + s + '" ' + (q ? '' : 'onclick="window.selTurno(this)"') + '>' +
      '<div class="slot-t">' + s + '</div>' +
      '<div class="slot-n">' + (q ? (q.nombre || '').split(' ')[0] : '✓ Libre') + '</div>' +
      '</div>';
  });
  html += '</div><button class="btn-out" style="margin-top:16px;" onclick="window.closeModal()">Cancelar</button>';
  document.getElementById('mcontent').innerHTML = html;
  openModal();
};

window.selTurno = (el) => {
  const id = el.dataset.id;
  const turno = el.dataset.slot;
  const c = cursos[id];
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">RESERVAR TURNO</div>' +
    '<div class="msub">' + (c ? c.titulo : '') + ' · <strong style="color:var(--red);">' + turno + '</strong></div>' +
    '<div class="mlbl">Tus datos</div>' +
    '<input class="finput" id="f-nom" placeholder="Nombre y apellido *"/>' +
    '<div class="frow2">' +
    '<input class="finput" id="f-dni" placeholder="DNI *" type="number"/>' +
    '<input class="finput" id="f-edad" placeholder="Edad *" type="number" oninput="window.chkMenor()"/>' +
    '</div>' +
    '<input class="finput" id="f-ig" placeholder="Instagram (sin @) *"/>' +
    '<input class="finput" id="f-wp" placeholder="WhatsApp * ej: 3764123456" type="tel"/>' +
    '<div id="tutor-box" style="display:none;">' +
    '<div class="mlbl" style="color:#f5c842;">⚠️ Menor de edad</div>' +
    '<div class="tutor-box"><input class="finput" id="f-tnombre" placeholder="Nombre tutor/a"/><input class="finput" id="f-twp" placeholder="WP tutor/a *" type="tel"/></div>' +
    '</div>' +
    '<button class="btn-main" onclick="window.confirmarTurno(\'' + id + '\',\'' + turno + '\')">✅ Confirmar turno ' + turno + '</button>' +
    '<button class="btn-out" onclick="window.abrirSesiones(\'' + id + '\')">← Volver</button>';
};

window.confirmarTurno = async (id, turno) => {
  const nom = document.getElementById('f-nom')?.value.trim();
  const dni = document.getElementById('f-dni')?.value.trim();
  const edad = parseInt(document.getElementById('f-edad')?.value) || 0;
  const ig = document.getElementById('f-ig')?.value.trim();
  const wp = document.getElementById('f-wp')?.value.trim();
  const twp = document.getElementById('f-twp')?.value.trim() || '';
  if (!nom) { toast('⚠️ El nombre es obligatorio'); return; }
  if (!wp) { toast('⚠️ El número de celular es obligatorio'); return; }
  if (!dni || !edad || !ig) { toast('⚠️ Completá todos los campos'); return; }
  if (edad < 18 && !twp) { toast('⚠️ Ingresá el WP del tutor'); return; }
  if (Object.values(inscripciones).find(i => i.cursoId === id && i.turno === turno)) {
    toast('⚠️ Ese turno ya fue tomado, elegí otro');
    abrirSesiones(id);
    return;
  }
  const c = cursos[id];
  await push(ref(db, 'tomauno/inscripciones'), {
    cursoId: id, cursoTitulo: c ? c.titulo : '', nombre: nom, dni, edad, ig, wp,
    tutorWp: twp || null, turno,
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}),
    pagos: [{label:'Pago único', estado:'pendiente', monto:'', nota:''}]
  });
  const tText = [
    '📅 NUEVO TURNO RESERVADO',
    '📸 Sesión: ' + (c ? c.titulo : '') + (c && c.fecha ? ' - ' + fFecha(c.fecha) : ''),
    '⏰ Turno: ' + turno,
    '👤 Nombre: ' + nom,
    '🎂 Edad: ' + edad,
    '📸 IG: @' + ig,
    '📱 WP: ' + wp,
  ];
  if (twp) tText.push('👨‍👩‍👧 WP Tutor: ' + twp);
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(tText.join('\n'));
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:12px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">✅</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">¡TURNO RESERVADO!</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Tu turno quedó registrado correctamente.<br/>Al presionar Aceptar se enviarán tus datos al WhatsApp de Javier.</div>' +
    '<button class="btn-main" id="wa-turno-btn">✅ Aceptar — Enviar a WhatsApp</button>' +
    '</div>';
  document.getElementById('wa-turno-btn').onclick = () => {
    window.open(window._pendingWaUrl, '_blank');
    closeModal();
    toast('🎉 ¡Turno confirmado!');
  };
};

function genSlots(c) {
  const sl = [];
  const [hi, mi] = (c.horaInicio || '09:00').split(':').map(Number);
  const [hf, mf] = (c.horaFin || '22:00').split(':').map(Number);
  const dur = parseInt(c.duracion) || 30;
  const descansos = (c.descansos || '').split(',').map(d => {
    const p = d.trim().split('-');
    if (p.length !== 2) return null;
    const [dhi, dmi] = p[0].trim().split(':').map(Number);
    const [dhf, dmf] = p[1].trim().split(':').map(Number);
    return {ini: dhi*60+(dmi||0), fin: dhf*60+(dmf||0)};
  }).filter(Boolean);
  let cur = hi*60+mi;
  const fin = hf*60+mf;
  while (cur + dur <= fin) {
    const bloqueado = descansos.some(d => cur < d.fin && cur + dur > d.ini);
    if (!bloqueado) {
      const h = String(Math.floor(cur/60)).padStart(2,'0');
      const m = String(cur%60).padStart(2,'0');
      const h2 = String(Math.floor((cur+dur)/60)).padStart(2,'0');
      const m2 = String((cur+dur)%60).padStart(2,'0');
      sl.push(h + ':' + m + '-' + h2 + ':' + m2);
    }
    cur += dur;
  }
  return sl;
}

window.verPlanillaTurnos = (id) => {
  const c = cursos[id]; if (!c) return;
  const slots = genSlots(c);
  const ocup = Object.values(inscripciones).filter(i => i.cursoId === id && i.turno);
  const soloNombres = slots.filter(s => ocup.find(i => i.turno === s)).map(s => {
    const i = ocup.find(x => x.turno === s);
    return i ? i.nombre : '';
  }).filter(Boolean).join('\n');
  const textoCompleto = slots.map(s => {
    const i = ocup.find(x => x.turno === s);
    return i ? (s + ' - ' + i.nombre + (i.wp ? ' (' + i.wp + ')' : '')) : (s + ' - LIBRE');
  }).join('\n');
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:4px;">PLANILLA TURNOS</div>' +
    '<div class="msub" style="margin-bottom:16px;">' + (c.titulo || '') + ' · ' + ocup.length + ' reservados · ' + (slots.length - ocup.length) + ' libres</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">' +
    '<button class="bsm bl" id="btn-cp-full">📋 Copiar planilla</button>' +
    '<button class="bsm bl" id="btn-cp-nom">👤 Solo nombres</button>' +
    '<a rel="noopener noreferrer" href="https://cronometro-two.vercel.app/" target="_blank" class="bsm gr" style="text-decoration:none;">⏱️ Cronómetro</a>' +
    '</div>' +
    '<textarea id="txt-comp" readonly style="width:100%;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;color:var(--text);font-size:12px;font-family:monospace;resize:vertical;min-height:180px;margin-bottom:8px;"></textarea>' +
    '<textarea id="txt-nom" readonly style="width:100%;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;color:var(--text);font-size:12px;font-family:monospace;resize:vertical;min-height:100px;"></textarea>' +
    '<button class="btn-out" onclick="window.closeModal()" style="margin-top:10px;">Cerrar</button>';
  openModal();
  document.getElementById('txt-comp').value = textoCompleto;
  document.getElementById('txt-nom').value = soloNombres;
  document.getElementById('btn-cp-full').onclick = () => navigator.clipboard.writeText(textoCompleto).then(() => toast('📋 Planilla copiada'));
  document.getElementById('btn-cp-nom').onclick = () => navigator.clipboard.writeText(soloNombres).then(() => toast('👤 Nombres copiados'));
};

// ── ADMIN TABS ────────────────────────────────────────────────────────────────
window.setAtab = (tab) => {
  const tabs = ['alumnos','cursos','nuevo','servicios-adm','testimonios-adm','eventos-adm','galeria-adm','agenda-adm','asistente-adm','apps-adm'];
  tabs.forEach(t => {
    const el = document.getElementById('atab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.atab').forEach((b, i) => b.classList.toggle('on', tabs[i] === tab));
  const stats = document.getElementById('atab-stats-vistas');
  if (stats) stats.style.display = tab === 'cursos' ? 'block' : 'none';
};

window.irAAdminTab = (tab) => {
  if (!isAdminNotifier()) return;
  if (document.getElementById('admin-section').style.display === 'none') toggleAdmin(true);
  setAtab(tab);
  setTimeout(()=>document.getElementById('admin-section')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
};

window.irAPlanillaCurso = (cursoId) => {
  if (!cursoId || !isAdminNotifier()) return;
  if (document.getElementById('admin-section').style.display === 'none') toggleAdmin(true);
  setAtab('alumnos');
  setTimeout(()=>{
    const f=document.getElementById('filtro-curso');
    if(f){ f.value=cursoId; renderAlumnos(); }
    document.getElementById('atab-alumnos')?.scrollIntoView({behavior:'smooth',block:'start'});
  },120);
};

window.irAPlanillaEvento = (evId) => {
  if (!evId || !isAdminNotifier()) return;
  if (document.getElementById('admin-section').style.display === 'none') toggleAdmin(true);
  setAtab('eventos-adm');
  setTimeout(()=>window.verPlanillaEventoAdmin && window.verPlanillaEventoAdmin(evId),160);
};

window.toggleTipoConfig = () => {
  const el = document.getElementById('sesiones-config');
  if (el) el.style.display = document.getElementById('nc-tipo')?.value === 'sesiones' ? 'block' : 'none';
};

window.toggleMeses = () => {
  const el = document.getElementById('nc-meses-wrap');
  if (el) el.style.display = document.getElementById('nc-pago-tipo')?.value === 'cuotas' ? 'block' : 'none';
};

// ── AGREGAR CURSO ─────────────────────────────────────────────────────────────
window.agregarCurso = async () => {
  const titulo = document.getElementById('nc-titulo')?.value.trim();
  if (!titulo) { toast('⚠️ El título es obligatorio'); return; }
  const tipo = document.getElementById('nc-tipo')?.value || 'curso';
  const pagoTipo = document.getElementById('nc-pago-tipo')?.value || 'unico';
  await push(ref(db, 'tomauno/cursos'), {
    tipo, titulo,
    desc: document.getElementById('nc-desc')?.value.trim() || '',
    costo: parseInt(document.getElementById('nc-costo')?.value) || 0,
    fecha: document.getElementById('nc-fecha')?.value || '',
    hora: document.getElementById('nc-hora')?.value.trim() || '',
    lugar: document.getElementById('nc-lugar')?.value.trim() || '',
    ig: document.getElementById('nc-ig')?.value.trim() || '',
    wp: document.getElementById('nc-wp')?.value.trim() || '',
    cupos: parseInt(document.getElementById('nc-cupos')?.value) || 0,
    pagoTipo,
    meses: pagoTipo === 'cuotas' ? (parseInt(document.getElementById('nc-meses')?.value) || 0) : 0,
    icon: document.getElementById('nc-icon')?.value.trim() || '📷',
    img: document.getElementById('nc-img')?.value.trim() || '',
    extraText: document.getElementById('nc-extra-text')?.value.trim() || '',
    extraUrl: document.getElementById('nc-extra-url')?.value.trim() || '',
    horaInicio: document.getElementById('nc-h-ini')?.value || '09:00',
    horaFin: document.getElementById('nc-h-fin')?.value || '22:00',
    descansos: document.getElementById('nc-descansos')?.value.trim() || '',
    duracion: parseInt(document.getElementById('nc-dur')?.value) || 30,
    grupoWA: document.getElementById('nc-grupo-wa')?.value.trim() || '',
    camposReq: {
      dni: document.getElementById('nc-req-dni')?.checked ?? true,
      edad: document.getElementById('nc-req-edad')?.checked ?? true,
      ig: document.getElementById('nc-req-ig')?.checked ?? true,
      email: document.getElementById('nc-req-email')?.checked ?? false,
      altura: document.getElementById('nc-req-altura')?.checked ?? false,
      medidas: document.getElementById('nc-req-medidas')?.checked ?? false,
    },
    finalizado: false, oculto: false, creado: Date.now()
  });
  ['nc-titulo','nc-desc','nc-costo','nc-cupos','nc-fecha','nc-hora','nc-lugar','nc-ig','nc-wp','nc-img','nc-extra-text','nc-extra-url','nc-meses','nc-grupo-wa','nc-icon','nc-descansos'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  toast('✅ Curso publicado');
  setAtab('cursos');
};

window.editCurso = (id) => {
  const c = cursos[id]; if (!c) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR CURSO</div>' +
    '<div class="msub" style="margin-bottom:16px;">Modificá los datos y guardá</div>' +
    '<label class="flbl">Título</label>' +
    '<input class="finput" id="ec-titulo" value="' + (c.titulo || '').replace(/"/g, '&quot;') + '"/>' +
    '<label class="flbl">Descripción</label>' +
    '<textarea class="finput" id="ec-desc" rows="5">' + (c.desc || '') + '</textarea>' +
    '<div class="frow2">' +
    '<div><label class="flbl">Costo ($)</label><input class="finput" id="ec-costo" type="number" value="' + (c.costo || '') + '"/></div>' +
    '<div><label class="flbl">Cupos (0=ilimitado)</label><input class="finput" id="ec-cupos" type="number" value="' + (c.cupos || 0) + '"/></div>' +
    '</div>' +
    '<div class="frow2">' +
    '<div><label class="flbl">Fecha</label><input class="finput" id="ec-fecha" type="date" value="' + (c.fecha || '') + '" style="color-scheme:dark"/></div>' +
    '<div><label class="flbl">Hora</label><input class="finput" id="ec-hora" value="' + (c.hora || '') + '"/></div>' +
    '</div>' +
    '<label class="flbl">Lugar</label>' +
    '<input class="finput" id="ec-lugar" value="' + (c.lugar || '').replace(/"/g, '&quot;') + '"/>' +
    '<div class="frow2">' +
    '<div><label class="flbl">Instagram (sin @)</label><input class="finput" id="ec-ig" value="' + (c.ig || '') + '"/></div>' +
    '<div><label class="flbl">WhatsApp consultas</label><input class="finput" id="ec-wp" value="' + (c.wp || '') + '"/></div>' +
    '</div>' +
    '<label class="flbl">URL imagen del flyer</label>' +
    '<input class="finput" id="ec-img" value="' + (c.img || '') + '" placeholder="https://i.imgur.com/..."/>' +
    '<div class="frow2"><div><label class="flbl">Texto link extra</label><input class="finput" id="ec-extra-text" value="' + (c.extraText || '').replace(/"/g, '&quot;') + '" placeholder="Ver más info"/></div><div><label class="flbl">URL link extra</label><input class="finput" id="ec-extra-url" value="' + (c.extraUrl || '').replace(/"/g, '&quot;') + '" placeholder="https://..."/></div></div>' +
    '<label class="flbl">Link grupo WhatsApp</label>' +
    '<input class="finput" id="ec-gwa" value="' + (c.grupoWA || '') + '" placeholder="https://chat.whatsapp.com/..."/>' +
    '<label class="flbl">Tipo de pago</label>' +
    '<select class="finput" id="ec-pago-tipo">' +
    '<option value="unico" ' + ((c.pagoTipo || 'unico') === 'unico' ? 'selected' : '') + '>Pago único</option>' +
    '<option value="cuotas" ' + (c.pagoTipo === 'cuotas' ? 'selected' : '') + '>Inscripción + cuotas</option>' +
    '</select>' +
    '<label class="flbl">Duración en meses (solo si cuotas)</label>' +
    '<input class="finput" id="ec-meses" type="number" value="' + (c.meses || 0) + '" placeholder="0"/>' +
    '<button class="btn-main" onclick="window.guardarEdit(\'' + id + '\')">💾 Guardar cambios</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarEdit = async (id) => {
  const titulo = document.getElementById('ec-titulo')?.value.trim();
  if (!titulo) { toast('⚠️ El título es obligatorio'); return; }
  await update(ref(db, 'tomauno/cursos/' + id), {
    titulo,
    desc: document.getElementById('ec-desc')?.value.trim() || '',
    costo: parseInt(document.getElementById('ec-costo')?.value) || 0,
    cupos: parseInt(document.getElementById('ec-cupos')?.value) || 0,
    fecha: document.getElementById('ec-fecha')?.value || '',
    hora: document.getElementById('ec-hora')?.value.trim() || '',
    lugar: document.getElementById('ec-lugar')?.value.trim() || '',
    ig: document.getElementById('ec-ig')?.value.trim() || '',
    wp: document.getElementById('ec-wp')?.value.trim() || '',
    img: document.getElementById('ec-img')?.value.trim() || '',
    extraText: document.getElementById('ec-extra-text')?.value.trim() || '',
    extraUrl: document.getElementById('ec-extra-url')?.value.trim() || '',
    grupoWA: document.getElementById('ec-gwa')?.value.trim() || '',
    pagoTipo: document.getElementById('ec-pago-tipo')?.value || 'unico',
    meses: parseInt(document.getElementById('ec-meses')?.value) || 0,
  });
  closeModal();
  toast('✅ Curso actualizado');
};

function renderAdminCursos() {
  const w = document.getElementById('admin-cursos-list'); if (!w) return;
  const lista = Object.entries(cursos).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin cursos</div>'; return; }
  const inscPorCurso = {};
  Object.values(inscripciones).forEach(i => {
    if (i.cursoId) inscPorCurso[i.cursoId] = (inscPorCurso[i.cursoId] || 0) + 1;
  });
  w.innerHTML = lista.map(([k, c], idx) => {
    const n = inscPorCurso[k] || 0;
    return '<div class="admin-ci">' +
      '<div class="admin-ci-info">' +
      '<div class="admin-ci-tit" style="' + (c.finalizado ? 'text-decoration:line-through;opacity:.4' : '') + '"><span style="color:var(--text3);font-size:12px;font-weight:700;margin-right:6px;">#' + (idx+1) + '</span>' + (c.titulo || 'Sin título') + '</div>' +
      '<div class="admin-ci-sub">' + (c.fecha ? fFecha(c.fecha) : 'Sin fecha') + ' · ' + n + ' inscripto' + (n !== 1 ? 's' : '') + ' · ' + (c.oculto ? '🙈 Oculto' : '👁️ Visible') + (c.grupoWA ? ' · <a rel="noopener noreferrer" href="' + c.grupoWA + '" target="_blank" style="color:#25d366;text-decoration:none;">💬 Grupo WA</a>' : '') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
      '<button class="bsm bl" onclick="window.verAlumnosCurso(\'' + k + '\')">'
      + '👥 ' + n + ' Alumnos</button>' +
      '<button class="bsm gr" onclick="window.editCurso(\'' + k + '\')">✏️ Editar</button>' +
      (c.tipo === 'sesiones' ? '<button class="bsm bl" onclick="window.verPlanillaTurnos(\'' + k + '\')">📋 Turnos</button>' : '') +
      '<button class="bsm bl" onclick="window.copiarLinkCurso(\'' + k + '\')">🔗 Link</button>' +
      '<button class="bsm ' + (c.finalizado ? 'gr' : 'bl') + '" onclick="window.togFin(\'' + k + '\',' + !c.finalizado + ')">' + (c.finalizado ? '✅ Reactivar' : '🏁 Finalizar') + '</button>' +
      '<button class="bsm ' + (c.oculto ? 'gr' : 'bl') + '" onclick="window.togOc(\'' + k + '\',' + !c.oculto + ')">' + (c.oculto ? '👁️ Mostrar' : '🙈 Ocultar') + '</button>' +
      '<button class="bsm re" onclick="window.delCurso(\'' + k + '\')">🗑️</button>' +
      '</div></div>';
  }).join('');
}

window.verAlumnosCurso = (id) => {
  setAtab('alumnos');
  setTimeout(() => {
    const sel = document.getElementById('filtro-curso');
    if (sel) sel.value = id;
    renderAlumnos();
    const panel = document.getElementById('atab-alumnos');
    if (panel) panel.scrollIntoView({behavior:'smooth', block:'start'});
  }, 60);
};

window.togFin = async (id, v) => { await update(ref(db, 'tomauno/cursos/' + id), {finalizado: v}); };
window.togOc = async (id, v) => { await update(ref(db, 'tomauno/cursos/' + id), {oculto: v}); };
window.delCurso = async (id) => {
  showConfirm('¿Eliminar este curso permanentemente?', async () => {
    await remove(ref(db, 'tomauno/cursos/' + id));
    toast('🗑️ Curso eliminado');
  });
};

window.copiarLinkCurso = (id) => {
  const url = window.location.origin + window.location.pathname + '#curso-' + id;
  navigator.clipboard.writeText(url).then(() => toast('🔗 Link copiado'));
};

window.compartirCurso = (id) => {
  const url = window.location.origin + window.location.pathname + '#curso-' + id;
  navigator.clipboard.writeText(url).then(() => {
    toast('🔗 Link copiado — compartilo donde quieras');
  });
};

// ── ALUMNOS ───────────────────────────────────────────────────────────────────
function renderFiltros() {
  const s = document.getElementById('filtro-curso'); if (!s) return;
  const cur = s.value;
  s.innerHTML = '<option value="">Todos los cursos</option>' +
    Object.entries(cursos).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0))
      .map(([k, c]) => '<option value="' + k + '" ' + (k === cur ? 'selected' : '') + '>' + (c.titulo || k) + '</option>').join('');
  // También el select de testimonios
  const st = document.getElementById('nt-curso'); if (!st) return;
  st.innerHTML = '<option value="">Sin curso específico</option>' +
    Object.entries(cursos).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0))
      .map(([k, c]) => '<option value="' + (c.titulo || k) + '">' + (c.titulo || k) + '</option>').join('');
}

function escHtml(v) {
  return String(v ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
}

function safeUrl(v) {
  const raw = String(v || '').trim();
  if (!raw) return '#';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw.replace(/"/g, '%22');
  return 'https://' + raw.replace(/"/g, '%22');
}

function getPagoAlumnoInfo(i, cur) {
  const pagos = i.pagos || [{label:'Pago único', estado:'pendiente', monto:(cur && cur.costo) ? Number(cur.costo) : ''}];
  const pagadas = pagos.filter(p => p.estado === 'pagado').length;
  const parciales = pagos.filter(p => p.estado === 'parcial').length;
  const pendientes = pagos.filter(p => p.estado === 'pendiente').length;
  let monto = pagos.reduce((acc,p) => acc + ((p.estado === 'pagado' || p.estado === 'parcial') ? (parseFloat(String(p.monto||'').replace(',','.')) || 0) : 0), 0);
  if (!monto && pagadas > 0 && cur && cur.costo) monto = Number(cur.costo) || 0;
  const estado = pagadas ? 'pagado' : parciales ? 'parcial' : 'pendiente';
  return {pagos,pagadas,parciales,pendientes,monto,estado};
}

function getAlumnosFiltrados() {
  const filtro = document.getElementById('filtro-curso')?.value || '';
  const q = (document.getElementById('admin-person-search')?.value || '').toLowerCase().trim();
  let lista = Object.entries(inscripciones).sort((a, b) => ((b[1].creado || 0) - (a[1].creado || 0)));
  if (filtro) lista = lista.filter(([, i]) => i.cursoId === filtro);
  if (q) lista = lista.filter(([,i]) => {
    const cur = cursos[i.cursoId] || {};
    const hay = [i.nombre,i.dni,i.edad,i.ig,i.wp,i.tutorWp,i.localidad,i.cursoTitulo,cur.titulo,i.turno].join(' ').toLowerCase();
    return hay.includes(q);
  });
  return {filtro, lista};
}

function matchTextAdmin(parts, q){ return parts.map(v => String(v || '')).join(' ').toLowerCase().includes(q); }
function adminWpLink(wp){ const n = String(wp||'').replace(/\D/g,''); return n ? '<a class="wabtn" target="_blank" rel="noopener noreferrer" href="https://wa.me/549'+n+'">'+escHtml(wp)+'</a>' : '<span class="tds">-</span>'; }
function adminIgLink(ig){ const v = String(ig||'').replace('@','').trim(); return v ? '<a class="ig-link" target="_blank" rel="noopener noreferrer" href="https://instagram.com/'+escAttr(v)+'">@'+escHtml(v)+'</a>' : '<span class="tds">-</span>'; }
window.limpiarBusquedaAdmin = () => {
  const inp = document.getElementById('admin-person-search'); if(inp) inp.value = '';
  const box = document.getElementById('admin-search-results'); if(box){ box.classList.remove('on'); box.innerHTML=''; }
  renderAlumnos();
};
window.buscarPersonasAdmin = () => {
  renderAlumnos();
  const q = (document.getElementById('admin-person-search')?.value || '').toLowerCase().trim();
  const box = document.getElementById('admin-search-results'); if(!box) return;
  if(!q){ box.classList.remove('on'); box.innerHTML=''; return; }
  const rows = [];
  Object.entries(inscripciones || {}).forEach(([id,i]) => {
    const cur = cursos[i.cursoId] || {};
    const titulo = i.cursoTitulo || cur.titulo || 'Curso';
    if(matchTextAdmin([i.nombre,i.dni,i.wp,i.ig,i.localidad,titulo,i.turno], q)) rows.push({tipo:'Curso', nombre:i.nombre, ref:titulo, extra:(i.turno?'⏰ '+i.turno+' · ':'')+(i.fecha||''), wp:i.wp, ig:i.ig, action:'window.verAlumnosCurso && window.verAlumnosCurso(\''+(i.cursoId||'')+'\')'});
  });
  Object.entries(servicioRegsDB || {}).forEach(([id,i]) => {
    const srv = serviciosDB[i.servicioId] || {};
    const titulo = i.servicioTitulo || srv.titulo || 'Servicio';
    if(matchTextAdmin([i.nombre,i.dni,i.wp,i.ig,i.localidad,titulo,i.turno], q)) rows.push({tipo:'Servicio', nombre:i.nombre, ref:titulo, extra:(i.turno?'⏰ '+i.turno+' · ':'')+(i.fecha||''), wp:i.wp, ig:i.ig, action:'window.abrirServicioDB && window.abrirServicioDB(\''+(i.servicioId||'')+'\')'});
  });
  Object.entries(evInscDB || {}).forEach(([id,i]) => {
    const ev = eventosDB[i.evId] || {};
    const titulo = i.evTitulo || ev.titulo || 'Evento';
    if(matchTextAdmin([i.nombre,i.dni,i.wp,i.ig,i.localidad,titulo,i.turno], q)) rows.push({tipo:'Evento', nombre:i.nombre, ref:titulo, extra:(i.turno?'⏰ '+i.turno+' · ':'')+(i.fecha||''), wp:i.wp, ig:i.ig, action:'window.verInscEventoAdmin && window.verInscEventoAdmin(\''+(i.evId||'')+'\')'});
  });
  const shown = rows.slice(0,30);
  box.classList.add('on');
  box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;"><div style="font-size:12px;color:var(--text2);font-weight:800;">Resultados rápidos: '+rows.length+'</div><div style="font-size:10px;color:var(--text3);">Cursos · servicios · eventos</div></div>' +
    (shown.length ? shown.map(r => '<div class="admin-result-row"><div class="admin-result-type">'+escHtml(r.tipo)+'</div><div><div class="admin-result-main">'+escHtml(r.nombre||'-')+'</div><div class="admin-result-sub">'+adminIgLink(r.ig)+'</div></div><div class="admin-result-sub" title="'+escAttr(r.ref)+'">'+escHtml(r.ref)+'</div><div class="admin-result-sub">'+escHtml(r.extra||'')+'</div><div style="display:flex;gap:6px;align-items:center;justify-content:flex-end;">'+adminWpLink(r.wp)+'<button class="bsm bl" onclick="'+r.action+'">Abrir</button></div></div>').join('') : '<div style="color:var(--text3);font-size:13px;padding:14px;text-align:center;">Sin coincidencias</div>');
};

window.renderAlumnos = () => {
  const tb = document.getElementById('alumnos-tbody'); if (!tb) return;
  const table = tb.closest('table');
  const thead = table?.querySelector('thead');
  const {filtro, lista} = getAlumnosFiltrados();
  const cursoSeleccionado = filtro && cursos[filtro] ? cursos[filtro] : null;
  const mostrarCurso = !filtro;

  if (table) {
    table.classList.add('planilla-table');
    table.classList.toggle('no-course', !mostrarCurso);
  }
  if (thead) {
    thead.innerHTML = '<tr>' +
      '<th>#</th><th>NOMBRE</th><th>EDAD</th><th>DNI</th>' +
      (mostrarCurso ? '<th>CURSO</th>' : '') +
      '<th>INSTAGRAM</th><th>WP ALUMNO</th><th>WP TUTOR</th><th>PAGO</th><th>ACC.</th>' +
      '</tr>';
  }

  const totalMonto = lista.reduce((acc, [,i]) => acc + getPagoAlumnoInfo(i, cursos[i.cursoId]).monto, 0);
  const conPago = lista.filter(([,i]) => getPagoAlumnoInfo(i, cursos[i.cursoId]).estado === 'pagado').length;
  const parcial = lista.filter(([,i]) => getPagoAlumnoInfo(i, cursos[i.cursoId]).estado === 'parcial').length;
  const pendientesPersonas = lista.filter(([,i]) => getPagoAlumnoInfo(i, cursos[i.cursoId]).estado === 'pendiente').length;
  const statEl = document.getElementById('alumnos-stats');
  if (statEl) statEl.innerHTML =
    (cursoSeleccionado ? '<div class="planilla-title">' + escHtml(cursoSeleccionado.titulo || 'Curso seleccionado') + '</div>' : '<div class="planilla-title">PLANILLA <em>GENERAL</em></div>') +
    '<div class="admin-metrics" style="width:100%;margin:0;">' +
      '<div class="admin-metric"><div class="admin-metric-n">' + lista.length + '</div><div class="admin-metric-l">Inscriptos</div></div>' +
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#4caf7d;">' + conPago + '</div><div class="admin-metric-l">Con pago</div></div>' +
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#f5c842;">' + parcial + '</div><div class="admin-metric-l">Parciales</div></div>' +
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#e05252;">' + pendientesPersonas + '</div><div class="admin-metric-l">Pendientes</div></div>' +
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#4caf7d;">$ ' + totalMonto.toLocaleString('es-AR') + '</div><div class="admin-metric-l">Total registrado</div></div>' +
    '</div>';

  if (!lista.length) {
    tb.innerHTML = '<tr><td colspan="' + (mostrarCurso ? 10 : 9) + '" style="text-align:center;padding:40px;color:var(--text3);">Sin inscripciones para este filtro</td></tr>';
    return;
  }

  tb.innerHTML = lista.map(([k, i], idx) => {
    const cur = cursos[i.cursoId];
    const cursoNombre = i.cursoTitulo || (cur ? cur.titulo : '') || 'Sin curso';
    const pinfo = getPagoAlumnoInfo(i, cur);
    const estadoClass = pinfo.estado === 'pagado' ? 'pay-ok' : pinfo.estado === 'parcial' ? 'pay-pa' : 'pay-pe';
    const estadoTxt = pinfo.estado === 'pagado' ? 'Con pagos' : pinfo.estado === 'parcial' ? 'Parcial' : 'Pendiente';
    const resumenPagos = '✅ ' + pinfo.pagadas + ' · ⚡ ' + pinfo.parciales + ' · ⏳ ' + pinfo.pendientes + (pinfo.monto ? ' · $ ' + pinfo.monto.toLocaleString('es-AR') : '');
    const waText = 'Hola ' + (i.nombre||'').split(' ')[0] + '! Te escribimos de Tomauno para confirmarte tu pre-inscripción a ' + cursoNombre + '. En breve nos comunicamos con los detalles. Muchas gracias!';
    const waLink = 'https://wa.me/549' + (i.wp||'').replace(/\D/g,'') + '?text=' + waEncode(waText);
    return '<tr>' +
      '<td class="row-index">' + (idx+1) + '</td>' +
      '<td title="' + escHtml(i.nombre||'') + '"><div class="student-name">' + escHtml(i.nombre||'-') + '</div><div class="student-sub">' + escHtml(i.fecha||'') + (i.hora?' · '+escHtml(i.hora):'') + '</div>' + (i.turno ? '<div class="student-sub" style="color:var(--red);">⏰ '+escHtml(i.turno)+'</div>' : '') + '</td>' +
      '<td>' + escHtml(i.edad||'-') + '</td>' +
      '<td>' + escHtml(i.dni||'-') + '</td>' +
      (mostrarCurso ? '<td><div class="course-cell" title="' + escHtml(cursoNombre) + '">' + escHtml(cursoNombre) + '</div></td>' : '') +
      '<td>' + (i.ig ? '<a rel="noopener noreferrer" href="https://instagram.com/'+escHtml(i.ig.replace('@',''))+'" target="_blank" class="ig-link">@'+escHtml(i.ig.replace('@',''))+'</a>' : '<span class="tds">-</span>') + '</td>' +
      '<td><a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp||'').replace(/\D/g,'') + '" target="_blank" class="wabtn">' + escHtml(i.wp||'-') + '</a></td>' +
      '<td>' + (i.tutorWp ? '<a rel="noopener noreferrer" href="https://wa.me/549'+i.tutorWp.replace(/\D/g,'')+'" target="_blank" class="wabtn" style="font-size:10px;">'+escHtml(i.tutorWp)+'</a>' : '<span class="tds">-</span>') + '</td>' +
      '<td><div class="pay-summary"><span class="pay-pill ' + estadoClass + '">' + estadoTxt + '</span><span class="pay-summary-text" title="' + escHtml(resumenPagos) + '">' + escHtml(resumenPagos) + '</span><button class="pay-chip-btn" onclick="window.abrirPagosAlumno(\'' + k + '\')">Pagos</button></div></td>' +
      '<td><div class="action-mini"><a rel="noopener noreferrer" href="' + waLink + '" target="_blank" class="bsm gr" style="text-decoration:none;">WA</a><button class="bsm bl" onclick="window.enviarTicketPagoAlumno(\'' + k + '\')">Ticket</button><button class="bsm re" onclick="window.delInsc(\'' + k + '\')">✕</button></div></td>' +
      '</tr>';
  }).join('') +
  '<tr style="background:#0d0d0d;border-top:2px solid var(--red);"><td colspan="' + (mostrarCurso ? 10 : 9) + '" style="padding:12px;font-size:12px;color:var(--text2);font-weight:700;white-space:normal;">📊 ' + (cursoSeleccionado ? escHtml(cursoSeleccionado.titulo || '') + ' · ' : '') + 'Total: ' + lista.length + ' · ✅ Con pago: ' + conPago + ' · ⚡ Parciales: ' + parcial + ' · ⏳ Pendientes: ' + pendientesPersonas + ' · 💰 Total registrado: $ ' + totalMonto.toLocaleString('es-AR') + '</td></tr>';
};

window.abrirPagosAlumno = (id) => {
  const i = inscripciones[id]; if (!i) return;
  const cur = cursos[i.cursoId];
  const pinfo = getPagoAlumnoInfo(i, cur);
  const montoDefault = Number(cur?.costo || 0) || '';
  const pagos = pinfo.pagos.map(p => ({...p, monto: (p.monto === undefined || p.monto === null || p.monto === '') ? montoDefault : p.monto}));
  if (JSON.stringify(pagos) !== JSON.stringify(i.pagos || [])) { update(ref(db, 'tomauno/inscripciones/' + id), {pagos}).catch(()=>{}); }
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">PAGOS</div>' +
    '<div class="msub" style="margin-bottom:16px;">' + escHtml(i.nombre||'Alumno') + ' · ' + escHtml(i.cursoTitulo || cur?.titulo || '') + '</div>' +
    '<div style="display:grid;gap:10px;">' +
    pagos.map((p, idx) => {
      const clr = p.estado==='pagado'?'#4caf7d':p.estado==='parcial'?'#f5c842':'#e05252';
      return '<div style="display:grid;grid-template-columns:1fr 120px 120px;gap:8px;align-items:center;background:#0d0d0d;border:1px solid var(--border);border-radius:12px;padding:10px;">' +
        '<div><div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.label||'Pago') + '</div><div style="font-size:10px;color:var(--text3);margin-top:2px;">Cuota / concepto</div></div>' +
        '<select class="mini-input" style="color:' + clr + ';font-weight:800;" onchange="window.updPago(\'' + id + '\',' + idx + ',this.value)">' +
          '<option value="pendiente" ' + (p.estado==='pendiente'?'selected':'') + '>Pendiente</option>' +
          '<option value="parcial" ' + (p.estado==='parcial'?'selected':'') + '>Parcial</option>' +
          '<option value="pagado" ' + (p.estado==='pagado'?'selected':'') + '>Pagado</option>' +
        '</select>' +
        '<input class="mini-input" type="number" value="' + escHtml((p.monto === undefined || p.monto === null || p.monto === '') ? montoDefault : p.monto) + '" placeholder="Monto" onchange="window.updMontoPagoAlumno(\'' + id + '\',' + idx + ',this.value)" />' +
      '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn-out" style="flex:1;" onclick="window.addCuota(\'' + id + '\')">+ Agregar cuota</button><button class="btn-main" style="flex:1;" onclick="window.closeModal()">Listo</button></div>';
  openModal();
};

window.updMontoPagoAlumno = async (id, idx, monto) => {
  const insc = inscripciones[id]; if (!insc) return;
  const pagos = [...(insc.pagos || [])];
  pagos[idx] = {...pagos[idx], monto};
  await update(ref(db, 'tomauno/inscripciones/' + id), {pagos});
  toast('💰 Monto actualizado');
};

window.updPago = async (id, idx, estado) => {
  const insc = inscripciones[id]; if (!insc) return;
  const cur = cursos[insc.cursoId];
  const pagos = [...(insc.pagos || [])];
  const montoDefault = Number(cur?.costo || 0) || '';
  pagos[idx] = {...pagos[idx], estado, monto: (pagos[idx].monto === undefined || pagos[idx].monto === null || pagos[idx].monto === '') ? montoDefault : pagos[idx].monto, fechaPago: (estado === 'pagado' || estado === 'parcial') ? (pagos[idx].fechaPago || new Date().toLocaleDateString('es-AR')) : (pagos[idx].fechaPago || '')};
  await update(ref(db, 'tomauno/inscripciones/' + id), {pagos});
  toast('💰 Pago actualizado');
};


window.enviarTicketPagoAlumno = (id) => {
  const i = inscripciones[id]; if (!i) return;
  const cur = cursos[i.cursoId];
  const cursoNombre = i.cursoTitulo || cur?.titulo || 'Curso';
  const pagos = i.pagos || [];
  const total = pagos.reduce((acc,p) => acc + ((p.estado === 'pagado' || p.estado === 'parcial') ? (parseFloat(String(p.monto||'').replace(',','.')) || 0) : 0), 0);
  const detalle = pagos.map((p, idx) => {
    const icon = p.estado === 'pagado' ? '✅' : p.estado === 'parcial' ? '⚡' : '⏳';
    const monto = p.monto ? ('$ ' + Number(String(p.monto).replace(',','.')).toLocaleString('es-AR')) : '$ 0';
    const fecha = p.fechaPago ? (' · ' + p.fechaPago) : '';
    return icon + ' ' + (p.label || ('Pago ' + (idx+1))) + ': ' + estadoPagoTxt(p.estado) + ' · ' + monto + fecha;
  }).join('\n');
  const msg = '*Historial de pagos - Tomauno*\n\n' +
    'Alumno/a: ' + (i.nombre || '-') + '\n' +
    'Curso: ' + cursoNombre + '\n' +
    'DNI: ' + (i.dni || '-') + '\n\n' +
    '*Pagos registrados:*\n' + (detalle || 'Sin pagos registrados') + '\n\n' +
    'Total abonado/registrado: $ ' + total.toLocaleString('es-AR') + '\n\n' +
    'Gracias por formar parte de Tomauno.';
  const wp = (i.wp || '').replace(/\D/g,'');
  const rows = pagos.map((p, idx) => ({
    label: p.label || ('Pago ' + (idx+1)),
    estado: estadoPagoTxt(p.estado),
    monto: p.monto ? ('$ ' + Number(String(p.monto).replace(',','.')).toLocaleString('es-AR')) : '$ 0',
    fecha: p.fechaPago || '-'
  }));
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:8px;">TICKET DE PAGOS</div>' +
    '<div class="msub" style="margin-bottom:16px;">' + escHtml(i.nombre || '-') + ' · ' + escHtml(cursoNombre) + '</div>' +
    '<div style="background:#fff;border-radius:14px;padding:12px;overflow:auto;"><canvas id="ticket-canvas" width="900" height="1200" style="width:100%;max-width:520px;display:block;margin:0 auto;border-radius:10px;"></canvas></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
    '<button class="btn-main" style="flex:1;min-width:170px;margin-top:0;" onclick="window.descargarTicketPNG()">Descargar PNG</button>' +
    '<button class="btn-out" style="flex:1;min-width:150px;margin-top:0;" onclick="navigator.clipboard.writeText(window._ticketText||\'\').then(()=>toast(\'Ticket copiado\',true))">Copiar texto</button>' +
    (wp ? '<a class="btn-out" style="flex:1;min-width:150px;margin-top:0;text-decoration:none;text-align:center;" target="_blank" rel="noopener noreferrer" href="https://wa.me/549' + wp + '?text=' + waEncode(msg) + '">Enviar WA</a>' : '') +
    '</div>' +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
  window._ticketText = msg;
  setTimeout(()=>drawTicketCanvas({alumno:i.nombre||'-', curso:cursoNombre, dni:i.dni||'-', wp:i.wp||'-', total, rows}), 50);
};

function drawTicketCanvas(data){
  const c=document.getElementById('ticket-canvas'); if(!c) return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,220);grad.addColorStop(0,'#050505');grad.addColorStop(1,'#b5000a');ctx.fillStyle=grad;ctx.fillRect(0,0,W,190);
  ctx.fillStyle='#e8000a';ctx.beginPath();ctx.arc(770,0,210,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(875,1120,300,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e8000a';ctx.beginPath();ctx.arc(760,1210,260,0,Math.PI*2);ctx.fill();
  ctx.font='900 54px Arial';ctx.fillStyle='#fff';ctx.fillText('TOMA',50,82);ctx.fillStyle='#ff151f';ctx.fillText('UNO',220,82);
  ctx.font='700 18px Arial';ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText('Cursos & Capacitaciones',52,116);
  ctx.font='900 42px Arial';ctx.fillStyle='#fff';ctx.textAlign='right';ctx.fillText('TICKET DE PAGOS',850,104);ctx.textAlign='left';
  ctx.fillStyle='#f7f7f7';ctx.fillRect(50,230,800,185);
  ctx.strokeStyle='#ddd';ctx.strokeRect(50,230,800,185);
  ctx.font='700 18px Arial';ctx.fillStyle='#777';ctx.fillText('ALUMNO/A',75,265);ctx.fillText('CURSO',75,330);ctx.fillText('DNI',555,265);ctx.fillText('WHATSAPP',555,330);
  ctx.font='900 27px Arial';ctx.fillStyle='#111';ctx.fillText(String(data.alumno).slice(0,28),75,298);ctx.font='800 24px Arial';ctx.fillText(String(data.curso).slice(0,34),75,363);
  ctx.font='800 24px Arial';ctx.fillText(String(data.dni),555,298);ctx.fillText(String(data.wp),555,363);
  let y=485;
  ctx.fillStyle='#e8000a';ctx.fillRect(50,y-45,800,42);
  ctx.font='900 18px Arial';ctx.fillStyle='#fff';ctx.fillText('CONCEPTO',72,y-18);ctx.fillText('ESTADO',410,y-18);ctx.fillText('FECHA',570,y-18);ctx.fillText('MONTO',735,y-18);
  ctx.font='700 18px Arial';
  data.rows.forEach((r,idx)=>{ctx.fillStyle=idx%2?'#fff':'#f3f3f3';ctx.fillRect(50,y,800,52);ctx.strokeStyle='#e1e1e1';ctx.strokeRect(50,y,800,52);ctx.fillStyle='#222';ctx.fillText(String(r.label).slice(0,28),72,y+33);ctx.fillStyle=r.estado==='Pagado'?'#078b42':r.estado==='Parcial'?'#c09000':'#b5000a';ctx.fillText(r.estado,410,y+33);ctx.fillStyle='#222';ctx.fillText(r.fecha,570,y+33);ctx.textAlign='right';ctx.fillText(r.monto,825,y+33);ctx.textAlign='left';y+=52;});
  ctx.fillStyle='#111';ctx.fillRect(520,940,330,78);ctx.font='800 22px Arial';ctx.fillStyle='#fff';ctx.fillText('TOTAL REGISTRADO',545,972);ctx.font='900 34px Arial';ctx.fillStyle='#ff151f';ctx.textAlign='right';ctx.fillText('$ '+Number(data.total||0).toLocaleString('es-AR'),825,1005);ctx.textAlign='left';
  ctx.font='700 18px Arial';ctx.fillStyle='#555';ctx.fillText('Gracias por formar parte de Tomauno.',60,1025);ctx.fillText('Pedro Méndez 2069 · Posadas · @tomaunomodels · 3764354522',60,1060);
}

window.descargarTicketPNG = () => {
  const c=document.getElementById('ticket-canvas'); if(!c) return;
  const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download='ticket_pagos_tomauno.png'; a.click();
};

function estadoPagoTxt(e){ return e === 'pagado' ? 'Pagado' : e === 'parcial' ? 'Parcial' : 'Pendiente'; }

window.addCuota = (id) => {
  showPrompt('Nombre de la cuota (ej: Mayo 2026):', async (label) => {
    if (!label) return;
    const insc = inscripciones[id]; if (!insc) return;
    const cur = cursos[insc.cursoId];
    const pagos = [...(insc.pagos || []), {label, estado:'pendiente', monto:(cur && cur.costo) ? Number(cur.costo) : '', nota:''}];
    await update(ref(db, 'tomauno/inscripciones/' + id), {pagos});
    toast('✅ Cuota agregada');
  });
};

window.delInsc = async (id) => {
  showConfirm('¿Eliminar esta inscripción?', async () => {
    await remove(ref(db, 'tomauno/inscripciones/' + id));
    toast('🗑️ Inscripción eliminada');
  });
};

// ── GRUPO WA ──────────────────────────────────────────────────────────────────
window.abrirGrupoWA = () => {
  const f = document.getElementById('filtro-curso')?.value;
  if (!f) { toast('Seleccioná un curso primero'); return; }
  const c = cursos[f];
  const lista = Object.values(inscripciones).filter(i => i.cursoId === f);
  if (!lista.length) { toast('Sin inscriptos en ese curso'); return; }
  let html = '<div class="mtitle" style="margin-bottom:12px;">💬 GRUPO WHATSAPP</div>' +
    '<div class="msub">' + (c ? c.titulo : '') + ' · ' + lista.length + ' inscriptos</div>';
  if (c && c.grupoWA) {
    html += '<a rel="noopener noreferrer" href="' + c.grupoWA + '" target="_blank" class="btn-main" style="text-decoration:none;background:#25d366;margin-top:16px;">💬 Abrir/compartir link del grupo</a>' +
      '<div style="margin:20px 0 8px;font-size:12px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;">O enviar invitación individual</div>' +
      lista.map(i =>
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">' +
        '<span style="font-size:13px;">' + (i.nombre || '') + '</span>' +
        '<a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola ' + (i.nombre || '').split(' ')[0] + '! Te comparto el link del grupo: ' + c.grupoWA) + '" target="_blank" class="wabtn">💬 Invitar</a>' +
        '</div>'
      ).join('');
  } else {
    html += '<div style="background:#1a1a1a;border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin:16px 0;font-size:13px;color:var(--text3);">Sin link de grupo. Podés editar el curso y agregar el link.</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-weight:700;">Enviar mensaje individual:</div>' +
      lista.map(i =>
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">' +
        '<span style="font-size:13px;">' + (i.nombre || '') + '</span>' +
        '<a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp || '').replace(/\D/g, '') + '" target="_blank" class="wabtn">💬 WA</a>' +
        '</div>'
      ).join('');
  }
  html += '<button class="btn-out" onclick="window.closeModal()" style="margin-top:16px;">Cerrar</button>';
  document.getElementById('mcontent').innerHTML = html;
  openModal();
};

// ── EXPORTAR ──────────────────────────────────────────────────────────────────
function descargarExcelCsv(nombreArchivo, titulo, columnas, filas) {
  const sep = ';';
  const limpiar = (v) => String(v ?? '').replace(/\r?\n/g, ' ').replace(/;/g, ',').trim();
  const lines = [];
  lines.push(limpiar(titulo));
  lines.push('Generado;' + new Date().toLocaleDateString('es-AR'));
  lines.push('');
  lines.push(columnas.map(limpiar).join(sep));
  filas.forEach(r => lines.push(r.map(limpiar).join(sep)));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : nombreArchivo + '.csv';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 800);
}

window.exportarExcel = () => {
  const {filtro, lista} = getAlumnosFiltrados();
  const cn = filtro && cursos[filtro] ? cursos[filtro].titulo : 'Todos los cursos';
  const selected = !!filtro;

  function payAmount(p){
    return (p && (p.estado === 'pagado' || p.estado === 'parcial')) ? (parseFloat(String(p.monto||'').replace(',','.')) || 0) : 0;
  }

  if (selected) {
    const seen = new Set();
    const paymentLabels = [];
    lista.forEach(([,i]) => (i.pagos || []).forEach(p => {
      const l = p.label || 'Pago';
      if(!seen.has(l)){ seen.add(l); paymentLabels.push(l); }
    }));
    const cols = ['N°','Nombre','DNI','Edad','Instagram','WhatsApp','Fecha', ...paymentLabels, 'Total alumno'];
    const rows = lista.map(([,i], idx) => {
      const pagos = i.pagos || [];
      const amounts = paymentLabels.map(l => payAmount(pagos.find(p => (p.label || 'Pago') === l)));
      const totalAlumno = amounts.reduce((a,b)=>a+b,0);
      return [idx+1, i.nombre||'', i.dni||'', i.edad||'', i.ig||'', i.wp||'', i.fecha||'', ...amounts, totalAlumno];
    });
    const totals = paymentLabels.map(l => lista.reduce((a,[,i]) => a + payAmount((i.pagos||[]).find(p => (p.label || 'Pago') === l)), 0));
    rows.push(['TOTAL POR CONCEPTO','','','','','','', ...totals, totals.reduce((a,b)=>a+b,0)]);
    descargarExcelCsv('tomauno_pagos_' + cn.replace(/[^a-zA-Z0-9]/g,'_') + '.csv', 'Tomauno — Pagos — ' + cn, cols, rows);
    return;
  }

  const cols = ['N°','Nombre','DNI','Edad','Curso','Instagram','WhatsApp','Fecha','Total registrado'];
  const rows = lista.map(([,i], idx) => {
    const cur = cursos[i.cursoId];
    const total = (i.pagos || []).reduce((a,p)=>a+payAmount(p),0);
    return [idx+1, i.nombre||'', i.dni||'', i.edad||'', i.cursoTitulo || cur?.titulo || '', i.ig||'', i.wp||'', i.fecha||'', total];
  });
  rows.push(['TOTAL GENERAL','','','','','','','', rows.reduce((a,r)=>a+(Number(r[8])||0),0)]);
  descargarExcelCsv('tomauno_inscripciones_todos_los_cursos.csv', 'Tomauno — Pagos — Todos los cursos', cols, rows);
};

window.exportarPDF = () => {
  const {filtro, lista} = getAlumnosFiltrados();
  const cn = filtro && cursos[filtro] ? cursos[filtro].titulo : 'Todos los cursos';
  const selected = !!filtro;
  const win = window.open('', '_blank');
  if (!win) return;

  function payAmount(p){ return (p && (p.estado === 'pagado' || p.estado === 'parcial')) ? (parseFloat(String(p.monto||'').replace(',','.')) || 0) : 0; }
  function payCell(p){
    if(!p) return '<span class="muted">-</span>';
    const amount = payAmount(p);
    const cls = p.estado === 'pagado' ? 'ok' : p.estado === 'parcial' ? 'pa' : 'pe';
    const label = p.estado === 'pagado' ? 'Pagado' : p.estado === 'parcial' ? 'Parcial' : 'Pendiente';
    return '<span class="' + cls + '">' + label + '</span><br><strong>$ ' + amount.toLocaleString('es-AR') + '</strong>';
  }

  let paymentLabels = [];
  if (selected) {
    const seen = new Set();
    lista.forEach(([,i]) => (i.pagos || []).forEach(p => { const l = p.label || 'Pago'; if(!seen.has(l)){ seen.add(l); paymentLabels.push(l); } }));
  }

  let head, rows, totalsRow = '';
  if (selected) {
    head = '<tr><th>#</th><th>Nombre</th><th>DNI</th><th>Edad</th><th>IG</th><th>WP</th><th>Fecha</th>' + paymentLabels.map(l => '<th>' + escHtml(l) + '</th>').join('') + '<th>Total</th></tr>';
    rows = lista.map(([,i], idx) => {
      const pagos = i.pagos || [];
      const totalAlumno = pagos.reduce((a,p)=>a+payAmount(p),0);
      return '<tr><td>' + (idx+1) + '</td><td>' + escHtml(i.nombre||'') + '</td><td>' + escHtml(i.dni||'') + '</td><td>' + escHtml(i.edad||'') + '</td><td>@' + escHtml(i.ig||'') + '</td><td>' + escHtml(i.wp||'') + '</td><td>' + escHtml(i.fecha||'') + '</td>' +
        paymentLabels.map(l => '<td>' + payCell(pagos.find(p => (p.label || 'Pago') === l)) + '</td>').join('') +
        '<td><strong>$ ' + totalAlumno.toLocaleString('es-AR') + '</strong></td></tr>';
    }).join('');
    const totals = paymentLabels.map(l => lista.reduce((a,[,i]) => a + payAmount((i.pagos||[]).find(p => (p.label || 'Pago') === l)), 0));
    const grand = totals.reduce((a,b)=>a+b,0);
    totalsRow = '<tr class="total-row"><td colspan="7">TOTAL POR CONCEPTO</td>' + totals.map(t => '<td>$ ' + t.toLocaleString('es-AR') + '</td>').join('') + '<td>$ ' + grand.toLocaleString('es-AR') + '</td></tr>';
  } else {
    head = '<tr><th>#</th><th>Nombre</th><th>DNI</th><th>Edad</th><th>Curso</th><th>IG</th><th>WP</th><th>Fecha</th><th>Pago</th><th>Monto</th></tr>';
    rows = lista.map(([,i], idx) => {
      const cur = cursos[i.cursoId];
      const p = getPagoAlumnoInfo(i, cur);
      const estadoTxt = p.estado === 'pagado' ? 'Con pagos' : p.estado === 'parcial' ? 'Parcial' : 'Pendiente';
      return '<tr><td>' + (idx+1) + '</td><td>' + escHtml(i.nombre||'') + '</td><td>' + escHtml(i.dni||'') + '</td><td>' + escHtml(i.edad||'') + '</td><td>' + escHtml(i.cursoTitulo || cur?.titulo || '') + '</td><td>@' + escHtml(i.ig||'') + '</td><td>' + escHtml(i.wp||'') + '</td><td>' + escHtml(i.fecha||'') + '</td><td>' + estadoTxt + '</td><td>$ ' + Number(p.monto||0).toLocaleString('es-AR') + '</td></tr>';
    }).join('');
  }
  const total = lista.reduce((a,[,i]) => a + getPagoAlumnoInfo(i, cursos[i.cursoId]).monto, 0);
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tomauno</title><link rel="stylesheet" href="css/03-style-03.css"/></head><body><div class="head"><div class="brand">TOMA<span>UNO</span></div><div class="course-title">' + escHtml(cn) + '</div><div class="meta">Planilla de alumnos · ' + new Date().toLocaleDateString('es-AR') + '</div></div><div class="summary"><div class="box">Inscriptos: ' + lista.length + '</div><div class="box">Total registrado: $ ' + total.toLocaleString('es-AR') + '</div></div><table><thead>' + head + '</thead><tbody>' + rows + totalsRow + '</tbody></table></body></html>');
  win.document.close();
  setTimeout(() => win.print(), 400);
};

// ── SERVICIOS HARDCODED ───────────────────────────────────────────────────────
const SERVICIOS = [
  {icon:'📷', title:'SESIONES FOTOGRÁFICAS', desc:'Capturamos tu esencia con luz profesional y dirección de arte.\n\nRealizamos sesiones de:\n• Retratos artísticos y editoriales\n• Book de modelos (principiantes y profesionales)\n• Moda y lookbook\n• Fotos para redes sociales / contenido\n• Sesiones en estudio o locación exterior\n\nCada sesión incluye selección de imágenes editadas en alta resolución.', wp:'3764354522'},
  {icon:'🎭', title:'MODELAJE', desc:'Formación integral para modelos de todos los niveles.\n\nIncluye:\n• Asesoramiento de imagen y posado\n• Técnicas de pasarela y desfile\n• Book fotográfico profesional incluido\n• Vinculación con agencias y productoras\n• Clases grupales e individuales\n\nIdeal para quienes quieren iniciar o potenciar su carrera en el modelaje.', wp:'3764354522'},
  {icon:'🎓', title:'CAPACITACIONES', desc:'Workshops y cursos presenciales para fotógrafos y creativos.\n\nFormatos disponibles:\n• Workshops intensivos (1 día)\n• Cursos regulares (mensuales)\n• Charlas temáticas\n• Capacitaciones in-company\n\nTemáticas: fotografía de retrato, iluminación, edición, branding personal y más.', wp:'3764354522'},
  {icon:'🎬', title:'PRODUCCIÓN', desc:'Contenido audiovisual profesional para tu marca o proyecto.\n\nRealizamos:\n• Videos para redes sociales (Reels, TikTok, YouTube)\n• Producción de eventos\n• Fotografía y video corporativo\n• Contenido para campañas publicitarias\n• Dirección creativa integral\n\nContactanos para cotización según tu proyecto.', wp:'3764354522'}
];

window.abrirServicio = (idx) => {
  const s = SERVICIOS[idx]; if (!s) return;
  document.getElementById('mcontent').innerHTML =
    '<div style="font-size:52px;text-align:center;margin-bottom:12px;">' + s.icon + '</div>' +
    '<div class="mtitle" style="text-align:center;">' + s.title + '</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.75;white-space:pre-line;margin:16px 0 20px;">' + s.desc + '</div>' +
    '<a rel="noopener noreferrer" href="https://wa.me/549' + s.wp + '?text=' + encodeURIComponent('Hola! Me interesa el servicio de ' + s.title + '. ¿Pueden darme más info?') + '" target="_blank" class="btn-main" style="text-decoration:none;">💬 Consultar por WhatsApp</a>' +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};

// ── SERVICIOS FIREBASE ────────────────────────────────────────────────────────
window.agregarServicio = async () => {
  const titulo = document.getElementById('ns-titulo')?.value.trim();
  if (!titulo) { toast('⚠️ El título es obligatorio'); return; }
  await push(ref(db, 'tomauno/servicios'), {
    titulo,
    tipo: document.getElementById('ns-tipo')?.value || 'servicio',
    desc: document.getElementById('ns-desc')?.value.trim() || '',
    precio: parseInt(document.getElementById('ns-precio')?.value) || 0,
    icon: document.getElementById('ns-icon')?.value.trim() || '📷',
    img: document.getElementById('ns-img')?.value.trim() || '',
    extraText: document.getElementById('ns-extra-text')?.value.trim() || '',
    extraUrl: document.getElementById('ns-extra-url')?.value.trim() || '',
    dir: document.getElementById('ns-dir')?.value.trim() || 'Pedro Méndez 2069, Posadas',
    ig: document.getElementById('ns-ig')?.value.trim() || 'tomaunomodels',
    wp: document.getElementById('ns-wp')?.value.trim() || '3764354522',
    horaInicio: document.getElementById('ns-h-ini')?.value || '09:00',
    horaFin: document.getElementById('ns-h-fin')?.value || '22:00',
    duracion: parseInt(document.getElementById('ns-dur')?.value)||30,
    descansos: document.getElementById('ns-descansos')?.value.trim() || '',
    camposReq: {dni: false, edad: document.getElementById('ns-req-edad')?.checked ?? true, ig: document.getElementById('ns-req-ig')?.checked ?? true, email: document.getElementById('ns-req-email')?.checked ?? false, altura: document.getElementById('ns-req-altura')?.checked ?? false, medidas: document.getElementById('ns-req-medidas')?.checked ?? false},
    oculto: false, creado: Date.now()
  });
  ['ns-titulo','ns-desc','ns-precio','ns-img','ns-extra-text','ns-extra-url','ns-dir','ns-ig','ns-wp'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('ns-icon').value = '📷';
  toast('✅ Servicio publicado');
};

function renderServiciosAdmin() {
  const w = document.getElementById('admin-servicios-list'); if (!w) return;
  const lista = Object.entries(serviciosDB).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin servicios en Firebase aún</div>'; return; }
  w.innerHTML = lista.map(([k, s], idx) =>
    '<div class="admin-ci">' +
    '<div class="admin-ci-info">' +
    '<div class="admin-ci-tit"><span style="color:var(--text3);font-size:12px;margin-right:6px;">#' + (idx+1) + '</span>' + (s.icon || '📷') + ' ' + (s.titulo || 'Sin título') + '</div>' +
    '<div class="admin-ci-sub">' + (s.precio ? '$ ' + Number(s.precio).toLocaleString('es-AR') : 'Sin precio') + ' · ' + (s.oculto ? '🙈 Oculto' : '👁️ Visible') + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
    '<button class="bsm gr" onclick="window.editServicio(\'' + k + '\')">✏️ Editar</button>' +
    '<button class="bsm ' + (s.oculto ? 'gr' : 'bl') + '" onclick="window.togSrvOc(\'' + k + '\',' + !s.oculto + ')">' + (s.oculto ? '👁️ Mostrar' : '🙈 Ocultar') + '</button>' +
    '<button class="bsm re" onclick="window.delServicio(\'' + k + '\')">🗑️</button>' +
    '</div></div>'
  ).join('');
}

function renderServiciosPublicos() {
  const g = document.getElementById('servicios-db-grid'); if (!g) return;
  const lista = Object.entries(serviciosDB).filter(([, s]) => !s.oculto).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) { g.innerHTML = ''; return; }
  g.innerHTML = lista.map(([k, s]) =>
    '<div class="srv-card" onclick="window.abrirServicioDB(\'' + k + '\')">' +
    '<div class="srv-icon">' + (s.img ? '<img src="' + s.img + '" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:12px;" onerror="this.outerHTML=\'<span style=font-size:44px>' + (s.icon || '📷') + '</span>\'"/>' : (s.icon || '📷')) + '</div>' +
    '<div class="srv-title">' + (s.titulo || '') + '</div>' +
    (s.tipo==='sesiones' ? '<div style="font-size:10px;color:#a78bfa;font-weight:800;margin-bottom:8px;letter-spacing:.08em;text-transform:uppercase;">📅 Reserva con turnos</div>' : '') +
    '<div class="srv-desc">' + (s.desc || '').replace(/\n/g,' ').substring(0, 90) + (s.desc && s.desc.length > 90 ? '...' : '') + '</div>' +
    (s.precio ? '<div class="srv-price">$ ' + Number(s.precio).toLocaleString('es-AR') + '</div>' : '') +
    '<div class="srv-cta">' + (s.tipo==='sesiones'?'Reservar turno →':'Ver más →') + '</div>' +
    '</div>'
  ).join('');
}

window.abrirServicioDB = (id) => {
  const s = serviciosDB[id]; if (!s) return;
  const wp = s.wp || '3764354522';
  document.getElementById('mcontent').innerHTML =
    (s.img ? '<img src="' + s.img + '" style="width:100%;border-radius:var(--radius-sm);margin-bottom:16px;max-height:280px;object-fit:contain;background:#0a0a0a;" onerror="this.style.display=\'none\'"/>' : '<div style="font-size:52px;text-align:center;margin-bottom:12px;">' + (s.icon || '📷') + '</div>') +
    '<div class="mtitle">' + (s.titulo || '') + '</div>' +
    (s.precio ? '<div style="font-family:var(--display);font-size:32px;color:var(--red);margin:8px 0 16px;">$ ' + Number(s.precio).toLocaleString('es-AR') + '</div>' : '') +
    '<div style="font-size:14px;color:var(--text2);line-height:1.75;white-space:pre-line;margin-bottom:20px;">' + (s.desc || '') + '</div>' +
    (s.dir ? '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">📍 ' + s.dir + '</div>' : '') +
    (s.ig ? '<a rel="noopener noreferrer" href="https://instagram.com/' + s.ig + '" target="_blank" class="det-link ig" style="margin-bottom:12px;display:inline-flex;">📸 @' + s.ig + '</a>' : '') +
    (s.tipo==='sesiones' ? '<button class="btn-main" style="margin-top:8px;" onclick="window.abrirTurnosServicio(\'' + id + '\')">📅 Elegir turno</button>' : '<a rel="noopener noreferrer" href="https://wa.me/549' + wp + '?text=' + encodeURIComponent('Hola! Me interesa el servicio: ' + (s.titulo || '') + '. ¿Pueden darme más info?') + '" target="_blank" class="btn-main" style="text-decoration:none;margin-top:8px;">💬 Consultar por WhatsApp</a>') +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};


window.editServicio = (id) => {
  const s = serviciosDB[id]; if (!s) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR SERVICIO</div>' +
    '<div class="msub" style="margin-bottom:14px;">Modificá los datos del servicio.</div>' +
    '<label class="flbl">Título *</label><input class="finput" id="es-titulo" value="' + escAttr(s.titulo || '') + '"/>' +
    '<label class="flbl">Modalidad</label><select class="finput" id="es-tipo" onchange="document.getElementById(\'es-turnos-config\').style.display=this.value===\'sesiones\'?\'block\':\'none\'"><option value="servicio" '+((s.tipo||'servicio')==='servicio'?'selected':'')+'>Servicio informativo</option><option value="sesiones" '+(s.tipo==='sesiones'?'selected':'')+'>Con turnos / reservas</option></select>' +
    '<div id="es-turnos-config" style="display:'+(s.tipo==='sesiones'?'block':'none')+';background:#1a0000;border:1px solid #3a0000;border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;"><div class="frow2"><div><label class="flbl">Hora inicio</label><input class="finput" id="es-h-ini" type="time" value="'+(s.horaInicio||'09:00')+'" style="color-scheme:dark"/></div><div><label class="flbl">Hora fin</label><input class="finput" id="es-h-fin" type="time" value="'+(s.horaFin||'22:00')+'" style="color-scheme:dark"/></div></div><div class="frow2"><div><label class="flbl">Duración turno</label><input class="finput" id="es-dur" type="number" value="'+(s.duracion||30)+'"/></div><div><label class="flbl">Descansos</label><input class="finput" id="es-descansos" value="'+escAttr(s.descansos||'')+'"/></div></div></div>' +
    '<label class="flbl">Descripción</label><textarea class="finput" id="es-desc" rows="4">' + escHtml(s.desc || '') + '</textarea>' +
    '<div class="frow2"><div><label class="flbl">Precio desde ($)</label><input class="finput" id="es-precio" type="number" value="'+(s.precio||0)+'"/></div><div><label class="flbl">Icono</label><input class="finput" id="es-icon" maxlength="4" value="'+escAttr(s.icon||'📷')+'"/></div></div>' +
    '<label class="flbl">URL imagen</label><input class="finput" id="es-img" value="'+escAttr(s.img||'')+'" placeholder="https://i.imgur.com/..."/>' +
    '<label class="flbl">Dirección</label><div style="display:flex;gap:6px;"><input class="finput" id="es-dir" value="'+escAttr(s.dir||'')+'" style="margin:0;"/><button type="button" onclick="document.getElementById(\'es-dir\').value=\'Pedro Méndez 2069, Posadas, Misiones\'" style="background:var(--gray3);border:none;color:var(--text2);border-radius:var(--radius-sm);padding:0 12px;font-size:11px;cursor:pointer;font-family:var(--font);">📍 Estudio</button></div>' +
    '<div class="frow2"><div><label class="flbl">Instagram</label><input class="finput" id="es-ig" value="'+escAttr(s.ig||'')+'"/></div><div><label class="flbl">WhatsApp</label><input class="finput" id="es-wp" value="'+escAttr(s.wp||'')+'"/></div></div>' +
    '<label class="flbl">Campos del formulario si usa turnos</label><div style="background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;display:flex;flex-wrap:wrap;gap:10px;"><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-ig" '+((s.camposReq||{}).ig!==false?'checked':'')+' style="accent-color:var(--red);"> Instagram</label><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-email" '+((s.camposReq||{}).email?'checked':'')+' style="accent-color:var(--red);"> Email</label><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-altura" '+((s.camposReq||{}).altura?'checked':'')+' style="accent-color:var(--red);"> Altura</label><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-medidas" '+((s.camposReq||{}).medidas?'checked':'')+' style="accent-color:var(--red);"> Medidas</label></div><div style="font-size:10px;color:var(--text3);margin-top:4px;">Nombre, WhatsApp y edad son siempre obligatorios. DNI no se pide en servicios.</div>' +
    '<button class="btn-main" onclick="window.guardarEditServicio(\''+id+'\')">💾 Guardar cambios</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarEditServicio = async (id) => {
  const titulo = document.getElementById('es-titulo')?.value.trim();
  if (!titulo) { toast('El título es obligatorio'); return; }
  await update(ref(db,'tomauno/servicios/'+id), {
    titulo,
    tipo: document.getElementById('es-tipo')?.value || 'servicio',
    desc: document.getElementById('es-desc')?.value.trim() || '',
    precio: parseInt(document.getElementById('es-precio')?.value) || 0,
    icon: document.getElementById('es-icon')?.value.trim() || '📷',
    img: document.getElementById('es-img')?.value.trim() || '',
    dir: document.getElementById('es-dir')?.value.trim() || 'Pedro Méndez 2069, Posadas, Misiones',
    ig: document.getElementById('es-ig')?.value.trim() || 'tomaunomodels',
    wp: document.getElementById('es-wp')?.value.trim() || '3764354522',
    horaInicio: document.getElementById('es-h-ini')?.value || '09:00',
    horaFin: document.getElementById('es-h-fin')?.value || '22:00',
    duracion: parseInt(document.getElementById('es-dur')?.value) || 30,
    descansos: document.getElementById('es-descansos')?.value.trim() || '',
    camposReq: {
      dni: false,
      edad: true,
      ig: document.getElementById('es-req-ig')?.checked ?? true,
      email: document.getElementById('es-req-email')?.checked ?? false,
      altura: document.getElementById('es-req-altura')?.checked ?? false,
      medidas: document.getElementById('es-req-medidas')?.checked ?? false
    }
  });
  closeModal();
  toast('✅ Servicio actualizado');
};

window.togSrvOc = async (id, v) => { await update(ref(db, 'tomauno/servicios/' + id), {oculto: v}); };
window.delServicio = async (id) => {
  showConfirm('¿Eliminar este servicio?', async () => {
    await remove(ref(db, 'tomauno/servicios/' + id));
    toast('🗑️ Servicio eliminado');
  });
};


function genSlotsServicio(s) {
  const sl = [];
  const [hi, mi] = (s.horaInicio || '09:00').split(':').map(Number);
  const [hf, mf] = (s.horaFin || '22:00').split(':').map(Number);
  const dur = parseInt(s.duracion) || 30;
  const descansos = (s.descansos || '').split(',').map(d => {
    const p = d.trim().split('-');
    if (p.length !== 2) return null;
    const [dhi, dmi] = p[0].trim().split(':').map(Number);
    const [dhf, dmf] = p[1].trim().split(':').map(Number);
    return {ini: dhi*60+(dmi||0), fin: dhf*60+(dmf||0)};
  }).filter(Boolean);
  let cur = hi*60+mi;
  const fin = hf*60+mf;
  while (cur + dur <= fin) {
    const bloqueado = descansos.some(d => cur < d.fin && cur + dur > d.ini);
    if (!bloqueado) {
      const h = String(Math.floor(cur/60)).padStart(2,'0');
      const m = String(cur%60).padStart(2,'0');
      const h2 = String(Math.floor((cur+dur)/60)).padStart(2,'0');
      const m2 = String((cur+dur)%60).padStart(2,'0');
      sl.push(h + ':' + m + '-' + h2 + ':' + m2);
    }
    cur += dur;
  }
  return sl;
}

window.abrirTurnosServicio = (id) => {
  const s = serviciosDB[id]; if (!s) return;
  const slots = genSlotsServicio(s);
  const ocup = Object.values(servicioRegsDB).filter(i => i.servicioId === id && i.turno);
  const libres = slots.filter(x => !ocup.find(i => i.turno === x)).length;
  let html = '<div class="mtitle">ELEGÍ TU TURNO</div><div class="msub">' + (s.titulo || '') + ' · <span style="color:#4caf7d;">' + libres + ' disponibles</span></div><div class="slots-grid">';
  slots.forEach(x => {
    const q = ocup.find(i => i.turno === x);
    html += '<div class="slot ' + (q ? 'ocupado' : 'libre') + '" data-id="' + id + '" data-slot="' + x + '" ' + (q ? '' : 'onclick="window.selTurnoServicio(this)"') + '><div class="slot-t">' + x + '</div><div class="slot-n">' + (q ? (q.nombre || '').split(' ')[0] : '✓ Libre') + '</div></div>';
  });
  html += '</div><button class="btn-out" style="margin-top:16px;" onclick="window.closeModal()">Cancelar</button>';
  document.getElementById('mcontent').innerHTML = html; openModal();
};
window.selTurnoServicio = (el) => { window.abrirReservaServicio(el.dataset.id, el.dataset.slot); };
window.abrirReservaServicio = (id, turno) => {
  const s = serviciosDB[id]; if (!s) return;
  const cr = Object.assign({dni:false, edad:true, ig:true, email:false, altura:false, medidas:false}, s.camposReq || {});
  document.getElementById('mcontent').innerHTML = '<div class="mtitle">RESERVAR TURNO</div><div class="msub">' + (s.titulo||'') + ' · <strong style="color:var(--red);">' + turno + '</strong></div>' +
    '<input type="hidden" id="fsv-turno" value="' + turno + '"/>' +
    '<input class="finput" id="fsv-nom" placeholder="Nombre y apellido *"/>' +
    '<input type="hidden" id="fsv-dni" value=""/>' +
    '<input class="finput" id="fsv-edad" placeholder="Edad *" type="number"/>' +
    (cr.ig !== false ? '<input class="finput" id="fsv-ig" placeholder="Instagram (sin @)"/>' : '') +
    (cr.email ? '<input class="finput" id="fsv-email" placeholder="Email *" type="email"/>' : '') +
    '<input class="finput" id="fsv-wp" placeholder="WhatsApp * ej: 3764123456" type="tel"/>' +
    '<input class="finput" id="fsv-localidad" placeholder="Localidad (opcional)"/>' +
    '<button class="btn-main" onclick="window.confirmarReservaServicio(\'' + id + '\')">✅ Confirmar turno</button><button class="btn-out" onclick="window.abrirTurnosServicio(\'' + id + '\')">← Volver</button>';
  openModal();
};
window.confirmarReservaServicio = async (id) => {
  const s = serviciosDB[id]; if (!s) return;
  const nom = document.getElementById('fsv-nom')?.value.trim();
  const wp = document.getElementById('fsv-wp')?.value.trim();
  const dni = document.getElementById('fsv-dni')?.value.trim() || '';
  const edad = document.getElementById('fsv-edad')?.value.trim() || '';
  const ig = document.getElementById('fsv-ig')?.value.trim() || '';
  const email = document.getElementById('fsv-email')?.value.trim() || '';
  const localidad = document.getElementById('fsv-localidad')?.value.trim() || '';
  const turno = document.getElementById('fsv-turno')?.value || '';
  if (!nom) { toast('El nombre es obligatorio'); return; }
  if (!wp) { toast('El WhatsApp es obligatorio'); return; }
  if (!edad) { toast('La edad es obligatoria'); return; }
  if (Object.values(servicioRegsDB).find(i => i.servicioId===id && i.turno===turno)) { toast('Ese turno ya fue tomado'); window.abrirTurnosServicio(id); return; }
  await push(ref(db,'tomauno/servicioRegs'), {servicioId:id, servicioTitulo:s.titulo||'', nombre:nom, wp, dni, edad, ig, email, localidad, turno, fecha:new Date().toLocaleDateString('es-AR'), creado:Date.now(), pagos:[{label:'Pago único', estado:'pendiente', monto:''}]});
  const waText = '📅 *NUEVA RESERVA DE SERVICIO*\n\n🛠️ *Servicio:* '+(s.titulo||'')+'\n⏰ *Turno:* '+turno+'\n👤 *Nombre:* '+nom+'\n📱 *WhatsApp:* '+wp+(ig?'\n📸 *Instagram:* @'+ig:'')+(localidad?'\n📍 *Localidad:* '+localidad:'');
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(waText);
  document.getElementById('mcontent').innerHTML = '<div style="text-align:center;padding:12px 0;"><div style="font-size:52px;margin-bottom:16px;">✅</div><div class="mtitle">TURNO REGISTRADO</div><div style="font-size:14px;color:var(--text2);line-height:1.6;margin:14px 0 20px;">Tu turno quedó registrado. Al presionar Aceptar se enviarán tus datos a Tomauno por WhatsApp.</div><button class="btn-main" onclick="window.open(window._pendingWaUrl,\'_blank\');window.closeModal();">Aceptar — Enviar a WhatsApp</button></div>';
};

// ── TESTIMONIOS ───────────────────────────────────────────────────────────────
function renderTestimonios() {
  const g = document.getElementById('test-grid'); if (!g) return;
  const lista = Object.entries(testimoniosDB)
    .filter(([, t]) => !t.pendiente)
    .sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) {
    g.innerHTML = '<div style="color:var(--text3);font-size:14px;padding:20px 0;">Los testimonios aparecerán aquí.</div>';
    return;
  }
  g.innerHTML = lista.map(([k, t]) => {
    const stars = '★'.repeat(parseInt(t.stars) || 5);
    const ini = (t.name || 'A')[0].toUpperCase();
    const avatarHtml = t.avatar
      ? '<img src="' + t.avatar + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy"/>'
      : ini;
    const igHtml = t.ig
      ? '<a rel="noopener noreferrer" href="https://instagram.com/' + t.ig.replace('@','') + '" target="_blank" class="test-ig">@' + t.ig.replace('@','') + '</a>'
      : '';
    return '<div class="test-card">' +
      '<div class="test-stars">' + stars + '</div>' +
      '<div class="test-text">' + (t.text || '') + '</div>' +
      '<div class="test-author">' +
      '<div class="test-avatar">' + avatarHtml + '</div>' +
      '<div>' +
      '<div class="test-name">' + (t.name || 'Alumno') + '</div>' +
      igHtml +
      (t.course ? '<div class="test-course">' + t.course + '</div>' : '') +
      (t.date ? '<div class="test-date">' + t.date + '</div>' : '') +
      '</div></div></div>';
  }).join('');
}

function renderTestimoniosAdmin() {
  const w = document.getElementById('admin-test-list'); if (!w) return;
  const lista = Object.entries(testimoniosDB).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin testimonios aún</div>'; return; }
  w.innerHTML = lista.map(([k, t]) =>
    '<div class="admin-ci">' +
    '<div class="admin-ci-info">' +
    '<div class="admin-ci-tit">' + ('⭐'.repeat(parseInt(t.stars)||5)) + ' ' + (t.name || 'Anónimo') + '</div>' +
    '<div class="admin-ci-sub">' + (t.course || '') + (t.ig ? ' · @' + String(t.ig).replace('@','') : '') + ' · "' + (t.text || '').substring(0, 60) + '..."</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center;">' +
    '<select class="mini-input" style="width:116px;height:32px;font-size:11px;font-weight:800;color:' + (t.pendiente ? '#f5c842' : '#4caf7d') + ';" onchange="window.setTestEstado(\'' + k + '\',this.value)">' +
      '<option value="publicado" ' + (!t.pendiente?'selected':'') + '>Publicado</option>' +
      '<option value="pendiente" ' + (t.pendiente?'selected':'') + '>Pendiente</option>' +
    '</select>' +
    '<button class="bsm bl" onclick="window.editTest(\'' + k + '\')">✏️ Editar</button>' +
    '<button class="bsm re" onclick="window.delTest(\'' + k + '\')">🗑️</button>' +
    '</div></div>'
  ).join('');
}

window.setTestEstado = async (id, estado) => {
  await update(ref(db, 'tomauno/testimonios/' + id), {pendiente: estado === 'pendiente'});
  toast(estado === 'pendiente' ? '⏳ Testimonio pendiente' : '✅ Testimonio publicado', true);
};

function renderFiltroTestimonios() {
  // ya está en renderFiltros, pero también se llama desde cursos listener
}

window.agregarTestimonio = async () => {
  const texto = document.getElementById('nt-texto')?.value.trim();
  if (!texto) { toast('⚠️ El texto es obligatorio'); return; }
  await push(ref(db, 'tomauno/testimonios'), {
    name: document.getElementById('nt-nombre')?.value.trim() || 'Alumno',
    text: texto,
    course: document.getElementById('nt-curso')?.value || '',
    stars: parseInt(document.getElementById('nt-stars')?.value) || 5,
    ig: (document.getElementById('nt-ig')?.value.trim() || '').replace(/^@+/, ''),
    avatar: document.getElementById('nt-avatar')?.value.trim() || '',
    pendiente: document.getElementById('nt-pendiente')?.value === 'true',
    date: new Date().toLocaleDateString('es-AR'),
    creado: Date.now()
  });
  ['nt-nombre','nt-texto','nt-ig','nt-avatar'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  toast('✅ Testimonio publicado', true);
};



function buildTestReferenceSelectHtml(currentValue) {
  const current = String(currentValue || '').trim();
  const items = [];
  Object.entries(cursos || {}).forEach(([k, c]) => {
    const name = String((c && c.titulo) || k || '').trim();
    if (name) items.push({type:'Curso', name});
  });
  Object.entries(serviciosDB || {}).forEach(([k, s]) => {
    const name = String((s && s.titulo) || k || '').trim();
    if (name) items.push({type:'Servicio', name});
  });
  const seen = new Set();
  const opts = ['<option value="">Sin referencia específica</option>'];
  items.sort((a,b)=> a.type.localeCompare(b.type) || a.name.localeCompare(b.name)).forEach(item => {
    const key = item.type + '|' + item.name;
    if (seen.has(key)) return;
    seen.add(key);
    const selected = item.name === current ? ' selected' : '';
    opts.push('<option value="' + escAttr(item.name) + '"' + selected + '>' + escHtml(item.type + ': ' + item.name) + '</option>');
  });
  if (current && !items.some(item => item.name === current)) {
    opts.splice(1, 0, '<option value="' + escAttr(current) + '" selected>Actual: ' + escHtml(current) + '</option>');
  }
  return '<select class="finput" id="et-course">' + opts.join('') + '</select>' +
    '<div style="font-size:11px;color:var(--text3);margin:-2px 0 10px;">Podés dejarlo vacío si el testimonio no corresponde a un curso o servicio cargado.</div>';
}

window.editTest = (id) => {
  const t = testimoniosDB[id]; if (!t) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR TESTIMONIO</div>' +
    '<div class="msub" style="margin-bottom:16px;">Corregí texto, curso, estrellas o imagen antes de publicarlo.</div>' +
    '<label class="flbl">Nombre</label><input class="finput" id="et-name" value="' + escHtml(t.name || '') + '" />' +
    '<label class="flbl">Curso / servicio / referencia</label>' + buildTestReferenceSelectHtml(t.course || '') +
    '<label class="flbl">Instagram (opcional)</label><input class="finput" id="et-ig" value="' + escHtml(t.ig || '') + '" placeholder="@usuario o usuario" />' +
    '<label class="flbl">Texto</label><textarea class="finput" id="et-text" rows="5">' + escHtml(t.text || '') + '</textarea>' +
    '<div class="frow2"><div><label class="flbl">Estrellas</label><select class="finput" id="et-stars">' +
      '<option value="5" ' + ((parseInt(t.stars)||5)===5?'selected':'') + '>⭐⭐⭐⭐⭐ 5</option>' +
      '<option value="4" ' + ((parseInt(t.stars)||5)===4?'selected':'') + '>⭐⭐⭐⭐ 4</option>' +
      '<option value="3" ' + ((parseInt(t.stars)||5)===3?'selected':'') + '>⭐⭐⭐ 3</option>' +
    '</select></div><div><label class="flbl">Estado</label><select class="finput" id="et-pendiente">' +
      '<option value="false" ' + (!t.pendiente?'selected':'') + '>Publicado</option>' +
      '<option value="true" ' + (t.pendiente?'selected':'') + '>Pendiente</option>' +
    '</select></div></div>' +
    '<label class="flbl">URL foto / avatar</label><input class="finput" id="et-avatar" value="' + escHtml(t.avatar || '') + '" placeholder="https://i.imgur.com/..." />' +
    '<button class="btn-main" onclick="window.guardarTestEdit(\'' + id + '\')">💾 Guardar testimonio</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarTestEdit = async (id) => {
  const texto = document.getElementById('et-text')?.value.trim();
  if (!texto) { toast('⚠️ El texto es obligatorio'); return; }
  await update(ref(db, 'tomauno/testimonios/' + id), {
    name: document.getElementById('et-name')?.value.trim() || 'Alumno',
    course: document.getElementById('et-course')?.value.trim() || '',
    ig: (document.getElementById('et-ig')?.value.trim() || '').replace(/^@+/, ''),
    text: texto,
    stars: parseInt(document.getElementById('et-stars')?.value) || 5,
    avatar: document.getElementById('et-avatar')?.value.trim() || '',
    pendiente: document.getElementById('et-pendiente')?.value === 'true'
  });
  closeModal();
  toast('✅ Testimonio actualizado', true);
};

window.aprobarTest = async (id) => {
  await update(ref(db, 'tomauno/testimonios/' + id), {pendiente: false});
  toast('✅ Testimonio aprobado', true);
};

window.delTest = async (id) => {
  showConfirm('¿Eliminar este testimonio?', async () => {
    await remove(ref(db, 'tomauno/testimonios/' + id));
    toast('🗑️ Testimonio eliminado', true);
  });
};

// Link público para dejar reseña
window.abrirFormTestimonio = () => {
  let cursosOpts = '<option value="">Sin curso específico</option>' +
    Object.entries(cursos).sort((a, b) => (b[1].creado||0)-(a[1].creado||0))
      .map(([k, c]) => '<option value="' + (c.titulo||k) + '">' + (c.titulo||k) + '</option>').join('');
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">DEJÁ TU RESEÑA</div>' +
    '<div class="msub" style="margin-bottom:16px;">¡Nos encanta saber tu opinión!</div>' +
    '<label class="flbl">Tu nombre</label>' +
    '<input class="finput" id="rv-nombre" placeholder="Tu nombre"/>' +
    '<label class="flbl">Instagram (opcional)</label>' +
    '<input class="finput" id="rv-ig" placeholder="@usuario o usuario"/>' +
    '<label class="flbl">Curso</label>' +
    '<select class="finput" id="rv-curso">' + cursosOpts + '</select>' +
    '<label class="flbl">Tu experiencia *</label>' +
    '<textarea class="finput" id="rv-texto" placeholder="Contanos qué te pareció..."></textarea>' +
    '<label class="flbl">Estrellas</label>' +
    '<select class="finput" id="rv-stars"><option value="5">⭐⭐⭐⭐⭐ Excelente</option><option value="4">⭐⭐⭐⭐ Muy bueno</option><option value="3">⭐⭐⭐ Bueno</option></select>' +
    '<button class="btn-main" onclick="window.enviarReview()">⭐ Enviar reseña</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.enviarReview = async () => {
  const texto = document.getElementById('rv-texto')?.value.trim();
  if (!texto) { toast('⚠️ Contanos tu experiencia'); return; }
  await push(ref(db, 'tomauno/testimonios'), {
    name: document.getElementById('rv-nombre')?.value.trim() || 'Alumno',
    ig: (document.getElementById('rv-ig')?.value.trim() || '').replace(/^@+/, ''),
    text: texto,
    course: document.getElementById('rv-curso')?.value || '',
    stars: parseInt(document.getElementById('rv-stars')?.value) || 5,
    avatar: '',
    date: new Date().toLocaleDateString('es-AR'),
    pendiente: true,
    creado: Date.now()
  });
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:20px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">🙏</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">¡Muchas gracias!</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Tu reseña fue registrada correctamente y será revisada antes de publicarse.</div>' +
    '<button class="btn-main" onclick="window.closeModal()">Cerrar</button></div>';
};


function renderStatsVistas() {
  const w = document.getElementById('stats-vistas-content');
  if (!w) return;
  const inscPorCurso = {};
  Object.values(inscripciones || {}).forEach(i => { if (i.cursoId) inscPorCurso[i.cursoId] = (inscPorCurso[i.cursoId] || 0) + 1; });
  const evPorEvento = {};
  Object.values(evInscDB || {}).forEach(i => { if (i.evId) evPorEvento[i.evId] = (evPorEvento[i.evId] || 0) + 1; });
  const cursosTop = Object.entries(cursos || {}).map(([id,c]) => ({id, titulo:c.titulo || 'Sin título', n:inscPorCurso[id] || 0})).sort((a,b)=>b.n-a.n).slice(0,6);
  const eventosTop = Object.entries(eventosDB || {}).map(([id,e]) => ({id, titulo:e.titulo || 'Sin título', n:evPorEvento[id] || 0})).sort((a,b)=>b.n-a.n).slice(0,6);
  const totalCursos = Object.values(inscPorCurso).reduce((a,b)=>a+b,0);
  const totalEventos = Object.values(evPorEvento).reduce((a,b)=>a+b,0);
  const renderRows = arr => arr.length ? arr.map(x => '<div class="stats-row"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + x.titulo + '</span><strong style="color:#fff;">' + x.n + '</strong></div>').join('') : '<div style="color:var(--text3);font-size:12px;">Sin datos todavía</div>';
  w.innerHTML = '<div class="stats-grid">' +
    '<div class="stats-mini-card"><div class="stats-mini-title">Inscripciones cursos</div><div class="stats-mini-value">' + totalCursos + '</div><div style="margin-top:10px;">' + renderRows(cursosTop) + '</div></div>' +
    '<div class="stats-mini-card"><div class="stats-mini-title">Inscripciones eventos</div><div class="stats-mini-value">' + totalEventos + '</div><div style="margin-top:10px;">' + renderRows(eventosTop) + '</div></div>' +
    '<div class="stats-mini-card"><div class="stats-mini-title">Actividad general</div>' +
      '<div class="stats-row"><span>Cursos publicados</span><strong>' + Object.keys(cursos || {}).length + '</strong></div>' +
      '<div class="stats-row"><span>Eventos registrados</span><strong>' + Object.keys(eventosDB || {}).length + '</strong></div>' +
      '<div class="stats-row"><span>Servicios</span><strong>' + Object.keys(serviciosDB || {}).length + '</strong></div>' +
      '<div class="stats-row"><span>Testimonios</span><strong>' + Object.keys(testimoniosDB || {}).length + '</strong></div>' +
    '</div>' +
  '</div>';
}



// ── CHAT DIRECTO ─────────────────────────────────────────────────────────────
let chatsDB = {}, adminStatus = {adminOnline:false, adminLast:0};
let asistenteDB = {modo:'manual', knowledge:{}};
let knownChatIds = null;
let notifiedChatIds = (() => { try { return new Set(JSON.parse(localStorage.getItem('tomauno-chat-notified') || '[]')); } catch(e){ return new Set(); } })();
// IMPORTANTE: el chat del visitante queda por pestaña, no por navegador completo.
// Así un usuario nuevo no hereda mensajes viejos si abre otra pestaña o navegador.
let currentVisitorChatId = (() => { try { return sessionStorage.getItem('tomauno-chat-id') || ''; } catch(e){ return ''; } })();
let currentOpenChatId = '';
let chatListFilter = 'abiertos';
let audioUnlocked = false;

function unlockAudio(){
  if(audioUnlocked) return;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    if(ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); g.gain.value = .0001; o.start(); o.stop(ctx.currentTime + .02);
    audioUnlocked = true;
  }catch(e){}
}
document.addEventListener('click', unlockAudio, {once:false});
document.addEventListener('keydown', unlockAudio, {once:false});

window.pedirPermisoNotificaciones = async () => {
  if (!('Notification' in window)) { toast('⚠️ Este navegador no soporta notificaciones'); return false; }
  if (Notification.permission === 'granted') { toast('🔔 Notificaciones ya activas', true); return true; }
  if (Notification.permission === 'denied') { toast('⚠️ Las notificaciones están bloqueadas en el navegador'); return false; }
  try{
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') { toast('🔔 Notificaciones activadas', true); return true; }
  }catch(e){}
  toast('⚠️ No se activaron las notificaciones');
  return false;
};

function notifyNative(title, body, tag){
  try{
    if('Notification' in window && Notification.permission === 'granted'){
      const n = new Notification(title, {
        body: body || 'Nuevo mensaje desde la web',
        icon: 'https://i.imgur.com/oZnkCPD.png',
        badge: 'https://i.imgur.com/oZnkCPD.png',
        tag: tag || 'tomauno-chat',
        renotify: true,
        requireInteraction: false
      });
      n.onclick = () => { try{ window.focus(); }catch(e){} window.abrirPanelChatsAdmin && window.abrirPanelChatsAdmin(); n.close(); };
    }
  }catch(e){}
}

function notifyAdminChat(title, body, chatId){
  try{ beep(); }catch(e){}
  try{ showNotif(); showNotifBanner(title, body || 'Nuevo mensaje'); }catch(e){}
  notifyNative('💬 ' + title, body || 'Nuevo mensaje desde la web', chatId ? 'tomauno-chat-' + chatId : 'tomauno-chat');
}

onValue(ref(db, 'tomauno/status'), snap => {
  adminStatus = snap.exists() ? snap.val() : {adminOnline:false, adminLast:0};
  updateAdminLiveIndicator();
  const pop=document.getElementById('chat-popover');
  if (currentVisitorChatId && pop?.classList.contains('open')) setTimeout(()=>abrirChatVisitante(currentVisitorChatId, true), 50);
});

onValue(ref(db, 'tomauno/asistente'), snap => {
  asistenteDB = snap.exists() ? snap.val() : {modo:'manual', knowledge:{}};
  renderAsistenteAdmin();
  updateAdminLiveIndicator();
  const fab=document.getElementById('chat-fab');
  if(fab) fab.classList.toggle('auto-on', asistenteModo() === 'automatico');
});

onValue(ref(db, 'tomauno/chats'), snap => {
  chatsDB = snap.exists() ? snap.val() : {};
  const chatEntries = Object.entries(chatsDB).filter(([,c]) => isValidChat(c));
  const unreadAdmin = chatEntries.filter(([,c]) => !!c.unreadAdmin && c.status !== 'cerrado').length;
  const fab = document.getElementById('chat-fab');
  if (fab) {
    fab.classList.toggle('has-new', isAdminNotifier() && unreadAdmin > 0);
    fab.classList.toggle('auto-on', asistenteModo() === 'automatico');
    fab.title = asistenteModo() === 'automatico' ? 'Asistente automático activo' : (isAdminNotifier() && unreadAdmin > 0 ? ('Tenés ' + unreadAdmin + ' chat' + (unreadAdmin!==1?'s':'') + ' pendiente' + (unreadAdmin!==1?'s':'')) : 'Mensaje directo');
  }

  if (knownChatIds === null) {
    knownChatIds = new Set(chatEntries.map(([id]) => id));
  } else if (isAdminNotifier()) {
    // Notificar una sola vez por conversación cuando aparece el primer mensaje no leído para admin.
    // Aunque el chat ya haya sido creado segundos antes al poner el nombre.
    const nuevos = chatEntries
      .filter(([id,c]) => !notifiedChatIds.has(id) && c.unreadAdmin && c.status !== 'cerrado')
      .sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
    if (nuevos.length) {
      const [newId, newest] = nuevos[0];
      notifyAdminChat('Nuevo chat web', (newest?.name || 'Sin nombre') + ': ' + (newest?.lastMsg || 'Escribió desde la web'), newId);
      // Si el chat está minimizado, abrir automáticamente la conversación nueva para el admin.
      const popAuto = document.getElementById('chat-popover');
      if (!popAuto || !popAuto.classList.contains('open')) setTimeout(() => window.abrirChatAdmin && window.abrirChatAdmin(newId), 120);
      nuevos.forEach(([id]) => notifiedChatIds.add(id));
      try{ localStorage.setItem('tomauno-chat-notified', JSON.stringify([...notifiedChatIds])); }catch(e){}
    }
    chatEntries.forEach(([id]) => knownChatIds.add(id));
  }

  if (currentVisitorChatId && chatsDB[currentVisitorChatId] && !isAdminNotifier()) {
    const cVisit = chatsDB[currentVisitorChatId];
    const popVisit = document.getElementById('chat-popover');
    if (cVisit.unreadVisitor && (!popVisit || !popVisit.classList.contains('open'))) {
      setTimeout(() => abrirChatVisitante(currentVisitorChatId, true), 80);
    }
  }
  if (currentVisitorChatId && chatsDB[currentVisitorChatId]) maybeRunVisitorActionTags(currentVisitorChatId, chatsDB[currentVisitorChatId]);
  const pop = document.getElementById('chat-popover');
  if (currentOpenChatId && pop?.classList.contains('open')) {
    const active = document.activeElement;
    const adminView = active?.id === 'chat-admin-text' || isAdminNotifier();
    // Evita refrescar todo el contenedor del chat mientras se escribe: actualiza solo mensajes.
    updateChatMessagesOnly(currentOpenChatId, adminView);
  }
});

function isAdminOnline(){ return !!(adminStatus.adminOnline && (Date.now() - (adminStatus.adminLast || 0) < 90000)); }
function chatTime(){ return new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }
function limpiarNombreChat(nombre){
  let n = String(nombre || '').trim().replace(/\s+/g,' ');
  n = n.replace(/^(hola\s+)?(soy|me llamo|mi nombre es|buenas\s+soy|hola\s+soy)\s+/i,'').trim();
  n = n.replace(/^[,.:;\-\s]+|[,.:;\-\s]+$/g,'');
  return n || String(nombre || '').trim();
}

function chatMsgs(chat){
  if(!chat || !chat.messages) return [];
  return Object.entries(chat.messages).sort((a,b)=>{
    const ca = Number(a[1].createdAt || 0), cb = Number(b[1].createdAt || 0);
    if (ca && cb && ca !== cb) return ca - cb;
    if (ca && !cb) return 1;
    if (!ca && cb) return -1;
    return String(a[0]).localeCompare(String(b[0]));
  });
}
function isValidChat(c){
  if (!c) return false;
  const msgs = chatMsgs(c);
  const name = String(c.name || '').trim();
  const last = String(c.lastMsg || '').trim();
  // Ignora chats realmente vacíos o creados solo al pedir nombre.
  if (!msgs.length && (!last || last === 'Esperando mensaje')) return false;
  // Si se borró parcialmente y quedó sin nombre, igual lo mostramos si tiene mensajes reales.
  if ((!name || name.toLowerCase() === 'sin nombre' || name === '.') && !msgs.some(([,m]) => m && String(m.text||'').trim())) return false;
  return true;
}
function chatGreeting(){ return isAdminOnline() ? '🟢 ¿En qué puedo ayudarte?' : '⚫ Puedo ayudarte con consultas rápidas. Si hace falta, Javier continúa la conversación personalmente.'; }
function isChatUserOnline(c){ return !!(c && c.userOnline && c.userLastSeen && Date.now() - Number(c.userLastSeen) < 75000); }
function lastSeenText(c){
  if(isChatUserOnline(c)) return 'En línea ahora';
  const t = Number(c?.userLastSeen || 0);
  if(!t) return 'Sin actividad reciente';
  const mins = Math.max(1, Math.round((Date.now() - t)/60000));
  return mins <= 1 ? 'Se fue hace instantes' : 'Última actividad hace ' + mins + ' min';
}
let visitorPresenceTimer = null;
function markVisitorChatOnline(id){
  if(!id) return;
  try{
    update(ref(db,'tomauno/chats/'+id), {userOnline:true, userLastSeen:Date.now()}).catch(()=>{});
    try{ onDisconnect(ref(db,'tomauno/chats/'+id)).update({userOnline:false, userLastSeen:Date.now()}); }catch(e){}
    clearInterval(visitorPresenceTimer);
    visitorPresenceTimer = setInterval(()=>{
      if(currentVisitorChatId === id) update(ref(db,'tomauno/chats/'+id), {userOnline:true, userLastSeen:Date.now()}).catch(()=>{});
    }, 25000);
  }catch(e){}
}
window.addEventListener('beforeunload', () => { if(currentVisitorChatId){ try{ update(ref(db,'tomauno/chats/'+currentVisitorChatId), {userOnline:false, userLastSeen:Date.now()}); }catch(e){} } });
function chatHtmlWrap(inner){ return '<button class="chat-max-btn" title="Ampliar chat" onclick="window.toggleChatExpanded()">⛶</button><button class="chat-popover-close" title="Minimizar chat" onclick="window.cerrarChatPopover()">−</button><div class="chat-popover-inner">'+inner+'</div>'; }
let chatToolsCollapsed = false;
window.toggleChatExpanded = () => { const p=document.getElementById('chat-popover'); if(p) { p.classList.toggle('expanded'); if(p.classList.contains('expanded')) p.classList.remove('dragged'); } };
function setChatPopover(html){ const p=document.getElementById('chat-popover'); if(!p) return; p.innerHTML=chatHtmlWrap(html); p.classList.add('open'); p.classList.toggle('chat-tools-collapsed', !!chatToolsCollapsed); enableChatWindowControls(); }
window.cerrarChatPopover = () => { const p=document.getElementById('chat-popover'); if(p) p.classList.remove('open'); currentOpenChatId=''; };
window.toggleChatTools = () => { chatToolsCollapsed = !chatToolsCollapsed; const p=document.getElementById('chat-popover'); if(p) p.classList.toggle('chat-tools-collapsed', chatToolsCollapsed); const b=document.getElementById('chat-tools-toggle'); if(b){ b.classList.toggle('on', !chatToolsCollapsed); b.textContent = chatToolsCollapsed ? '▴' : '▾'; } };
function enableChatWindowControls(){
  const p=document.getElementById('chat-popover'); if(!p || p.dataset.dragReady==='1') return;
  p.dataset.dragReady='1';
  let dragging=false, sx=0, sy=0, sl=0, st=0;
  p.addEventListener('mousedown', (ev)=>{
    if(window.innerWidth < 760) return;
    const head = ev.target.closest && ev.target.closest('.chat-head');
    if(!head || ev.target.closest('button,a,input,textarea,select')) return;
    dragging=true; sx=ev.clientX; sy=ev.clientY;
    const r=p.getBoundingClientRect(); sl=r.left; st=r.top;
    p.classList.add('dragged'); p.classList.remove('expanded');
    p.style.left=sl+'px'; p.style.top=st+'px'; p.style.right='auto'; p.style.bottom='auto'; p.style.transform='none';
    ev.preventDefault();
  });
  window.addEventListener('mousemove', (ev)=>{
    if(!dragging) return;
    const nx=Math.max(8, Math.min(window.innerWidth - p.offsetWidth - 8, sl + ev.clientX - sx));
    const ny=Math.max(8, Math.min(window.innerHeight - p.offsetHeight - 8, st + ev.clientY - sy));
    p.style.left=nx+'px'; p.style.top=ny+'px';
  });
  window.addEventListener('mouseup', ()=>{ dragging=false; });
}


const DEFAULT_CHAT_QUICK = [
  {label:'📍 Ubicación', text:'📍 Estamos en Pedro Méndez 2069, Posadas, Misiones. Te dejo el mapa: https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D\n#ubicacion'},
  {label:'📲 Instagram', text:'📲 Nuestros Instagram son:\n@tomaunoestudio\n@tomaunomodels\n@tomaunocapacitaciones'},
  {label:'💬 WhatsApp', text:'💬 También podés escribirme directo por WhatsApp: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%20Cursos%20y%20Capacitaciones%2C%20quisiera%20hacer%20una%20consulta.'},
  {label:'🎓 Cursos', text:'🎓 En la sección CURSOS de esta web podés ver las capacitaciones disponibles. Si querés, decime cuál te interesa y te paso más detalles.\n#cursos'},
  {label:'📷 Sesiones', text:'📷 Hacemos sesiones fotográficas, books, retratos, moda y contenido para redes. Contame qué tipo de sesión buscás y te oriento.\n#servicios'}
];
function chatQuickList(){
  const custom = Object.entries(asistenteDB?.quickReplies || {})
    .filter(([,q]) => q && q.activo !== false && q.label && q.text)
    .sort((a,b)=>(a[1].orden||0)-(b[1].orden||0))
    .map(([,q]) => ({label:q.label, text:q.text}));
  return custom.length ? custom : DEFAULT_CHAT_QUICK;
}
function quickReplyIcon(label){
  const m = String(label || '').match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  if(m) return m[0];
  const clean = String(label || '?').trim();
  return clean ? clean[0].toUpperCase() : '?';
}
function quickReplyLabelText(label){
  // v33.17: evita doble icono en botones rápidos.
  // Si el label ya empieza con emoji, el emoji queda en qr-ico y se quita del texto.
  return String(label || '').replace(/^[\s\uFE0F\u200D]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}][\uFE0F\u200D]*\s*/u, '').trim() || String(label || '').trim();
}
function quickRepliesHtml(){
  const list = chatQuickList();
  return '<div class="chat-quick-label">Respuestas rápidas:</div><div class="chat-quick-wrap">'+list.map((q,i)=>'<button class="chat-quick" title="'+escAttr(q.label)+'" aria-label="'+escAttr(q.label)+'" onclick="window.usarRespuestaRapida('+i+')"><span class="qr-ico">'+escHtml(quickReplyIcon(q.label))+'</span><span class="qr-text">'+escHtml(quickReplyLabelText(q.label))+'</span></button>').join('')+'</div>';
}
window.usarRespuestaRapida = (idx) => {
  const q = chatQuickList()[idx]; if(!q) return;
  const inp = document.getElementById('chat-admin-text');
  if(inp && currentOpenChatId){ window.enviarChatAdmin(currentOpenChatId, q.text); return; }
  if(inp){ inp.value = q.text; inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
};

window.abrirChatTomauno = () => {
  unlockAudio();
  const popToggle = document.getElementById('chat-popover');
  // Si el chat está abierto y el usuario toca nuevamente el botón flotante, se minimiza.
  if (popToggle && popToggle.classList.contains('open')) {
    window.cerrarChatPopover && window.cerrarChatPopover();
    return;
  }
  // Si este navegador quedó habilitado como administrador, el botón de chat SIEMPRE abre la bandeja admin.
  // Antes usaba solo adminOk/admin-section y al salir del panel te trataba como visitante aunque el indicador dijera ADM activo.
  if (isAdminNotifier()) {
    // v33.15: el botón del operador abre la bandeja por defecto.
    // Así siempre se ven los indicadores de actividad antes de elegir una conversación.
    return abrirPanelChatsAdmin();
  }
  document.getElementById('chat-fab')?.classList.remove('has-new');
  if (currentVisitorChatId && chatsDB[currentVisitorChatId] && chatsDB[currentVisitorChatId].status !== 'cerrado') return abrirChatVisitante(currentVisitorChatId);
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">' +
    '<div class="chat-bubble admin"><div>Hola 😊<br/><b>¿Cómo es tu nombre?</b></div><div class="chat-meta">Ahora</div></div>' +
    '</div>' +
    '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">➜</button></div></div>'
  );
  setTimeout(()=>{
    const inp = document.getElementById('chat-name');
    if(inp){ try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } }
  }, 80);
};

window.iniciarChatConNombre = async () => {
  const rawName = (document.getElementById('chat-name')?.value || '').trim();
  const name = limpiarNombreChat(rawName);
  if(!name || /^(hola|buenas|ok|dale|a)$/i.test(name)){ toast('⚠️ Escribí tu nombre para iniciar'); return; }
  const now = Date.now();
  const chatRef = await push(ref(db,'tomauno/chats'), {name, wp:'', status:'abierto', createdAt:now, updatedAt:now, lastMsg:rawName, unreadAdmin:true, unreadVisitor:false, userOnline:true, userLastSeen:now});
  currentVisitorChatId = chatRef.key;
  try{
    sessionStorage.setItem('tomauno-chat-id', currentVisitorChatId);
    sessionStorage.setItem('tomauno-chat-name', name);
  }catch(e){}
  // v19: guardar el nombre como primer mensaje real, para que el admin reciba aviso desde el inicio.
  try{ await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {from:'user', text:rawName, time:chatTime(), createdAt:now}); }catch(e){}
  try{ await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {from:'admin', text:'Hola '+name+' 👋 ¿En qué puedo ayudarte?', time:chatTime(), createdAt:Date.now(), auto:true}); }catch(e){}
  abrirChatVisitante(currentVisitorChatId);
};

function isGenericChatName(n){ return /^(consulta web|sin nombre|visitante|usuario\s+[a-z]|hola|buenas|consulta)$/i.test(String(n||'').trim()); }
function chatWhatsappUrl(chat){
  const n = chatVisibleName(chat || {});
  const nombreReal = n && !/^Usuario\s+[A-Z]$/i.test(n) && !isGenericChatName(n);
  const msg = nombreReal
    ? ('Hola soy ' + n + ', vengo de la web Tomauno y quiero continuar mi consulta.')
    : 'Hola Javier, vengo de la web Tomauno y quiero continuar mi consulta.';
  return 'https://wa.me/5493764354522?text=' + encodeURIComponent(msg);
}
function isExternalOnlyLink(url){ return /(wa\.me|api\.whatsapp\.com|whatsapp\.com|drive\.google\.com|docs\.google\.com|sheets\.google\.com|forms\.gle|instagram\.com|google\.com\/maps|maps\.app\.goo\.gl)/i.test(String(url||'')); }
function lastAdminAskedName(chat){
  const last = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin');
  return !!(last && /nombre|como\s+te\s+llamas|cómo\s+te\s+llamás|como\s+es\s+tu\s+nombre|cómo\s+es\s+tu\s+nombre/i.test(String(last[1].text||'')));
}
function isJustNameReply(text, chat){
  const n = extraerNombreAI(text);
  if(!n) return '';
  if(lastAdminAskedName(chat)) return n;
  const raw = String(text||'').trim();
  if(/^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw)) return n;
  if(!tieneNombreRealChat(chat) && /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}(\s+[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}){0,2}$/.test(raw)) return n;
  return '';
}
function chatCopyTokenHtml(value){
  const val = String(value || '').trim();
  if(!val) return '';
  return '<span class="chat-copy-card"><span>'+escHtml(val)+'</span><button class="chat-copy-btn" onclick="event.preventDefault();event.stopPropagation();window.copiarTextoChat(\''+escAttr(val)+'\')">Copiar</button></span>';
}
window.copiarTextoChat = (txt) => {
  const val = String(txt || '');
  if(!val) return;
  navigator.clipboard?.writeText(val).then(()=>toast('Copiado', true)).catch(()=>{
    try{ const ta=document.createElement('textarea'); ta.value=val; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Copiado', true); }catch(e){ toast('No se pudo copiar'); }
  });
};
function chatLinkify(text, chat){
  const original = String(cleanChatDisplayText(text || ''));
  const copyTokens = [];
  // Los bloques copiables usan !texto!, pero evitamos convertir partes internas de URLs largas
  // como Google Maps (ej: .../data=!3m1!4b1...), porque eso ensucia el mensaje.
  const withMarkers = original.replace(/(^|[\s(])!([^!\n]{1,80})!(?=$|[\s).,;:!?])/g, function(m, pre, val){
    const raw = String(val || '').trim();
    if(!raw || raw.length > 60 || /https?:\/\//i.test(raw) || /[\/\\]/.test(raw)) return m;
    const idx = copyTokens.push(raw) - 1;
    return pre + '§§COPY'+idx+'§§';
  });
  let safe = escHtml(withMarkers);
  // Negrita simple estilo Markdown: **texto**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Cursiva simple: _texto_ o *texto*
  safe = safe.replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');
  safe = safe.replace(/(^|\s)\*([^*]+)\*(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');
  safe = safe.replace(/§§COPY(\d+)§§/g, function(m, n){ return chatCopyTokenHtml(copyTokens[Number(n)] || ''); });
  // Links cliqueables
  safe = safe.replace(/(https?:\/\/[^\s<]+)/g, function(url){
    const clean = url.replace(/[.,;!?)]$/,'');
    const tail = url.slice(clean.length);
    let safeClean = clean.replace(/&quot;/g,'').replace(/'/g,'%27');
    if(/(wa\.me|api\.whatsapp\.com).*3764354522/i.test(safeClean)) safeClean = chatWhatsappUrl(chat || {});
    let label = safeClean;
    if(/google\.com\/maps|maps\.app\.goo\.gl/i.test(safeClean)) label = 'Abrir Google Maps';
    else if(/wa\.me|api\.whatsapp\.com|whatsapp\.com/i.test(safeClean)) label = 'Abrir WhatsApp';
    else if(/drive\.google\.com|docs\.google\.com|sheets\.google\.com|forms\.gle/i.test(safeClean)) label = 'Abrir archivo';
    else if(safeClean.length > 62) label = safeClean.slice(0, 50) + '...';
    const extra = isExternalOnlyLink(safeClean) ? '' : '<button class="chat-open-inline" onclick="event.preventDefault();event.stopPropagation();window.previsualizarLinkChat(\'' + safeClean + '\')">ver aquí</button>';
    return '<a class="chat-link" href="'+safeClean+'" target="_blank" rel="noopener noreferrer">'+label+'</a>'+extra+tail;
  });
  // Instagram cliqueable, evitando que el punto final quede pegado al usuario.
  safe = safe.replace(/(^|\s)@([a-zA-Z0-9._]{2,30})/g, function(m, pre, handle){
    const clean = String(handle).replace(/[.]+$/,'');
    const tail = handle.slice(clean.length);
    if(!clean || clean.length < 2) return m;
    return pre + '<a class="chat-link ig" href="https://instagram.com/'+clean+'" target="_blank" rel="noopener noreferrer">@'+clean+'</a>' + tail;
  });
  // Teléfonos argentinos simples a WhatsApp
  safe = safe.replace(/(^|\s)(\+?54\s?9?\s?)?(\d{3,4}[\s-]?\d{6,8})(?=\s|$|[.,;!?)])/g, function(m, pre, pref, num){
    const clean = String(num).replace(/\D/g,'');
    if(clean.length < 8) return m;
    return pre + '<a class="chat-link" href="https://wa.me/549'+clean+'" target="_blank" rel="noopener noreferrer">'+num+'</a>';
  });
  return safe.replace(/\n/g,'<br>');
}
function chatActionButtonsForMessage(text){
  const t = normAI(text || '');
  const btns = parseChatActions(text || '');
  if(t.includes('cursos activos') || t.includes('seccion cursos') || t.includes('ver cursos')) btns.push({label:'🎓 Ver cursos', sec:'sec-cursos'});
  if(t.includes('eventos activos') || t.includes('seccion eventos') || t.includes('ver eventos')) btns.push({label:'🎪 Ver eventos', sec:'sec-eventos'});
  if(t.includes('servicios disponibles') || t.includes('seccion servicios') || t.includes('ver servicios')) btns.push({label:'📷 Ver servicios', sec:'sec-servicios'});
  if(t.includes('direccion del estudio') || t.includes('seccion ubicacion') || t.includes('pedro mendez')) btns.push({label:'📍 Ver ubicación', sec:'sec-ubicacion'});
  if(t.includes('google maps') || t.includes('maps.app.goo.gl')) btns.push({label:'🗺️ Abrir mapa', url:'https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D'});
  if(!btns.length) return '';
  return '<div class="chat-action-row">' + btns.map(b => b.url
    ? '<button class="chat-action-btn" onclick="window.open(\''+b.url+'\',\'_blank\')">'+b.label+'</button>'
    : '<button class="chat-action-btn" onclick="window.chatGoToSection(\''+b.sec+'\')">'+b.label+'</button>'
  ).join('') + '</div>';
}
window.chatGoToSection = (id) => {
  navScroll(id);
};
function renderMsgs(chat, adminView=false, chatId=''){
  return chatMsgs(chat).map(([mid,m]) => {
    const editBtn = adminView && m.from === 'admin' ? '<button class="chat-edit-mini" title="Editar respuesta" onclick="event.stopPropagation();window.editarMensajeChat(\''+chatId+'\',\''+mid+'\')">✎</button>' : '';
    const cls = m.typing ? 'typing' : (m.from==='admin'?'admin':m.from==='system'?'system':'user');
    const actions = (!m.typing && (m.from==='admin' || m.from==='system')) ? chatActionButtonsForMessage(m.text || '') : '';
    const waitStart = m.humanWait ? Number(chat?.humanWaitStartedAt || m.createdAt || 0) : 0;
    const waitCountdown = waitStart ? '<div class="chat-human-countdown" data-human-wait-start="'+waitStart+'"><span class="chat-human-countdown-num">60</span>s para intentar conectar con Javier</div>' : '';
    return '<div class="chat-bubble '+cls+'"><div>'+chatLinkify(m.text||'')+editBtn+'</div>'+waitCountdown+actions+(m.from==='system'?'':'<div class="chat-meta">'+escHtml(m.time||'')+'</div>')+'</div>';
  }).join('');
}
function scrollChatSmart(box){
  if(!box) return;
  const bubbles = box.querySelectorAll('.chat-bubble');
  const last = bubbles[bubbles.length - 1];
  if(!last){ box.scrollTop = box.scrollHeight; return; }
  box.scrollTop = box.scrollHeight;
}
function updateChatMessagesOnly(id, adminView){
  const box=document.getElementById('chat-msgs'); if(!box) return;
  const chat=chatsDB[id]||{};
  const html = renderMsgs(chat, adminView, id);
  if(box.dataset.lastHtml !== html){ box.innerHTML=html; box.dataset.lastHtml=html; scrollChatSmart(box); }
}

function abrirChatVisitante(id, silent=false){
  currentOpenChatId = id;
  markVisitorChatOnline(id);
  const chat = chatsDB[id] || {};
  const inputVal = document.getElementById('chat-text')?.value || '';
  const wasFocused = document.activeElement?.id === 'chat-text';
  const msgs = renderMsgs(chat, false, id);
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">'+escHtml(chatVisibleName(chat,id))+' · '+(isAdminOnline()?'🟢 Admin en línea':'⚫ Admin fuera de línea')+'</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">' + (msgs || '<div class="chat-bubble admin">Hola '+escHtml(chat.name||'')+' 👋 ¿En qué puedo ayudarte?</div>') +
    '' +
    '</div>' +
    '<div class="chat-row"><input class="finput" id="chat-text" placeholder="Escribí tu mensaje..." value="'+escAttr(inputVal)+'" onkeydown="if(event.key===\'Enter\')window.enviarChatVisitante(\''+id+'\')"/><button class="chat-send" onclick="window.enviarChatVisitante(\''+id+'\')">➜</button></div>' +
    '</div>'
  );
  update(ref(db,'tomauno/chats/'+id), {unreadVisitor:false}).catch(()=>{});
  maybeRunVisitorActionTags(id, chat);
  setTimeout(()=>{const el=document.getElementById('chat-msgs'); if(el) scrollChatSmart(el); const inp=document.getElementById('chat-text'); if(inp && (!silent || wasFocused)){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }},60);
}

window.enviarChatVisitante = async (id) => {
  const inp = document.getElementById('chat-text');
  const text = inp?.value.trim();
  if(!text) return;
  inp.value=''; inp.focus();
  const existingChat = chatsDB?.[id] || {};
  let fallbackName = '';
  try{ fallbackName = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}
  const detectedName = isJustNameReply(text, existingChat);
  const repairedName = limpiarNombreChat(detectedName || existingChat.name || fallbackName || chatAnonName(id, existingChat));
  // Repara metadata si el chat fue borrado parcialmente desde Firebase mientras el visitante conservaba el id en su pestaña.
  await update(ref(db,'tomauno/chats/'+id), {
    name: repairedName,
    status:'abierto',
    updatedAt:Date.now(),
    lastMsg:text,
    unreadAdmin:true,
    userOnline:true,
    userLastSeen:Date.now()
  });
  await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'user', text, time:chatTime(), createdAt:Date.now()});
  await update(ref(db,'tomauno/chats/'+id), {updatedAt:Date.now(), lastMsg:text, status:'abierto', unreadAdmin:true, userOnline:true, userLastSeen:Date.now(), name:repairedName});
  try{ if(detectedName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}
  // Si solo respondió su nombre porque se lo pedimos, no disparar una respuesta temática equivocada.
  if(detectedName && lastAdminAskedName(existingChat)) return;
  responderAutomaticoChat(id, text);
};


function chatAnonName(id, c){
  const raw = String(id || (c && (c.createdAt || c.updatedAt)) || 'anon');
  let h = 0;
  for(let i=0;i<raw.length;i++) h = ((h * 31) + raw.charCodeAt(i)) >>> 0;
  const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[h % 26] || 'A';
  return 'Usuario ' + letter;
}
function chatVisibleName(c, id){
  const n = String((c && c.name) || '').trim();
  if(n && !isGenericChatName(n)) return n;
  return chatAnonName(id, c);
}
function chatLastActivityLabel(c){
  const t = Number(c?.updatedAt || c?.createdAt || 0);
  if(!t) return '';
  try{ return new Date(t).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; }
}
function chatNeedsReply(c){
  if(!c) return false;
  return !!(c.unreadAdmin || c.humanRequested);
}
function chatStatusLabel(c){
  if(!c) return 'abierto';
  if(c.unreadAdmin) return 'Esperando';
  if(c.humanRequested) return 'Prioridad';
  if(isChatUserOnline(c)) return 'Online';
  return c.status === 'cerrado' ? 'Cerrado' : 'Al día';
}
window.editarNombreChat = (id) => {
  const c = chatsDB[id]; if(!c) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR NOMBRE</div>'+
    '<div class="msub" style="margin-bottom:12px;">Acomodá el nombre para ordenar mejor la bandeja.</div>'+
    '<input class="finput" id="chat-edit-name" value="'+escAttr((c.name && !/^consulta web$/i.test(c.name)) ? c.name : '')+'" placeholder="Nombre del contacto" onkeydown="if(event.key===\'Enter\')document.getElementById(\'chat-name-save\').click()"/>'+
    '<button class="btn-main" id="chat-name-save">💾 Guardar nombre</button>'+
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  setTimeout(()=>document.getElementById('chat-edit-name')?.focus(),80);
  document.getElementById('chat-name-save').onclick = async () => {
    const name = limpiarNombreChat(document.getElementById('chat-edit-name')?.value.trim() || '');
    if(!name){ toast('Escribí un nombre válido'); return; }
    await update(ref(db,'tomauno/chats/'+id), {name, updatedAt:Date.now()});
    closeModal(); abrirChatAdmin(id, true); toast('✅ Nombre actualizado', true);
  };
};

function abrirPanelChatsAdmin(){
  currentOpenChatId = '';
  let lista = Object.entries(chatsDB).filter(([,c]) => isValidChat(c)).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
  if (chatListFilter === 'abiertos') lista = lista.filter(([,c]) => c.status !== 'cerrado');
  if (chatListFilter === 'cerrados') lista = lista.filter(([,c]) => c.status === 'cerrado');
  const validChats = Object.values(chatsDB).filter(c => isValidChat(c));
  const total = validChats.length;
  const abiertosCount = validChats.filter(c=>c.status !== 'cerrado').length;
  const cerradosCount = validChats.filter(c=>c.status === 'cerrado').length;
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">📥</div><div><div class="chat-title">BANDEJA DE CHATS</div><div class="chat-subline">'+total+' conversación'+(total!==1?'es':'')+' desde la web</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Activar/desactivar automático" onclick="window.toggleModoAsistenteChat()">🤖</button><button class="chat-icon-btn" title="Activar notificaciones" onclick="window.pedirPermisoNotificaciones()">🔔</button></div></div>' +
    '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;">' +
    '<button class="chat-filter '+(chatListFilter==='abiertos'?'on':'')+'" onclick="window.setChatListFilter(\'abiertos\')">Abiertos '+abiertosCount+'</button>' +
    '<button class="chat-filter '+(chatListFilter==='cerrados'?'on':'')+'" onclick="window.setChatListFilter(\'cerrados\')">Cerrados '+cerradosCount+'</button>' +
    '<button class="chat-filter '+(chatListFilter==='todos'?'on':'')+'" onclick="window.setChatListFilter(\'todos\')">Todos '+total+'</button>' +
    '<button class="chat-filter" onclick="window.verResumenConsultasChat()">📋 Resumen</button>' +
    '<button class="chat-clean-btn" onclick="window.limpiarChatsDefinitivo()">🧹 Limpiar chats</button>' +
    '</div>' +
    (lista.length ? lista.map(([id,c]) => '<div class="chat-list-item '+(c.unreadAdmin?'unread ':'')+((c.humanRequested||c.prioridad||c.awaitingHumanContact)?'priority':'')+'" onclick="window.abrirChatAdmin(\''+id+'\')"><div style="flex:1;min-width:0;"><div style="font-weight:800;font-size:14px;">'+((c.humanRequested||c.prioridad||c.awaitingHumanContact)?'⭐ ':'')+(c.updatedAt && c.createdAt && (c.updatedAt-c.createdAt)>60000?'🔁 ':'')+escHtml(chatVisibleName(c,id))+'</div><div style="font-size:11px;color:var(--text3);margin-top:2px;max-width:245px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escHtml(((c.humanRequested||c.prioridad||c.awaitingHumanContact)?'Atención Javier · ':'')+(c.lastMsg||''))+'</div>'+(c.wp?'<div style="font-size:11px;color:#25d366;margin-top:2px;">WP: '+escHtml(c.wp)+'</div>':'')+'</div><span class="chat-status '+(c.unreadAdmin?'new':c.status==='abierto'?'on':'')+'">'+(c.unreadAdmin?'Nuevo':escHtml(c.status||'abierto'))+'</span><button class="chat-trash" title="Eliminar chat" onclick="event.stopPropagation();window.eliminarChatDefinitivo(\''+id+'\')">🗑️</button></div>').join('') : '<div style="color:var(--text3);font-size:13px;padding:20px;text-align:center;">Sin chats en este filtro</div>')
  );
}
window.setChatListFilter = (f) => { chatListFilter = f || 'abiertos'; abrirPanelChatsAdmin(); };
window.abrirPanelChatsAdmin = abrirPanelChatsAdmin;

function primerMensajeUsuario(chat){
  const arr = chatMsgs(chat).filter(([,m]) => m.from === 'user');
  return arr.length ? (arr[0][1].text || '') : (chat.lastMsg || '');
}
function resumenConsultasChatHtml(){
  const lista = Object.entries(chatsDB).filter(([,c]) => isValidChat(c)).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
  if(!lista.length) return '<div style="color:var(--text3);font-size:13px;padding:20px;text-align:center;">Sin consultas registradas</div>';
  return '<div style="overflow:auto;max-height:48vh;border:1px solid var(--border);border-radius:14px;"><table style="min-width:640px;font-size:12px;"><thead><tr><th>Nombre</th><th>WhatsApp</th><th>Tema</th><th>Consulta</th><th>Estado</th><th>Acc.</th></tr></thead><tbody>' + lista.map(([id,c]) => {
    const wp = String(c.wp||'').replace(/\D/g,'');
    const consulta = primerMensajeUsuario(c);
    const tema = c.temaPrincipal || detectarTemaConsulta(consulta);
    return '<tr><td><strong>'+escHtml(chatVisibleName(c,id))+'</strong></td><td>'+(wp?'<a class="wabtn" target="_blank" rel="noopener noreferrer" href="https://wa.me/549'+wp+'">'+escHtml(c.wp)+'</a>':'<span class="tds">-</span>')+'</td><td>'+escHtml(tema||'-')+'</td><td style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escHtml(consulta||'-')+'</td><td>'+escHtml(c.status||'abierto')+'</td><td><button class="bsm bl" onclick="window.abrirChatAdmin(\''+id+'\')">Leer</button></td></tr>';
  }).join('') + '</tbody></table></div>';
}
window.verResumenConsultasChat = () => {
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">📋</div><div><div class="chat-title">RESUMEN DE CONSULTAS</div><div class="chat-subline">Nombre, WhatsApp, tema y consulta principal</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Volver" onclick="abrirPanelChatsAdmin()">←</button></div></div>' +
    resumenConsultasChatHtml() +
    '<div style="display:flex;gap:8px;margin-top:12px;"><button class="btn-out" onclick="abrirPanelChatsAdmin()" style="flex:1;">← Bandeja</button></div>'
  );
};

function adminChatTabsHtml(activeId){
  const abiertos = Object.entries(chatsDB)
    .filter(([,c]) => isValidChat(c) && c.status !== 'cerrado')
    .sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
  if (!abiertos.length) return '';
  return '<div class="chat-tabs chat-inbox-side">' + abiertos.slice(0,12).map(([id,c]) => {
    const status = chatStatusLabel(c);
    const time = chatLastActivityLabel(c);
    const preview = String((c.humanRequested ? 'Atención Javier · ' : '') + (c.lastMsg || '')).trim();
    const cls = [
      'chat-tab',
      id===activeId ? 'active' : '',
      c.unreadAdmin ? 'unread' : '',
      c.humanRequested ? 'priority' : '',
      isChatUserOnline(c) ? 'online' : '',
      chatNeedsReply(c) ? 'waiting' : 'answered'
    ].filter(Boolean).join(' ');
    return '<button class="'+cls+'" onclick="window.abrirChatAdmin(\''+id+'\')">'
      + '<span class="chat-tab-light" title="'+escAttr(status)+'"></span>'
      + '<span class="chat-tab-body"><span class="chat-tab-name">'+escHtml(chatVisibleName(c,id))+'</span>'
      + '<span class="chat-tab-preview">'+escHtml(preview || status)+'</span>'
      + '<span class="chat-tab-foot">'+escHtml(status)+(time?' · '+escHtml(time):'')+'</span></span>'
      + '<span class="chat-tab-close" title="Cerrar" onclick="event.stopPropagation();window.cerrarConversacionChat(\''+id+'\')">×</span>'
      + '</button>';
  }).join('') + '</div>';
}

window.eliminarChatDefinitivo = (id) => {
  const c = chatsDB[id] || {};
  showConfirm('¿Eliminar definitivamente el chat de ' + chatVisibleName(c,id) + '? Esto borra todo el historial de Firebase.', async () => {
    await remove(ref(db,'tomauno/chats/'+id));
    try{ notifiedChatIds.delete(id); localStorage.setItem('tomauno-chat-notified', JSON.stringify([...notifiedChatIds])); }catch(e){}
    toast('🗑️ Chat eliminado');
    abrirPanelChatsAdmin();
  });
};


window.limpiarChatsDefinitivo = () => {
  const validChats = Object.entries(chatsDB).filter(([,c]) => isValidChat(c));
  if (!validChats.length) { toast('No hay chats para limpiar'); return; }
  showConfirm('¿Eliminar definitivamente TODOS los chats visibles de Firebase? Esta acción no se puede deshacer.', async () => {
    await remove(ref(db,'tomauno/chats'));
    try{ notifiedChatIds = new Set(); localStorage.setItem('tomauno-chat-notified', '[]'); }catch(e){}
    currentOpenChatId = '';
    toast('🧹 Chats eliminados');
    abrirPanelChatsAdmin();
  });
};

window.cerrarConversacionChat = async (id) => {
  await update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()});
  if(currentOpenChatId && currentOpenChatId !== id && chatsDB[currentOpenChatId] && chatsDB[currentOpenChatId].status !== 'cerrado'){
    abrirChatAdmin(currentOpenChatId, true);
  }else{
    currentOpenChatId = '';
    abrirPanelChatsAdmin();
  }
};

window.abrirChatAdmin = (id, silent=false) => {
  currentOpenChatId = id;
  const chat = chatsDB[id] || {};
  const inputVal = document.getElementById('chat-admin-text')?.value || '';
  const wasFocused = document.activeElement?.id === 'chat-admin-text';
  const msgs = renderMsgs(chat, true, id);
  setChatPopover(
    adminChatTabsHtml(id) +
    '<div class="chat-head"><div class="chat-avatar">👤</div><div><div class="chat-title"><span class="chat-online-dot '+(isChatUserOnline(chat)?'on':'')+'"></span>'+escHtml(chatVisibleName(chat))+'</div><div class="chat-subline">'+(chat.wp?'WhatsApp: '+escHtml(chat.wp)+' · ':'')+lastSeenText(chat)+'</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">'+msgs+'</div>' +
    '<div class="chat-row"><input class="finput" id="chat-admin-text" placeholder="Responder..." value="'+escAttr(inputVal)+'" onkeydown="if(event.key===\'Enter\')window.enviarChatAdmin(\''+id+'\')"/><button class="chat-send" onclick="window.enviarChatAdmin(\''+id+'\')">➜</button></div>' +
    '<div class="chat-admin-tools"><button class="chat-filter auto '+(asistenteModo()==='automatico'?'on':'')+'" title="Activar/desactivar automático" onclick="window.toggleModoAsistenteChat()">🤖 '+(asistenteModo()==='automatico'?'ON':'OFF')+'</button><button class="chat-filter" title="Ayuda / Machete" onclick="window.mostrarAyudaAsistente()">/?</button><button class="chat-filter" title="Respuestas del cerebro" onclick="window.mostrarSelectorCerebroChat(\''+id+'\')">//</button><button class="chat-filter" title="Acciones rápidas" onclick="window.mostrarAccionesChatAdmin(\''+id+'\')">⚡</button><button id="chat-tools-toggle" class="chat-filter chat-tools-toggle '+(!chatToolsCollapsed?'on':'')+'" title="Mostrar/ocultar botones" onclick="window.toggleChatTools()">'+(chatToolsCollapsed?'▴':'▾')+'</button></div>' +
    '<div class="chat-tools-block">' + quickRepliesHtml() +
    '<div class="chat-admin-actions"><button class="btn-out" title="Bandeja" onclick="abrirPanelChatsAdmin()"><span class="ico">←</span></button><button class="btn-out" title="Editar nombre" onclick="window.editarNombreChat(\''+id+'\')"><span class="ico">✏️</span></button><button class="btn-out" title="Copiar conversación" onclick="window.copiarHistorialChat(\''+id+'\')"><span class="ico">📋</span></button><button class="btn-out" title="Exportar TXT" onclick="window.exportarHistorialChat(\''+id+'\')"><span class="ico">⬇️</span></button><button class="btn-out danger" title="Cerrar chat" onclick="window.cerrarConversacionChat(\''+id+'\')"><span class="ico">✕</span></button><button class="btn-out danger" title="Borrar chat" onclick="window.eliminarChatDefinitivo(\''+id+'\')"><span class="ico">🗑️</span></button>' + (chat.wp?'<a class="btn-out" title="WhatsApp" style="text-align:center;text-decoration:none;color:#25d366;border-color:rgba(37,211,102,.35);" target="_blank" rel="noopener noreferrer" href="https://wa.me/549'+String(chat.wp||'').replace(/\D/g,'')+'"><span class="ico">💬</span></a>':'') + '</div></div></div>'
  );
  update(ref(db,'tomauno/chats/'+id), {unreadAdmin:false}).catch(()=>{});
  setTimeout(()=>{const el=document.getElementById('chat-msgs'); if(el) scrollChatSmart(el); const inp=document.getElementById('chat-admin-text'); if(inp && (!silent || wasFocused)){ inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }},60);
};

window.enviarChatAdmin = async (id, presetText='') => {
  const inp = document.getElementById('chat-admin-text');
  let text = String(presetText || inp?.value || '').trim();
  if(!text) return;
  if(!presetText){
    if(text === '/?'){ window.mostrarAyudaAsistente(); return; }
    if(text === '//'){ window.mostrarSelectorCerebroChat(id); if(inp) inp.value=''; return; }
    if(normAI(text) === '/acciones'){ window.mostrarAccionesChatAdmin(id); if(inp) inp.value=''; return; }
    if(/^\/info\b/i.test(text) || /^\/inscribir\b/i.test(text)){
      const isIns = /^\/inscribir\b/i.test(text);
      const query = text.replace(/^\/(info|inscribir)\b/i,'').trim();
      const match = bestPublishedTitleMatchAI(query || '');
      if(match){
        text = isIns
          ? 'Perfecto 😊 Te abro el formulario para **' + (match.obj.titulo || 'esta actividad') + '**. #inscripcion:' + match.type + ':' + match.id + '#'
          : 'Te muestro la información completa de **' + (match.obj.titulo || 'esta actividad') + '**. #info:' + match.type + ':' + match.id + '#';
      }else{
        toast('No encontré esa actividad. Probá /info fotografía o usá ⚡ Acciones.', true);
        return;
      }
    }else if(text.charAt(0) === '/'){
      const found = findKnowledgeByCommand(text);
      if(found){ text = applyAIVariables(found.k.respuesta || '', chatsDB[id] || {}); }
    }
  }
  text = applyAIVariables(text, chatsDB[id] || {});
  if(inp){ inp.value=''; inp.focus(); }
  await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'admin', text, time:chatTime(), createdAt:Date.now()});
  await update(ref(db,'tomauno/chats/'+id), {updatedAt:Date.now(), lastMsg:cleanChatDisplayText(text), status:'respondido', unreadVisitor:true, unreadAdmin:false});
};


window.copiarHistorialChat = async (id) => {
  const c = chatsDB[id]; if(!c) return;
  const lines = ['Historial chat Tomauno', 'Cliente: ' + chatVisibleName(c), c.wp ? ('WhatsApp: ' + c.wp) : '', 'Estado: ' + (c.status || 'abierto'), ''];
  chatMsgs(c).forEach(([,m]) => {
    if(m.typing) return;
    const who = m.from === 'user' ? chatVisibleName(c) : (m.auto ? 'Asistente Tomauno' : 'Tomauno');
    lines.push('[' + (m.time || '') + '] ' + who + ': ' + (m.text || ''));
  });
  try{ await navigator.clipboard.writeText(lines.filter(Boolean).join('\n')); toast('📋 Historial copiado', true); }
  catch(e){ toast('No pude copiar el historial'); }
};

function historialChatTextoPlano(id){
  const c = chatsDB[id]; if(!c) return '';
  const lines = ['Historial chat Tomauno', 'Cliente: ' + chatVisibleName(c), c.wp ? ('WhatsApp: ' + c.wp) : '', 'Estado: ' + (c.status || 'abierto'), ''];
  chatMsgs(c).forEach(([,m]) => {
    if(!m || m.typing) return;
    const who = m.from === 'user' ? chatVisibleName(c) : (m.auto ? 'Asistente Tomauno' : 'Tomauno');
    lines.push('[' + (m.time || '') + '] ' + who + ': ' + cleanChatDisplayText(m.text || ''));
  });
  return lines.filter(Boolean).join('\n');
}
window.exportarHistorialChat = (id) => {
  const txt = historialChatTextoPlano(id);
  if(!txt){ toast('No hay historial para exportar'); return; }
  const c = chatsDB[id] || {};
  const nombre = String(chatVisibleName(c) || 'chat').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'chat';
  const blob = new Blob(['\ufeff' + txt], {type:'text/plain;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tomauno-chat-' + nombre + '.txt';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 800);
  toast('⬇️ Chat exportado en TXT', true);
};
window.previsualizarLinkChat = (url) => {
  const clean = String(url||'').trim();
  if(!/^https?:\/\//i.test(clean)){ toast('Link inválido'); return; }
  if(/(wa\.me|api\.whatsapp\.com|whatsapp\.com|drive\.google\.com|docs\.google\.com|sheets\.google\.com|forms\.gle|instagram\.com|google\.com\/maps|maps\.app\.goo\.gl)/i.test(clean)){
    window.open(clean, '_blank', 'noopener,noreferrer');
    return;
  }
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">VISTA DEL LINK</div>'+
    '<div class="web-preview-note">Algunas webs bloquean verse dentro de otra página. Si no carga, usá “Abrir en pestaña”.</div>'+
    '<iframe class="web-preview-frame" src="'+escAttr(clean)+'" loading="lazy"></iframe>'+
    '<a class="btn-main" href="'+escAttr(clean)+'" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">Abrir en pestaña</a>'+
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};

window.editarMensajeChat = (chatId, msgId) => {
  const msg = chatsDB?.[chatId]?.messages?.[msgId];
  if(!msg || msg.from !== 'admin') return;
  const actual = msg.text || '';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR MENSAJE</div>'+
    '<div class="msub" style="margin-bottom:12px;">Corregí el texto de tu respuesta.</div>'+
    '<textarea class="finput" id="edit-chat-msg" style="min-height:120px;">'+escHtml(actual)+'</textarea>'+
    '<button class="btn-main" id="edit-chat-save">💾 Guardar mensaje</button>'+
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  setTimeout(()=>document.getElementById('edit-chat-msg')?.focus(),80);
  document.getElementById('edit-chat-save').onclick = async () => {
    const nuevo = document.getElementById('edit-chat-msg')?.value.trim();
    if(!nuevo){ toast('El mensaje no puede quedar vacío'); return; }
    await update(ref(db,'tomauno/chats/'+chatId+'/messages/'+msgId), {text:nuevo, editedAt:Date.now()});
    await update(ref(db,'tomauno/chats/'+chatId), {lastMsg:nuevo, updatedAt:Date.now()});
    closeModal(); abrirChatAdmin(chatId, true); toast('✅ Mensaje actualizado');
  };
};

function escAttr(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }


// ── ASISTENTE AUTOMÁTICO / CEREBRO ───────────────────────────────────────────
function normAI(t){
  return String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function asistenteModo(){ return asistenteDB?.modo || 'manual'; }
function asistenteKnowledgeEntries(){ return Object.entries(asistenteDB?.knowledge || {}).filter(([,k]) => k && k.activo !== false); }
function renderAsistenteAdmin(){
  const sel = document.getElementById('ai-mode');
  if(sel) sel.value = asistenteModo();
  const list = document.getElementById('ai-knowledge-list');
  if(!list) return;
  let entries = Object.entries(asistenteDB?.knowledge || {}).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0));
  const qSearch = normAI(document.getElementById('ai-knowledge-search')?.value || '');
  if(qSearch){
    entries = entries.filter(([id,k]) => normAI([k.titulo||'', k.command||'', k.keys||'', k.respuesta||''].join(' ')).includes(qSearch));
  }
  if(!entries.length){
    list.innerHTML = qSearch
      ? '<div style="color:var(--text3);font-size:13px;">No encontré resultados para esa búsqueda.</div>'
      : '<div style="color:var(--text3);font-size:13px;">Todavía no cargaste información extra. El asistente puede usar ubicación, WhatsApp, Instagram, cursos, eventos y servicios cargados.</div>';
    renderQuickRepliesAdmin();
    return;
  }
  list.innerHTML = entries.map(([id,k]) =>
    '<div class="ai-item">' +
    '<div style="flex:1;min-width:0;"><div class="ai-item-title">'+escHtml(k.titulo||'Sin título')+'</div>'+
    '<div style="margin-bottom:6px;">'+(k.command?'<span class="ai-pill">'+escHtml(k.command)+'</span>':'')+String(k.keys||'').split(',').filter(Boolean).map(x=>'<span class="ai-pill">'+escHtml(x.trim())+'</span>').join('')+'</div>'+
    '<div class="ai-item-answer">'+escHtml(k.respuesta||'')+'</div></div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">'+
    '<button class="bsm bl" onclick="window.editarInfoAsistente(\''+id+'\')">✏️ Editar</button>'+
    '<button class="bsm '+(k.activo===false?'gr':'bl')+'" onclick="window.toggleInfoAsistente(\''+id+'\','+(k.activo===false?'true':'false')+')">'+(k.activo===false?'Activar':'Pausar')+'</button>'+
    '<button class="bsm re" onclick="window.eliminarInfoAsistente(\''+id+'\')">🗑️</button></div></div>'
  ).join('');
  renderQuickRepliesAdmin();
}
window.buscarCerebroAdmin = () => renderAsistenteAdmin();
function renderQuickRepliesAdmin(){
  const box = document.getElementById('ai-quick-list');
  if(!box) return;
  const entries = Object.entries(asistenteDB?.quickReplies || {}).sort((a,b)=>(a[1].orden||0)-(b[1].orden||0));
  if(!entries.length){ box.innerHTML = '<div style="color:var(--text3);font-size:13px;">Si no cargás botones, se usan los botones rápidos predeterminados.</div>'; return; }
  box.innerHTML = entries.map(([id,q]) => '<div class="admin-ci"><div class="admin-ci-info"><div class="admin-ci-tit">'+escHtml(q.label||'Botón')+'</div><div class="admin-ci-sub" style="max-width:620px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escHtml(q.text||'')+'</div></div><button class="bsm re" onclick="window.eliminarRespuestaRapidaAsistente(\''+id+'\')">🗑️</button></div>').join('');
}
window.guardarModoAsistente = async () => {
  const modo = document.getElementById('ai-mode')?.value || 'manual';
  await update(ref(db,'tomauno/asistente'), {modo});
  toast(modo === 'automatico' ? '🤖 Modo automático activado' : '👤 Modo manual activado', true);
};
window.toggleModoAsistenteChat = async () => {
  const nuevo = asistenteModo() === 'automatico' ? 'manual' : 'automatico';
  await update(ref(db,'tomauno/asistente'), {modo:nuevo});
  toast(nuevo === 'automatico' ? '🤖 Asistente automático ON' : '👤 Asistente manual', true);
  const fab=document.getElementById('chat-fab');
  if(fab) fab.classList.toggle('auto-on', nuevo === 'automatico');
  if (isAdminNotifier() && currentOpenChatId) setTimeout(()=>abrirChatAdmin(currentOpenChatId, true), 80);
  else if (isAdminNotifier()) setTimeout(()=>abrirPanelChatsAdmin(), 80);
};

function asistenteCommandDuplicado(command, ignoreId=''){
  const c = normAI(command || '');
  if(!c) return null;
  return asistenteKnowledgeEntries().find(([id,k]) => id !== ignoreId && normAI(k.command || '') === c) || null;
}
window.agregarInfoAsistente = async () => {
  const titulo = document.getElementById('ai-title')?.value.trim();
  const keys = document.getElementById('ai-keys')?.value.trim();
  const command = document.getElementById('ai-command')?.value.trim();
  const respuesta = document.getElementById('ai-answer')?.value.trim();
  if(!titulo || !respuesta){ toast('⚠️ Completá título y respuesta'); return; }
  const dup = asistenteCommandDuplicado(command);
  if(dup){ toast('⚠️ Ese comando rápido ya está en uso: ' + command); return; }
  await push(ref(db,'tomauno/asistente/knowledge'), {titulo, keys:keys||'', command:command||'', respuesta, activo:true, creado:Date.now()});
  ['ai-title','ai-command','ai-keys','ai-answer'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  toast('✅ Información agregada al asistente', true);
};
window.editarInfoAsistente = (id) => {
  const k = asistenteDB?.knowledge?.[id]; if(!k) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR INFO DEL ASISTENTE</div>'+
    '<label class="flbl">Título / tema</label><input class="finput" id="eai-title" value="'+escAttr(k.titulo||'')+'"/>'+
    '<label class="flbl">Comando rápido opcional</label><input class="finput" id="eai-command" value="'+escAttr(k.command||'')+'" placeholder="Ej: /pack15, /alias, /equipos"/>'+
    '<label class="flbl">Palabras clave</label><input class="finput" id="eai-keys" value="'+escAttr(k.keys||'')+'"/>'+
    '<label class="flbl">Respuesta</label><textarea class="finput" id="eai-answer" style="min-height:150px;">'+escHtml(k.respuesta||'')+'</textarea>'+
    '<button class="btn-main" id="eai-save">💾 Guardar</button><button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  document.getElementById('eai-save').onclick = async () => {
    const newCmd = document.getElementById('eai-command')?.value.trim()||'';
    const dup = asistenteCommandDuplicado(newCmd, id);
    if(dup){ toast('⚠️ Ese comando rápido ya está en uso: ' + newCmd); return; }
    await update(ref(db,'tomauno/asistente/knowledge/'+id), {
      titulo:document.getElementById('eai-title')?.value.trim()||'',
      keys:document.getElementById('eai-keys')?.value.trim()||'',
      command:newCmd,
      respuesta:document.getElementById('eai-answer')?.value.trim()||'',
      actualizado:Date.now()
    });
    closeModal(); toast('✅ Información actualizada', true);
  };
};
window.toggleInfoAsistente = async (id, activo) => { await update(ref(db,'tomauno/asistente/knowledge/'+id), {activo}); };
window.eliminarInfoAsistente = (id) => {
  showConfirm('¿Eliminar esta información del cerebro del asistente?', async()=>{
    await remove(ref(db,'tomauno/asistente/knowledge/'+id));
    toast('🗑️ Información eliminada', true);
  });
};


window.agregarRespuestaRapidaAsistente = async () => {
  const label = document.getElementById('aiqr-label')?.value.trim();
  const text = document.getElementById('aiqr-text')?.value.trim();
  if(!label || !text){ toast('⚠️ Completá botón y respuesta'); return; }
  await push(ref(db,'tomauno/asistente/quickReplies'), {label, text, activo:true, orden:Date.now(), creado:Date.now()});
  ['aiqr-label','aiqr-text'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  toast('✅ Botón rápido agregado', true);
};
window.eliminarRespuestaRapidaAsistente = (id) => {
  showConfirm('¿Eliminar este botón rápido?', async()=>{
    await remove(ref(db,'tomauno/asistente/quickReplies/'+id));
    toast('🗑️ Botón rápido eliminado', true);
  });
};


// ── AYUDA / COMANDOS / ACCIONES DEL ASISTENTE ───────────────────────────────
function aiMacheteHtml(){
  return '<div class="mtitle">AYUDA RÁPIDA DEL ASISTENTE</div>'+
    '<div class="msub" style="margin-bottom:14px;">Machete para usar el Cerebro y el chat admin.</div>'+
    '<div style="font-size:13px;color:var(--text2);line-height:1.75;background:#0d0d0d;border:1px solid var(--border);border-radius:14px;padding:14px;">'+
    '<b>Variables</b><br>{{nombre}} = nombre del contacto del chat.<br><br>'+
    '<b>Acciones dentro de una respuesta</b><br>Ahora podés usar una sola almohadilla: #cursos · #servicios · #eventos · #testimonios · #estudio · #ubicacion · #preguntas · #contacto.<br>También acepta la forma anterior con cierre: #cursos#.<br>Ej: “Te muestro el estudio #estudio”.<br><br>'+
    '<b>Comandos en el chat admin</b><br>/? = ver esta ayuda<br>// = abrir lista de respuestas del Cerebro<br>/acciones = abrir acciones rápidas: Info / Inscribir / Ir a sección<br>/alias, /pack15, /equipos, etc. = si los configuraste en una ficha del Cerebro.<br><br>'+
    '<b>Formato</b><br>**negrita** · _cursiva_ · links y @instagram se vuelven cliqueables.<br>!texto! = crea un bloque con botón Copiar. Ej: Alias: !tomauno.mp!<br><br>'+
    '<b>Consejo</b><br>Para respuestas largas cargá una ficha por tema: Pack 15 años, Bodas, Alquiler de estudio, Alias de pago, Equipos.</div>'+
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
}
window.mostrarAyudaAsistente = () => { document.getElementById('mcontent').innerHTML = aiMacheteHtml(); openModal(); };
function applyAIVariables(text, chat){
  return String(text||'').replace(/{{\s*nombre\s*}}/gi, chatVisibleName(chat||{}) || '');
}
function findKnowledgeByCommand(cmd){
  const c = normAI(cmd || '');
  return asistenteKnowledgeEntries().map(([id,k])=>({id,k})).find(x => normAI(x.k.command||'') === c || String(x.k.keys||'').split(',').map(normAI).includes(c)) || null;
}
function chatActionTagMap(rawTag){
  const key = normAI(String(rawTag || '')).replace(/[^a-z0-9]/g,'');
  const map = {
    cursos:{label:'🎓 Ver cursos', sec:'sec-cursos'}, curso:{label:'🎓 Ver cursos', sec:'sec-cursos'},
    servicios:{label:'📷 Ver servicios', sec:'sec-servicios'}, servicio:{label:'📷 Ver servicios', sec:'sec-servicios'},
    eventos:{label:'🎪 Ver eventos', sec:'sec-eventos'}, evento:{label:'🎪 Ver eventos', sec:'sec-eventos'},
    testimonios:{label:'⭐ Ver testimonios', sec:'sec-testimonios'}, testimonio:{label:'⭐ Ver testimonios', sec:'sec-testimonios'}, resenas:{label:'⭐ Ver testimonios', sec:'sec-testimonios'}, reseñas:{label:'⭐ Ver testimonios', sec:'sec-testimonios'},
    estudio:{label:'🏢 Ver estudio', sec:'sec-galeria'}, elestudio:{label:'🏢 Ver estudio', sec:'sec-galeria'},
    ubicacion:{label:'📍 Ver ubicación', sec:'sec-ubicacion'}, ubicaciondelestudio:{label:'📍 Ver ubicación', sec:'sec-ubicacion'}, mapa:{label:'📍 Ver ubicación', sec:'sec-ubicacion'}, maps:{label:'📍 Ver ubicación', sec:'sec-ubicacion'},
    preguntas:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}, pregunta:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}, frecuentes:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}, faq:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}
  };
  if(key === 'contacto' || key === 'whatsapp') return {label:'💬 WhatsApp Javier', url:'https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%2C%20quisiera%20hacer%20una%20consulta.'};
  return map[key] || null;
}
const CHAT_SECTION_TAG_RE = /#\s*(el\s*estudio|estudio|cursos?|servicios?|eventos?|testimonios?|resenas|reseñas|ubicacion|ubicación|mapa|maps|preguntas\s+frecuentes|preguntas|frecuentes|faq|contacto|whatsapp)\s*#?/gi;
function cleanChatDisplayText(text){
  return String(text||'')
    .replace(/#\s*(info|inscripcion|inscripción):(curso|servicio|evento):([^#\n]+)#?/gi,'')
    .replace(CHAT_SECTION_TAG_RE,'')
    .trim();
}
function parseChatActions(text){
  const raw = String(text||'');
  const actions = [];
  const pushAction = (a) => {
    if(!a) return;
    if(a.sec && actions.some(x=>x.sec===a.sec)) return;
    if(a.url && actions.some(x=>x.url===a.url)) return;
    actions.push(a);
  };
  raw.replace(CHAT_SECTION_TAG_RE, (m, tag) => { pushAction(chatActionTagMap(tag)); return m; });
  raw.replace(/#\s*(info|inscripcion|inscripción):(curso|servicio|evento):([^#\n]+)#?/gi, (m, kind, type, id) => {
    const k = normAI(kind).startsWith('ins') ? 'inscripcion' : 'info';
    const label = (k==='inscripcion' ? '✍️ Inscribirme' : 'ℹ️ Ver info');
    actions.push({label, fn:k, type:normAI(type), id:String(id).trim()});
    return m;
  });
  return actions;
}
window.executeChatAction = (fn,type,id) => {
  setTimeout(()=>{
    try{
      if(type==='curso'){
        if(fn==='inscripcion' && window.abrirInscripcion) window.abrirInscripcion(id); else if(window.abrirDetalle) window.abrirDetalle(id);
      }else if(type==='servicio'){
        if(window.abrirServicioDB) window.abrirServicioDB(id); else navScroll('sec-servicios');
      }else if(type==='evento'){
        if(fn==='inscripcion' && window.abrirInscEvento) window.abrirInscEvento(id); else if(window.abrirDetalleEvento) window.abrirDetalleEvento(id);
      }
    }catch(e){ console.warn('executeChatAction', e); }
  },180);
};
function maybeRunVisitorActionTags(chatId, chat){
  if(!chatId || chatId !== currentVisitorChatId || isAdminNotifier()) return;
  const msgs = chatMsgs(chat).filter(([,m]) => m && m.from === 'admin' && !m.typing);
  if(!msgs.length) return;
  const [mid,last] = msgs[msgs.length-1];
  const key = 'tomauno-action-done-' + chatId;
  try{ if(sessionStorage.getItem(key) === mid) return; }catch(e){}
  const actions = parseChatActions(last.text || '');
  const auto = actions.find(a => a.sec || a.fn);
  if(!auto) return;
  try{ sessionStorage.setItem(key, mid); }catch(e){}
  setTimeout(()=>{
    if(auto.sec) navScroll(auto.sec);
    else if(auto.fn) window.executeChatAction(auto.fn, auto.type, auto.id);
  }, 650);
}
window.mostrarSelectorCerebroChat = (chatId) => {
  const entries = asistenteKnowledgeEntries().sort((a,b)=>String(a[1].titulo||'').localeCompare(String(b[1].titulo||'')));
  const rows = entries.length ? entries.map(([id,k]) => {
    const search = escAttr([k.titulo||'', k.command||'', k.keys||'', k.respuesta||''].join(' '));
    return '<div class="admin-ci" data-ai-item="1" data-ai-search="'+search+'">'+
      '<div class="admin-ci-info"><div class="admin-ci-tit">'+escHtml(k.titulo||'Sin título')+'</div><div class="admin-ci-sub">'+escHtml((k.command||'') + (k.keys?(' · '+k.keys):''))+'</div></div>'+
      '<button class="bsm bl" onclick="window.enviarFichaCerebroChat(\''+chatId+'\',\''+id+'\')">Enviar</button></div>';
  }).join('') : '<div style="color:var(--text3);font-size:13px;">No hay fichas cargadas.</div>';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">RESPUESTAS DEL CEREBRO</div><div class="msub">Elegí una respuesta para enviarla al chat.</div>'+
    '<div class="ai-selector-search"><input class="finput" id="ai-selector-search" placeholder="Buscar por título, comando o palabra clave..." oninput="window.filtrarSelectorCerebro()" autocomplete="off"/></div>'+
    '<div id="ai-selector-list">'+rows+'</div>'+
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
  setTimeout(()=>document.getElementById('ai-selector-search')?.focus(),80);
};
window.filtrarSelectorCerebro = () => {
  const q = normAI(document.getElementById('ai-selector-search')?.value || '');
  document.querySelectorAll('[data-ai-item="1"]').forEach(el => {
    const txt = normAI(el.getAttribute('data-ai-search') || el.textContent || '');
    el.style.display = (!q || txt.includes(q)) ? '' : 'none';
  });
};
window.enviarFichaCerebroChat = (chatId,id) => {
  const k = asistenteDB?.knowledge?.[id]; if(!k) return;
  closeModal();
  window.enviarChatAdmin(chatId, applyAIVariables(k.respuesta||'', chatsDB[chatId]||{}));
};
function actionRowsFor(kind, chatId){
  let entries = [];
  if(kind==='curso') entries = Object.entries(cursos||{}).filter(([,c])=>!c.oculto);
  if(kind==='servicio') entries = Object.entries(serviciosDB||{}).filter(([,s])=>!s.oculto);
  if(kind==='evento') entries = Object.entries(eventosDB||{}).filter(([,e])=>e.estado==='activo' && !e.oculto);
  return entries.sort((a,b)=>String(a[1].titulo||'').localeCompare(String(b[1].titulo||''))).map(([id,x])=>{
    const titulo = x.titulo || (kind==='curso'?'Curso':kind==='servicio'?'Servicio':'Evento');
    return '<div class="admin-ci"><div class="admin-ci-info"><div class="admin-ci-tit">'+escHtml(titulo)+'</div><div class="admin-ci-sub">'+(x.fecha?escHtml(fFecha(x.fecha)):'')+(x.costo?' · '+escHtml(moneyAI(x.costo)):'')+'</div></div><div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="bsm bl" onclick="window.enviarAccionChat(\''+chatId+'\',\'info\',\''+kind+'\',\''+id+'\')">Info</button><button class="bsm gr" onclick="window.enviarAccionChat(\''+chatId+'\',\'inscripcion\',\''+kind+'\',\''+id+'\')">Inscribir</button></div></div>';
  }).join('');
}
window.mostrarAccionesChatAdmin = (chatId) => {
  document.getElementById('mcontent').innerHTML = '<div class="mtitle">ACCIONES RÁPIDAS</div><div class="msub">Abrí info o formulario en la web del visitante sin recordar títulos exactos.</div>'+
    '<div class="mlbl">Cursos</div>'+ (actionRowsFor('curso',chatId) || '<div class="tds">Sin cursos</div>') +
    '<div class="mlbl">Servicios</div>'+ (actionRowsFor('servicio',chatId) || '<div class="tds">Sin servicios</div>') +
    '<div class="mlbl">Eventos</div>'+ (actionRowsFor('evento',chatId) || '<div class="tds">Sin eventos</div>') +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};
window.enviarAccionChat = (chatId, fn, type, id) => {
  let nombre = '';
  if(type==='curso') nombre = cursos?.[id]?.titulo || 'esta actividad';
  if(type==='servicio') nombre = serviciosDB?.[id]?.titulo || 'este servicio';
  if(type==='evento') nombre = eventosDB?.[id]?.titulo || 'este evento';
  const txt = fn === 'inscripcion'
    ? 'Perfecto 😊 Te abro el formulario para que completes los datos de **'+nombre+'**. #' + fn + ':' + type + ':' + id + '#'
    : 'Te muestro la información completa de **'+nombre+'**. #' + fn + ':' + type + ':' + id + '#';
  closeModal();
  window.enviarChatAdmin(chatId, txt);
};

const FAQ_AI = [
  {q:'experiencia previa nivel principiante empezar de cero necesito experiencia', a:'No necesitás experiencia previa. Nuestros cursos están pensados para distintos niveles y cada actividad indica su nivel recomendado en la descripción.'},
  {q:'confirmar lugar inscripcion reservar cupo como confirmo mi lugar', a:'Para confirmar tu lugar, completás el formulario de inscripción y luego coordinamos por WhatsApp la disponibilidad y el pago correspondiente.'},
  {q:'medios de pago formas de pago transferencia mercado pago efectivo pagar', a:'Aceptamos transferencia bancaria, Mercado Pago y efectivo. Según el curso o servicio, el detalle de pago se coordina por WhatsApp luego de la pre-inscripción.'},
  {q:'no puedo asistir falto cancelar reprogramar devolucion aviso', a:'Si no podés asistir, avisános con anticipación. Buscamos la mejor solución y, según disponibilidad, el pago puede acreditarse para futuras actividades.'},
  {q:'certificado certificados emiten diploma constancia participacion', a:'Sí, los cursos y workshops incluyen certificado digital de participación emitido por Tomauno Estudio.'},
  {q:'menor edad menor de edad tutor responsable inscribir menor', a:'Sí, se puede inscribir a un menor de edad. En el formulario se solicitan los datos de contacto del tutor o responsable.'}
];
function faqMatchAI(q){
  let best = null;
  FAQ_AI.forEach((f) => {
    const words = entityWordsAI(f.q).filter(w => w.length > 2);
    let score = 0;
    words.forEach(w => { if(q.includes(w)) score += 1; });
    if(score > 0 && (!best || score > best.score)) best = {faq:f, score};
  });
  return best && best.score >= 2 ? best.faq.a : '';
}

function moneyAI(n){ return n ? '$ ' + Number(n).toLocaleString('es-AR') : 'Gratis'; }

function isAvailabilityAI(q){
  return /(tienen|tenes|tenés|hay|alguno|alguna|algun|algún|disponible|disponibles|activos|activas|ofrecen|ofreces|mostrame|mostrar|lista|listado|cuales|cuáles)/.test(q);
}
function isPriceOrSpecificAI(q){
  return /(cuanto|cuánto|sale|precio|costo|valor|horario|hora|fecha|cuando|cuándo|profesor|organizador|disertante|contacto|whatsapp|inscrib|anotar|registrar|reservar)/.test(q);
}
function hasCategoryAI(q, cat){
  if(cat==='curso') return /(curso|cursos|capacit|taller|workshop|clase|clases|aprender)/.test(q);
  if(cat==='servicio') return /(servicio|servicios|sesion|sesiones|book|portfolio|beauty|belleza|foto|fotos|video|produccion|producción|alquiler)/.test(q);
  if(cat==='evento') return /(evento|eventos|agenda|ciudad|show|charla)/.test(q);
  return false;
}

function entityWordsAI(t){
  // No eliminamos términos de dominio como fotografia/modelo/beauty porque son claves para filtrar cursos y servicios.
  const stop = ['con','del','los','las','para','curso','cursos','evento','eventos','servicio','servicios','tomauno','estudio','alguno','alguna','algun','tienen','tenes','hay','solo','info','informacion','quiero','saber','sobre','cuanto','sale','precio','costo','valor','horario','hora','disponible','disponibles','activo','activos'];
  return normAI(t).split(/\s+/).filter(w => w.length > 2 && !stop.includes(w));
}
function termHitAI(hay, w){
  if(!w || w.length < 3) return false;
  if(hay.includes(w)) return true;
  // equivalencias simples para consultas reales: modelo/modelaje, foto/fotografía, beauty/belleza
  const aliases = {
    modelo:['modelo','modelos','modelaje'], modelos:['modelo','modelos','modelaje'], modelaje:['modelo','modelos','modelaje'],
    foto:['foto','fotos','fotografia','fotografias','fotografico','fotografica'], fotos:['foto','fotos','fotografia','fotografias','fotografico','fotografica'], fotografia:['foto','fotos','fotografia','fotografias','fotografico','fotografica'],
    beauty:['beauty','belleza','makeup','maquillaje'], belleza:['beauty','belleza','makeup','maquillaje']
  };
  return (aliases[w] || []).some(a => hay.includes(a));
}

function importantTermsAI(q){
  // Palabras realmente útiles para cruzar contra títulos cargados.
  const raw = normAI(q).split(/\s+/).map(w=>w.replace(/[^a-z0-9ñ]/g,'')).filter(Boolean);
  const stop = new Set(['con','del','los','las','para','curso','cursos','evento','eventos','servicio','servicios','tomauno','estudio','quiero','saber','tenes','tenés','tienen','hay','alguno','alguna','algun','algún','solo','disponible','disponibles','activo','activos','cuanto','cuánto','sale','precio','costo','valor','horario','hora','info','informacion','información','mostrar','mostrame','lista','listado','de','la','el','un','una','unos','unas','que','qué']);
  return raw.filter(w => w.length > 2 && !stop.has(w));
}
function scoreEntityAI(q, title, extra=''){
  const titleHay = normAI(title || '');
  const extraHay = normAI(extra || '');
  const hay = (titleHay + ' ' + extraHay).trim();
  const qWords = entityWordsAI(q).filter(w => w.length > 2);
  const titleWords = entityWordsAI(title);
  let score = 0;
  qWords.forEach(w => {
    if(termHitAI(titleHay, w)) score += 4;
    else if(termHitAI(extraHay, w)) score += 1.5;
  });
  titleWords.forEach(w => { if(termHitAI(q, w)) score += 2; });
  // Prioridades comunes: cuando el usuario dice curso/modelo/fotografía/beauty, pesa más el título exacto que textos largos.
  if(/fotograf|foto/.test(q)){
    if(/fotografia|fotograf[ií]a/.test(titleHay)) score += 5;
    else if(/foto|fotos/.test(titleHay)) score += 2;
  }
  if(/modelo|modelaje/.test(q) && /modelo|modelaje/.test(titleHay)) score += 5;
  if(/beauty|belleza|maquillaje/.test(q) && /beauty|belleza|maquillaje/.test(titleHay)) score += 5;
  if(/curso|capacit|taller|clase/.test(q) && /curso|capacit|taller|clase/.test(titleHay)) score += 2;
  if(!score) return 0;
  // Pequeña normalización: mantiene comparables títulos cortos/largos.
  return score / Math.max(2, Math.min(8, titleWords.length || 2));
}
function findCursoAI(q){
  const lista = Object.entries(cursos||{}).filter(([,c])=>!c.oculto);
  let best = null;
  lista.forEach(([id,c]) => {
    const sc = scoreEntityAI(q, c.titulo || '', [c.desc,c.ig,c.disertante,c.profesor,c.organizador,c.docente].join(' '));
    if(sc > 0 && (!best || sc > best.sc)) best = {id,c,sc};
  });
  return best && best.sc >= .35 ? best : null;
}
function findEventoAI(q){
  const lista = Object.entries(eventosDB||{}).filter(([,e])=>e.estado==='activo' && !e.oculto);
  let best = null;
  lista.forEach(([id,e]) => {
    const sc = scoreEntityAI(q, e.titulo || '', [e.desc,e.ig,e.nombreOrg,e.lugar].join(' '));
    if(sc > 0 && (!best || sc > best.sc)) best = {id,e,sc};
  });
  return best && best.sc >= .35 ? best : null;
}
function findServicioAI(q){
  const lista = Object.entries(serviciosDB||{}).filter(([,x])=>!x.oculto);
  let best = null;
  lista.forEach(([id,x]) => {
    const sc = scoreEntityAI(q, x.titulo || '', [x.desc,x.ig,x.dir].join(' '));
    if(sc > 0 && (!best || sc > best.sc)) best = {id,s:x,sc};
  });
  return best && best.sc >= .35 ? best : null;
}
function detalleCursoAI(c){
  const hoy = new Date().toISOString().slice(0,10);
  const vencido = !!(c.finalizado || (c.fecha && c.fecha < hoy));
  const prof = c.disertante || c.profesor || c.organizador || c.docente || c.nombreOrg || '';
  return '**' + (c.titulo || 'Curso') + '**\n' +
    (c.fecha ? '📅 ' + fFecha(c.fecha) + '\n' : '') +
    (c.hora ? '⏰ ' + c.hora + '\n' : '') +
    (c.lugar ? '📍 ' + c.lugar + '\n' : '') +
    (prof ? '👤 Profesor/organizador: ' + prof + '\n' : '') +
    (c.wp ? '💬 Contacto: https://wa.me/549' + String(c.wp).replace(/\D/g,'') + '\n' : '') +
    (c.ig ? '📸 Instagram: @' + c.ig + '\n' : '') +
    '💰 ' + moneyAI(c.costo) + '\n' +
    (c.extraLink ? '🔗 Más info: ' + c.extraLink + '\n' : '') +
    (vencido ? '\n⚠️ Tené en cuenta que este curso puede haber comenzado o estar fuera de inscripción. Consultanos para próximas fechas.\n' : '') +
    'Podés tocar el botón **Ver cursos** para ir directo a la sección Cursos.';
}
function detalleServicioAI(s){
  return '**' + (s.titulo || 'Servicio') + '**\n' +
    (s.desc ? s.desc + '\n' : '') +
    (s.precio ? '💰 Desde $ ' + Number(s.precio).toLocaleString('es-AR') + '\n' : '') +
    (s.dir ? '📍 ' + s.dir + '\n' : '') +
    (s.wp ? '💬 Contacto: https://wa.me/549' + String(s.wp).replace(/\D/g,'') + '\n' : '') +
    (s.ig ? '📸 Instagram: @' + s.ig + '\n' : '') +
    (s.extraLink ? '🔗 Más info: ' + s.extraLink + '\n' : '') +
    '\nPodés tocar el botón **Ver servicios** para ir directo a la sección Servicios.';
}
function detalleEventoAI(e){
  return '**' + (e.titulo || 'Evento') + '**\n' +
    (e.fecha ? '📅 ' + fFecha(e.fecha) + '\n' : '') +
    (e.hora ? '⏰ ' + e.hora + '\n' : '') +
    (e.lugar ? '📍 ' + e.lugar + '\n' : '') +
    (e.nombreOrg ? '👤 Organiza: ' + e.nombreOrg + '\n' : '') +
    (e.wpOrg ? '💬 Contacto: https://wa.me/549' + String(e.wpOrg).replace(/\D/g,'') + '\n' : '') +
    (e.ig ? '📸 Instagram: @' + e.ig + '\n' : '') +
    '💰 ' + moneyAI(e.costo) + '\n' +
    (e.extraLink ? '🔗 Más info: ' + e.extraLink + '\n' : '') +
    '\nPodés tocar el botón **Ver eventos** para ir directo a la sección Eventos.';
}
function listaCursosAI(query){
  let lista = Object.values(cursos||{}).filter(c=>!c.oculto && !c.finalizado).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  const q = normAI(query || '');
  const allActiveCount = lista.length;
  const terms = importantTermsAI(q);
  if(terms.length){
    const scored = lista.map(c => {
      const titleHay = normAI(c.titulo||'');
      const allHay = normAI([(c.titulo||''),(c.desc||''),(c.ig||''),(c.disertante||''),(c.profesor||''),(c.organizador||''),(c.docente||'')].join(' '));
      let score = 0;
      terms.forEach(w => {
        if(termHitAI(titleHay, w)) score += 4;
        else if(termHitAI(allHay, w)) score += 1;
      });
      // Coincidencias de dos términos importantes en el título tienen prioridad máxima.
      const titleHits = terms.filter(w => termHitAI(titleHay, w)).length;
      if(titleHits >= 2) score += 8;
      if(/fotograf|foto/.test(q) && /fotografia|foto/.test(titleHay)) score += 6;
      if(/modelo|modelaje/.test(q) && /modelo|modelaje/.test(titleHay)) score += 6;
      return {c, score};
    }).filter(x => x.score > 0).sort((a,b)=>b.score-a.score);
    if(scored.length){
      const best = scored[0].score;
      lista = scored.filter(x => x.score >= Math.max(1, best - 2)).map(x=>x.c);
    }
  }
  if(!lista.length) return 'Por el momento no encontré cursos activos relacionados con esa consulta. Podés escribirnos por WhatsApp para consultar próximas fechas.';
  const titulo = (terms.length && lista.length < allActiveCount) ? '📚 **Cursos encontrados**' : '📚 **Cursos activos**';
  return titulo + '\n\n' + lista.slice(0,8).map((c,i)=>
    (i+1)+'. **'+(c.titulo||'Curso')+'**\n' +
    (c.fecha?'📅 '+fFecha(c.fecha)+'\n':'') +
    (c.hora?'⏰ '+c.hora+'\n':'') +
    '💰 '+moneyAI(c.costo)
  ).join('\n\n') + '\n\nPodés tocar el botón **Ver cursos** para ir directo a la sección e inscribirte.';
}
function listaEventosAI(){
  const lista = Object.values(eventosDB||{}).filter(e=>e.estado==='activo' && !e.oculto).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!lista.length) return 'Por el momento no tengo eventos activos publicados en la web.';
  return '🎪 **Eventos activos**\n\n' + lista.slice(0,8).map((e,i)=>(i+1)+'. **'+(e.titulo||'Evento')+'**'+(e.fecha?'\n📅 '+fFecha(e.fecha):'')+(e.hora?'\n⏰ '+e.hora:'')+'\n💰 '+moneyAI(e.costo)).join('\n\n') + '\n\nPodés tocar el botón **Ver eventos** para ir a la sección.';
}
function listaServiciosAI(query){
  let lista = Object.values(serviciosDB||{}).filter(s=>!s.oculto).sort((a,b)=>(b.creado||0)-(a.creado||0));
  const q = normAI(query || '');
  const terms = importantTermsAI(q);
  const allCount = lista.length;
  if(terms.length){
    const scored = lista.map(s => {
      const titleHay = normAI(s.titulo||'');
      const allHay = normAI([(s.titulo||''),(s.desc||''),(s.ig||''),(s.dir||'')].join(' '));
      let score = 0;
      terms.forEach(w => {
        if(termHitAI(titleHay, w)) score += 4;
        else if(termHitAI(allHay, w)) score += 1;
      });
      const titleHits = terms.filter(w => termHitAI(titleHay, w)).length;
      if(titleHits >= 2) score += 8;
      return {s, score};
    }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(scored.length){
      const best=scored[0].score;
      lista=scored.filter(x=>x.score>=Math.max(1,best-2)).map(x=>x.s);
    }
  }
  if(!lista.length) return 'No encontré servicios activos relacionados con esa consulta. También ofrecemos sesiones fotográficas, modelaje, capacitaciones y producción. Decime qué servicio te interesa y te oriento.';
  const titulo = (terms.length && lista.length < allCount) ? '📷 **Servicios encontrados**' : '📷 **Servicios disponibles**';
  return titulo + '\n\n' + lista.slice(0,8).map((s,i)=>(i+1)+'. **'+(s.titulo||'Servicio')+'**'+(s.precio?'\n💰 Desde $ '+Number(s.precio).toLocaleString('es-AR'):'')).join('\n\n') + '\n\nPodés tocar el botón **Ver servicios** para ir a la sección.';
}
function knowledgeMatchesAI(q){
  const matches = [];
  const qWords = entityWordsAI(q).filter(w => w.length > 2);
  asistenteKnowledgeEntries().forEach(([id,k]) => {
    const title = normAI(k.titulo||'');
    const keysRaw = String(k.keys||'').split(',').map(normAI).filter(Boolean);
    const resp = normAI(k.respuesta||'');
    let score = 0;
    keysRaw.forEach(x => {
      if(!x || x.length < 3) return;
      if(q.includes(x)) score += 5;
      else if(x.includes(q) && q.length > 4) score += 3;
    });
    entityWordsAI(k.titulo||'').forEach(w => { if(q.includes(w)) score += 2; });
    let pairHits = 0;
    qWords.forEach(w => { if(resp.includes(w)) score += .9; if(title.includes(w)) score += 1.2; if(resp.includes(w) || title.includes(w) || keysRaw.some(x=>x.includes(w))) pairHits++; });
    // Si el usuario combina 2 o más palabras importantes, priorizamos la ficha que contenga esa combinación.
    // Ejemplo: "whatsapp organizador" debe pesar más que solo "whatsapp".
    if(pairHits >= 2) score += 4 + pairHits;
    // Consultas del tipo "desde qué edad", "edad mínima", "cuánto sale", etc. priorizan el cerebro si hay coincidencia.
    if(/edad|desde que edad|edad minima|menor|menores|precio|costo|valor|cuanto|alias|pago|fotolibro|album/.test(q) && score > 0) score += 2;
    if(score > 0) matches.push({id,k,score});
  });
  return matches.sort((a,b)=>b.score-a.score);
}
function suggestedTopicsAI(matches){
  return 'Encontré varias opciones relacionadas. ¿Cuál te interesa?\n\n' + matches.slice(0,4).map((m,i)=>(i+1)+'. '+(m.k.titulo||'Tema')).join('\n') + '\n\nEscribí el número o el nombre del tema y te paso la información.';
}
function isThanksOrByeAI(q){
  return /^(gracias|muchas gracias|ok gracias|dale gracias|perfecto gracias|listo gracias|genial gracias|buenisimo gracias|buenísimo gracias|chau|adios|adiós|nos vemos|hasta luego)[.!\s]*$/.test(q);
}
function pickPendingTopicAI(chat, q){
  const pending = Array.isArray(chat?.pendingTopics) ? chat.pendingTopics : [];
  if(!pending.length) return null;
  const n = parseInt(String(q).replace(/\D/g,''),10);
  if(n && pending[n-1]) return pending[n-1];
  return pending.find(t => normAI(t.titulo||'').includes(q) || q.includes(normAI(t.titulo||''))) || null;
}
function shouldOpenFormAI(q){
  return /inscrib|anotar|registrar|reservar|quiero ir|me quiero sumar|formulario/.test(q);
}
function buscarRespuestaAsistente(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';

  const go = (sec) => { window._lastAiSection = sec; };
  const brainDirect = (groups) => {
    const wanted = Array.isArray(groups) ? groups : [groups];
    const found = [];
    asistenteKnowledgeEntries().forEach(([id,k]) => {
      const hayKeys = String(k.keys||'').split(',').map(normAI).filter(Boolean);
      const hayTitle = normAI(k.titulo||'');
      const hayResp = normAI(k.respuesta||'');
      let score = 0;
      wanted.forEach(g => {
        const terms = String(g).split('|').map(normAI).filter(Boolean);
        terms.forEach(t => {
          if(!t || t.length < 3) return;
          if(q.includes(t)) score += 2;
          if(hayKeys.some(kx => kx === t || kx.includes(t) || t.includes(kx))) score += 6;
          if(hayTitle.includes(t)) score += 4;
          if(hayResp.includes(t)) score += 1;
        });
      });
      if(score > 0) found.push({id,k,score});
    });
    found.sort((a,b)=>b.score-a.score);
    return found;
  };
  const topBrainAnswer = (groups, min=6) => {
    const m = brainDirect(groups);
    if(m.length && m[0].score >= min) return m[0].k.respuesta || '';
    return '';
  };

  if(isThanksOrByeAI(q)) return '¡Gracias a vos! 😊\nQuedo a disposición si necesitás algo más.';

  // 1) Intenciones institucionales fuertes: NO deben caer en cursos por coincidencias sueltas.
  if(/(ubicacion|ubicación|direccion|dirección|donde|dónde|mapa|maps|google maps|lugar|queda|como llegar|cómo llegar)/.test(q)){
    go('sec-ubicacion');
    return '📍 **Dirección del estudio**\nPedro Méndez 2069, Posadas, Misiones.\n\n🗺️ Google Maps: https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D\n\nTambién podés tocar **Ver ubicación** para ir a la sección Ubicación.';
  }
  if(/(horario|horarios|atencion|atención|abren|abre|cerrado|cerrados|dias|días)/.test(q) && /(estudio|tomauno|atienden|atencion|atención|abren|abre|cerrado|cerrados)/.test(q)){
    const b = topBrainAnswer(['horario|horarios|atencion|atención|dias|días'], 6);
    if(b) return b;
    return '🕒 **Horarios del estudio**\nLos horarios se coordinan según sesiones, cursos y reservas.\n\nPara confirmar disponibilidad escribinos por WhatsApp: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%2C%20quiero%20consultar%20horarios.';
  }
  if(/(whatsapp|telefono|teléfono|contacto|celular|numero|número|comunicarme|comunicar|comunicacion|comunicación|contactarme)/.test(q) && !/(organizador|organiza|profesor|docente|disertante)/.test(q)){
    return '💬 **Contacto Tomauno**\nWhatsApp: 3764354522\nLink directo: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%20Cursos%20y%20Capacitaciones%2C%20quisiera%20hacer%20una%20consulta.';
  }
  if(/(instagram|ig|redes)/.test(q)) return '📸 **Instagram Tomauno**\n@tomaunomodels\n@tomaunoestudio\n@tomaunocapacitaciones';
  if(/(javier|mottola|dueño|dueno|fundador|quien es javier|quién es javier|quien es el dueño|quién es el dueño)/.test(q)){
    const b = topBrainAnswer(['javier|mottola|dueño|dueno|fundador|quien soy'], 6);
    if(b) return b;
    return '👤 **Javier Móttola** es parte de Tomauno y está a cargo de la coordinación de consultas, cursos, servicios y actividades del estudio.\n\nSi querés hablar directo con él: https://wa.me/5493764354522';
  }
  if(/(profes|profesor|profesores|docente|docentes|quienes dan|quiénes dan|quien dicta|quién dicta|academia de modelos|academia modelaje|materias de modelaje|materias modelo)/.test(q)){
    const b = topBrainAnswer(['profes|profesores|docentes|docente|academia|modelaje|materias'], 6);
    if(b) return b;
    const cSpec = findCursoAI(q);
    if(cSpec && cSpec.sc >= .8){
      const c = cSpec.c;
      const prof = c.disertante || c.profesor || c.organizador || c.docente || c.nombreOrg || '';
      const wp = c.wp || c.wpOrg || c.contacto || '';
      return '**' + (c.titulo || 'Curso') + '**\n' +
        (prof ? '👤 Profesor/organizador: ' + prof + '\n' : '') +
        (wp ? '💬 WhatsApp de contacto: https://wa.me/549' + String(wp).replace(/\D/g,'') + '\n' : '') +
        (!prof && !wp ? 'No tengo cargado un profesor u organizador específico para ese curso.' : '');
    }
    return '👥 Sobre profesores o materias de la academia, puedo pasarte la información cargada o derivarte con Javier para confirmarlo en detalle.';
  }
  if(/(desde que edad|desde qué edad|edad minima|edad mínima|menores|menor de edad|pueden inscribirse|puedo inscribirme con)/.test(q)){
    const b = topBrainAnswer(['edad|edad minima|edad mínima|menores|inscripcion menores|inscripción menores'], 5);
    if(b) return b;
    const faqAns = faqMatchAI(q);
    if(faqAns) return '❓ **Pregunta frecuente**\n' + faqAns;
  }

  // 2) Listas claras. Si el usuario pide cursos/servicios/eventos en general, no buscar un título al azar.
  if(/(curso|cursos|capacitaciones|capacitacion|capacitación|taller|talleres|workshop|workshops)/.test(q) && /(info|informacion|información|disponible|disponibles|activo|activos|tienen|tenes|tenés|hay|lista|listado|cuales|cuáles|ver|mostrar)/.test(q) && importantTermsAI(q).length === 0){
    go('sec-cursos');
    return listaCursosAI('');
  }
  if(/(servicio|servicios|sesiones|sesion|sesión|book|produccion|producción)/.test(q) && /(info|informacion|información|disponible|disponibles|tienen|tenes|tenés|hay|lista|listado|cuales|cuáles|ver|mostrar)/.test(q) && importantTermsAI(q).length === 0){
    go('sec-servicios');
    return listaServiciosAI('');
  }
  if(/(evento|eventos|agenda|actividades)/.test(q) && /(info|informacion|información|disponible|disponibles|activo|activos|tienen|tenes|tenés|hay|lista|listado|cuales|cuáles|ver|mostrar)/.test(q)){
    go('sec-eventos');
    return listaEventosAI();
  }

  // 3) Preguntas por pagos generales.
  if(/(abonar|pagar|pago|seña|senia|reservar cupo|transferencia|mercado pago|alias)/.test(q) && !/(precio|costo|valor|cuanto|cuánto|sale)/.test(q)){
    const b = topBrainAnswer(['pago|pagos|alias|transferencia|mercado pago|seña|senia'], 6);
    if(b) return b;
    return '💳 **Pagos e inscripción**\nPara confirmar un lugar normalmente coordinamos el pago por WhatsApp.\n\nSi querés, decime el curso, servicio o evento que te interesa y te paso el detalle correcto.\n\nTambién podés escribirnos directo: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%2C%20quiero%20consultar%20por%20un%20pago.';
  }

  // 4) Entidades específicas publicadas: primero títulos de web, después cerebro.
  const asksSpecific = isPriceOrSpecificAI(q) || /(horario|hora|fecha|profesor|organizador|quien|quién|inscrib|anotar|registrar|formulario|precio|costo|valor|cuanto|cuánto|sale|info|informacion|información)/.test(q);
  if(/(servicio|servicios|sesion|sesiones|sesión|beauty|book|foto|fotografia|fotografía|retrato|boda|15|quince|casamiento|filmacion|filmación|video)/.test(q)){
    const sSpec = findServicioAI(q);
    const cSpec = findCursoAI(q);
    // Si dice explícitamente sesión/servicio/beauty/book, priorizamos servicios.
    if(sSpec && (/servicio|sesion|sesiones|sesión|beauty|book|boda|casamiento|quince|15/.test(q) || !cSpec || sSpec.sc >= cSpec.sc)){
      go('sec-servicios');
      return detalleServicioAI(sSpec.s);
    }
  }
  if(/(curso|cursos|capacitacion|capacitación|capacitaciones|taller|workshop|clase|fotografia|fotografía|modelo|modelaje)/.test(q)){
    const cSpec = findCursoAI(q);
    if(cSpec && (asksSpecific || importantTermsAI(q).length > 0)){
      go('sec-cursos');
      return detalleCursoAI(cSpec.c);
    }
    if(hasCategoryAI(q,'curso') || /fotografia|fotografía|modelo|modelaje/.test(q)){
      go('sec-cursos');
      return listaCursosAI(q);
    }
  }
  if(/(evento|eventos|organizador|organiza|decoracion|decoración|danzaterapia|danza|taller|charla|show)/.test(q)){
    const eSpec = findEventoAI(q);
    // Si el texto coincide claramente con un título de evento cargado, responder ese evento aunque no haya pedido “más info”.
    if(eSpec && (asksSpecific || eSpec.sc >= .55 || importantTermsAI(q).length >= 2)){
      go('sec-eventos');
      return detalleEventoAI(eSpec.e);
    }
    if(hasCategoryAI(q,'evento')){ go('sec-eventos'); return listaEventosAI(); }
  }

  // 5) FAQ antes del cerebro largo.
  const faqAns = faqMatchAI(q);
  if(faqAns) return '❓ **Pregunta frecuente**\n' + faqAns;

  // 6) Cerebro como fuente secundaria para info extra, paquetes, bodas, 15 años, alquiler, etc.
  const custom = knowledgeMatchesAI(q);
  if(custom.length === 1 && custom[0].score >= 6) return custom[0].k.respuesta;
  if(custom.length > 1 && custom[0].score >= custom[1].score + 3 && custom[0].score >= 7) return custom[0].k.respuesta;
  if(custom.length > 0){
    window._lastAiSuggestions = custom.slice(0,4).map(m => ({id:m.id, titulo:m.k.titulo||'Tema', respuesta:m.k.respuesta||''}));
    return suggestedTopicsAI(custom);
  }

  // 7) Fallbacks ordenados.
  if(/(servicio|sesion|sesiones|foto|book|modelo|portfolio|produccion|video|retrato|alquiler|boda|casamiento|quince|15|fiesta|cumple|fotolibro|album|streaming|robot|360)/.test(q)){
    go('sec-servicios');
    return listaServiciosAI(q);
  }
  if(/(curso|capacit|workshop|taller|clase|aprender|inscrip)/.test(q)){
    go('sec-cursos');
    return listaCursosAI(q);
  }
  if(/(precio|costo|valor|cuanto|cuánto|cuota)/.test(q)) return 'Los precios dependen del curso, evento o servicio. Si me decís exactamente cuál te interesa, te paso el detalle.';
  return 'Gracias por escribirnos. Puedo ayudarte con **cursos**, **eventos**, **servicios**, **ubicación**, **WhatsApp**, **Instagram**, preguntas frecuentes y agenda activa. Si tu consulta es más específica, Javier puede responderte personalmente.';
}

function quiereHablarConJavierAI(text){
  const q = normAI(text);
  return /(javier|humano|persona|alguien|asesor|atencion personalizada|atención personalizada|me responda|responder personalmente|hablar con|contactarme|contacte|llame|llamar)/.test(q) && /(javier|humano|persona|alguien|asesor|responda|responder|hablar|contact|llam)/.test(q);
}
function esAfirmacionAI(text){
  const q = normAI(text).replace(/[\.!,;:]+/g,'').trim();
  return /^(si|sí|s|dale|ok|okay|bueno|perfecto|claro|por favor|quiero|quiero que si|si por favor|sí por favor|que me responda|que javier me responda)$/.test(q);
}
function tieneWhatsAppChat(chat){ return !!String(chat?.wp || '').replace(/\D/g,''); }
function tieneNombreRealChat(chat){ const n = String(chat?.name || '').trim(); return !!n && !isGenericChatName(n); }
function extraerWhatsappAI(text){
  const digits = String(text||'').replace(/\D/g,'');
  if(digits.length >= 8 && digits.length <= 15) return digits;
  return '';
}
function extraerNombreAI(text){
  let raw = String(text||'').trim();
  if(!raw || extraerWhatsappAI(raw)) return '';
  raw = raw.replace(/[.!?]+$/g,'').trim();
  const m = raw.match(/^(?:hola\s+)?(?:soy|me llamo|mi nombre es|nombre es|soy\s+yo\s+)?\s*([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,3})$/i);
  if(!m) return '';
  let n = limpiarNombreChat(m[1]);
  if(!n || n.length < 2) return '';
  if(/^(si|sí|ok|dale|bueno|perfecto|claro|gracias|quiero|consulta|web|whatsapp|telefono|javier)$/i.test(n)) return '';
  return n;
}
function chatEsperandoDatosHumanos(chat){
  if(!chat) return false;
  if(chat.humanRequested && (!tieneNombreRealChat(chat) || !tieneWhatsAppChat(chat) || !chat.temaPrincipal)) return true;
  const last = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
  return !!(last && /(dejame|dejam[eé]|whatsapp|nombre|tema|consulta).*Javier|Para que pueda contactarte|Sobre qu[eé] tema/i.test(String(last.text||'')));
}
async function manejarDatosHumanosPendientes(chatId, chat, userText){
  const updates = {updatedAt:Date.now(), humanRequested:true, prioridad:true, unreadAdmin:true};
  const wp = extraerWhatsappAI(userText);
  const name = extraerNombreAI(userText);
  if(wp && !tieneWhatsAppChat(chat)) updates.wp = wp;
  if(name && !tieneNombreRealChat(chat)) updates.name = name;
  const merged = Object.assign({}, chat, updates);
  let tema = temaDesdeHistorialAI(merged, userText) || merged.temaPrincipal || '';
  // Si el mensaje no es solo nombre/teléfono, puede ser tema de consulta.
  if(!name && !wp && String(userText||'').trim().length > 3) tema = detectarTemaConsulta(userText);
  if(tema) updates.temaPrincipal = tema;
  await update(ref(db,'tomauno/chats/'+chatId), updates);
  const faltaNombre = !tieneNombreRealChat(merged);
  const faltaWp = !tieneWhatsAppChat(merged);
  const faltaTema = !tema;
  if(faltaNombre || faltaWp || faltaTema){
    let txt = 'Perfecto, voy dejando tu consulta marcada para Javier.';
    if(name) txt = 'Gracias, '+name+'. Voy dejando tu consulta marcada para Javier.';
    const faltan = [];
    if(faltaNombre) faltan.push('tu nombre');
    if(faltaWp) faltan.push('tu WhatsApp');
    if(faltaTema) faltan.push('el tema puntual de tu consulta');
    txt += '\n\nPara que pueda responderte mejor, dejame ' + faltan.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
    txt += '\n\nMientras tanto, el Asistente Tomauno puede adelantarte información si querés.';
    return txt;
  }
  return 'Perfecto 😊 Le dejo tu consulta marcada a Javier con tus datos.\n\nTema detectado: **'+tema+'**.\n\nSi querés escribirle ahora, también podés hacerlo por WhatsApp: https://wa.me/5493764354522?text=Hola%20Javier%2C%20vengo%20de%20la%20web%20Tomauno%20y%20quiero%20continuar%20mi%20consulta.';
}
function temaDesdeHistorialAI(chat, actual=''){
  const partes = [actual || '', chat?.temaPrincipal || '', chat?.lastMsg || ''];
  try{ chatMsgs(chat).slice(-6).forEach(([,m]) => { if(m && m.text) partes.push(m.text); }); }catch(e){}
  const q = normAI(partes.join(' '));
  if(/modelo|modelaje|booker|casting|portfolio|book/.test(q)) return 'modelaje / books / portfolio';
  if(/boda|casamiento|15|quince|fiesta|cumple/.test(q)) return 'eventos sociales / 15 años / bodas';
  if(/curso|capacit|taller|workshop|clase|fotografia|fotografía/.test(q)) return 'cursos o capacitaciones';
  if(/alquiler|estudio|equipos|fondo|luces/.test(q)) return 'alquiler del estudio';
  if(/sesion|sesión|foto|retrato|beauty|maternidad/.test(q)) return 'sesiones fotográficas';
  return '';
}
function respuestaAtencionHumanaAI(chat, userText){
  const tema = temaDesdeHistorialAI(chat, userText) || chat?.temaPrincipal || '';
  const faltaNombre = !tieneNombreRealChat(chat);
  const faltaWp = !tieneWhatsAppChat(chat);
  let txt = 'Perfecto 🙂 Puedo dejarle tu consulta marcada a Javier para que pueda responderte personalmente cuando esté disponible.';
  if(tema) txt += '\n\nTema detectado: **' + tema + '**.';
  if(faltaNombre || faltaWp || !tema){
    const faltan = [];
    if(faltaNombre) faltan.push('tu **nombre**');
    if(faltaWp) faltan.push('tu **WhatsApp**');
    if(!tema) faltan.push('el **tema puntual** de tu consulta');
    txt += '\n\nPara que Javier pueda responderte mejor, dejame ' + faltan.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
    txt += '\n\nMientras tanto, si querés, el **Asistente Tomauno** también puede adelantarte información sobre cursos, servicios, modelaje, eventos o alquiler del estudio.';
  }else{
    txt += '\n\nYa tengo tus datos de contacto. También podés escribirle directo por WhatsApp: https://wa.me/5493764354522?text=Hola%20Javier%2C%20vengo%20de%20la%20web%20Tomauno%20y%20quiero%20continuar%20mi%20consulta.';
  }
  return txt;
}
async function responderAutomaticoChat(chatId, userText){
  try{
    // Leemos el modo real desde Firebase para que AUTO funcione aunque el listener local tarde en actualizar.
    let modo = asistenteModo();
    try{
      const modoSnap = await get(ref(db,'tomauno/asistente/modo'));
      if(modoSnap.exists()) modo = modoSnap.val();
    }catch(e){}
    if(modo !== 'automatico') return;

    // Usamos el chat más actualizado de Firebase, no solo el snapshot local.
    let chat = chatsDB?.[chatId] || {};
    try{
      const chatSnap = await get(ref(db,'tomauno/chats/'+chatId));
      if(chatSnap.exists()) chat = chatSnap.val();
    }catch(e){}

    const q = normAI(userText);
    if(!q) return;

    // Si el usuario ya pidió atención humana y está dejando nombre/WhatsApp/tema,
    // no lo tratamos como una pregunta normal del asistente.
    if(chatEsperandoDatosHumanos(chat)){
      const respPend = await manejarDatosHumanosPendientes(chatId, chat, userText);
      if(respPend){
        const typingRefP = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno está escribiendo', time:chatTime(), createdAt:Date.now(), typing:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Datos para Javier', status:'abierto'});
        await new Promise(r=>setTimeout(r, 650));
        try{ await remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+typingRefP.key)); }catch(e){}
        await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'admin', text:respPend, time:chatTime(), createdAt:Date.now(), auto:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:cleanChatDisplayText(respPend), status:'abierto-auto', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, lastAutoUserText:userText, lastAutoAt:Date.now()});
        return;
      }
    }

    // Si el usuario pide atención humana o responde afirmativamente al pedido anterior,
    // no explicamos quién es Javier: marcamos prioridad y pedimos datos si faltan.
    const lastAutoMsgForHuman = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto && /Javier|personalmente|opciones relacionadas/i.test(String(m.text||'')));
    if(quiereHablarConJavierAI(userText) || (lastAutoMsgForHuman && esAfirmacionAI(userText))){
      const respHum = respuestaAtencionHumanaAI(chat, userText);
      const typingRefH = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno está escribiendo', time:chatTime(), createdAt:Date.now(), typing:true});
      await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Atención humana solicitada', status:'abierto'});
      await new Promise(r=>setTimeout(r, 750));
      try{ await remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+typingRefH.key)); }catch(e){}
      await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'admin', text:respHum, time:chatTime(), createdAt:Date.now(), auto:true});
      await update(ref(db,'tomauno/chats/'+chatId), {
        updatedAt:Date.now(),
        lastMsg:'⭐ Atención humana solicitada',
        status:'abierto-auto',
        unreadVisitor:true,
        unreadAdmin:true,
        humanRequested:true,
        prioridad:true,
        temaPrincipal: temaDesdeHistorialAI(chat, userText) || detectarTemaConsulta(userText),
        lastAutoUserText:userText,
        lastAutoAt:Date.now()
      });
      return;
    }

    // Evita responder dos veces exactamente al mismo mensaje de usuario.
    if(normAI(chat.lastAutoUserText || '') === q && (Date.now() - Number(chat.lastAutoAt || 0)) < 12000) return;

    const picked = pickPendingTopicAI(chat, q);
    let respuesta = '';
    let pendingTopics = null;
    if(picked){
      respuesta = picked.respuesta || '';
      pendingTopics = [];
    }else{
      respuesta = buscarRespuestaAsistente(userText);
      pendingTopics = Array.isArray(window._lastAiSuggestions) ? window._lastAiSuggestions : [];
    }
    if(!respuesta) return;
    respuesta = applyAIVariables(respuesta, chat);

    const lastAuto = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
    if(lastAuto && normAI(lastAuto[1].text||'') === normAI(respuesta)){
      respuesta = 'Creo que mi respuesta anterior no fue lo suficientemente precisa. ¿Querés que te muestre opciones relacionadas o preferís que Javier te responda personalmente?';
      pendingTopics = pendingTopics && pendingTopics.length ? pendingTopics : [];
    }

    const typingRef = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno está escribiendo', time:chatTime(), createdAt:Date.now(), typing:true});
    await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Tomauno está escribiendo...', status:'abierto'});
    await new Promise(r=>setTimeout(r, Math.min(1700, Math.max(650, String(respuesta).length * 12))));
    try{ await remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+typingRef.key)); }catch(e){}
    await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'admin', text:respuesta, time:chatTime(), createdAt:Date.now(), auto:true});
    try{
      const sec = window._lastAiSection || '';
      window._lastAiSection = '';
      if(sec && typeof navScroll === 'function') setTimeout(() => navScroll(sec), 450);
    }catch(e){}
    await update(ref(db,'tomauno/chats/'+chatId), {
      updatedAt:Date.now(),
      lastMsg:cleanChatDisplayText(respuesta),
      status:'abierto-auto',
      unreadVisitor:true,
      unreadAdmin:true,
      temaPrincipal:detectarTemaConsulta(userText),
      pendingTopics,
      lastAutoUserText:userText,
      lastAutoAt:Date.now()
    });
  }catch(e){
    console.error('Asistente automático:', e);
  }
}
function detectarTemaConsulta(text){
  const q = normAI(text);
  if(/ubicacion|direccion|mapa|donde/.test(q)) return 'Ubicación';
  if(/curso|capacit|workshop|taller/.test(q)) return 'Cursos';
  if(/evento|agenda/.test(q)) return 'Eventos';
  if(/precio|costo|valor|cuanto|pago/.test(q)) return 'Precios';
  if(/foto|sesion|book|video|boda|quince|15|fiesta|servicio/.test(q)) return 'Servicios';
  return String(text||'').slice(0,60);
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function fFecha(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  const ms = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return parseInt(d) + ' de ' + ms[parseInt(m) - 1] + ' ' + y;
}

function openModal() {
  document.getElementById('moverlay').style.display = 'flex';
}
window.closeModal = () => {
  const ov=document.getElementById('moverlay');
  ov.style.display = 'none';
  const box=ov.querySelector('.mbox');
  if(box && box.dataset.compactPin){ box.style.maxWidth=''; box.style.padding=''; delete box.dataset.compactPin; }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

window.toast = (msg, autohide = true) => {
  const t = document.getElementById('toast');
  t.onclick = () => t.classList.remove('show');
  t.textContent = msg + '  ✕';
  t.classList.add('show');
  if (autohide) setTimeout(() => t.classList.remove('show'), 3000);
};
// Alias para no romper código que llame toast sin window
const toast = window.toast;

function showNotif() {
  const d = document.getElementById('notif-dot');
  if (d) { d.style.display = 'inline-block'; setTimeout(() => d.style.display = 'none', 10000); }
}

function showNotifBanner(titulo, detalle, icono='🔴', onClick=null) {
  let banner = document.getElementById('notif-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'notif-banner';
    banner.style.cssText = 'position:fixed;top:72px;right:16px;z-index:800;background:#111;border:1.5px solid var(--red);border-radius:14px;padding:14px 18px;max-width:320px;box-shadow:0 8px 30px rgba(0,0,0,.6);transform:translateX(340px);transition:transform .4s cubic-bezier(.4,0,.2,1);cursor:pointer;';
    banner.onclick = () => { if (typeof banner._action === 'function') { banner.style.transform='translateX(340px)'; banner._action(); } else banner.style.transform = 'translateX(340px)'; };
    document.body.appendChild(banner);
  }
  banner._action = onClick;
  banner.innerHTML =
    '<div style="font-size:10px;color:var(--red);font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">' + icono + ' ' + escHtml(titulo || 'Notificación') + '</div>' +
    '<div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:3px;line-height:1.35;">' + escHtml(detalle || '') + '</div>' +
    '<div style="font-size:10px;color:var(--text3);margin-top:6px;">' + new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}) + ' · Clic para cerrar</div>';
  setTimeout(() => banner.style.transform = 'translateX(0)', 50);
  clearTimeout(banner._timer);
}

function showConfirm(msg, onOk) {
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:8px 0;">' +
    '<div style="font-size:36px;margin-bottom:14px;">⚠️</div>' +
    '<div class="mtitle" style="font-size:22px;margin-bottom:12px;">Confirmar acción</div>' +
    '<div style="font-size:14px;color:var(--text2);margin-bottom:24px;line-height:1.5;">' + msg + '</div>' +
    '<div style="display:flex;gap:10px;">' +
    '<button class="btn-out" onclick="window.closeModal()" style="flex:1;">Cancelar</button>' +
    '<button class="btn-main" id="confirm-ok-btn" style="flex:1;background:#c00;">Sí, eliminar</button>' +
    '</div></div>';
  openModal();
  document.getElementById('confirm-ok-btn').onclick = () => { closeModal(); onOk(); };
}

function showPrompt(msg, onOk) {
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:12px;">' + msg + '</div>' +
    '<input class="finput" id="prompt-inp" placeholder="Ej: Mayo 2026" onkeydown="if(event.key===\'Enter\')document.getElementById(\'prompt-ok\').click()"/>' +
    '<div style="display:flex;gap:10px;margin-top:4px;">' +
    '<button class="btn-out" onclick="window.closeModal()" style="flex:1;">Cancelar</button>' +
    '<button class="btn-main" id="prompt-ok" style="flex:1;">Agregar</button>' +
    '</div>';
  openModal();
  setTimeout(() => document.getElementById('prompt-inp')?.focus(), 80);
  document.getElementById('prompt-ok').onclick = () => {
    const val = document.getElementById('prompt-inp')?.value.trim();
    closeModal();
    onOk(val);
  };
}

// ── DRAG & DROP ───────────────────────────────────────────────────────────────
let draggedId = null;
window.dragStart = (e, id) => {
  draggedId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => e.target.style.opacity = '.4', 0);
};
window.dropCard = async (e) => {
  e.preventDefault();
  const target = e.target.closest('[data-id]');
  if (!target || !draggedId || target.dataset.id === draggedId) {
    document.querySelectorAll('.ccard').forEach(c => c.style.opacity = '');
    return;
  }
  const targetId = target.dataset.id;
  const draggedCreado = cursos[draggedId]?.creado || 0;
  const targetCreado = cursos[targetId]?.creado || 0;
  await update(ref(db, 'tomauno/cursos/' + draggedId), {creado: targetCreado - 1});
  await update(ref(db, 'tomauno/cursos/' + targetId), {creado: draggedCreado});
  document.querySelectorAll('.ccard').forEach(c => c.style.opacity = '');
  draggedId = null;
};

// ── CONTADOR VISITAS ──────────────────────────────────────────────────────────
setTimeout(() => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    onValue(ref(db, 'tomauno/stats/visitas/' + today), snap => {
      update(ref(db, 'tomauno/stats/visitas'), {[today]: (snap.val() || 0) + 1});
    }, {onlyOnce: true});
    onValue(ref(db, 'tomauno/stats/totalVisitas'), snap => {
      const total = (snap.val() || 0) + 1;
      update(ref(db, 'tomauno/stats'), {totalVisitas: total});
      const el = document.getElementById('visit-count');
      if (el) el.textContent = total.toLocaleString('es-AR');
      const elh = document.getElementById('visit-count-hero');
      if (elh) elh.textContent = total.toLocaleString('es-AR');
    }, {onlyOnce: true});
  } catch(e) {}
}, 3000);

// ── WA ENCODE ─────────────────────────────────────────────────────────────────
function waEncode(text) {
  return Array.from(text).map(c => {
    const code = c.codePointAt(0);
    if (code > 127) return c;
    if (/[a-zA-Z0-9 \-_.,!?:\/\n@()]/.test(c)) return c;
    return encodeURIComponent(c);
  }).join('').replace(/\n/g, '%0A').replace(/ /g, '%20');
}

// ── BEEP ──────────────────────────────────────────────────────────────────────
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1100].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(.3, ctx.currentTime + i * .15);
      g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + i * .15 + .3);
      o.start(ctx.currentTime + i * .15);
      o.stop(ctx.currentTime + i * .15 + .3);
    });
  } catch(e) {}
}


// ── EVENTOS ───────────────────────────────────────────────────────────────────
onValue(ref(db, 'tomauno/eventos'), s => {
  const oldEventosCount = prevEventosCount;
  eventosDB = s.exists() ? s.val() : {};
  const totalEventos = Object.keys(eventosDB).length;
  if (totalEventos > oldEventosCount && oldEventosCount > 0) {
    const newest = Object.entries(eventosDB).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0))[0];
    if (newest && isAdminNotifier()) {
      beep();
      showNotif();
      showNotifBanner('Nuevo evento registrado', newest[1].titulo || 'Evento sin título', '🎪', () => window.irAAdminTab('eventos-adm'));
    }
  }
  prevEventosCount = totalEventos;
  renderEventos();
  renderAdminEventos();
  updateStats();
  renderStatsVistas();
});

onValue(ref(db, 'tomauno/evRegs'), s => {
  const oldEvRegsCount = prevEvRegsCount;
  evInscDB = s.exists() ? s.val() : {};
  const totalEvRegs = Object.keys(evInscDB).length;
  if (totalEvRegs > oldEvRegsCount && oldEvRegsCount > 0 && isAdminNotifier()) {
    const newest = Object.values(evInscDB).sort((a,b)=>(b.creado||0)-(a.creado||0))[0];
    beep(); showNotif(); showNotifBanner('Nueva inscripción a evento', (newest?.nombre || 'Alumno') + ' · ' + (newest?.evTitulo || 'Evento'), '🎟️', () => window.irAPlanillaEvento(newest?.evId));
  }
  prevEvRegsCount = totalEvRegs;
  renderEventos();
  renderAdminEventos();
  renderStatsVistas();
});

function renderEventos() {
  const g = document.getElementById('eventos-grid'); if (!g) return;
  const lista = Object.entries(eventosDB)
    .filter(([,e]) => e.estado === 'activo' && !e.oculto)
    .sort((a,b) => (b[1].creado||0)-(a[1].creado||0));
  if (!lista.length) {
    g.innerHTML = '<div style="color:var(--text3);font-size:14px;padding:40px 0;text-align:center;grid-column:1/-1;">No hay eventos publicados por el momento.</div>';
    return;
  }
  const inscPorEv = {};
  Object.values(evInscDB).forEach(i => { if(i.evId) inscPorEv[i.evId] = (inscPorEv[i.evId]||0)+1; });
  g.innerHTML = lista.map(([k,e]) => {
    const insc = inscPorEv[k] || 0;
    const full = e.cupos > 0 && insc >= e.cupos;
    const esExt = e.dniOrg && e.dniOrg !== 'tomauno';
    const evSearch = escAttr([e.titulo||'', e.desc||'', e.nombreOrg||'', e.ig||'', e.lugar||''].join(' '));
    return '<div class="ev-card" data-search="' + evSearch + '" onclick="window.abrirDetalleEvento(\'' + k + '\')">' +
      (esExt ? '<span class="ev-badge-ext">Externo</span>' : '') +
      '<span class="ev-badge-tomauno">Plataforma Tomauno</span>' +
      '<div class="cimg">' +
      (e.img ? '<img src="' + e.img + '" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:100%;object-fit:contain;background:#0a0a0a;"/>'
             : '<div class="cimg-placeholder"><span class="icon">🎪</span><span class="brand">TOMA<em>UNO</em></span></div>') +
      '<span class="cbadge ' + (full?'full':'open') + '">' + (full?'Sin cupos':'Activo') + '</span>' +
      (e.cupos > 0 ? '<span class="ccupos-badge">👥 ' + insc + '/' + e.cupos + '</span>' : '') +
      '</div>' +
      '<div class="cbody">' +
      '<div class="ctitle">' + (e.titulo||'Sin titulo') + '</div>' +
      '<div class="cdesc">' + (e.desc||'').substring(0,80) + '</div>' +
      '<div class="cmeta">' +
      (e.fecha ? '<span class="chip">📅 ' + fFecha(e.fecha) + '</span>' : '') +
      (e.hora  ? '<span class="chip">⏰ ' + e.hora + '</span>' : '') +
      (e.lugar ? '<span class="chip">📍 ' + e.lugar.split(',')[0] + '</span>' : '') +
      '</div>' +
      '<div class="cfoot">' +
      '<div class="cprice' + (!e.costo?' free':'') + '">' + (e.costo ? '$ '+Number(e.costo).toLocaleString('es-AR') : 'GRATIS') + '</div>' +
      '<div class="cfoot-btns">' +
      '<button class="cbtn-info" onclick="event.stopPropagation();window.abrirDetalleEvento(\'' + k + '\')">Mas info</button>' +
      '<button class="cbtn" ' + (full?'disabled':'') + ' onclick="event.stopPropagation();' + (e.tipo==='sesiones' ? 'window.abrirTurnosEvento(\'' + k + '\')' : 'window.abrirInscEvento(\'' + k + '\')') + '">' + (full?'Sin cupos':(e.tipo==='sesiones'?'📅 Turnos':'Inscribirme')) + '</button>' +
      '</div></div></div></div>';
  }).join('');
}

function renderAdminEventos() {
  const w = document.getElementById('admin-eventos-list'); if (!w) return;
  const filtro = document.getElementById('ev-filtro-estado')?.value || '';
  let lista = Object.entries(eventosDB).sort((a,b) => (b[1].creado||0)-(a[1].creado||0));
  if (filtro) lista = lista.filter(([,e]) => e.estado === filtro);
  const inscPorEv = {};
  Object.values(evInscDB).forEach(i => { if(i.evId) inscPorEv[i.evId] = (inscPorEv[i.evId]||0)+1; });
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin eventos</div>'; return; }
  w.innerHTML = lista.map(([k,e]) => {
    const n = inscPorEv[k] || 0;
    const ec = e.estado==='activo'?'#4caf7d':e.estado==='pendiente'?'#f5c842':'#555';
    return '<div class="admin-ci">' +
      '<div class="admin-ci-info">' +
      '<div class="admin-ci-tit">' + (e.titulo||'Sin titulo') +
      ' <span style="color:'+ec+';font-size:10px;background:rgba(255,255,255,.06);padding:2px 8px;border-radius:10px;margin-left:4px;">' + (e.estado||'pendiente').toUpperCase() + '</span>' +
      (e.dniOrg && e.dniOrg!=='tomauno' ? ' <span style="color:#a78bfa;font-size:10px;background:rgba(90,60,220,.1);padding:2px 8px;border-radius:10px;">ORG: '+e.dniOrg+'</span>' : '') +
      '</div>' +
      '<div class="admin-ci-sub">' + (e.fecha?fFecha(e.fecha):'Sin fecha') + ' · ' + n + ' inscriptos' + (e.nombreOrg?' · Org: <strong>'+e.nombreOrg+'</strong> ('+e.dniOrg+')':'') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
      (e.estado==='pendiente' ? '<button class="bsm gr" onclick="window.activarEvento(\'' + k + '\')">Activar</button>' : '') +
      (e.estado==='activo'    ? '<button class="bsm bl" onclick="window.finalizarEvento(\'' + k + '\')">Finalizar</button>' : '') +
      '<button class="bsm gr" onclick="window.editarEvento(\'' + k + '\')">Editar</button>' +
      (e.wpOrg ? '<a class="bsm wa" rel="noopener noreferrer" target="_blank" style="text-decoration:none;" href="https://wa.me/549' + String(e.wpOrg).replace(/[^0-9]/g,'') + '?text=' + waEncode('Hola! Te escribo desde Tomauno por tu evento: ' + (e.titulo||'')) + '">WA Org</a>' : '') +
      '<button class="bsm bl" onclick="window.exportarExcelEvento(\'' + k + '\')">Excel</button>' +
      '<button class="bsm bl" onclick="window.exportarPDFEvento(\'' + k + '\')">PDF</button>' +
      '<button class="bsm wa" onclick="window.verPlanillaEventoAdmin(\'' + k + '\')">📋 Planilla vivo</button>' +
      '<button class="bsm bl" onclick="window.copiarLinkEvento(\'' + k + '\')">🔗 Link</button>' +
      '<button class="bsm ' + (e.oculto?'gr':'bl') + '" onclick="window.togEvOc(\'' + k + '\',' + !e.oculto + ')">' + (e.oculto?'Mostrar':'Ocultar') + '</button>' +
      '<button class="bsm re" onclick="window.delEvento(\'' + k + '\')">Borrar</button>' +
      '</div></div>';
  }).join('');
}

window.abrirDetalleEvento = (id) => {
  const e = eventosDB[id]; if (!e) return;
  const n = Object.values(evInscDB).filter(i => i.evId === id).length;
  const full = e.cupos > 0 && n >= e.cupos;
  document.getElementById('mcontent').innerHTML =
    (e.img ? '<img src="' + e.img + '" style="width:100%;border-radius:var(--radius-sm);margin-bottom:16px;max-height:420px;object-fit:contain;background:#0a0a0a;display:block;cursor:zoom-in;" onclick="window.verFlyerFull(this.src)" onerror="this.style.display=\'none\'"/>' : '') +
    '<div class="mtitle">' + (e.titulo||'') + '</div>' +
    '<div class="msub">' + n + ' inscriptos' + (e.cupos>0?' · '+(e.cupos-n)+' cupos restantes':'') + '</div>' +
    '<div class="cmeta" style="margin-bottom:16px;">' +
    (e.fecha?'<span class="chip">📅 '+fFecha(e.fecha)+'</span>':'') +
    (e.hora ?'<span class="chip">⏰ '+e.hora+'</span>':'') +
    (e.lugar?'<span class="chip">📍 '+e.lugar+'</span>':'') +
    (e.costo?'<span class="chip accent">💰 $ '+Number(e.costo).toLocaleString('es-AR')+'</span>':'<span class="chip" style="color:#00d25a;">GRATIS</span>') +
    '</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.7;white-space:pre-line;margin-bottom:16px;">' + (e.desc||'') + '</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:14px;padding:6px 12px;background:rgba(255,255,255,.03);border-radius:8px;display:inline-block;">Plataforma Tomauno</div>' +
    (e.ig?'<br><a rel="noopener noreferrer" href="https://instagram.com/'+e.ig+'" target="_blank" class="det-link ig" style="margin-top:8px;display:inline-flex;">📸 @'+e.ig+'</a>':'') +
    (!full?'<button class="btn-main" style="margin-top:14px;" onclick="' + (e.tipo==='sesiones' ? 'window.abrirTurnosEvento(\'' + id + '\')' : 'window.abrirInscEvento(\'' + id + '\')') + '">' + (e.tipo==='sesiones'?'📅 Elegir turno':'Inscribirme') + '</button>':'') +
    '<div style="display:flex;gap:10px;margin-top:8px;">' +
    '<button class="btn-out" style="flex:1;" onclick="window.closeModal()">Cerrar</button>' +
    '<button class="btn-out" style="flex:1;border-color:rgba(232,0,10,.3);color:var(--red);" onclick="window.compartirEvento(\'' + id + '\')">Compartir</button>' +
    '</div>';
  openModal();
};

window.compartirEvento = (id) => {
  const url = window.location.origin + window.location.pathname + '#evento-' + id;
  navigator.clipboard.writeText(url).then(() => toast('Link copiado'));
};


function genSlotsEvento(e) {
  const sl = [];
  const [hi, mi] = (e.horaInicio || '09:00').split(':').map(Number);
  const [hf, mf] = (e.horaFin || '22:00').split(':').map(Number);
  const dur = parseInt(e.duracion) || 30;
  const descansos = (e.descansos || '').split(',').map(d => {
    const p = d.trim().split('-');
    if (p.length !== 2) return null;
    const [dhi, dmi] = p[0].trim().split(':').map(Number);
    const [dhf, dmf] = p[1].trim().split(':').map(Number);
    return {ini: dhi*60+(dmi||0), fin: dhf*60+(dmf||0)};
  }).filter(Boolean);
  let cur = hi*60+mi;
  const fin = hf*60+mf;
  while (cur + dur <= fin) {
    const bloqueado = descansos.some(d => cur < d.fin && cur + dur > d.ini);
    if (!bloqueado) {
      const h = String(Math.floor(cur/60)).padStart(2,'0');
      const m = String(cur%60).padStart(2,'0');
      const h2 = String(Math.floor((cur+dur)/60)).padStart(2,'0');
      const m2 = String((cur+dur)%60).padStart(2,'0');
      sl.push(h + ':' + m + '-' + h2 + ':' + m2);
    }
    cur += dur;
  }
  return sl;
}

window.abrirTurnosEvento = (id) => {
  const e = eventosDB[id]; if (!e) return;
  const slots = genSlotsEvento(e);
  const ocup = Object.values(evInscDB).filter(i => i.evId === id && i.turno);
  const libres = slots.filter(s => !ocup.find(i => i.turno === s)).length;
  let html = '<div class="mtitle">ELEGÍ TU TURNO</div>' +
    '<div class="msub">' + (e.titulo || '') + (e.fecha ? ' · ' + fFecha(e.fecha) : '') + ' · <span style="color:#4caf7d;">' + libres + ' disponibles</span></div>' +
    '<div class="slots-grid">';
  slots.forEach(s => {
    const q = ocup.find(i => i.turno === s);
    html += '<div class="slot ' + (q ? 'ocupado' : 'libre') + '" data-id="' + id + '" data-slot="' + s + '" ' + (q ? '' : 'onclick="window.selTurnoEvento(this)"') + '>' +
      '<div class="slot-t">' + s + '</div><div class="slot-n">' + (q ? (q.nombre || '').split(' ')[0] : '✓ Libre') + '</div></div>';
  });
  html += '</div><button class="btn-out" style="margin-top:16px;" onclick="window.closeModal()">Cancelar</button>';
  document.getElementById('mcontent').innerHTML = html;
  openModal();
};

window.selTurnoEvento = (el) => {
  const id = el.dataset.id;
  const turno = el.dataset.slot;
  window.abrirInscEvento(id, turno);
};

window.abrirInscEvento = (id, turnoElegido='') => {
  const e = eventosDB[id]; if (!e) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">INSCRIPCION</div>' +
    '<div class="msub">' + (e.titulo||'') + (e.fecha?' · '+fFecha(e.fecha):'') + (turnoElegido ? ' · <strong style="color:var(--red);">' + turnoElegido + '</strong>' : '') + '</div>' +
    (turnoElegido ? '<input type="hidden" id="fev-turno" value="' + turnoElegido + '"/>' : '') +
    '<div class="mlbl">Tus datos</div>' +
    '<input class="finput" id="fev-nom" placeholder="Nombre y apellido *"/>' +
    '<input class="finput" id="fev-wp" placeholder="WhatsApp * ej: 3764123456" type="tel"/>' +
    '<input class="finput" id="fev-dni" placeholder="DNI *" type="number"/>' +
    '<input class="finput" id="fev-edad" placeholder="Edad *" type="number" oninput="window.chkMenor()"/>' +
    '<input class="finput" id="fev-localidad" placeholder="Localidad (opcional)"/>' +
    '<input class="finput" id="fev-ig" placeholder="Instagram (sin @)"/>' +
    '<div id="tutor-box" style="display:none;">' +
    '<div class="mlbl" style="color:#f5c842;">Menor de edad</div>' +
    '<div class="tutor-box"><input class="finput" id="fev-tnombre" placeholder="Nombre tutor"/><input class="finput" id="fev-twp" placeholder="WP tutor *" type="tel"/></div>' +
    '</div>' +
    '<button class="btn-main" onclick="window.confirmarInscEvento(\'' + id + '\')">Confirmar inscripcion</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

function genPagosEvento(e) {
  if (e && e.pagoTipo === 'cuotas' && Number(e.meses) > 0) {
    const mm = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const n = new Date();
    const pagos = [{label:'Inscripción', estado:'pendiente', monto: e.montoInscripcion || e.costo || ''}];
    for (let i=0; i<Number(e.meses); i++) {
      const d = new Date(n.getFullYear(), n.getMonth()+i, 1);
      pagos.push({label:mm[d.getMonth()] + ' ' + d.getFullYear(), estado:'pendiente', monto:e.montoCuota || ''});
    }
    return pagos;
  }
  return [{label:'Pago único', estado:'pendiente', monto:(e && e.costo) ? e.costo : ''}];
}

window.confirmarInscEvento = async (id) => {
  const nom = document.getElementById('fev-nom')?.value.trim();
  const wp  = document.getElementById('fev-wp')?.value.trim();
  const dni = document.getElementById('fev-dni')?.value.trim();
  const edad= parseInt(document.getElementById('fev-edad')?.value)||0;
  const localidad = document.getElementById('fev-localidad')?.value.trim()||'';
  const ig  = document.getElementById('fev-ig')?.value.trim()||'';
  const twp = document.getElementById('fev-twp')?.value.trim()||'';
  const turno = document.getElementById('fev-turno')?.value || '';
  if (!nom) { toast('El nombre es obligatorio'); return; }
  if (!wp)  { toast('El WhatsApp es obligatorio'); return; }
  if (!dni) { toast('El DNI es obligatorio'); return; }
  if (!edad) { toast('La edad es obligatoria'); return; }
  if (edad < 18 && !twp) { toast('Ingresa el WP del tutor'); return; }
  const e = eventosDB[id];
  if (turno && Object.values(evInscDB).find(i => i.evId===id && i.turno===turno)) { toast('Ese turno ya fue tomado'); window.abrirTurnosEvento(id); return; }
  if (Object.values(evInscDB).find(i => i.evId===id && i.dni===dni)) { toast('Ya hay inscripcion con ese DNI'); return; }
  await push(ref(db, 'tomauno/evRegs'), {
    evId: id, evTitulo: e?e.titulo:'', nombre: nom, wp, dni, edad, localidad, ig,
    tutorWp: twp||null, turno: turno||'', dniOrg: e?e.dniOrg:'',
    fecha: new Date().toLocaleDateString('es-AR'), creado: Date.now(),
    pagos: genPagosEvento(e)
  });
  const waTo = (e && e.wpOrg) ? '549' + e.wpOrg.replace(/\D/g,'') : '5493764354522';
  const waText = '🎪 *NUEVA INSCRIPCIÓN A EVENTO*\n\n📌 *Evento:* '+(e?e.titulo:'')+'\n👤 *Nombre:* '+nom+'\n🪪 *DNI:* '+dni+'\n📱 *WhatsApp:* '+wp+(ig?'\n📸 *Instagram:* @'+ig:'')+(localidad?'\n📍 *Localidad:* '+localidad:'');
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=' + waTo + '&text=' + waEncode(waText);
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:12px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">✅</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">INSCRIPCION REGISTRADA</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Al presionar Aceptar se envian tus datos por WhatsApp.</div>' +
    '<button class="btn-main" id="wa-ev-btn">Aceptar - Enviar a WhatsApp</button>' +
    '</div>';
  document.getElementById('wa-ev-btn').onclick = () => { window.open(window._pendingWaUrl,'_blank'); closeModal(); toast('Inscripcion confirmada!'); };
};

window.abrirFormEvento = () => {
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:4px;">REGISTRAR MI EVENTO</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:18px;line-height:1.6;">Completá los datos. Tu evento quedará pendiente de aprobación. Nos contactaremos para coordinar el flyer.</div>' +
    '<label class="flbl">Nombre del organizador *</label>' +
    '<input class="finput" id="nev-org-nombre" placeholder="Tu nombre y apellido"/>' +
    '<label class="flbl">DNI del organizador * (será tu clave de acceso)</label>' +
    '<input class="finput" id="nev-org-dni" placeholder="Tu DNI" type="number"/>' +
    '<label class="flbl">WhatsApp del organizador *</label>' +
    '<input class="finput" id="nev-org-wp" placeholder="3764123456" type="tel"/>' +
    '<label class="flbl">Instagram del evento (sin @)</label>' +
    '<input class="finput" id="nev-ig" placeholder="mi_evento_ig"/>' +
    '<label class="flbl">Link grupo WhatsApp del evento (opcional)</label>' +
    '<input class="finput" id="nev-grupo-wa" placeholder="https://chat.whatsapp.com/..."/>' +
    '<div style="height:1px;background:var(--border);margin:14px 0;"></div>' +
    '<label class="flbl">Título del evento *</label>' +
    '<input class="finput" id="nev-titulo" placeholder="Ej: Taller de Fotografía"/>' +
    '<label class="flbl">Modalidad</label>' +
    '<select class="finput" id="nev-tipo" onchange="document.getElementById(\'nev-turnos-config\').style.display=this.value===\'sesiones\'?\'block\':\'none\'"><option value="evento">Inscripción normal</option><option value="sesiones">Con turnos / horarios</option></select>' +
    '<div id="nev-turnos-config" style="display:none;background:#1a0000;border:1px solid #3a0000;border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;"><div style="font-size:12px;color:var(--red);font-weight:800;margin-bottom:10px;">📅 Configuración de turnos</div><div class="frow2"><div class="fgroup"><label class="flbl">Hora inicio</label><input class="finput" id="nev-h-ini" type="time" value="09:00" style="color-scheme:dark"/></div><div class="fgroup"><label class="flbl">Hora fin</label><input class="finput" id="nev-h-fin" type="time" value="22:00" style="color-scheme:dark"/></div></div><div class="frow2"><div class="fgroup"><label class="flbl">Duración por turno</label><input class="finput" id="nev-dur" type="number" value="30"/></div><div class="fgroup"><label class="flbl">Descansos</label><input class="finput" id="nev-descansos" placeholder="13:00-14:00, 17:30-18:00"/></div></div></div>' +
    '<label class="flbl">Descripción</label>' +
    '<textarea class="finput" id="nev-desc" placeholder="De qué se trata tu evento..."></textarea>' +
    '<div class="frow2"><div class="fgroup"><label class="flbl">Texto link extra</label><input class="finput" id="nev-extra-text" placeholder="Ej: Ver bases / programa"/></div><div class="fgroup"><label class="flbl">URL link extra</label><input class="finput" id="nev-extra-url" placeholder="https://..."/></div></div>' +
    '<div class="frow2">' +
    '<div class="fgroup"><label class="flbl">Fecha</label><input class="finput" id="nev-fecha" type="date" style="color-scheme:dark"/></div>' +
    '<div class="fgroup"><label class="flbl">Hora</label><input class="finput" id="nev-hora" placeholder="18:00 a 21:00"/></div>' +
    '</div>' +
    '<label class="flbl">Lugar</label>' +
    '<input class="finput" id="nev-lugar" placeholder="Nombre del lugar, dirección"/>' +
    '<div class="frow2">' +
    '<div class="fgroup"><label class="flbl">Costo / pago único ($)</label><input class="finput" id="nev-costo" type="number" placeholder="0"/></div>' +
    '<div class="fgroup"><label class="flbl">Cupos (0=ilimitado)</label><input class="finput" id="nev-cupos" type="number" placeholder="0"/></div>' +
    '</div>' +
    '<label class="flbl">Tipo de pago</label>' +
    '<select class="finput" id="nev-pago-tipo" onchange="document.getElementById(\'nev-cuotas-wrap\').style.display=this.value===\'cuotas\'?\'block\':\'none\'"><option value="unico">Pago único</option><option value="cuotas">Inscripción + cuotas</option></select>' +
    '<div id="nev-cuotas-wrap" style="display:none;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;"><div class="frow2"><div class="fgroup"><label class="flbl">Monto inscripción ($)</label><input class="finput" id="nev-monto-insc" type="number" placeholder="0"/></div><div class="fgroup"><label class="flbl">Monto cuota mensual ($)</label><input class="finput" id="nev-monto-cuota" type="number" placeholder="0"/></div></div><div class="fgroup"><label class="flbl">Duración en meses</label><input class="finput" id="nev-meses" type="number" min="1" max="12" placeholder="3"/></div></div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:14px;padding:10px;background:rgba(255,255,255,.03);border-radius:8px;">El flyer lo agregaremos nosotros una vez aprobado tu evento.</div>' +
    '<button class="btn-main" onclick="window.enviarSolicitudEvento()">Enviar solicitud</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.enviarSolicitudEvento = async () => {
  const orgNombre = document.getElementById('nev-org-nombre')?.value.trim();
  const orgDni    = document.getElementById('nev-org-dni')?.value.trim();
  const orgWp     = document.getElementById('nev-org-wp')?.value.trim();
  const titulo    = document.getElementById('nev-titulo')?.value.trim();
  if (!orgNombre||!orgDni||!orgWp) { toast('Completá tus datos de organizador'); return; }
  if (!titulo) { toast('El título del evento es obligatorio'); return; }
  const nuevoEventoData = {
    titulo, desc: document.getElementById('nev-desc')?.value.trim()||'',
    extraText: document.getElementById('nev-extra-text')?.value.trim()||'',
    extraUrl: document.getElementById('nev-extra-url')?.value.trim()||'',
    fecha: document.getElementById('nev-fecha')?.value||'',
    hora: document.getElementById('nev-hora')?.value.trim()||'',
    lugar: document.getElementById('nev-lugar')?.value.trim()||'',
    costo: parseInt(document.getElementById('nev-costo')?.value)||0,
    cupos: parseInt(document.getElementById('nev-cupos')?.value)||0,
    pagoTipo: document.getElementById('nev-pago-tipo')?.value || 'unico',
    meses: parseInt(document.getElementById('nev-meses')?.value)||0,
    montoInscripcion: parseInt(document.getElementById('nev-monto-insc')?.value)||0,
    montoCuota: parseInt(document.getElementById('nev-monto-cuota')?.value)||0,
    tipo: document.getElementById('nev-tipo')?.value || 'evento',
    horaInicio: document.getElementById('nev-h-ini')?.value || '09:00',
    horaFin: document.getElementById('nev-h-fin')?.value || '22:00',
    duracion: parseInt(document.getElementById('nev-dur')?.value)||30,
    descansos: document.getElementById('nev-descansos')?.value.trim() || '',
    ig: document.getElementById('nev-ig')?.value.trim()||'',
    grupoWA: document.getElementById('nev-grupo-wa')?.value.trim()||'',
    img: '', dniOrg: orgDni, wpOrg: orgWp, nombreOrg: orgNombre,
    estado: 'pendiente', oculto: false, creado: Date.now()
  };
  await push(ref(db, 'tomauno/eventos'), nuevoEventoData);
  const avisoEvento = [
    '🎪 *EVENTO REGISTRADO EN LA WEB*',
    '',
    '📌 *Evento:* ' + (nuevoEventoData.titulo || '-'),
    '👤 *Organizador:* ' + (nuevoEventoData.nombreOrg || '-'),
    '🪪 *DNI acceso:* ' + (nuevoEventoData.dniOrg || '-'),
    '📱 *WhatsApp:* ' + (nuevoEventoData.wpOrg || '-'),
    nuevoEventoData.ig ? '📸 *Instagram:* @' + nuevoEventoData.ig : '',
    nuevoEventoData.fecha ? '📅 *Fecha:* ' + fFecha(nuevoEventoData.fecha) : '',
    nuevoEventoData.hora ? '⏰ *Hora:* ' + nuevoEventoData.hora : '',
    nuevoEventoData.lugar ? '📍 *Lugar:* ' + nuevoEventoData.lugar : '',
    '🧩 *Modalidad:* ' + (nuevoEventoData.tipo === 'sesiones' ? 'Con turnos / horarios' : 'Inscripción normal'),
    '💰 *Pago:* ' + (nuevoEventoData.pagoTipo === 'cuotas' ? ('Inscripción $ ' + Number(nuevoEventoData.montoInscripcion||0).toLocaleString('es-AR') + ' + ' + (nuevoEventoData.meses||0) + ' cuota(s) de $ ' + Number(nuevoEventoData.montoCuota||0).toLocaleString('es-AR')) : (nuevoEventoData.costo ? '$ ' + Number(nuevoEventoData.costo).toLocaleString('es-AR') : 'Gratis / sin costo cargado')),
    '👥 *Cupos:* ' + (nuevoEventoData.cupos ? nuevoEventoData.cupos : 'Ilimitados / sin cupo cargado'),
    nuevoEventoData.grupoWA ? '💬 *Grupo WA:* ' + nuevoEventoData.grupoWA : '',
    '',
    '🖼️ *Acción pendiente:* pedir el flyer al organizador por WhatsApp, subirlo a Imgur y pegar el link desde *Editar evento*.',
    '✅ *Estado actual:* Pendiente de aprobación'
  ].filter(Boolean).join('\n');
  window._pendingEventoAdminWa = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(avisoEvento);
  setTimeout(() => { try { window.open(window._pendingEventoAdminWa, '_blank'); } catch(e) {} }, 200);
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:20px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">🙏</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">SOLICITUD ENVIADA</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:8px;">Recibimos tu solicitud. Nos contactaremos pronto.</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:20px;">Tu clave de acceso es tu DNI: <strong style="color:#fff;">' + orgDni + '</strong></div>' +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button></div>';
};

window.accederOrganizador = () => {
  const dni = document.getElementById('org-dni-input')?.value.trim();
  if (!dni) { toast('Ingresá tu DNI'); return; }
  const misEventos = Object.entries(eventosDB).filter(([,e]) => String(e.dniOrg) === String(dni));
  if (!misEventos.length) { toast('No se encontraron eventos con ese DNI'); return; }
  const wrap = document.getElementById('org-panel-wrap'); if (!wrap) return;
  const inscPorEv = {};
  Object.values(evInscDB).forEach(i => { if(i.evId) inscPorEv[i.evId] = (inscPorEv[i.evId]||0)+1; });
  let html = '<div class="org-panel">' +
    '<div class="org-panel-header">' +
    '<div class="org-panel-title">Mis Eventos</div>' +
    '<button class="bsm re" onclick="document.getElementById(\'org-panel-wrap\').innerHTML=\'\'">Cerrar sesión</button>' +
    '</div>';
  misEventos.forEach(([k,e]) => {
    const misInsc = Object.entries(evInscDB).filter(([,i]) => i.evId===k);
    html += '<div style="background:var(--gray2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px;margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">' +
      '<div><div style="font-size:16px;font-weight:800;">' + (e.titulo||'') + '</div>' +
      '<div style="font-size:12px;color:var(--text3);">' + (e.fecha?fFecha(e.fecha):'Sin fecha') + ' · ' + misInsc.length + ' inscriptos · 💰 $ ' + totalPagosEvento(misInsc, e).toLocaleString('es-AR') + '</div></div>' +
      '<div style="display:flex;gap:6px;">' +
      '<button class="bsm bl" onclick="window.exportarExcelOrg(\'' + k + '\')">Excel</button>' +
      '<button class="bsm bl" onclick="window.exportarPDFOrg(\'' + k + '\')">PDF</button>' +
      (e.grupoWA ? '<a rel="noopener noreferrer" target="_blank" href="' + e.grupoWA + '" class="bsm wa" style="text-decoration:none;">Grupo WA</a>' : '') +
      '<button class="bsm gr" onclick="window.guardarPagosEvento(\'' + k + '\')">Guardar cambios</button>' +
      '</div></div>';
    if (misInsc.length) {
      html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:400px;">' +
        '<thead><tr style="border-bottom:1px solid var(--border);">' +
        '<th style="padding:6px;text-align:left;color:var(--text3);">Nombre</th>' +
        '<th style="padding:6px;text-align:left;color:var(--text3);">WP</th>' +
        '<th style="padding:6px;text-align:left;color:var(--text3);">DNI</th>' +
        '<th style="padding:6px;text-align:left;color:var(--text3);">Pago</th>' +
        '<th style="padding:6px;text-align:left;color:var(--text3);">Monto</th>' +
        '</tr></thead><tbody>';
      misInsc.forEach(([ik,i]) => {
        const est = (i.pagos&&i.pagos[0]) ? i.pagos[0].estado : 'pendiente';
        const clr = est==='pagado'?'#4caf7d':est==='parcial'?'#f5c842':'#e05252';
        html += '<tr style="border-bottom:1px solid #181818;">' +
          '<td style="padding:6px;">' + (i.nombre||'') + '</td>' +
          '<td style="padding:6px;"><a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp||'').replace(/[^0-9]/g,'') + '" target="_blank" style="color:#25d366;">' + (i.wp||'') + '</a></td>' +
          '<td style="padding:6px;">' + (i.dni||'-') + '</td>' +
          '<td style="padding:6px;"><select style="background:transparent;border:none;color:' + clr + ';font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font);outline:none;" onchange="window.updPagoOrg(\'' + ik + '\',this.value)">' +
          '<option value="pendiente" ' + (est==='pendiente'?'selected':'') + ' style="background:#111;">Pendiente</option>' +
          '<option value="parcial" '   + (est==='parcial'  ?'selected':'') + ' style="background:#111;">Parcial</option>' +
          '<option value="pagado" '    + (est==='pagado'   ?'selected':'') + ' style="background:#111;">Pagado</option>' +
          '</select></td>' +
          '<td style="padding:6px;"><input type="number" value="' + ((i.pagos&&i.pagos[0]&&i.pagos[0].monto)?i.pagos[0].monto:(((i.pagos&&i.pagos[0]&&i.pagos[0].estado)==='pagado'&&e.costo)?e.costo:'')) + '" placeholder="0" onchange="window.updMontoPagoEvento(\'' + ik + '\',this.value)" style="width:90px;background:#0d0d0d;border:1px solid var(--border);color:#fff;border-radius:8px;padding:5px;font-family:var(--font);"/></td></tr>';
      });
      html += '</tbody></table></div>';
    } else {
      html += '<div style="color:var(--text3);font-size:13px;padding:8px 0;">Sin inscriptos aún</div>';
    }
    html += '</div>';
  });
  html += '</div>';
  wrap.innerHTML = html;
  wrap.scrollIntoView({behavior:'smooth',block:'start'});
};

window.updPagoOrg = async (inscId, estado) => {
  const insc = evInscDB[inscId]; if (!insc) return;
  const pagos = [...(insc.pagos||[{label:'Pago unico',estado:'pendiente',monto:''}])];
  pagos[0] = Object.assign({}, pagos[0], {estado});
  await update(ref(db, 'tomauno/evRegs/' + inscId), {pagos});
  toast('Pago actualizado');
};

window.exportarExcelOrg = (evId) => {
  const lista = Object.values(evInscDB).filter(i => i.evId===evId);
  const e = eventosDB[evId];
  const cols = ['Nombre','DNI','WhatsApp','Instagram','Fecha','Pago','Monto'];
  const sep = ';';
  const q = v => '"' + String(v||'').replace(/"/g,'""') + '"';
  const rows = [
    ['Evento', e?e.titulo:'Evento'].map(q).join(sep),
    ['Fecha del evento', e&&e.fecha?e.fecha:''].map(q).join(sep),
    ['Generado', new Date().toLocaleDateString('es-AR')].map(q).join(sep),
    '',
    cols.map(q).join(sep)
  ];
  lista.forEach(i => {
    const est = (i.pagos&&i.pagos[0])?i.pagos[0].estado:'pendiente';
    const monto = pagoEventoInfo(i, e).monto;
    rows.push([i.nombre,i.dni,i.wp,i.ig||'',i.fecha,est,monto].map(q).join(sep));
  });
  const csv = '\ufeff' + rows.join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download = 'inscriptos_' + (e?e.titulo:'evento').replace(/[^a-zA-Z0-9]/g,'_') + '.csv';
  a.click();
};

window.exportarPDFOrg = (evId) => {
  const lista = Object.values(evInscDB).filter(i => i.evId===evId);
  const e = eventosDB[evId];
  const rows = lista.map(i => {
    const est = (i.pagos&&i.pagos[0])?i.pagos[0].estado:'pendiente';
    const monto = pagoEventoInfo(i, e).monto;
    return '<tr><td>'+(i.nombre||'')+'</td><td>'+(i.dni||'')+'</td><td>'+(i.wp||'')+'</td><td>'+est+'</td><td>$ '+Number(monto).toLocaleString('es-AR')+'</td></tr>';
  }).join('');
  const win = window.open('','_blank');
  if (win) {
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inscriptos</title><link rel="stylesheet" href="css/04-style-04.css"/></head><body><div style="background:#111;color:#fff;padding:16px 18px;border-radius:10px;margin-bottom:14px;"><h1 style="margin:0;font-size:22px;">TOMA<span style="color:#e8000a;">UNO</span></h1><div style="font-size:13px;margin-top:5px;">Planilla de evento: <strong>'+(e?e.titulo:'Evento')+'</strong>'+(e&&e.fecha?' · '+e.fecha:'')+'</div></div><p><strong>'+lista.length+'</strong> inscriptos · Generado: '+new Date().toLocaleDateString('es-AR')+'</p><table><thead><tr><th>Nombre</th><th>DNI</th><th>WP</th><th>Pago</th><th>Monto</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>');
    win.document.close();
    setTimeout(()=>win.print(),400);
  }
};

window.exportarExcelEvento = (evId) => {
  const lista = Object.values(evInscDB).filter(i => i.evId===evId);
  const e = eventosDB[evId];
  const cols = ['Nombre','DNI','WhatsApp','Instagram','Fecha','Pago','Monto'];
  const sep = ';';
  const q = v => '"' + String(v||'').replace(/"/g,'""') + '"';
  const rows = [
    ['Evento', e?e.titulo:'Evento'].map(q).join(sep),
    ['Fecha del evento', e&&e.fecha?e.fecha:''].map(q).join(sep),
    ['Generado', new Date().toLocaleDateString('es-AR')].map(q).join(sep),
    '',
    cols.map(q).join(sep)
  ];
  lista.forEach(i => {
    const est = (i.pagos&&i.pagos[0])?i.pagos[0].estado:'pendiente';
    const monto = pagoEventoInfo(i, e).monto;
    rows.push([i.nombre,i.dni,i.wp,i.ig||'',i.fecha,est,monto].map(q).join(sep));
  });
  const csv = '\ufeff' + rows.join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download = 'inscriptos_' + (e?e.titulo:'evento').replace(/[^a-zA-Z0-9]/g,'_') + '.csv';
  a.click();
};

window.exportarPDFEvento = (evId) => {
  const lista = Object.values(evInscDB).filter(i => i.evId===evId);
  const e = eventosDB[evId];
  const rows = lista.map(i => {
    const est = (i.pagos&&i.pagos[0])?i.pagos[0].estado:'pendiente';
    const monto = pagoEventoInfo(i, e).monto;
    return '<tr><td>'+(i.nombre||'')+'</td><td>'+(i.dni||'')+'</td><td>'+(i.wp||'')+'</td><td>'+est+'</td><td>$ '+Number(monto).toLocaleString('es-AR')+'</td></tr>';
  }).join('');
  const win = window.open('','_blank');
  if (win) {
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inscriptos</title><link rel="stylesheet" href="css/05-style-05.css"/></head><body><div style="background:#111;color:#fff;padding:16px 18px;border-radius:10px;margin-bottom:14px;"><h1 style="margin:0;font-size:22px;">TOMA<span style="color:#e8000a;">UNO</span></h1><div style="font-size:13px;margin-top:5px;">Planilla de evento: <strong>'+(e?e.titulo:'Evento')+'</strong>'+(e&&e.fecha?' · '+e.fecha:'')+'</div></div><p><strong>'+lista.length+'</strong> inscriptos · Generado: '+new Date().toLocaleDateString('es-AR')+'</p><table><thead><tr><th>Nombre</th><th>DNI</th><th>WP</th><th>Pago</th><th>Monto</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>');
    win.document.close();
    setTimeout(()=>win.print(),400);
  }
};

window.activarEvento   = async (id) => { await update(ref(db,'tomauno/eventos/'+id),{estado:'activo'}); toast('Evento activado'); };
window.finalizarEvento = async (id) => { await update(ref(db,'tomauno/eventos/'+id),{estado:'finalizado'}); toast('Evento finalizado'); };
window.togEvOc = async (id,v) => { await update(ref(db,'tomauno/eventos/'+id),{oculto:v}); };
window.delEvento = async (id) => {
  showConfirm('Eliminar este evento?', async () => {
    await remove(ref(db,'tomauno/eventos/'+id));
    toast('Evento eliminado');
  });
};


function pagoEventoInfo(i, e) {
  const pagos = (i.pagos && i.pagos.length) ? i.pagos : genPagosEvento(e || {});
  const total = pagos.length;
  const pagados = pagos.filter(p => p.estado === 'pagado').length;
  const parciales = pagos.filter(p => p.estado === 'parcial').length;
  const estado = pagados === total ? 'pagado' : (pagados > 0 || parciales > 0 ? 'parcial' : 'pendiente');
  const monto = pagos.reduce((acc,p) => {
    if (p.estado === 'pagado' || p.estado === 'parcial') return acc + (parseFloat(String(p.monto || '').replace(',', '.')) || 0);
    return acc;
  }, 0);
  return {estado, monto};
}

function totalPagosEvento(lista, e) {
  return lista.reduce((acc, [,i]) => acc + pagoEventoInfo(i, e).monto, 0);
}

window.updMontoPagoEvento = async (inscId, monto) => {
  const insc = evInscDB[inscId]; if (!insc) return;
  const pagos = [...(insc.pagos||[{label:'Pago unico',estado:'pendiente',monto:''}])];
  pagos[0] = Object.assign({}, pagos[0], {monto: monto || ''});
  await update(ref(db, 'tomauno/evRegs/' + inscId), {pagos});
};

window.guardarPagosEvento = (evId) => {
  toast('✅ Cambios de pagos guardados', true);
  setTimeout(()=>{ if(evId && window.verPlanillaEventoAdmin) window.verPlanillaEventoAdmin(evId); }, 250);
};

window.verPlanillaEventoAdmin = (id) => {
  const e = eventosDB[id];
  const lista = Object.entries(evInscDB).filter(([,i])=>i.evId===id).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0));
  const total = totalPagosEvento(lista, e);
  const pagados = lista.filter(([,i]) => pagoEventoInfo(i,e).estado === 'pagado').length;
  const parciales = lista.filter(([,i]) => pagoEventoInfo(i,e).estado === 'parcial').length;
  const pendientes = lista.filter(([,i]) => pagoEventoInfo(i,e).estado === 'pendiente').length;
  let html = '<div class="mtitle" style="margin-bottom:6px;">📋 PLANILLA EVENTO</div>' +
    '<div class="msub" style="margin-bottom:14px;">' + (e?e.titulo:'Evento') + '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--text2);">' +
    '<span>👥 <strong>' + lista.length + '</strong> inscriptos</span>' +
    '<span>✅ <strong style="color:#4caf7d;">' + pagados + '</strong> pagados</span>' +
    '<span>⚡ <strong style="color:#f5c842;">' + parciales + '</strong> parciales</span>' +
    '<span>⏳ <strong style="color:#e05252;">' + pendientes + '</strong> pendientes</span>' +
    '<span>💰 Total cobrado: <strong style="color:#4caf7d;">$ ' + total.toLocaleString('es-AR') + '</strong></span>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
    '<button class="bsm bl" onclick="window.exportarExcelEvento(\'' + id + '\')">📊 Excel</button>' +
    '<button class="bsm bl" onclick="window.exportarPDFEvento(\'' + id + '\')">📄 PDF</button>' +
    (e&&e.grupoWA ? '<a rel="noopener noreferrer" target="_blank" href="' + e.grupoWA + '" class="bsm wa" style="text-decoration:none;">💬 Grupo WA</a>' : '') +
    '<button class="bsm gr" onclick="window.guardarPagosEvento(\'' + id + '\')">💾 Guardar cambios</button>' +
    '</div>';
  if (!lista.length) {
    html += '<div style="color:var(--text3);padding:18px 0;">Sin inscriptos aún</div>';
  } else {
    html += '<div style="overflow-x:hidden;"><table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;">' +
      '<thead><tr><th style="padding:7px;text-align:left;color:var(--text3);width:24%;">Nombre</th><th style="padding:7px;text-align:left;color:var(--text3);width:12%;">DNI</th><th style="padding:7px;text-align:left;color:var(--text3);width:15%;">WP</th><th style="padding:7px;text-align:left;color:var(--text3);width:18%;">IG</th><th style="padding:7px;text-align:left;color:var(--text3);width:16%;">Pago</th><th style="padding:7px;text-align:left;color:var(--text3);width:15%;">Monto</th></tr></thead><tbody>';
    lista.forEach(([ik,i]) => {
      const p = pagoEventoInfo(i,e);
      const clr = p.estado==='pagado'?'#4caf7d':p.estado==='parcial'?'#f5c842':'#e05252';
      const montoActual = (i.pagos&&i.pagos[0]&&i.pagos[0].monto) ? i.pagos[0].monto : (p.estado==='pagado'&&e&&e.costo?e.costo:'');
      html += '<tr style="border-bottom:1px solid #181818;"><td style="padding:7px;">'+(i.nombre||'')+'</td>' +
        '<td style="padding:7px;">'+(i.dni||'')+'</td>' +
        '<td style="padding:7px;"><a rel="noopener noreferrer" href="https://wa.me/549'+(i.wp||'').replace(/[^0-9]/g,'')+'" target="_blank" style="color:#25d366;">'+(i.wp||'')+'</a></td>' +
        '<td style="padding:7px;">'+(i.ig?'<a rel="noopener noreferrer" href="https://instagram.com/'+i.ig.replace('@','')+'" target="_blank" class="ig-link">@'+i.ig.replace('@','')+'</a>':'-')+'</td>' +
        '<td style="padding:7px;"><select style="background:transparent;border:none;color:'+clr+';font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font);outline:none;" onchange="window.updPagoOrg(\'' + ik + '\',this.value)"><option value="pendiente" '+(p.estado==='pendiente'?'selected':'')+' style="background:#111;">Pendiente</option><option value="parcial" '+(p.estado==='parcial'?'selected':'')+' style="background:#111;">Parcial</option><option value="pagado" '+(p.estado==='pagado'?'selected':'')+' style="background:#111;">Pagado</option></select></td>' +
        '<td style="padding:7px;"><input type="number" value="'+montoActual+'" placeholder="0" onchange="window.updMontoPagoEvento(\'' + ik + '\',this.value)" style="width:95px;background:#0d0d0d;border:1px solid var(--border);color:#fff;border-radius:8px;padding:6px;font-family:var(--font);"/></td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '<button class="btn-out" onclick="window.closeModal()" style="margin-top:16px;">Cerrar</button>';
  document.getElementById('mcontent').innerHTML = html;
  openModal();
};

window.verInscEventoAdmin = (id) => {
  const e = eventosDB[id];
  const lista = Object.entries(evInscDB).filter(([,i])=>i.evId===id);
  let html = '<div class="mtitle" style="margin-bottom:8px;">' + (e?e.titulo:'Evento') + '</div>' +
    '<div class="msub" style="margin-bottom:16px;">' + lista.length + ' inscriptos</div>';
  if (!lista.length) {
    html += '<div style="color:var(--text3);">Sin inscriptos aún</div>';
  } else {
    html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:400px;">' +
      '<thead><tr><th style="padding:7px;text-align:left;border-bottom:1px solid var(--border);color:var(--text3);">Nombre</th>' +
      '<th style="padding:7px;text-align:left;border-bottom:1px solid var(--border);color:var(--text3);">DNI</th>' +
      '<th style="padding:7px;text-align:left;border-bottom:1px solid var(--border);color:var(--text3);">WP</th>' +
      '<th style="padding:7px;text-align:left;border-bottom:1px solid var(--border);color:var(--text3);">Pago</th>' +
      '</tr></thead><tbody>';
    lista.forEach(([,i]) => {
      const est = (i.pagos&&i.pagos[0])?i.pagos[0].estado:'pendiente';
      const clr = est==='pagado'?'#4caf7d':est==='parcial'?'#f5c842':'#e05252';
      html += '<tr><td style="padding:7px;">'+(i.nombre||'')+'</td>' +
        '<td style="padding:7px;">'+(i.dni||'')+'</td>' +
        '<td style="padding:7px;"><a rel="noopener noreferrer" href="https://wa.me/549'+(i.wp||'').replace(/[^0-9]/g,'')+'" target="_blank" style="color:#25d366;">'+(i.wp||'')+'</a></td>' +
        '<td style="padding:7px;font-weight:700;color:'+clr+';">'+est+'</td></tr>';
    });
    html += '</tbody></table></div>';
  }
  html += '<button class="btn-out" onclick="window.closeModal()" style="margin-top:16px;">Cerrar</button>';
  document.getElementById('mcontent').innerHTML = html;
  openModal();
};

window.editarEvento = (id) => {
  const e = eventosDB[id]; if (!e) return;
  window._editEvId = id;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:16px;">EDITAR EVENTO</div>' +
    '<div class="frow2"><div><label class="flbl">Organizador</label><input class="finput" id="ee-org" value="' + (e.nombreOrg||'').replace(/"/g,'&quot;') + '"/></div><div><label class="flbl">DNI organizador / acceso</label><input class="finput" id="ee-dni" value="' + (e.dniOrg||'') + '"/></div></div>' +
    '<label class="flbl">Título</label><input class="finput" id="ee-titulo" value="' + (e.titulo||'').replace(/"/g,'&quot;') + '"/>' +
    '<label class="flbl">Descripción</label><textarea class="finput" id="ee-desc" rows="3">' + (e.desc||'') + '</textarea>' +
    '<div class="frow2"><div><label class="flbl">Fecha</label><input class="finput" id="ee-fecha" type="date" value="' + (e.fecha||'') + '" style="color-scheme:dark"/></div>' +
    '<div><label class="flbl">Hora</label><input class="finput" id="ee-hora" value="' + (e.hora||'') + '"/></div></div>' +
    '<label class="flbl">Lugar</label><input class="finput" id="ee-lugar" value="' + (e.lugar||'').replace(/"/g,'&quot;') + '"/>' +
    '<div class="frow2"><div><label class="flbl">Costo / pago único</label><input class="finput" id="ee-costo" type="number" value="' + (e.costo||0) + '"/></div>' +
    '<div><label class="flbl">Cupos</label><input class="finput" id="ee-cupos" type="number" value="' + (e.cupos||0) + '"/></div></div>' +
    '<label class="flbl">Tipo de pago</label><select class="finput" id="ee-pago-tipo" onchange="document.getElementById(\'ee-cuotas-wrap\').style.display=this.value===\'cuotas\'?\'block\':\'none\'"><option value="unico" '+((e.pagoTipo||'unico')==='unico'?'selected':'')+'>Pago único</option><option value="cuotas" '+(e.pagoTipo==='cuotas'?'selected':'')+'>Inscripción + cuotas</option></select>' +
    '<div id="ee-cuotas-wrap" style="display:'+(e.pagoTipo==='cuotas'?'block':'none')+';background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;"><div class="frow2"><div><label class="flbl">Monto inscripción</label><input class="finput" id="ee-monto-insc" type="number" value="'+(e.montoInscripcion||0)+'"/></div><div><label class="flbl">Monto cuota</label><input class="finput" id="ee-monto-cuota" type="number" value="'+(e.montoCuota||0)+'"/></div></div><label class="flbl">Duración en meses</label><input class="finput" id="ee-meses" type="number" value="'+(e.meses||0)+'"/></div>' +
    '<label class="flbl">Modalidad</label><select class="finput" id="ee-tipo"><option value="evento" '+((e.tipo||'evento')==='evento'?'selected':'')+'>Inscripción normal</option><option value="sesiones" '+(e.tipo==='sesiones'?'selected':'')+'>Con turnos / horarios</option></select>' +
    '<div class="frow2"><div><label class="flbl">Hora inicio turnos</label><input class="finput" id="ee-hini" type="time" value="' + (e.horaInicio||'09:00') + '" style="color-scheme:dark"/></div><div><label class="flbl">Hora fin turnos</label><input class="finput" id="ee-hfin" type="time" value="' + (e.horaFin||'22:00') + '" style="color-scheme:dark"/></div></div>' +
    '<div class="frow2"><div><label class="flbl">Duración turno</label><input class="finput" id="ee-dur" type="number" value="' + (e.duracion||30) + '"/></div><div><label class="flbl">Descansos</label><input class="finput" id="ee-descansos" value="' + (e.descansos||'').replace(/"/g,'&quot;') + '"/></div></div>' +
    '<label class="flbl">URL Flyer (Imgur)</label><input class="finput" id="ee-img" value="' + (e.img||'') + '" placeholder="https://i.imgur.com/..."/>' +
    '<label class="flbl">Instagram (sin @)</label><input class="finput" id="ee-ig" value="' + (e.ig||'') + '"/>' +
    '<label class="flbl">WhatsApp organizador</label><input class="finput" id="ee-wp" value="' + (e.wpOrg||'') + '"/>' +
    '<label class="flbl">Link grupo WhatsApp del evento</label><input class="finput" id="ee-gwa" value="' + (e.grupoWA||'') + '" placeholder="https://chat.whatsapp.com/..."/>' +
    '<label class="flbl">Estado</label>' +
    '<select class="finput" id="ee-estado">' +
    '<option value="pendiente" '+(e.estado==='pendiente'?'selected':'')+'>Pendiente de aprobacion</option>' +
    '<option value="activo" '   +(e.estado==='activo'   ?'selected':'')+'>Activo</option>' +
    '<option value="finalizado" '+(e.estado==='finalizado'?'selected':'')+'>Finalizado</option>' +
    '</select>' +
    '<button class="btn-main" onclick="window.guardarEditEvento()">Guardar cambios</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarEditEvento = async () => {
  const id = window._editEvId; if (!id) return;
  await update(ref(db,'tomauno/eventos/'+id), {
    nombreOrg: document.getElementById('ee-org')?.value.trim()||'',
    dniOrg: document.getElementById('ee-dni')?.value.trim()||'',
    titulo: document.getElementById('ee-titulo')?.value.trim()||'',
    desc:   document.getElementById('ee-desc')?.value.trim()||'',
    fecha:  document.getElementById('ee-fecha')?.value||'',
    hora:   document.getElementById('ee-hora')?.value.trim()||'',
    lugar:  document.getElementById('ee-lugar')?.value.trim()||'',
    costo:  parseInt(document.getElementById('ee-costo')?.value)||0,
    cupos:  parseInt(document.getElementById('ee-cupos')?.value)||0,
    pagoTipo: document.getElementById('ee-pago-tipo')?.value||'unico',
    meses: parseInt(document.getElementById('ee-meses')?.value)||0,
    montoInscripcion: parseInt(document.getElementById('ee-monto-insc')?.value)||0,
    montoCuota: parseInt(document.getElementById('ee-monto-cuota')?.value)||0,
    img:    document.getElementById('ee-img')?.value.trim()||'',
    ig:     document.getElementById('ee-ig')?.value.trim()||'',
    wpOrg:  document.getElementById('ee-wp')?.value.trim()||'',
    grupoWA: document.getElementById('ee-gwa')?.value.trim()||'',
    tipo: document.getElementById('ee-tipo')?.value||'evento',
    horaInicio: document.getElementById('ee-hini')?.value||'09:00',
    horaFin: document.getElementById('ee-hfin')?.value||'22:00',
    duracion: parseInt(document.getElementById('ee-dur')?.value)||30,
    descansos: document.getElementById('ee-descansos')?.value.trim()||'',
    estado: document.getElementById('ee-estado')?.value||'pendiente',
  });
  window._editEvId = null;
  closeModal();
  toast('Evento actualizado');
};



// ── GALERÍA ───────────────────────────────────────────────────────────────────
let galeriaDB = {};
onValue(ref(db, 'tomauno/galeria'), s => {
  galeriaDB = s.exists() ? s.val() : {};
  renderGaleria();
  renderGaleriaAdmin();
});

function renderGaleria() {
  const g = document.getElementById('galeria-grid'); if (!g) return;
  const lista = Object.entries(galeriaDB)
    .filter(([,f]) => !f.oculto)
    .sort((a,b) => (b[1].creado||0)-(a[1].creado||0));
  if (!lista.length) {
    g.innerHTML = '<div style="color:var(--text3);font-size:14px;padding:20px 0;">Las fotos del estudio apareceran aqui.</div>';
    return;
  }
  g.innerHTML = lista.map(([k,f]) => {
    const url = f.url || '';
    const cap = f.caption || '';
    return '<div class="gal-card" onclick="window.verFlyerFull(\'' + url + '\')" style="cursor:pointer;">' +
      '<div class="gal-card-img"><img src="' + url + '" alt="Tomauno Estudio" loading="lazy"/></div>' +
      '<div class="gal-card-caption">' + (cap || 'Tomauno Estudio') + '</div>' +
      '</div>';
  }).join('');
}

function renderGaleriaAdmin() {
  const w = document.getElementById('admin-galeria-list'); if (!w) return;
  const lista = Object.entries(galeriaDB).sort((a,b) => (b[1].creado||0)-(a[1].creado||0));
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin fotos aun</div>'; return; }
  w.innerHTML = lista.map(([k,f]) => {
    const ocBtn = f.oculto
      ? '<button class="bsm gr" onclick="window.togGalOc(\'' + k + '\',false)">Mostrar</button>'
      : '<button class="bsm bl" onclick="window.togGalOc(\'' + k + '\',true)">Ocultar</button>';
    return '<div class="admin-ci">' +
      '<img src="' + (f.url||'') + '" style="width:56px;height:42px;object-fit:cover;border-radius:6px;border:1px solid var(--border);flex-shrink:0;"/>' +
      '<div class="admin-ci-info"><div class="admin-ci-tit">' + (f.caption||'Sin descripcion') + '</div>' +
      '<div class="admin-ci-sub">' + (f.oculto?'Oculta':'Visible') + '</div></div>' +
      '<div style="display:flex;gap:6px;">' + ocBtn +
      '<button class="bsm re" onclick="window.delGal(\'' + k + '\')">Borrar</button>' +
      '</div></div>';
  }).join('');
}

window.agregarFotoGaleria = async () => {
  const url = document.getElementById('ng-url')?.value.trim();
  if (!url) { toast('La URL es obligatoria'); return; }
  await push(ref(db, 'tomauno/galeria'), {
    url,
    caption: document.getElementById('ng-caption')?.value.trim() || '',
    oculto: false, creado: Date.now()
  });
  const eu = document.getElementById('ng-url'); if (eu) eu.value = '';
  const ec = document.getElementById('ng-caption'); if (ec) ec.value = '';
  toast('Foto publicada');
};

window.togGalOc = async (id,v) => { await update(ref(db,'tomauno/galeria/'+id),{oculto:v}); };
window.delGal = async (id) => {
  showConfirm('Eliminar esta foto?', async () => {
    await remove(ref(db,'tomauno/galeria/'+id));
    toast('Foto eliminada');
  });
};


// ── AGENDA AUTOMÁTICA PARA REDES ─────────────────────────────────────────────
function getAgendaItems() {
  const cursosItems = Object.entries(cursos || {})
    .filter(([, c]) => !c.oculto && !c.finalizado)
    .map(([id, c]) => ({
      uid: 'curso_' + id,
      id,
      tipo: c.tipo === 'sesiones' ? 'TURNOS' : 'CURSO',
      icon: c.tipo === 'sesiones' ? '📅' : (c.icon || '🎓'),
      titulo: c.titulo || 'Actividad Tomauno',
      fecha: c.fecha || '',
      hora: c.hora || '',
      lugar: c.lugar || 'Tomauno Estudio',
      costo: Number(c.costo || 0),
      fuente: 'curso',
      extra: c.disertante ? c.disertante : (c.ig ? '@' + String(c.ig).replace('@','') : 'Tomauno Capacitaciones')
    }));
  const eventosItems = Object.entries(eventosDB || {})
    .filter(([, e]) => e.estado === 'activo' && !e.oculto)
    .map(([id, e]) => ({
      uid: 'evento_' + id,
      id,
      tipo: e.tipo === 'sesiones' ? 'TURNOS' : 'EVENTO',
      icon: '🎪',
      titulo: e.titulo || 'Evento de la ciudad',
      fecha: e.fecha || '',
      hora: e.hora || '',
      lugar: e.lugar || 'Posadas, Misiones',
      costo: Number(e.costo || 0),
      fuente: 'evento',
      extra: e.nombreOrg ? e.nombreOrg : (e.ig ? '@' + String(e.ig).replace('@','') : 'Evento de la ciudad')
    }));
  const serviciosItems = Object.entries(serviciosDB || {})
    .filter(([, s]) => !s.oculto)
    .map(([id, s]) => ({
      uid: 'servicio_' + id,
      id,
      tipo: s.tipo === 'sesiones' ? 'TURNOS' : 'SERVICIO',
      icon: s.icon || '📷',
      titulo: s.titulo || 'Servicio Tomauno',
      fecha: s.fecha || '',
      hora: s.hora || '',
      lugar: s.dir || s.lugar || 'Tomauno Estudio',
      costo: Number(s.precio || s.costo || 0),
      fuente: 'servicio',
      extra: s.ig ? '@' + String(s.ig).replace('@','') : 'Tomauno Models'
    }));
  return [...cursosItems, ...eventosItems, ...serviciosItems].sort((a, b) => {
    if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
    if (a.fecha && !b.fecha) return -1;
    if (!a.fecha && b.fecha) return 1;
    const order = {curso: 1, evento: 2, servicio: 3};
    if (order[a.fuente] !== order[b.fuente]) return order[a.fuente] - order[b.fuente];
    return a.titulo.localeCompare(b.titulo);
  });
}

function getSelectedAgendaItems() {
  const all = getAgendaItems();
  const checked = Array.from(document.querySelectorAll('.agenda-item-check:checked')).map(i => i.value);
  const limit = Math.max(2, Math.min(12, parseInt(document.getElementById('ag-limit')?.value) || 7));
  if (!document.querySelector('.agenda-item-check')) return all.slice(0, limit);
  return all.filter(it => checked.includes(it.uid)).slice(0, limit);
}

function renderAgendaSelector() {
  const list = document.getElementById('agenda-list-preview');
  if (!list) return;
  const all = getAgendaItems();
  const currentChecked = new Set(Array.from(document.querySelectorAll('.agenda-item-check:checked')).map(i => i.value));
  if (!all.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:13px;">No hay actividades activas para mostrar.</div>';
    return;
  }
  const firstRender = !document.querySelector('.agenda-item-check');
  const limit = Math.max(2, Math.min(12, parseInt(document.getElementById('ag-limit')?.value) || 7));
  list.innerHTML = all.map((it, idx) => {
    const selected = firstRender ? idx < limit : currentChecked.has(it.uid);
    const color = it.fuente === 'evento' ? '#7b0010' : it.fuente === 'servicio' ? '#46000a' : '#e8000a';
    return '<label style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0d0d0d;border:1px solid var(--border);border-radius:12px;padding:10px 12px;cursor:pointer;">' +
      '<div style="display:flex;align-items:center;gap:10px;min-width:0;">' +
      '<input class="agenda-item-check" type="checkbox" value="' + it.uid + '" ' + (selected ? 'checked' : '') + ' onchange="window.previsualizarAgendaRedes()" style="accent-color:var(--red);width:16px;height:16px;flex-shrink:0;">' +
      '<div style="min-width:0;"><div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + it.icon + ' ' + it.titulo + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (it.fecha ? fFecha(it.fecha) : 'Sin fecha') + (it.hora ? ' · ' + it.hora : '') + ' · ' + it.extra + '</div></div>' +
      '</div><span style="font-size:10px;font-weight:900;color:#fff;background:' + color + ';border-radius:20px;padding:4px 9px;flex-shrink:0;">' + it.tipo + '</span></label>';
  }).join('');
}

function drawAgendaCanvas(canvas, mode = 'story', scalePreview = false) {
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = mode === 'post' ? 1080 : 1920;
  canvas.width = scalePreview ? 270 : W;
  canvas.height = scalePreview ? (mode === 'post' ? 270 : 480) : H;
  const sx = canvas.width / W;
  const sy = canvas.height / H;
  ctx.save();
  ctx.scale(sx, sy);

  const title = document.getElementById('ag-title')?.value.trim() || 'AGENDA TOMAUNO';
  const subtitle = document.getElementById('ag-subtitle')?.value.trim() || 'Cursos, capacitaciones y eventos disponibles';
  const cta = document.getElementById('ag-cta')?.value.trim() || 'Inscripciones desde la web · Link en bio';
  const items = getSelectedAgendaItems();

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#030303');
  bg.addColorStop(.24, '#280407');
  bg.addColorStop(.62, '#090909');
  bg.addColorStop(1, '#41000a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 90) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  const glow = ctx.createRadialGradient(W*.56, H*.37, 0, W*.56, H*.37, W*.86);
  glow.addColorStop(0, 'rgba(232,0,10,0.62)');
  glow.addColorStop(.44, 'rgba(232,0,10,0.20)');
  glow.addColorStop(1, 'rgba(232,0,10,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Header marca: sin depender de imagen externa, para evitar CORS y mejorar calidad.
  const logoX = 88, logoY = mode === 'post' ? 76 : 92, logoR = mode === 'post' ? 42 : 50;
  ctx.fillStyle = '#050505';
  ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI*2); ctx.fill();
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.stroke();
  ctx.fillStyle = '#e8000a';
  ctx.beginPath(); ctx.arc(logoX, logoY, logoR-13, 0, Math.PI*2); ctx.fill();
  ctx.font = '900 ' + (mode === 'post' ? 30 : 36) + 'px Bebas Neue, Impact, Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('T1', logoX, logoY+12);

  ctx.textAlign = 'left';
  ctx.font = '900 ' + (mode === 'post' ? 54 : 66) + 'px Bebas Neue, Impact, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('TOMA', 158, logoY+4);
  const tomaW = ctx.measureText('TOMA').width;
  ctx.fillStyle = '#ff0712';
  ctx.fillText('UNO', 158 + tomaW + 8, logoY+4);
  ctx.font = '800 ' + (mode === 'post' ? 18 : 23) + 'px Outfit, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.50)';
  ctx.fillText('CURSOS & CAPACITACIONES', 160, logoY+42);
  ctx.font = '900 ' + (mode === 'post' ? 22 : 28) + 'px Outfit, Arial, sans-serif';
  ctx.fillStyle = '#ff0712';
  ctx.fillText('Tomauno está con vos!!', 160, logoY + (mode === 'post' ? 72 : 82));

  // Título central con más aire.
  const top = mode === 'post' ? 230 : 340;
  ctx.textAlign = 'center';
  ctx.font = '900 ' + (mode === 'post' ? 66 : 92) + 'px Bebas Neue, Impact, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  wrapCanvasText(ctx, title.toUpperCase(), W/2, top, W - 190, mode === 'post' ? 64 : 86, 2);
  ctx.font = '700 ' + (mode === 'post' ? 24 : 31) + 'px Outfit, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  wrapCanvasText(ctx, subtitle, W/2, top + (mode === 'post' ? 70 : 102), W - 200, mode === 'post' ? 32 : 39, 2);

  const n = Math.max(items.length, 1);
  const startY = mode === 'post' ? 385 : 545;
  const footerReserve = mode === 'post' ? 180 : 255;
  const available = H - startY - footerReserve;
  const gap = n <= 4 ? (mode === 'post' ? 18 : 26) : n <= 7 ? (mode === 'post' ? 11 : 18) : (mode === 'post' ? 7 : 12);
  const minH = mode === 'post' ? 54 : 78;
  const maxH = mode === 'post' ? 92 : 126;
  const cardH = Math.max(minH, Math.min(maxH, Math.floor((available - gap * (n - 1)) / n)));
  let y = startY;

  if (!items.length) {
    ctx.fillStyle = 'rgba(255,255,255,.12)';
    roundedRect(ctx, 70, y, W-140, 210, 34, true, false);
    ctx.font = '800 34px Outfit, Arial, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('No hay actividades seleccionadas', W/2, y+92);
  } else {
    items.forEach((it, idx) => {
      const x = 60;
      const cw = W - 120;
      ctx.fillStyle = 'rgba(10,10,10,.86)';
      roundedRect(ctx, x, y, cw, cardH, 24, true, false);
      ctx.strokeStyle = idx === 0 ? 'rgba(255,7,18,.78)' : 'rgba(255,255,255,.13)';
      ctx.lineWidth = idx === 0 ? 3 : 2;
      roundedRect(ctx, x, y, cw, cardH, 24, false, true);

      const typeColor = it.fuente === 'evento' ? '#7b0010' : it.fuente === 'servicio' ? '#4a0008' : '#e8000a';
      const badgeW = mode === 'post' ? 106 : 122;
      const badgeH = mode === 'post' ? 28 : 34;
      ctx.fillStyle = typeColor;
      roundedRect(ctx, x+18, y + Math.max(13, (cardH-badgeH)/2), badgeW, badgeH, badgeH/2, true, false);
      ctx.font = '900 ' + (mode === 'post' ? 14 : 17) + 'px Outfit, Arial, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(it.tipo, x+18+badgeW/2, y + Math.max(13, (cardH-badgeH)/2) + badgeH*.68);

      ctx.textAlign = 'left';
      const priceW = mode === 'post' ? 112 : 130;
      const titleX = x + 18 + badgeW + 24;
      const titleMax = cw - (titleX-x) - priceW - 34;
      const titleSize = cardH < 65 ? 21 : cardH < 88 ? 25 : 30;
      ctx.font = '900 ' + titleSize + 'px Outfit, Arial, sans-serif';
      ctx.fillStyle = '#fff';
      truncateCanvasText(ctx, it.titulo, titleX, y + (cardH < 70 ? 33 : 40), titleMax);

      ctx.font = '700 ' + (cardH < 70 ? 14 : 18) + 'px Outfit, Arial, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.58)';
      const meta = [it.fecha ? fFechaCortaAgenda(it.fecha) : '', it.hora || '', it.extra || ''].filter(Boolean).join(' · ');
      truncateCanvasText(ctx, meta || 'Consultar detalles', titleX, y + cardH - (cardH < 70 ? 12 : 18), titleMax);

      ctx.textAlign = 'right';
      ctx.font = '900 ' + (cardH < 70 ? 23 : 28) + 'px Bebas Neue, Impact, Arial, sans-serif';
      ctx.fillStyle = it.costo ? '#ff0712' : '#00d25a';
      ctx.fillText(it.costo ? ('$ ' + it.costo.toLocaleString('es-AR')) : 'GRATIS', x+cw-24, y + cardH/2 + 10);
      y += cardH + gap;
    });
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff0712';
  roundedRect(ctx, 90, H-178, W-180, 68, 34, true, false);
  ctx.font = '900 ' + (mode === 'post' ? 27 : 31) + 'px Outfit, Arial, sans-serif';
  ctx.fillStyle = '#fff';
  truncateCanvasTextCenter(ctx, cta, W/2, H-134, W-220);
  ctx.font = '800 ' + (mode === 'post' ? 18 : 22) + 'px Outfit, Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.68)';
  truncateCanvasTextCenter(ctx, '@tomaunomodels · 3764354522 · Pedro Méndez 2069', W/2, H-66, W-120);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = String(text || '').split(' ');
  let line = '';
  let lines = [];
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = word; }
    else line = test;
  });
  if (line) lines.push(line);
  lines = lines.slice(0, maxLines);
  if (lines.length === maxLines && words.length > lines.join(' ').split(' ').length) {
    let last = lines[lines.length - 1];
    while (ctx.measureText(last + '…').width > maxWidth && last.length > 3) last = last.slice(0, -1);
    lines[lines.length - 1] = last + '…';
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function truncateCanvasText(ctx, text, x, y, maxWidth) {
  let t = String(text || '');
  if (ctx.measureText(t).width <= maxWidth) { ctx.fillText(t, x, y); return; }
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 3) t = t.slice(0, -1);
  ctx.fillText(t + '…', x, y);
}

function truncateCanvasTextCenter(ctx, text, x, y, maxWidth) {
  let t = String(text || '');
  if (ctx.measureText(t).width <= maxWidth) { ctx.fillText(t, x, y); return; }
  while (ctx.measureText(t + '…').width > maxWidth && t.length > 3) t = t.slice(0, -1);
  ctx.fillText(t + '…', x, y);
}

function fFechaCortaAgenda(f) {
  if (!f) return '';
  const [y, m, d] = f.split('-');
  const ms = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
  return (parseInt(d) || '') + ' ' + (ms[(parseInt(m)||1)-1] || '') + ' ' + y;
}

window.previsualizarAgendaRedes = () => {
  renderAgendaSelector();
  const cv = document.getElementById('agenda-preview-canvas');
  if (cv) drawAgendaCanvas(cv, 'story', true);
};

window.previsualizarAgendaFull = (mode = 'story') => {
  const selected = getSelectedAgendaItems();
  if (!selected.length) { toast('⚠️ Seleccioná al menos una actividad'); return; }
  const cv = document.createElement('canvas');
  drawAgendaCanvas(cv, mode, false);
  const img = cv.toDataURL('image/jpeg', .98);
  const ratioStyle = mode === 'post' ? 'max-width:min(88vw,720px);max-height:88vh;' : 'max-width:min(72vw,520px);max-height:88vh;';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:12px;">VISTA PREVIA ' + (mode === 'post' ? 'POST' : 'HISTORIA') + '</div>' +
    '<div style="display:flex;justify-content:center;background:#050505;border:1px solid var(--border);border-radius:var(--radius);padding:12px;">' +
    '<img src="' + img + '" style="width:auto;height:auto;' + ratioStyle + 'border-radius:14px;box-shadow:0 20px 70px rgba(0,0,0,.65);"/>' +
    '</div>' +
    '<div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">' +
    '<button class="btn-main" style="flex:1;" onclick="window.generarAgendaRedes(\'' + mode + '\')">Descargar JPG</button>' +
    '<button class="btn-out" style="flex:1;" onclick="window.closeModal()">Cerrar</button>' +
    '</div>';
  openModal();
};

window.generarAgendaRedes = (mode = 'story') => {
  const selected = getSelectedAgendaItems();
  if (!selected.length) { toast('⚠️ Seleccioná al menos una actividad'); return; }
  const cv = document.createElement('canvas');
  drawAgendaCanvas(cv, mode, false);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().slice(0,10);
  a.download = 'tomauno_agenda_' + mode + '_' + fecha + '.jpg';
  a.href = cv.toDataURL('image/jpeg', .98);
  a.click();
  toast('📲 Agenda descargada');
};

setTimeout(() => { if (document.getElementById('agenda-preview-canvas')) window.previsualizarAgendaRedes(); }, 1200);

// ── CANVAS BACKGROUND ─────────────────────────────────────────────────────────
(function() {
  const cv = document.getElementById('bg-canvas');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowPowerScreen = window.innerWidth < 768;
  if (!cv || reduceMotion || lowPowerScreen) { if (cv) cv.style.display = 'none'; return; }
  const ctx = cv.getContext('2d');
  let W, H, blobs, t = 0;
  const COLORS = [[200,0,15],[140,0,20],[180,10,40],[100,0,30],[220,20,50],[80,0,20],[160,0,60]];
  function resize() { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; }
  function initBlobs() {
    blobs = Array.from({length: 7}, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 200 + Math.random() * 300,
      vx: (Math.random() - .5) * .6, vy: (Math.random() - .5) * .6,
      color: COLORS[i % COLORS.length],
      phase: Math.random() * Math.PI * 2,
      speed: .003 + Math.random() * .004,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    blobs.forEach(b => {
      b.x += b.vx + Math.sin(t * b.speed + b.phase) * .8;
      b.y += b.vy + Math.cos(t * b.speed + b.phase) * .8;
      if (b.x < -b.r) b.x = W + b.r;
      if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r;
      if (b.y > H + b.r) b.y = -b.r;
      const pulse = .55 + .25 * Math.sin(t * b.speed * 2 + b.phase);
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      const [r, g2, bl] = b.color;
      grad.addColorStop(0, 'rgba(' + r + ',' + g2 + ',' + bl + ',' + pulse + ')');
      grad.addColorStop(.4, 'rgba(' + r + ',' + g2 + ',' + bl + ',' + (pulse * .4) + ')');
      grad.addColorStop(1, 'rgba(' + r + ',' + g2 + ',' + bl + ',0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fillRect(0, 0, W, H);
    t++;
    requestAnimationFrame(draw);
  }
  resize(); initBlobs(); draw();
  window.addEventListener('resize', () => { resize(); initBlobs(); });
})();

// ── FLYER PANTALLA COMPLETA ───────────────────────────────────────────────────
window.verFlyerFull = (src) => {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px;';
  ov.onclick = () => document.body.removeChild(ov);
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 0 60px rgba(0,0,0,.8);';
  const close = document.createElement('button');
  close.textContent = '✕';
  close.style.cssText = 'position:absolute;top:16px;right:16px;background:rgba(255,255,255,.1);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:18px;cursor:pointer;';
  close.onclick = () => document.body.removeChild(ov);
  ov.appendChild(img);
  ov.appendChild(close);
  document.body.appendChild(ov);
};

// Resolver deep link pendiente
if (window._pendingDeepLink) {
  window.abrirDetalle(window._pendingDeepLink);
  window._pendingDeepLink = null;
}



// ── PATCH V33.5: estabilidad chat, nombres, intención por entidades y layout ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    .chat-popover{min-width:380px;min-height:520px;max-width:calc(100vw - 18px);max-height:calc(100vh - 18px);}
    .chat-popover.expanded{width:min(1180px,calc(100vw - 36px))!important;height:min(820px,calc(100vh - 58px))!important;max-height:calc(100vh - 58px)!important;}
    .chat-popover.dragged{right:auto!important;bottom:auto!important;transform:none!important;}
    .chat-popover.open{display:block!important;}
    .chat-popover.resizable{resize:both;overflow:hidden;}
    .chat-popover-inner{height:100%;display:flex;flex-direction:column;min-height:0;}
    .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
    .chat-msgs{flex:1 1 auto!important;min-height:250px!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;}
    .chat-tools-block{flex:0 0 auto;}
    .chat-admin-tools{flex:0 0 auto;}
    .chat-fab{display:flex!important;}
    @media(min-width:760px){.chat-popover:not(.expanded){height:auto}.chat-popover.expanded .chat-msgs{min-height:420px!important}}
    @media(max-width:700px){.chat-popover{min-width:0!important;resize:none!important}.chat-popover.expanded{height:auto!important}}
  `;
  document.head.appendChild(css);
})();

window.cerrarChatPopover = function(){
  const p=document.getElementById('chat-popover');
  if(p){ p.classList.remove('open'); p.classList.remove('expanded'); p.classList.remove('dragged'); }
  const fab=document.getElementById('chat-fab');
  if(fab){ fab.style.display='flex'; fab.classList.remove('hidden'); }
  currentOpenChatId='';
};
window.toggleChatExpanded = function(){
  const p=document.getElementById('chat-popover');
  if(!p) return;
  p.classList.toggle('expanded');
  p.classList.add('resizable');
  if(p.classList.contains('expanded')){
    p.classList.remove('dragged');
    p.style.left=''; p.style.top=''; p.style.right=''; p.style.bottom=''; p.style.transform='';
  }
};
enableChatWindowControls = function(){
  const p=document.getElementById('chat-popover');
  if(!p || p.dataset.dragReadyV335==='1') return;
  p.dataset.dragReadyV335='1';
  p.classList.add('resizable');
  let dragging=false, offX=0, offY=0;
  p.addEventListener('mousedown', function(ev){
    if(window.innerWidth < 760) return;
    if(ev.target.closest && ev.target.closest('button,input,textarea,a,select,.chat-msgs,.chat-row,.chat-admin-tools,.chat-tools-block')) return;
    if(!(ev.target.closest && (ev.target.closest('.chat-head') || ev.target.closest('.chat-tabs')))) return;
    const r=p.getBoundingClientRect();
    dragging=true; offX=ev.clientX-r.left; offY=ev.clientY-r.top;
    p.classList.add('dragged'); p.classList.remove('expanded');
    p.style.width=r.width+'px'; p.style.height=r.height+'px';
    p.style.left=r.left+'px'; p.style.top=r.top+'px'; p.style.right='auto'; p.style.bottom='auto'; p.style.transform='none';
    ev.preventDefault();
  });
  document.addEventListener('mousemove', function(ev){
    if(!dragging) return;
    const w=p.offsetWidth||420, h=p.offsetHeight||620;
    let l=ev.clientX-offX, t=ev.clientY-offY;
    l=Math.max(8, Math.min(window.innerWidth-w-8, l));
    t=Math.max(8, Math.min(window.innerHeight-h-8, t));
    p.style.left=l+'px'; p.style.top=t+'px';
  });
  document.addEventListener('mouseup', function(){ dragging=false; });
};

window.chatGoToSection = function(id){
  const aliases = {estudio:'sec-galeria','el-estudio':'sec-galeria','elestudio':'sec-galeria','sec-estudio':'sec-galeria',preguntas:'sec-faq',faq:'sec-faq',ubicacion:'sec-ubicacion',cursos:'sec-cursos',servicios:'sec-servicios',eventos:'sec-eventos',testimonios:'sec-testimonios'};
  const key = String(id||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'').replace(/^#/, '');
  let target = id;
  if(aliases[key]) target = aliases[key];
  if(key==='elestudio' || key==='estudio') target='sec-galeria';
  const el = document.getElementById(target) || document.querySelector('[id="'+String(target).replace(/"/g,'')+'"]');
  if(el) setTimeout(()=>el.scrollIntoView({behavior:'smooth', block:'start'}), 60);
};

chatActionTagMap = function(rawTag){
  const key = normAI(String(rawTag || '')).replace(/[^a-z0-9]/g,'');
  const map = {
    cursos:{label:'🎓 Ver cursos', sec:'sec-cursos'}, curso:{label:'🎓 Ver cursos', sec:'sec-cursos'},
    servicios:{label:'📷 Ver servicios', sec:'sec-servicios'}, servicio:{label:'📷 Ver servicios', sec:'sec-servicios'},
    eventos:{label:'🎪 Ver eventos', sec:'sec-eventos'}, evento:{label:'🎪 Ver eventos', sec:'sec-eventos'},
    testimonios:{label:'⭐ Ver testimonios', sec:'sec-testimonios'}, testimonio:{label:'⭐ Ver testimonios', sec:'sec-testimonios'}, resenas:{label:'⭐ Ver testimonios', sec:'sec-testimonios'}, resena:{label:'⭐ Ver testimonios', sec:'sec-testimonios'},
    estudio:{label:'🏢 Ver estudio', sec:'sec-galeria'}, elestudio:{label:'🏢 Ver estudio', sec:'sec-galeria'},
    ubicacion:{label:'📍 Ver ubicación', sec:'sec-ubicacion'}, mapa:{label:'📍 Ver ubicación', sec:'sec-ubicacion'}, maps:{label:'📍 Ver ubicación', sec:'sec-ubicacion'},
    preguntas:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}, preguntasfrecuentes:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}, frecuentes:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}, faq:{label:'❓ Ver preguntas frecuentes', sec:'sec-faq'}
  };
  if(key === 'contacto' || key === 'whatsapp') return {label:'💬 WhatsApp Javier', url:chatWhatsappUrl(chatsDB[currentOpenChatId]||{})};
  return map[key] || null;
};

extraerNombreAI = function(text){
  let raw = String(text||'').trim();
  if(!raw || extraerWhatsappAI(raw)) return '';
  raw = raw.replace(/[.!?]+$/g,'').trim();
  let m = raw.match(/^(?:hola\s+)?(?:soy|me llamo|mi nombre es|nombre es)\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,3})$/i);
  if(!m && /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}(\s+[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}){0,2}$/.test(raw)) m = [raw, raw];
  if(!m) return '';
  let n = limpiarNombreChat(m[1]);
  if(!n || n.length < 2) return '';
  if(/^(si|sí|ok|dale|bueno|perfecto|claro|gracias|quiero|consulta|web|whatsapp|telefono|javier|hola|buenas)$/i.test(n)) return '';
  return n.charAt(0).toUpperCase()+n.slice(1);
};
lastAdminAskedName = function(chat){
  const last = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin');
  return !!(last && /(nombre|como\s+te\s+llamas|cómo\s+te\s+llamás|como\s+es\s+tu\s+nombre|cómo\s+es\s+tu\s+nombre|dejame\s+tu\s+nombre|deja\s+tu\s+nombre|dejá\s+tu\s+nombre)/i.test(String(last[1].text||'')));
};
isJustNameReply = function(text, chat){
  const n = extraerNombreAI(text);
  if(!n) return '';
  const raw = String(text||'').trim();
  if(lastAdminAskedName(chat)) return n;
  if(/^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw)) return n;
  if(!tieneNombreRealChat(chat) && /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}(\s+[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}){0,2}$/.test(raw)) return n;
  return '';
};
chatWhatsappUrl = function(chat){
  const c = chat || chatsDB[currentOpenChatId] || {};
  const n = chatVisibleName(c, currentOpenChatId);
  const nombreReal = n && !/^Usuario\s+[A-Z]$/i.test(n) && !isGenericChatName(n);
  const msg = nombreReal ? ('Hola soy ' + n + ', vengo de la web Tomauno y quiero continuar mi consulta.') : 'Hola Javier, vengo de la web Tomauno y quiero continuar mi consulta.';
  return 'https://wa.me/5493764354522?text=' + encodeURIComponent(msg);
};

window.enviarChatVisitante = async function(id){
  const inp = document.getElementById('chat-text');
  const text = inp?.value.trim();
  if(!text) return;
  inp.value=''; inp.focus();
  const existingChat = chatsDB?.[id] || {};
  let fallbackName = '';
  try{ fallbackName = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}
  const detectedName = isJustNameReply(text, existingChat);
  const repairedName = limpiarNombreChat(detectedName || existingChat.name || fallbackName || chatAnonName(id, existingChat));
  await update(ref(db,'tomauno/chats/'+id), {name: repairedName, status:'abierto', updatedAt:Date.now(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:Date.now()});
  await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'user', text, time:chatTime(), createdAt:Date.now()});
  await update(ref(db,'tomauno/chats/'+id), {updatedAt:Date.now(), lastMsg:text, status:'abierto', unreadAdmin:true, userOnline:true, userLastSeen:Date.now(), name:repairedName});
  try{ if(detectedName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}
  if(detectedName){ setTimeout(()=>abrirChatVisitante(id, true), 120); }
  if(detectedName && lastAdminAskedName(existingChat)) return;
  responderAutomaticoChat(id, text);
};

window.filterCursos = function(){
  const inp = document.getElementById('course-search');
  const q = normAI(inp?.value || '');
  const cl = document.getElementById('search-clear');
  const info = document.getElementById('search-info');
  if (cl) cl.style.display = q ? 'block' : 'none';
  let vis = 0;
  document.querySelectorAll('.ccard').forEach(card => {
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none';
    if(match) vis++;
  });
  if(info) info.textContent = q ? (vis + ' resultado' + (vis !== 1 ? 's' : '') + ' para "' + (inp?.value || '') + '"') : '';
};

function bestPublishedTitleMatchAI(q){
  const nq = normAI(q);
  const terms = importantTermsAI(nq).filter(w=>w.length>2);
  if(!terms.length) return null;
  const items = [];
  Object.entries(cursos||{}).forEach(([id,c])=>{ if(!c.oculto) items.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.disertante,c.profesor,c.organizador,c.docente,c.wp].join(' ')}); });
  Object.entries(serviciosDB||{}).forEach(([id,s])=>{ if(!s.oculto) items.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.ig,s.wp,s.dir].join(' ')}); });
  Object.entries(eventosDB||{}).forEach(([id,e])=>{ if(e.estado==='activo' && !e.oculto) items.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.ig,e.nombreOrg,e.wpOrg,e.lugar].join(' ')}); });
  let best=null;
  items.forEach(it=>{
    const titleNorm = normAI(it.title);
    const extraNorm = normAI(it.extra);
    let titleHits=0, extraHits=0;
    terms.forEach(t=>{ if(termHitAI(titleNorm,t)) titleHits++; else if(termHitAI(extraNorm,t)) extraHits++; });
    let sc = titleHits*10 + extraHits*2;
    if(/curso|cursos|taller|workshop|clase|capacit/.test(nq) && it.type==='curso') sc += 3;
    if(/servicio|sesion|sesiones|book|portfolio|beauty/.test(nq) && it.type==='servicio') sc += 3;
    if(/evento|eventos|charla|show|organizador|decoracion|decoración|danzaterapia/.test(nq) && it.type==='evento') sc += 4;
    if(sc>0 && (!best || sc>best.sc)) best={...it, sc, titleHits, extraHits};
  });
  return best && (best.titleHits>=1 || best.sc>=8) ? best : null;
}
function contactoEntidadAI(match){
  if(!match) return '';
  const x = match.obj;
  const titulo = x.titulo || (match.type==='curso'?'Curso':match.type==='servicio'?'Servicio':'Evento');
  const prof = x.disertante || x.profesor || x.organizador || x.docente || x.nombreOrg || '';
  const wp = x.wp || x.wpOrg || x.contacto || '';
  const ig = x.ig || '';
  let txt = '**' + titulo + '**\n';
  if(match.type==='evento') txt += '🎪 Evento publicado\n';
  if(prof) txt += '👤 Profesor/organizador: ' + prof + '\n';
  if(wp) txt += '💬 WhatsApp de contacto: https://wa.me/549' + String(wp).replace(/\D/g,'') + '\n';
  if(ig) txt += '📲 Instagram: @' + ig + '\n';
  if(!prof && !wp && !ig) txt += 'No tengo cargado un profesor, organizador o contacto específico para esta actividad. Puedo dejar tu consulta marcada para Javier.';
  return txt;
}
const __buscarRespuestaAsistente_v335 = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';
  if(/(profesor|profesora|profesores|docente|docentes|disertante|organizador|organiza|quien da|quién da|quien dicta|quién dicta)/.test(q)){
    const m = bestPublishedTitleMatchAI(q);
    if(m){
      if(m.type==='curso') window._lastAiSection='sec-cursos';
      if(m.type==='servicio') window._lastAiSection='sec-servicios';
      if(m.type==='evento') window._lastAiSection='sec-eventos';
      return contactoEntidadAI(m);
    }
  }
  const explicit = bestPublishedTitleMatchAI(q);
  if(explicit && /(decoracion|decoración|danzaterapia|manualidades|beauty|modelo|modelaje|fotografia|fotografía|polaroid|reconecta|portfolio|book)/.test(q)){
    if(explicit.type==='curso'){ window._lastAiSection='sec-cursos'; return detalleCursoAI(explicit.obj); }
    if(explicit.type==='servicio'){ window._lastAiSection='sec-servicios'; return detalleServicioAI(explicit.obj); }
    if(explicit.type==='evento'){ window._lastAiSection='sec-eventos'; return detalleEventoAI(explicit.obj); }
  }
  return __buscarRespuestaAsistente_v335(text);
};


// ── PATCH V33.6: búsqueda eventos, comandos info, layout chat y acciones ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    .chat-popover.expanded{left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(1220px,calc(100vw - 36px))!important;height:min(860px,calc(100vh - 42px))!important;max-height:calc(100vh - 42px)!important;resize:both!important;}
    .chat-popover.expanded.dragged{transform:none!important;}
    .chat-popover.expanded .chat-popover-inner{height:100%!important;max-height:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .chat-popover.expanded .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
    .chat-popover.expanded .chat-msgs{flex:1 1 auto!important;min-height:280px!important;max-height:none!important;overflow-y:auto!important;}
    .chat-popover.expanded .chat-tools-block{max-height:150px;overflow:auto;}
    .chat-popover.expanded ~ .chat-fab,#chat-fab{display:flex!important;}
    @media(max-width:700px){.chat-popover.expanded{left:8px!important;right:8px!important;top:auto!important;bottom:86px!important;transform:none!important;width:auto!important;height:auto!important;max-height:calc(100vh - 106px)!important;resize:none!important}.chat-popover.expanded .chat-tools-block{max-height:140px;}}
  `;
  document.head.appendChild(css);
})();

// Filtrado acento-insensible también para eventos visibles cuando se busca desde Cursos.
const __filterCursos_v336 = window.filterCursos;
window.filterCursos = function(){
  if(typeof __filterCursos_v336 === 'function') __filterCursos_v336();
  const inp = document.getElementById('course-search');
  const q = normAI(inp?.value || '');
  let evVis = 0;
  document.querySelectorAll('#eventos-grid .ev-card').forEach(card => {
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none';
    if(match) evVis++;
  });
  if(q){
    const cursoVis = [...document.querySelectorAll('.ccard')].filter(c => c.style.display !== 'none').length;
    if(cursoVis === 0 && evVis > 0){
      setTimeout(()=>document.getElementById('sec-eventos')?.scrollIntoView({behavior:'smooth', block:'start'}), 120);
    }
  }
};

// Devuelve detalle con acción de Info/Inscripción cuando la entidad publicada está identificada.
function detalleEntidadConAccionAI(match){
  if(!match) return '';
  let txt = '';
  if(match.type === 'curso') txt = detalleCursoAI(match.obj) + '\n#info:curso:' + match.id + '#';
  else if(match.type === 'servicio') txt = detalleServicioAI(match.obj) + '\n#info:servicio:' + match.id + '#';
  else if(match.type === 'evento') txt = detalleEventoAI(match.obj) + '\n#info:evento:' + match.id + '#';
  return txt;
}
const __buscarRespuestaAsistente_v336 = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';
  // Contacto general: incluye "comunicarme".
  if(/(comunicarme|comunicar|comunicacion|comunicación|contactarme|contacto|whatsapp|telefono|teléfono|celular|numero|número)/.test(q) && !/(organizador|organiza|profesor|docente|disertante)/.test(q)){
    return '💬 **Contacto Tomauno**\nWhatsApp: 3764354522\nLink directo: ' + chatWhatsappUrl(chatsDB[currentOpenChatId] || {});
  }
  // Profesor/organizador de una actividad publicada.
  if(/(profesor|profesora|profesores|docente|docentes|disertante|organizador|organiza|quien da|quién da|quien dicta|quién dicta)/.test(q)){
    const m = bestPublishedTitleMatchAI(q);
    if(m){
      if(m.type==='curso') window._lastAiSection='sec-cursos';
      if(m.type==='servicio') window._lastAiSection='sec-servicios';
      if(m.type==='evento') window._lastAiSection='sec-eventos';
      return contactoEntidadAI(m);
    }
  }
  // Si hay una entidad publicada clara, responder esa y agregar botón Info.
  const terms = importantTermsAI(q);
  const m = bestPublishedTitleMatchAI(q);
  if(m && terms.length && (m.titleHits >= 1 || m.sc >= 8)){
    if(/(curso|cursos|capacit|taller|workshop|clase|seminario|charla)/.test(q) && m.type==='curso'){ window._lastAiSection='sec-cursos'; return detalleEntidadConAccionAI(m); }
    if(/(servicio|servicios|sesion|sesiones|book|portfolio|beauty|alquiler|foto|fotos)/.test(q) && m.type==='servicio'){ window._lastAiSection='sec-servicios'; return detalleEntidadConAccionAI(m); }
    if(/(evento|eventos|taller|seminario|workshop|charla|decoracion|decoración|danzaterapia|manualidades)/.test(q) && m.type==='evento'){ window._lastAiSection='sec-eventos'; return detalleEntidadConAccionAI(m); }
    if(isPriceOrSpecificAI(q) || /info|informacion|información|datos|detalle|detalles/.test(q)){
      window._lastAiSection = m.type==='curso'?'sec-cursos':m.type==='servicio'?'sec-servicios':'sec-eventos';
      return detalleEntidadConAccionAI(m);
    }
  }
  return __buscarRespuestaAsistente_v336(text);
};


// ── PATCH V33.7: estabilidad asistente, búsquedas generales y UI chat ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    .moverlay{z-index:3000!important;}
    .chat-popover{z-index:900!important;}
    .chat-popover.expanded{left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(1220px,calc(100vw - 32px))!important;height:min(900px,calc(100vh - 38px))!important;max-height:calc(100vh - 38px)!important;}
    .chat-popover.expanded .chat-popover-inner{height:100%!important;max-height:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .chat-popover.expanded .chat-panel{height:auto!important;flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
    .chat-popover.expanded .chat-msgs{flex:1 1 auto!important;min-height:300px!important;max-height:none!important;overflow-y:auto!important;}
    .chat-popover.expanded .chat-tools-block{max-height:170px!important;overflow:auto!important;}
    .chat-popover .chat-tools-block{transition:max-height .2s ease, opacity .2s ease;}
    .chat-tools-collapsed .chat-tools-block{display:none!important;}
    .chat-popover.expanded ~ #chat-fab{display:flex!important;}
    .chat-action-row .chat-action-btn{white-space:nowrap;}
    @media(max-width:700px){
      .moverlay{z-index:3000!important;}
      .chat-popover.expanded{left:8px!important;right:8px!important;top:auto!important;bottom:86px!important;transform:none!important;width:auto!important;height:auto!important;max-height:calc(100vh - 106px)!important;resize:none!important;}
      .chat-popover.expanded .chat-msgs{min-height:300px!important;}
    }
  `;
  document.head.appendChild(css);
})();

function meaningfulTermsAI(q){
  const generic = new Set(['estan','están','esta','está','este','estos','estas','teniendo','tengo','tiene','tener','tenemos','dame','decime','contame','informacion','información','info','quiero','saber','sobre','puedo','puedes','pueden','tus','sus','mis','mas','más','disponible','disponibles','activo','activos','tienen','tenes','tenés','hay','alguno','alguna','algun','algún','cuales','cuáles','lista','listado','mostrar','mostrame','ver']);
  return importantTermsAI(q).filter(w => !generic.has(w));
}
function isGeneralCourseQueryAI(q){
  return /(curso|cursos|capacitacion|capacitación|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && /(info|informacion|información|disponible|disponibles|activo|activos|tienen|tenes|tenés|hay|lista|listado|cuales|cuáles|ver|mostrar|mostrame|están|estan|teniendo)/.test(q) && meaningfulTermsAI(q).length === 0;
}
function isGeneralServiceQueryAI(q){
  return /(servicio|servicios|sesion|sesión|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && /(info|informacion|información|disponible|disponibles|tienen|tenes|tenés|hay|lista|listado|cuales|cuáles|ver|mostrar|mostrame|están|estan|teniendo)/.test(q) && meaningfulTermsAI(q).length === 0;
}
function isGeneralEventQueryAI(q){
  return /(evento|eventos|agenda|actividad|actividades)/.test(q) && /(info|informacion|información|disponible|disponibles|activo|activos|tienen|tenes|tenés|hay|lista|listado|cuales|cuáles|ver|mostrar|mostrame|están|estan|teniendo)/.test(q) && meaningfulTermsAI(q).length === 0;
}

const __listaCursosAI_v337 = listaCursosAI;
listaCursosAI = function(query){
  const q = normAI(query || '');
  if(!q || isGeneralCourseQueryAI(q)) return __listaCursosAI_v337('');
  return __listaCursosAI_v337(query);
};
const __listaServiciosAI_v337 = listaServiciosAI;
listaServiciosAI = function(query){
  const q = normAI(query || '');
  if(!q || isGeneralServiceQueryAI(q)) return __listaServiciosAI_v337('');
  return __listaServiciosAI_v337(query);
};

const __buscarRespuestaAsistente_v337 = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';

  // Listas generales: jamás elegir una actividad al azar si el usuario pidió “los cursos/servicios/eventos”.
  if(isGeneralCourseQueryAI(q)){ window._lastAiSection = 'sec-cursos'; return listaCursosAI(''); }
  if(isGeneralServiceQueryAI(q)){ window._lastAiSection = 'sec-servicios'; return listaServiciosAI(''); }
  if(isGeneralEventQueryAI(q)){ window._lastAiSection = 'sec-eventos'; return listaEventosAI(); }

  // Contacto del dueño/Javier: si pide contacto, pasar contacto; no biografía.
  if(/(contactar|contactarme|comunicarme|comunicar|whatsapp|telefono|teléfono|numero|número)/.test(q) && /(javier|dueño|dueno|mottola|tomauno|ustedes)/.test(q)){
    return '💬 **Contacto directo**\nPodés escribirle a Javier por WhatsApp: ' + chatWhatsappUrl(chatsDB[currentOpenChatId] || {}) + '\n\nSi querés, también puedo dejar tu consulta marcada para que Javier la revise al volver.';
  }

  // Si el usuario dice sí después de una pregunta ambigua, evitar asumir atención humana como única salida.
  const chat = chatsDB[currentOpenChatId] || {};
  const lastAuto = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
  if(/^(si|sí|dale|ok|bueno|perfecto)$/i.test(String(text||'').trim()) && lastAuto && /opciones relacionadas/i.test(String(lastAuto[1].text||''))){
    const pend = Array.isArray(chat.pendingTopics) ? chat.pendingTopics : [];
    if(pend.length){
      window._lastAiSuggestions = pend;
      return 'Perfecto. Estas son las opciones que encontré:\n\n' + pend.slice(0,4).map((t,i)=>(i+1)+'. '+(t.titulo||'Tema')).join('\n') + '\n\nEscribí el número o el nombre del tema.';
    }
    return 'Perfecto. Decime si preferís consultar por **cursos**, **servicios**, **eventos**, **ubicación** o **WhatsApp** y te oriento.';
  }

  return __buscarRespuestaAsistente_v337(text);
};

// Mejora de filtros: búsqueda acento-insensible y sin “arrastrar” todos los eventos si no coinciden.
const __filterCursos_v337 = window.filterCursos;
window.filterCursos = function(){
  if(typeof __filterCursos_v337 === 'function') __filterCursos_v337();
  const inp = document.getElementById('course-search');
  const q = normAI(inp?.value || '');
  let evVis = 0;
  document.querySelectorAll('#eventos-grid .ev-card').forEach(card => {
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none';
    if(match) evVis++;
  });
  const info = document.getElementById('search-info');
  const cursoVis = [...document.querySelectorAll('.ccard')].filter(c => c.style.display !== 'none').length;
  if(info && q && cursoVis === 0 && evVis > 0) info.textContent = evVis + ' resultado' + (evVis!==1?'s':'') + ' en eventos para "' + (inp?.value || '') + '"';
  if(q && cursoVis === 0 && evVis > 0){ setTimeout(()=>document.getElementById('sec-eventos')?.scrollIntoView({behavior:'smooth', block:'start'}), 120); }
};



// ── PATCH V33.8: operador limpio, nombres seguros y layout chat estable ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    .chat-home-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
    .chat-empty-state{border:1px solid var(--border);background:#070707;border-radius:18px;min-height:230px;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--text3);padding:24px;}
    .chat-empty-state strong{color:#fff;display:block;font-size:18px;margin-bottom:6px;}
    .chat-popover.expanded{display:flex!important;flex-direction:column!important;}
    .chat-popover.expanded .chat-popover-inner{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .chat-popover.expanded .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
    .chat-popover.expanded .chat-msgs{flex:1 1 auto!important;min-height:360px!important;max-height:none!important;}
    .chat-popover.expanded .chat-row{flex:0 0 auto!important;}
    .chat-popover.expanded .chat-tools-block{flex:0 0 auto!important;max-height:145px!important;overflow:auto!important;}
    .chat-list-actions{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;}
    .chat-popover:not(.expanded) .chat-msgs{min-height:310px;}
    @media(max-width:700px){.chat-home-actions{grid-template-columns:1fr}.chat-popover.expanded .chat-msgs{min-height:300px!important}.chat-popover.expanded .chat-tools-block{max-height:130px!important}}
  `;
  document.head.appendChild(css);
})();

function chatFullDate(ts){
  const n = Number(ts || 0);
  if(!n) return '';
  try{return new Date(n).toLocaleString('es-AR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}
}

function extraerNombreDesdeRespuestaAmplia(text, chat){
  const raw0 = String(text||'').trim();
  if(!raw0 || extraerWhatsappAI(raw0)) return '';
  let raw = raw0.replace(/[.!?]+$/g,'').trim();
  // Si preguntamos nombre, aceptar respuestas como: “Martin, quiero saber...” o “me llamo Sofia y necesito...”
  if(lastAdminAskedName(chat)){
    raw = raw.replace(/^(hola|buenas|buen dia|buenas tardes|buenas noches)[,\s]+/i,'').trim();
    raw = raw.replace(/^(soy|me llamo|mi nombre es|nombre es)\s+/i,'').trim();
    raw = raw.split(/[,.;:!¿?]|\s+(?:y|pero|quiero|quisiera|necesito|me gustaria|me gustaría|consulta|consulto|pregunto)\b/i)[0].trim();
    const m = raw.match(/^([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,2})/i);
    if(m){
      const n = limpiarNombreChat(m[1]);
      if(n && n.length >= 2 && !/^(si|sí|ok|dale|bueno|perfecto|claro|gracias|quiero|consulta|web|whatsapp|telefono|javier|hola|buenas)$/i.test(n)){
        return n.charAt(0).toUpperCase()+n.slice(1);
      }
    }
  }
  return extraerNombreAI(raw0);
}

isJustNameReply = function(text, chat){
  const n = extraerNombreDesdeRespuestaAmplia(text, chat);
  if(!n) return '';
  const raw = String(text||'').trim();
  if(lastAdminAskedName(chat)) return n;
  if(/^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw)) return n;
  if(!tieneNombreRealChat(chat) && /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}(\s+[A-Za-zÁÉÍÓÚÑÜáéíóúñü]{2,}){0,2}$/.test(raw)) return n;
  return '';
};

function esSoloRespuestaNombre(text, chat){
  const n = isJustNameReply(text, chat);
  if(!n || !lastAdminAskedName(chat)) return false;
  let raw = String(text||'').trim().replace(/^(hola|buenas)[,\s]+/i,'').replace(/^(soy|me llamo|mi nombre es|nombre es)\s+/i,'').trim();
  raw = raw.replace(/[.!?]+$/g,'').trim();
  return normAI(raw) === normAI(n);
}

window.enviarChatVisitante = async function(id){
  const inp = document.getElementById('chat-text');
  const text = inp?.value.trim();
  if(!text) return;
  inp.value=''; inp.focus();
  const existingChat = chatsDB?.[id] || {};
  let fallbackName = '';
  try{ fallbackName = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}
  const detectedName = isJustNameReply(text, existingChat);
  const repairedName = limpiarNombreChat(detectedName || existingChat.name || fallbackName || chatAnonName(id, existingChat));
  await update(ref(db,'tomauno/chats/'+id), {name: repairedName, status:'abierto', updatedAt:Date.now(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:Date.now()});
  await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'user', text, time:chatTime(), createdAt:Date.now()});
  await update(ref(db,'tomauno/chats/'+id), {updatedAt:Date.now(), lastMsg:text, status:'abierto', unreadAdmin:true, userOnline:true, userLastSeen:Date.now(), name:repairedName});
  try{ if(detectedName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}
  if(detectedName){ setTimeout(()=>abrirChatVisitante(id, true), 120); }
  if(esSoloRespuestaNombre(text, existingChat)) return;
  responderAutomaticoChat(id, text);
};

const __updateChatMessagesOnly_v338 = updateChatMessagesOnly;
updateChatMessagesOnly = function(id, adminView){
  const box=document.getElementById('chat-msgs'); if(!box) return;
  const chat=chatsDB[id];
  // Evita que el listener limpie la ventana si Firebase todavía no devolvió el chat o si fue cerrado/borrado.
  if(!chat){ return; }
  const html = renderMsgs(chat, adminView, id);
  if(!html.trim() && box.innerHTML.trim()) return;
  if(box.dataset.lastHtml !== html){ box.innerHTML=html; box.dataset.lastHtml=html; scrollChatSmart(box); }
};

window.abrirChatAdminHome = function(){
  currentOpenChatId = '';
  const valid = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c));
  const abiertos = valid.filter(([,c])=>c.status !== 'cerrado').length;
  const nuevos = valid.filter(([,c])=>c.unreadAdmin).length;
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Panel de atención desde la web</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Activar/desactivar automático" onclick="window.toggleModoAsistenteChat()">🤖</button><button class="chat-icon-btn" title="Activar notificaciones" onclick="window.pedirPermisoNotificaciones()">🔔</button></div></div>'+
    '<div class="chat-empty-state"><div><strong>Esperando consultas</strong><div>Tenés '+abiertos+' conversación'+(abiertos!==1?'es':'')+' abierta'+(abiertos!==1?'s':'')+(nuevos?(' · '+nuevos+' nueva'+(nuevos!==1?'s':'')):'')+'.</div><div style="margin-top:8px;font-size:12px;">Abrí la bandeja cuando quieras revisar o responder.</div></div></div>'+
    '<div class="chat-home-actions"><button class="btn-main" onclick="abrirPanelChatsAdmin()">📥 Ver bandeja</button><button class="btn-out" onclick="window.verResumenConsultasChat()">📋 Resumen</button><button class="btn-out" onclick="window.cerrarTodosChatsAbiertos()">📭 Vaciar abiertos</button><button class="btn-out" onclick="window.cerrarChatPopover()">Minimizar</button></div>'
  );
};

window.abrirChatTomauno = function(){
  unlockAudio();
  const popToggle = document.getElementById('chat-popover');
  if (popToggle && popToggle.classList.contains('open')) { window.cerrarChatPopover && window.cerrarChatPopover(); return; }
  if (isAdminNotifier()) return window.abrirPanelChatsAdmin();
  document.getElementById('chat-fab')?.classList.remove('has-new');
  if (currentVisitorChatId && chatsDB[currentVisitorChatId] && chatsDB[currentVisitorChatId].status !== 'cerrado') return abrirChatVisitante(currentVisitorChatId);
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">' +
    '<div class="chat-bubble admin"><div>Hola 😊<br/><b>¿Cómo es tu nombre?</b></div><div class="chat-meta">Ahora</div></div>' +
    '</div>' +
    '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">➜</button></div></div>'
  );
  setTimeout(()=>{
    const inp = document.getElementById('chat-name');
    if(inp){ try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } }
  }, 80);
};

window.cerrarConversacionChat = async function(id){
  await update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()});
  toast('📭 Conversación cerrada');
  if(currentOpenChatId && currentOpenChatId !== id && chatsDB[currentOpenChatId] && chatsDB[currentOpenChatId].status !== 'cerrado'){
    abrirChatAdmin(currentOpenChatId, true);
  }else{
    currentOpenChatId = '';
    abrirPanelChatsAdmin();
  }
};

window.cerrarTodosChatsAbiertos = function(){
  const abiertos = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c) && c.status !== 'cerrado');
  if(!abiertos.length){ toast('No hay chats abiertos'); return; }
  showConfirm('¿Cerrar todas las conversaciones abiertas? No se borran: quedan en Cerrados/Todos.', async ()=>{
    await Promise.all(abiertos.map(([id])=>update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()})));
    toast('📭 Bandeja abierta vacía');
    abrirChatAdminHome();
  });
};

const __abrirPanelChatsAdmin_v338 = abrirPanelChatsAdmin;
abrirPanelChatsAdmin = function(){
  __abrirPanelChatsAdmin_v338();
  const p = document.getElementById('chat-popover');
  if(!p) return;
  const firstRow = p.querySelector('.chat-filter')?.parentElement;
  if(firstRow && !p.querySelector('[data-vaciar-abiertos]')){
    const btn = document.createElement('button');
    btn.className='chat-filter';
    btn.setAttribute('data-vaciar-abiertos','1');
    btn.textContent='📭 Vaciar abiertos';
    btn.onclick=window.cerrarTodosChatsAbiertos;
    firstRow.appendChild(btn);
  }
};
window.abrirPanelChatsAdmin = abrirPanelChatsAdmin;

const __historialChatTextoPlano_v338 = historialChatTextoPlano;
historialChatTextoPlano = function(id){
  const c = chatsDB[id]; if(!c) return '';
  const lines = ['Historial chat Tomauno', 'Cliente: ' + chatVisibleName(c,id), c.wp ? ('WhatsApp: ' + c.wp) : '', 'Estado: ' + (c.status || 'abierto'), ''];
  chatMsgs(c).forEach(([,m]) => {
    if(!m || m.typing) return;
    const who = m.from === 'user' ? chatVisibleName(c,id) : (m.auto ? 'Asistente Tomauno' : 'Tomauno');
    const fecha = chatFullDate(m.createdAt) || (m.time || '');
    lines.push('[' + fecha + '] ' + who + ': ' + cleanChatDisplayText(m.text || ''));
  });
  return lines.filter(Boolean).join('\n');
};



// ── PATCH V33.9: cierre de detalles chat/asistente y operación estable ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    .moverlay{z-index:5200!important;}
    .mcard{max-width:min(760px,calc(100vw - 36px))!important;}
    .chat-popover{z-index:950!important;}
    .chat-popover:not(.expanded){width:min(460px,calc(100vw - 22px))!important;min-height:620px!important;}
    .chat-popover.expanded{left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(1220px,calc(100vw - 34px))!important;height:min(900px,calc(100vh - 36px))!important;max-height:calc(100vh - 36px)!important;resize:both!important;}
    .chat-popover.dragged{transform:none!important;}
    .chat-popover .chat-popover-inner{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .chat-popover .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
    .chat-popover .chat-msgs{flex:1 1 auto!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;}
    .chat-popover:not(.expanded) .chat-msgs{min-height:365px!important;}
    .chat-popover.expanded .chat-msgs{min-height:420px!important;}
    .chat-popover .chat-row{flex:0 0 auto!important;}
    .chat-popover .chat-tools-block{flex:0 0 auto!important;max-height:130px!important;overflow:auto!important;}
    .chat-tools-collapsed .chat-tools-block{display:none!important;}
    .chat-tabs{max-width:calc(100% - 68px);}
    .chat-head{cursor:move;}
    .chat-home-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
    .chat-empty-state{border:1px solid var(--border);background:#070707;border-radius:18px;min-height:260px;display:flex;align-items:center;justify-content:center;text-align:center;color:var(--text3);padding:24px;}
    .chat-empty-state strong{color:#fff;display:block;font-size:18px;margin-bottom:6px;}
    .chat-bubble .chat-action-row{margin-top:10px;}
    @media(max-width:700px){
      .chat-popover:not(.expanded){left:10px!important;right:10px!important;width:auto!important;min-height:0!important;max-height:calc(100vh - 110px)!important;bottom:90px!important;}
      .chat-popover.expanded{left:8px!important;right:8px!important;top:auto!important;bottom:86px!important;transform:none!important;width:auto!important;height:auto!important;resize:none!important;max-height:calc(100vh - 106px)!important;}
      .chat-popover .chat-msgs{min-height:300px!important;}
      .chat-home-actions{grid-template-columns:1fr;}
    }
  `;
  document.head.appendChild(css);
})();

function stripNameFromMessageForAI(text, name){
  let raw = String(text || '').trim();
  if(!name) return raw;
  raw = raw.replace(/^(hola|buenas|buen dia|buenas tardes|buenas noches)[,\s]+/i,'').trim();
  raw = raw.replace(/^(soy|me llamo|mi nombre es|nombre es)\s+/i,'').trim();
  const n = String(name).trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  raw = raw.replace(new RegExp('^'+n+'\\b[,.;:\\-\\s]*','i'),'').trim();
  return raw;
}
function chatHadHumanMark(chat){
  return chatMsgs(chat).slice().reverse().some(([,m]) => m && m.from === 'admin' && /consulta marcada|marcada a Javier|le dejo tu consulta|queda marcada/i.test(String(m.text||'')));
}
function chatLastAutoText(chat){
  const last = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
  return last ? String(last[1].text || '') : '';
}
function chatInferCategoryFromHistory(chat){
  const sample = chatMsgs(chat).slice(-8).map(([,m]) => String(m?.text||'')).join(' ');
  const q = normAI(sample);
  if(/servicio|sesion|sesiones|book|portfolio|beauty|alquiler/.test(q)) return 'servicios';
  if(/evento|eventos|decoracion|danzaterapia|manualidades|ciudad/.test(q)) return 'eventos';
  if(/curso|cursos|taller|workshop|seminario|clase|capacitacion|fotografia|modelo|modelaje/.test(q)) return 'cursos';
  return '';
}

// El basurero de la bandeja elimina directo, sin confirmación.
window.eliminarChatDefinitivo = async function(id){
  await remove(ref(db,'tomauno/chats/'+id));
  try{ notifiedChatIds.delete(id); localStorage.setItem('tomauno-chat-notified', JSON.stringify([...notifiedChatIds])); }catch(e){}
  if(currentOpenChatId === id) currentOpenChatId = '';
  toast('🗑️ Chat eliminado');
  abrirPanelChatsAdmin();
};

// Al cerrar todos, solo archiva/cierra. No borra historial.
window.cerrarTodosChatsAbiertos = function(){
  const abiertos = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c) && c.status !== 'cerrado');
  if(!abiertos.length){ toast('No hay chats abiertos'); return; }
  showConfirm('¿Vaciar la bandeja de abiertos? No se borran mensajes: quedan en Cerrados/Todos.', async ()=>{
    await Promise.all(abiertos.map(([id])=>update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()})));
    toast('📭 Bandeja abierta vacía');
    abrirChatAdminHome();
  });
};

// New course: insertar profesor/disertante en alta.
(function injectProfesorCursoField(){
  const hora = document.getElementById('nc-hora');
  if(hora && !document.getElementById('nc-profesor')){
    const wrap = document.createElement('div');
    wrap.className = 'fgroup';
    wrap.innerHTML = '<label class="flbl">Profesor / disertante / responsable</label><input class="finput" id="nc-profesor" placeholder="Ej: Javier Móttola"/>';
    const row = hora.closest('.frow2');
    if(row) row.insertAdjacentElement('afterend', wrap);
  }
})();

// Reemplazo controlado para guardar curso nuevo con profesor.
window.agregarCurso = async function(){
  const titulo = document.getElementById('nc-titulo')?.value.trim();
  if (!titulo) { toast('⚠️ El título es obligatorio'); return; }
  const tipo = document.getElementById('nc-tipo')?.value || 'curso';
  const pagoTipo = document.getElementById('nc-pago-tipo')?.value || 'unico';
  const prof = document.getElementById('nc-profesor')?.value.trim() || '';
  await push(ref(db, 'tomauno/cursos'), {
    tipo, titulo,
    desc: document.getElementById('nc-desc')?.value.trim() || '',
    costo: parseInt(document.getElementById('nc-costo')?.value) || 0,
    fecha: document.getElementById('nc-fecha')?.value || '',
    hora: document.getElementById('nc-hora')?.value.trim() || '',
    profesor: prof,
    disertante: prof,
    lugar: document.getElementById('nc-lugar')?.value.trim() || '',
    ig: document.getElementById('nc-ig')?.value.trim() || '',
    wp: document.getElementById('nc-wp')?.value.trim() || '',
    cupos: parseInt(document.getElementById('nc-cupos')?.value) || 0,
    pagoTipo,
    meses: pagoTipo === 'cuotas' ? (parseInt(document.getElementById('nc-meses')?.value) || 0) : 0,
    icon: document.getElementById('nc-icon')?.value.trim() || '📷',
    img: document.getElementById('nc-img')?.value.trim() || '',
    extraText: document.getElementById('nc-extra-text')?.value.trim() || '',
    extraUrl: document.getElementById('nc-extra-url')?.value.trim() || '',
    horaInicio: document.getElementById('nc-h-ini')?.value || '09:00',
    horaFin: document.getElementById('nc-h-fin')?.value || '22:00',
    descansos: document.getElementById('nc-descansos')?.value.trim() || '',
    duracion: parseInt(document.getElementById('nc-dur')?.value) || 30,
    grupoWA: document.getElementById('nc-grupo-wa')?.value.trim() || '',
    camposReq: {
      dni: document.getElementById('nc-req-dni')?.checked ?? true,
      edad: document.getElementById('nc-req-edad')?.checked ?? true,
      ig: document.getElementById('nc-req-ig')?.checked ?? true,
      email: document.getElementById('nc-req-email')?.checked ?? false,
      altura: document.getElementById('nc-req-altura')?.checked ?? false,
      medidas: document.getElementById('nc-req-medidas')?.checked ?? false,
    },
    finalizado: false, oculto: false, creado: Date.now()
  });
  ['nc-titulo','nc-desc','nc-costo','nc-cupos','nc-fecha','nc-hora','nc-profesor','nc-lugar','nc-ig','nc-wp','nc-img','nc-extra-text','nc-extra-url','nc-meses','nc-grupo-wa','nc-icon','nc-descansos'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  toast('✅ Curso publicado');
  setAtab('cursos');
};

const __editCurso_v339 = window.editCurso;
window.editCurso = function(id){
  __editCurso_v339(id);
  setTimeout(()=>{
    const desc = document.getElementById('ec-desc');
    const c = cursos[id] || {};
    if(desc && !document.getElementById('ec-profesor')){
      desc.insertAdjacentHTML('afterend','<label class="flbl">Profesor / disertante / responsable</label><input class="finput" id="ec-profesor" value="'+escAttr(c.profesor || c.disertante || c.organizador || c.docente || '')+'" placeholder="Ej: Javier Móttola"/>');
    }
  },30);
};
const __guardarEdit_v339 = window.guardarEdit;
window.guardarEdit = async function(id){
  const prof = document.getElementById('ec-profesor')?.value.trim() || '';
  await __guardarEdit_v339(id);
  await update(ref(db,'tomauno/cursos/'+id), {profesor:prof, disertante:prof});
};

function isAckAI(q){ return /^(si|sí|dale|ok|oki|bueno|perfecto|genial|gracias|muchas gracias|de acuerdo|listo)$/i.test(String(q||'').trim()); }
function hasGeneralListWords(q){ return /(tienen|tenes|tenés|hay|activos|activas|disponibles|ofrecen|cuales|cuáles|lista|listado|mostrar|mostrame|saber todos|todos los que)/.test(q); }
function queryTermsForEntity(q){
  const generic = new Set(['quiero','saber','sobre','tienen','tenes','hay','activos','activas','disponibles','info','informacion','todos','todas','cuales','cuáles','lista','listado','me','interesa','gustaria','gustaría','ver','mostrar','mostrame','curso','cursos','taller','talleres','workshop','seminario','clase','servicio','servicios','evento','eventos','tener','estan','están','teniendo']);
  return importantTermsAI(q).filter(w => !generic.has(w));
}
function listaEventosAI_v339(){
  const list = Object.values(eventosDB || {}).filter(e => e.estado === 'activo' && !e.oculto).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!list.length) return 'Por ahora no hay eventos activos publicados. #eventos';
  return '🎪 **Eventos activos**\n\n' + list.slice(0,8).map((e,i)=> (i+1)+'. **'+(e.titulo||'Evento')+'**' + (e.fecha?'\n📅 '+fFecha(e.fecha):'') + (e.costo?'\n💰 '+moneyAI(e.costo):'')).join('\n\n') + '\n\n#eventos';
}
function listaServiciosAI_v339(){
  const list = Object.values(serviciosDB || {}).filter(s => !s.oculto).sort((a,b)=>String(a.titulo||'').localeCompare(String(b.titulo||'')));
  if(!list.length) return '📷 Hacemos sesiones fotográficas, books, retratos, moda y contenido para redes. Contame qué tipo de sesión buscás y te oriento. #servicios';
  return '📷 **Servicios activos**\n\n' + list.slice(0,8).map((s,i)=> (i+1)+'. **'+(s.titulo||'Servicio')+'**' + (s.costo?'\n💰 '+moneyAI(s.costo):'') + (s.ig?'\n📲 @'+String(s.ig).replace('@',''):'')).join('\n\n') + '\n\n#servicios';
}
function listaCursosAI_v339(){
  const list = Object.values(cursos || {}).filter(c => !c.oculto && !c.finalizado).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!list.length) return 'Por ahora no hay cursos activos publicados. #cursos';
  return '🎓 **Cursos activos**\n\n' + list.slice(0,8).map((c,i)=> (i+1)+'. **'+(c.titulo||'Curso')+'**' + (c.fecha?'\n📅 '+fFecha(c.fecha):'') + (c.hora?'\n⏰ '+c.hora:'') + (c.costo?'\n💰 '+moneyAI(c.costo):'')).join('\n\n') + '\n\n#cursos';
}
function bestEntityAcrossPublishedAI(q){
  const terms = queryTermsForEntity(q);
  if(!terms.length) return null;
  const items = [];
  Object.entries(cursos||{}).forEach(([id,c])=>{ if(!c.oculto) items.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.profesor,c.disertante,c.organizador,c.docente,c.wp].join(' ')}); });
  Object.entries(serviciosDB||{}).forEach(([id,s])=>{ if(!s.oculto) items.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.ig,s.dir,s.wp].join(' ')}); });
  Object.entries(eventosDB||{}).forEach(([id,e])=>{ if(e.estado==='activo' && !e.oculto) items.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.nombreOrg,e.ig,e.lugar,e.wpOrg].join(' ')}); });
  let best = null;
  items.forEach(it=>{
    const titleNorm = normAI(it.title);
    const extraNorm = normAI(it.extra);
    let titleHits = 0, extraHits = 0;
    terms.forEach(t=>{ if(termHitAI(titleNorm,t)) titleHits++; else if(termHitAI(extraNorm,t)) extraHits++; });
    let score = titleHits*10 + extraHits*2;
    if(/curso|cursos|taller|workshop|seminario|clase/.test(q) && it.type==='curso') score += 3;
    if(/servicio|servicios|sesion|sesiones|book|portfolio|alquiler/.test(q) && it.type==='servicio') score += 3;
    if(/evento|eventos|decoracion|decoración|danzaterapia|manualidades/.test(q) && it.type==='evento') score += 3;
    if(score && (!best || score > best.score)) best = {...it, score, titleHits, extraHits};
  });
  return best && (best.titleHits > 0 || best.score >= 8) ? best : null;
}
function detailEntityAI_v339(m){
  if(!m) return '';
  if(m.type==='curso') return detalleCursoAI(m.obj) + '\n#info:curso:' + m.id + '#';
  if(m.type==='servicio') return detalleServicioAI(m.obj) + '\n#info:servicio:' + m.id + '#';
  if(m.type==='evento') return detalleEventoAI(m.obj) + '\n#info:evento:' + m.id + '#';
  return '';
}

const __buscarRespuestaAsistente_v339_base = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  const chat = chatsDB[currentOpenChatId] || {};
  if(!q) return '';

  if(isAckAI(text) && chatHadHumanMark(chat)){
    return 'Perfecto 😊 Queda marcada tu consulta para que Javier la revise. Si querés agregar algo más, escribilo por acá.';
  }

  // Contacto general o con Javier/dueño: pasar WhatsApp, no pedir más vueltas.
  if(/(comunicarme|comunicar|contactarme|contactar|contacto|whatsapp|telefono|teléfono|celular|numero|número|dueño|dueno|javier|mottola|ustedes)/.test(q) && !/(organizador|profesor|docente|disertante)/.test(q)){
    return '💬 **Contacto directo de Tomauno**\nPodés escribirle a Javier por WhatsApp: ' + chatWhatsappUrl(chat) + '\n\nSi querés, también puedo dejar tu consulta marcada para que la revise personalmente.';
  }

  if(/(direccion|dirección|ubicacion|ubicación|donde queda|dónde queda|maps|mapa|llegar)/.test(q)){
    window._lastAiSection = 'sec-ubicacion';
    return '📍 **Dirección del estudio**\nPedro Méndez 2069, Posadas, Misiones.\n\n🗺️ Google Maps: Abrir Google Maps\n#ubicacion';
  }

  // Listas generales claras.
  if(/(curso|cursos|capacitacion|capacitación|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && (hasGeneralListWords(q) || queryTermsForEntity(q).length === 0)){
    window._lastAiSection = 'sec-cursos';
    return listaCursosAI_v339();
  }
  if(/(servicio|servicios|sesion|sesión|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && (hasGeneralListWords(q) || queryTermsForEntity(q).length === 0)){
    window._lastAiSection = 'sec-servicios';
    return listaServiciosAI_v339();
  }
  if(/(evento|eventos|agenda|actividad|actividades)/.test(q) && (hasGeneralListWords(q) || queryTermsForEntity(q).length === 0)){
    window._lastAiSection = 'sec-eventos';
    return listaEventosAI_v339();
  }

  // Profesor / organizador / contacto de actividad publicada.
  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|organizador|organiza|quien da|quién da|quien dicta|quién dicta)/.test(q)){
    const ent = bestEntityAcrossPublishedAI(q) || bestPublishedTitleMatchAI(q);
    if(ent){
      window._lastAiSection = ent.type==='curso' ? 'sec-cursos' : ent.type==='servicio' ? 'sec-servicios' : 'sec-eventos';
      return contactoEntidadAI(ent);
    }
    return 'Para decirte quién es el profesor u organizador necesito saber de qué curso, taller, servicio o evento me hablás. ¿Cuál te interesa?';
  }

  // Entidad puntual por título/tema.
  const ent = bestEntityAcrossPublishedAI(q) || bestPublishedTitleMatchAI(q);
  if(ent && queryTermsForEntity(q).length){
    window._lastAiSection = ent.type==='curso' ? 'sec-cursos' : ent.type==='servicio' ? 'sec-servicios' : 'sec-eventos';
    return detailEntityAI_v339(ent);
  }

  // Si dice “todos los que tienen activos” sin categoría, intentar inferir por contexto.
  if(/(todos|todas|activos|activas|disponibles|tienen|teniendo)/.test(q)){
    const cat = chatInferCategoryFromHistory(chat);
    if(cat === 'servicios'){ window._lastAiSection='sec-servicios'; return listaServiciosAI_v339(); }
    if(cat === 'eventos'){ window._lastAiSection='sec-eventos'; return listaEventosAI_v339(); }
    if(cat === 'cursos'){ window._lastAiSection='sec-cursos'; return listaCursosAI_v339(); }
  }

  return __buscarRespuestaAsistente_v339_base(text);
};

// Evitar que la búsqueda interna confunda acentos y mover al bloque correcto.
window.filterCursos = function(){
  const inp = document.getElementById('course-search');
  const q = normAI(inp?.value || '');
  const cl = document.getElementById('search-clear');
  const info = document.getElementById('search-info');
  if(cl) cl.style.display = q ? 'block' : 'none';
  let curVis = 0, evVis = 0;
  document.querySelectorAll('.ccard').forEach(card => {
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none';
    if(match) curVis++;
  });
  document.querySelectorAll('#eventos-grid .ev-card').forEach(card => {
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none';
    if(match) evVis++;
  });
  if(info){
    if(!q) info.textContent = '';
    else if(curVis > 0) info.textContent = curVis + ' resultado' + (curVis!==1?'s':'') + ' en cursos para "' + (inp?.value || '') + '"';
    else if(evVis > 0) info.textContent = evVis + ' resultado' + (evVis!==1?'s':'') + ' en eventos para "' + (inp?.value || '') + '"';
    else info.textContent = '0 resultados para "' + (inp?.value || '') + '"';
  }
  if(q && curVis === 0 && evVis > 0){ setTimeout(()=>document.getElementById('sec-eventos')?.scrollIntoView({behavior:'smooth', block:'start'}), 120); }
};

// Mensaje visitante: guardar nombre si viene junto a una consulta, conservar historial y responder solo sobre la consulta real.
window.enviarChatVisitante = async function(id){
  const inp = document.getElementById('chat-text');
  const text = inp?.value.trim();
  if(!text) return;
  inp.value=''; inp.focus();
  const existingChat = chatsDB?.[id] || {};
  let fallbackName = '';
  try{ fallbackName = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}
  const detectedName = isJustNameReply(text, existingChat);
  const repairedName = limpiarNombreChat(detectedName || existingChat.name || fallbackName || chatAnonName(id, existingChat));
  await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'user', text, time:chatTime(), createdAt:Date.now()});
  await update(ref(db,'tomauno/chats/'+id), {name: repairedName, status:'abierto', updatedAt:Date.now(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:Date.now()});
  try{ if(detectedName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}
  if(detectedName){ setTimeout(()=>abrirChatVisitante(id, true), 120); }
  let queryForBot = text;
  if(detectedName && lastAdminAskedName(existingChat)) queryForBot = stripNameFromMessageForAI(text, detectedName);
  if(!queryForBot || esSoloRespuestaNombre(text, existingChat)) return;
  responderAutomaticoChat(id, queryForBot);
};

// Abrir automáticamente la conversación nueva si el admin está en el home del chat.
let __lastAutoOpenChatV339 = '';
setInterval(()=>{
  try{
    if(!isAdminNotifier()) return;
    const pop = document.getElementById('chat-popover');
    if(!pop || !pop.classList.contains('open')) return;
    if(currentOpenChatId) return;
    const unread = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c) && c.status !== 'cerrado' && c.unreadAdmin).sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
    if(unread.length && __lastAutoOpenChatV339 !== unread[0][0]){
      __lastAutoOpenChatV339 = unread[0][0];
      abrirChatAdmin(unread[0][0]);
    }
  }catch(e){}
}, 1600);

// Menú admin: si hay chats cerrados pero nada abierto, mostrar home vacío limpio.
window.abrirChatAdminHome = function(){
  currentOpenChatId = '';
  const valid = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c));
  const abiertos = valid.filter(([,c])=>c.status !== 'cerrado').length;
  const nuevos = valid.filter(([,c])=>c.unreadAdmin).length;
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Panel de atención desde la web</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Activar/desactivar automático" onclick="window.toggleModoAsistenteChat()">🤖</button><button class="chat-icon-btn" title="Activar notificaciones" onclick="window.pedirPermisoNotificaciones()">🔔</button></div></div>'+ 
    '<div class="chat-empty-state"><div><strong>'+(abiertos?'Esperando consultas':'Bandeja limpia')+'</strong><div>'+(abiertos?'Tenés '+abiertos+' conversación'+(abiertos!==1?'es':'')+' abierta'+(abiertos!==1?'s':'')+(nuevos?(' · '+nuevos+' nueva'+(nuevos!==1?'s':'')):'')+'.':'No hay conversaciones abiertas ahora mismo.')+'</div><div style="margin-top:8px;font-size:12px;">'+(abiertos?'Abrí la bandeja cuando quieras revisar o responder.':'Cuando alguien escriba desde la web aparecerá acá.')+'</div></div></div>'+ 
    '<div class="chat-home-actions"><button class="btn-main" onclick="abrirPanelChatsAdmin()">📥 Ver bandeja</button><button class="btn-out" onclick="window.verResumenConsultasChat()">📋 Resumen</button><button class="btn-out" onclick="window.cerrarTodosChatsAbiertos()">📭 Vaciar abiertos</button><button class="btn-out" onclick="window.cerrarChatPopover()">Minimizar</button></div>'
  );
};

// Normalizar botón de acción de ubicación para no repetir “tocá”.
const __chatActionButtonsForMessage_v339 = chatActionButtonsForMessage;
chatActionButtonsForMessage = function(text){
  return __chatActionButtonsForMessage_v339(String(text||'').replace(/También podés tocar[^\n]+/gi,''));
};



// ── PATCH V33.10: cierre fino de chat/asistente sin tocar Firebase ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    /* Botonera siempre visible y área de lectura más grande */
    .chat-popover:not(.expanded){width:min(470px,calc(100vw - 22px))!important;min-height:650px!important;}
    .chat-popover .chat-popover-inner{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .chat-popover .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;}
    .chat-popover .chat-msgs{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;}
    .chat-popover:not(.expanded) .chat-msgs{min-height:390px!important;}
    .chat-popover .chat-row{flex:0 0 auto!important;}
    .chat-popover .chat-admin-tools{flex:0 0 auto!important;margin-top:8px!important;}
    .chat-popover .chat-tools-block{flex:0 0 auto!important;max-height:none!important;overflow:visible!important;}
    .chat-popover .chat-quick-wrap,.chat-popover .chat-admin-actions{overflow:visible!important;flex-wrap:wrap!important;padding-right:0!important;}
    .chat-popover .chat-admin-actions{padding-bottom:0!important;}
    .chat-popover.expanded{left:50%!important;right:auto!important;top:50%!important;bottom:auto!important;transform:translate(-50%,-50%)!important;width:min(1240px,calc(100vw - 28px))!important;height:min(940px,calc(100vh - 32px))!important;max-height:calc(100vh - 32px)!important;}
    .chat-popover.expanded .chat-msgs{min-height:430px!important;}
    .chat-popover.expanded .chat-tools-block{max-height:160px!important;overflow:visible!important;}
    .chat-popover.expanded .chat-panel{height:auto!important;}
    .chat-bubble .chip.prof-chip{display:inline-flex;margin-top:6px;}
    @media(max-width:700px){
      .chat-popover:not(.expanded){left:10px!important;right:10px!important;width:auto!important;min-height:0!important;bottom:90px!important;max-height:calc(100vh - 112px)!important;}
      .chat-popover:not(.expanded) .chat-msgs{min-height:310px!important;}
      .chat-popover.expanded{left:8px!important;right:8px!important;top:auto!important;bottom:86px!important;transform:none!important;width:auto!important;height:auto!important;max-height:calc(100vh - 106px)!important;}
      .chat-popover.expanded .chat-msgs{min-height:320px!important;}
    }
  `;
  document.head.appendChild(css);
})();

// Generalidad estricta: si preguntan “qué cursos/servicios/eventos tienen”, listar todo y no elegir al azar.
function generalTermsV3310(q){
  const drop = new Set(['quiero','saber','sobre','tienen','tenes','tenés','hay','activos','activas','disponibles','info','informacion','información','todos','todas','cuales','cuáles','lista','listado','mostrar','mostrame','ver','me','interesa','gustaria','gustaría','estan','están','teniendo','ofrecen','ofreces','estudio','tomauno','curso','cursos','capacitacion','capacitación','capacitaciones','taller','talleres','workshop','seminario','clase','clases','servicio','servicios','sesion','sesión','sesiones','evento','eventos','agenda','actividad','actividades']);
  return importantTermsAI(q).filter(w=>!drop.has(w));
}
function isGeneralCourseQueryAI_v3310(q){ return /(curso|cursos|capacitacion|capacitación|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && /(que|qué|cuales|cuáles|tienen|tenes|tenés|hay|disponibles|activos|info|informacion|información|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(q) && generalTermsV3310(q).length===0; }
function isGeneralServiceQueryAI_v3310(q){ return /(servicio|servicios|sesion|sesión|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && /(que|qué|cuales|cuáles|tienen|tenes|tenés|hay|disponibles|activos|info|informacion|información|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(q) && generalTermsV3310(q).length===0; }
function isGeneralEventQueryAI_v3310(q){ return /(evento|eventos|agenda|actividad|actividades)/.test(q) && /(que|qué|cuales|cuáles|tienen|tenes|tenés|hay|disponibles|activos|info|informacion|información|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(q) && generalTermsV3310(q).length===0; }

// Botones de acción: soportar #info/#inscripción siempre, aunque el usuario cierre y vuelva a tocar.
chatActionButtonsForMessage = function(text){
  const t = normAI(text || '');
  const btns = parseChatActions(text || []);
  if(t.includes('cursos activos') || t.includes('seccion cursos') || t.includes('ver cursos')) btns.push({label:'🎓 Ver cursos', sec:'sec-cursos'});
  if(t.includes('eventos activos') || t.includes('seccion eventos') || t.includes('ver eventos')) btns.push({label:'🎪 Ver eventos', sec:'sec-eventos'});
  if(t.includes('servicios activos') || t.includes('servicios disponibles') || t.includes('seccion servicios') || t.includes('ver servicios')) btns.push({label:'📷 Ver servicios', sec:'sec-servicios'});
  if(t.includes('direccion del estudio') || t.includes('pedro mendez')) btns.push({label:'📍 Ver ubicación', sec:'sec-ubicacion'});
  const seen = new Set();
  const clean = btns.filter(b=>{ const k = b.url || (b.fn+':'+b.type+':'+b.id) || b.sec || b.label; if(seen.has(k)) return false; seen.add(k); return true; });
  if(!clean.length) return '';
  return '<div class="chat-action-row">' + clean.map(b => {
    if(b.url) return '<button class="chat-action-btn" onclick="window.open(\''+b.url+'\',\'_blank\')">'+b.label+'</button>';
    if(b.fn) return '<button class="chat-action-btn" onclick="window.executeChatAction(\''+b.fn+'\',\''+b.type+'\',\''+String(b.id).replace(/'/g,'\\\'')+'\')">'+b.label+'</button>';
    return '<button class="chat-action-btn" onclick="window.chatGoToSection(\''+b.sec+'\')">'+b.label+'</button>';
  }).join('') + '</div>';
};

// Demorar acciones automáticas para que el usuario lea primero el mensaje.
maybeRunVisitorActionTags = function(chatId, chat){
  if(!chatId || chatId !== currentVisitorChatId || isAdminNotifier()) return;
  const msgs = chatMsgs(chat).filter(([,m]) => m && m.from === 'admin' && !m.typing);
  if(!msgs.length) return;
  const [mid,last] = msgs[msgs.length-1];
  const key = 'tomauno-action-done-' + chatId;
  try{ if(sessionStorage.getItem(key) === mid) return; }catch(e){}
  const actions = parseChatActions(last.text || '');
  const auto = actions.find(a => a.sec || a.fn);
  if(!auto) return;
  try{ sessionStorage.setItem(key, mid); }catch(e){}
  setTimeout(()=>{
    if(auto.sec) navScroll(auto.sec);
    else if(auto.fn) window.executeChatAction(auto.fn, auto.type, auto.id);
  }, 1900);
};

// Limpiar frases innecesarias en respuestas con ubicación/acciones.
const __cleanChatDisplayText_v3310 = cleanChatDisplayText;
cleanChatDisplayText = function(text){
  return __cleanChatDisplayText_v3310(String(text||'').replace(/También podés tocar[^\n]+\n?/gi,''));
};

// Ejecutar info/inscripción siempre que se toque el botón.
executeChatAction = function(fn,type,id){
  setTimeout(()=>{
    try{
      if(type==='curso'){
        if(fn==='inscripcion' && window.abrirInscripcion) window.abrirInscripcion(id); else if(window.abrirDetalle) window.abrirDetalle(id);
      }else if(type==='servicio'){
        if(window.abrirServicioDB) window.abrirServicioDB(id); else if(window.abrirServicio) window.abrirServicio(id); else navScroll('sec-servicios');
      }else if(type==='evento'){
        if(fn==='inscripcion' && window.abrirInscEvento) window.abrirInscEvento(id); else if(window.abrirDetalleEvento) window.abrirDetalleEvento(id); else navScroll('sec-eventos');
      }
    }catch(e){ console.warn('executeChatAction v33.10', e); }
  }, 60);
};

// Mostrar profesor/disertante/responsable en tarjetas y detalle del curso.
function cursoProfesorLabelV3310(c){ return (c && (c.profesor || c.disertante || c.organizador || c.docente || c.responsable)) || ''; }
const __renderCursos_v3310 = renderCursos;
renderCursos = function(){
  __renderCursos_v3310();
  try{
    document.querySelectorAll('.ccard[data-id]').forEach(card=>{
      if(card.dataset.profInjected==='1') return;
      const id = card.getAttribute('data-id'); const c = cursos?.[id]; const prof = cursoProfesorLabelV3310(c);
      if(!prof) return;
      const meta = card.querySelector('.cmeta'); if(!meta) return;
      meta.insertAdjacentHTML('beforeend','<span class="chip prof-chip">👤 '+escHtml(prof)+'</span>');
      card.dataset.profInjected='1';
    });
  }catch(e){}
};
const __abrirDetalle_v3310 = window.abrirDetalle;
window.abrirDetalle = function(id){
  __abrirDetalle_v3310(id);
  try{
    const c = cursos?.[id]; const prof = cursoProfesorLabelV3310(c); if(!prof) return;
    const meta = document.querySelector('#mcontent .cmeta');
    if(meta && !meta.querySelector('.prof-chip')) meta.insertAdjacentHTML('beforeend','<span class="chip prof-chip">👤 '+escHtml(prof)+'</span>');
  }catch(e){}
};

// Respuesta asistente: prioridad a listas generales, contacto y profes antes de caer en el motor anterior.
const __buscarRespuestaAsistente_v3310 = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';

  if(isGeneralCourseQueryAI_v3310(q)){ window._lastAiSection='sec-cursos'; return listaCursosAI(''); }
  if(isGeneralServiceQueryAI_v3310(q)){ window._lastAiSection='sec-servicios'; return listaServiciosAI(''); }
  if(isGeneralEventQueryAI_v3310(q)){ window._lastAiSection='sec-eventos'; return listaEventosAI(); }

  if(/(contactar|contactarme|comunicarme|comunicar|whatsapp|telefono|teléfono|numero|número)/.test(q) && /(javier|dueño|dueno|mottola|tomauno|ustedes)/.test(q)){
    return '💬 **Contacto directo de Javier / Tomauno**\nPodés escribir por WhatsApp: ' + chatWhatsappUrl(chatsDB[currentOpenChatId] || {}) + '\n\nSi querés, dejame también el motivo de tu consulta y queda marcado para responderte mejor.';
  }

  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|responsable|organizador|organiza|quien da|quién da|quien dicta|quién dicta)/.test(q)){
    const m = bestPublishedTitleMatchAI(q) || bestEntityAcrossPublishedAI?.(q);
    if(m){ window._lastAiSection = m.type==='curso'?'sec-cursos':m.type==='servicio'?'sec-servicios':'sec-eventos'; return contactoEntidadAI(m); }
    return 'Para decirte quién es el profesor, disertante u organizador necesito saber de qué curso, taller, servicio o evento me hablás. ¿Cuál te interesa?';
  }

  return __buscarRespuestaAsistente_v3310(text);
};

// Filtros de búsqueda acento-insensibles y con mensajes claros.
const __filterCursos_v3310_prev = window.filterCursos;
window.filterCursos = function(){
  const inp = document.getElementById('course-search');
  const qRaw = inp?.value || '';
  const q = normAI(qRaw);
  const cl = document.getElementById('search-clear');
  const info = document.getElementById('search-info');
  if(cl) cl.style.display = q ? 'block' : 'none';
  let curVis=0, evVis=0;
  document.querySelectorAll('.ccard').forEach(card=>{
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none'; if(match) curVis++;
  });
  document.querySelectorAll('#eventos-grid .ev-card').forEach(card=>{
    const txt = normAI((card.dataset.search || '') + ' ' + card.textContent);
    const match = !q || txt.includes(q);
    card.style.display = match ? '' : 'none'; if(match) evVis++;
  });
  if(info){
    if(!q) info.textContent='';
    else if(curVis && evVis) info.textContent=(curVis+evVis)+' resultados para "'+qRaw+'"';
    else if(curVis) info.textContent=curVis+' resultado'+(curVis!==1?'s':'')+' en cursos para "'+qRaw+'"';
    else if(evVis) info.textContent=evVis+' resultado'+(evVis!==1?'s':'')+' en eventos para "'+qRaw+'"';
    else info.textContent='0 resultados para "'+qRaw+'"';
  }
  if(q && curVis===0 && evVis>0){ setTimeout(()=>document.getElementById('sec-eventos')?.scrollIntoView({behavior:'smooth', block:'start'}), 150); }
};


// ── PATCH V33.11: layout chat + prioridad de cursos/profesores sin mezclar servicios ──
(function(){
  const css = document.createElement('style');
  css.textContent = `
    /* V33.11: que la botonera no robe pantalla ni quede tapada */
    .chat-popover.expanded{
      width:min(1240px,calc(100vw - 28px))!important;
      height:min(900px,calc(100vh - 28px))!important;
      max-height:calc(100vh - 28px)!important;
      top:50%!important;left:50%!important;right:auto!important;bottom:auto!important;
      transform:translate(-50%,-50%)!important;
    }
    .chat-popover.expanded.dragged{transform:none!important;}
    .chat-popover.expanded .chat-popover-inner{height:100%!important;max-height:none!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;padding:18px!important;}
    .chat-popover.expanded .chat-panel{flex:1 1 auto!important;min-height:0!important;height:auto!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}
    .chat-popover.expanded .chat-msgs{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;}
    .chat-popover.expanded .chat-row{flex:0 0 auto!important;}
    .chat-popover.expanded .chat-admin-tools{flex:0 0 auto!important;margin-top:8px!important;}
    .chat-popover.expanded .chat-tools-block{flex:0 0 auto!important;max-height:118px!important;overflow-y:auto!important;overflow-x:hidden!important;padding-bottom:4px!important;}
    .chat-popover.expanded .chat-quick-wrap,.chat-popover.expanded .chat-admin-actions{display:flex!important;flex-wrap:wrap!important;gap:7px!important;overflow:visible!important;padding:4px 0 4px!important;}
    .chat-popover.expanded .chat-admin-actions .btn-out,.chat-popover.expanded .chat-admin-actions a.btn-out{width:38px!important;min-width:38px!important;height:38px!important;border-radius:50%!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;}
    .chat-popover.expanded .chat-quick{width:34px!important;min-width:34px!important;height:34px!important;}
    .chat-popover:not(.expanded){min-height:0!important;height:auto!important;max-height:min(86vh,760px)!important;}
    .chat-popover:not(.expanded) .chat-msgs{min-height:300px!important;}
    .chat-popover:not(.expanded) .chat-tools-block{max-height:126px!important;overflow-y:auto!important;overflow-x:hidden!important;}
    @media(max-width:700px){
      .chat-popover.expanded{left:8px!important;right:8px!important;top:auto!important;bottom:86px!important;width:auto!important;height:auto!important;max-height:calc(100vh - 106px)!important;transform:none!important;resize:none!important;}
      .chat-popover.expanded .chat-popover-inner{max-height:calc(100vh - 126px)!important;}
      .chat-popover.expanded .chat-msgs{min-height:0!important;}
      .chat-popover.expanded .chat-tools-block{max-height:108px!important;}
    }
  `;
  document.head.appendChild(css);
})();

function aiItemsV3311(types){
  const allow = new Set(types || ['curso','servicio','evento']);
  const arr = [];
  if(allow.has('curso')) Object.entries(cursos || {}).forEach(([id,c])=>{ if(!c.oculto) arr.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.profesor,c.disertante,c.organizador,c.docente,c.responsable,c.wp].join(' ')}); });
  if(allow.has('servicio')) Object.entries(serviciosDB || {}).forEach(([id,s])=>{ if(!s.oculto) arr.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.ig,s.wp,s.dir,s.responsable].join(' ')}); });
  if(allow.has('evento')) Object.entries(eventosDB || {}).forEach(([id,e])=>{ if(e.estado==='activo' && !e.oculto) arr.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.nombreOrg,e.organizador,e.ig,e.lugar,e.wpOrg].join(' ')}); });
  return arr;
}
function aiTermsV3311(q){
  const stop = new Set(['quiero','quisiera','saber','sobre','tienen','tenes','tenés','hay','activos','activas','disponibles','info','informacion','información','todos','todas','cuales','cuáles','lista','listado','mostrar','mostrame','ver','me','interesa','gustaria','gustaría','estan','están','teniendo','ofrecen','ofreces','estudio','tomauno','curso','cursos','capacitacion','capacitación','capacitaciones','taller','talleres','workshop','seminario','clase','clases','servicio','servicios','sesion','sesión','sesiones','evento','eventos','agenda','actividad','actividades','profesor','profesora','profesores','profe','profes','docente','docentes','disertante','disertantes','organizador','organiza','quien','quién','dicta','da','del','de','la','el','los','las','un','una','alguno','alguna','para','con','como','cómo']);
  return importantTermsAI(q).filter(w => w.length > 2 && !stop.has(w));
}
function aiBestV3311(q, types){
  const nq = normAI(q || '');
  const terms = aiTermsV3311(nq);
  if(!terms.length) return null;
  let best = null;
  aiItemsV3311(types).forEach(it => {
    const title = normAI(it.title);
    const extra = normAI(it.extra);
    let titleHits = 0, extraHits = 0;
    terms.forEach(t => { if(termHitAI(title,t)) titleHits++; else if(termHitAI(extra,t)) extraHits++; });
    let score = titleHits * 20 + extraHits * 4;
    if(types && types.length === 1) score += 2;
    if(score > 0 && (!best || score > best.score)) best = {...it, score, titleHits, extraHits, terms};
  });
  return best && (best.titleHits > 0 || best.score >= 8) ? best : null;
}
function aiProfessorMatchV3311(q){
  const terms = aiTermsV3311(q);
  if(!terms.length) return null;
  let matches = [];
  aiItemsV3311(['curso','servicio','evento']).forEach(it => {
    const who = normAI([it.obj.profesor,it.obj.disertante,it.obj.docente,it.obj.responsable,it.obj.organizador,it.obj.nombreOrg].filter(Boolean).join(' '));
    const all = normAI([it.title,it.extra].join(' '));
    let whoHits = 0, allHits = 0;
    terms.forEach(t => { if(termHitAI(who,t)) whoHits++; if(termHitAI(all,t)) allHits++; });
    if(whoHits || allHits >= 2) matches.push({...it, score: whoHits*25 + allHits*3, whoHits, allHits});
  });
  matches.sort((a,b)=>b.score-a.score);
  return matches[0] || null;
}
function aiDetailV3311(m){
  if(!m) return '';
  if(m.type === 'curso') return detalleCursoAI(m.obj) + '\n#info:curso:' + m.id + '#';
  if(m.type === 'servicio') return detalleServicioAI(m.obj) + '\n#info:servicio:' + m.id + '#';
  if(m.type === 'evento') return detalleEventoAI(m.obj) + '\n#info:evento:' + m.id + '#';
  return '';
}

const __buscarRespuestaAsistente_v3311 = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';

  // General: nunca elegir una actividad al azar si pidió lista.
  if(/(curso|cursos|capacitacion|capacitación|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && (hasGeneralListWords(q) || aiTermsV3311(q).length === 0)){
    window._lastAiSection = 'sec-cursos';
    return (typeof listaCursosAI_v339 === 'function' ? listaCursosAI_v339() : listaCursosAI(''));
  }
  if(/(servicio|servicios|sesion|sesión|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && (hasGeneralListWords(q) || aiTermsV3311(q).length === 0)){
    window._lastAiSection = 'sec-servicios';
    return (typeof listaServiciosAI_v339 === 'function' ? listaServiciosAI_v339() : listaServiciosAI(''));
  }
  if(/(evento|eventos|agenda|actividad|actividades)/.test(q) && (hasGeneralListWords(q) || aiTermsV3311(q).length === 0)){
    window._lastAiSection = 'sec-eventos';
    return (typeof listaEventosAI_v339 === 'function' ? listaEventosAI_v339() : listaEventosAI());
  }

  // Profesor/disertante/organizador: buscar por nombre o por título en datos publicados.
  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|responsable|organizador|organiza|quien da|quién da|quien dicta|quién dicta)/.test(q)){
    const byPerson = aiProfessorMatchV3311(q);
    const byTitle = aiBestV3311(q, ['curso','servicio','evento']);
    const m = byPerson || byTitle;
    if(m){
      window._lastAiSection = m.type === 'curso' ? 'sec-cursos' : m.type === 'servicio' ? 'sec-servicios' : 'sec-eventos';
      return contactoEntidadAI(m);
    }
    return 'Para decirte quién es el profesor, disertante u organizador necesito saber de qué curso, taller, servicio o evento me hablás. ¿Cuál te interesa?';
  }

  // Específico por tipo: si dijo curso, sólo mirar cursos; si dijo servicio, sólo servicios; si dijo evento/taller de ciudad, eventos.
  if(/(curso|cursos|capacitacion|capacitación|capacitaciones|clase|clases)/.test(q)){
    const m = aiBestV3311(q, ['curso']);
    if(m){ window._lastAiSection='sec-cursos'; return aiDetailV3311(m); }
  }
  if(/(servicio|servicios|sesion|sesión|sesiones|book|books|portfolio|alquiler|trabajos|propuestas)/.test(q)){
    const m = aiBestV3311(q, ['servicio']);
    if(m){ window._lastAiSection='sec-servicios'; return aiDetailV3311(m); }
  }
  if(/(evento|eventos|danzaterapia|decoracion|decoración|manualidades)/.test(q)){
    const m = aiBestV3311(q, ['evento']);
    if(m){ window._lastAiSection='sec-eventos'; return aiDetailV3311(m); }
  }

  return __buscarRespuestaAsistente_v3311(text);
};

// Comandos rápidos recordatorio: /info fotografía, /info modelaje, /info decoración, /inscribir fotografía.



// ── PATCH V33.12: cierre de ajustes chat/asistente/búsquedas ────────────────
(function(){
  const css = document.createElement('style');
  css.textContent = `
    /* Scrollbars discretas y rojas */
    .chat-tabs,.chat-admin-actions,.chat-tools-block,.chat-msgs{scrollbar-width:thin;scrollbar-color:#e8000a #101010;}
    .chat-tabs::-webkit-scrollbar,.chat-admin-actions::-webkit-scrollbar{height:5px!important;}
    .chat-msgs::-webkit-scrollbar,.chat-tools-block::-webkit-scrollbar{width:6px!important;}
    .chat-tabs::-webkit-scrollbar-track,.chat-admin-actions::-webkit-scrollbar-track,.chat-msgs::-webkit-scrollbar-track,.chat-tools-block::-webkit-scrollbar-track{background:#111;border-radius:20px;}
    .chat-tabs::-webkit-scrollbar-thumb,.chat-admin-actions::-webkit-scrollbar-thumb,.chat-msgs::-webkit-scrollbar-thumb,.chat-tools-block::-webkit-scrollbar-thumb{background:#e8000a;border-radius:20px;}
    /* Tabs más claras y sin encimarse */
    .chat-tabs{max-width:calc(100% - 92px);padding-bottom:6px;margin-bottom:8px;}
    .chat-tab{height:30px;max-width:178px;}
    .chat-tab.active{box-shadow:0 0 0 1px rgba(232,0,10,.45) inset;}
    .chat-tab.unread{border-color:#e8000a!important;background:rgba(232,0,10,.13)!important;animation:tabPulse 1.2s infinite;}
    @keyframes tabPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,0,10,.0)}50%{box-shadow:0 0 0 4px rgba(232,0,10,.12)}}
    /* Chat expandido: más área útil, menos hueco abajo */
    .chat-popover.expanded{width:min(1180px,calc(100vw - 28px))!important;height:min(880px,calc(100vh - 28px))!important;max-height:calc(100vh - 28px)!important;top:50%!important;left:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;resize:both!important;overflow:auto!important;}
    .chat-popover.expanded.dragged{transform:none!important;}
    .chat-popover.expanded .chat-popover-inner{height:100%!important;max-height:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:16px!important;}
    .chat-popover.expanded .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;gap:8px!important;}
    .chat-popover.expanded .chat-msgs{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;overflow-x:hidden!important;}
    .chat-popover.expanded .chat-row{flex:0 0 auto!important;}
    .chat-popover.expanded .chat-tools-block{flex:0 0 auto!important;max-height:112px!important;overflow-y:auto!important;overflow-x:hidden!important;padding-right:4px;}
    .chat-popover.expanded .chat-admin-actions{display:flex!important;flex-wrap:wrap!important;overflow:visible!important;gap:7px!important;padding:4px 0!important;}
    .chat-popover.expanded .chat-admin-actions .btn-out,.chat-popover.expanded .chat-admin-actions a.btn-out{width:38px!important;height:38px!important;min-width:38px!important;border-radius:50%!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:15px!important;}
    .chat-popover.expanded .chat-quick{width:34px!important;height:34px!important;min-width:34px!important;border-radius:50%!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:15px!important;}
    .chat-action-row{gap:6px!important;}
    .chat-action-btn{padding:6px 10px!important;font-size:10.5px!important;}
    .chat-bubble{overflow-wrap:anywhere;}
    .chat-confirm-modal,.modal.confirm{z-index:99999!important;}
    @media(max-width:700px){.chat-popover.expanded{left:8px!important;right:8px!important;top:auto!important;bottom:86px!important;transform:none!important;width:auto!important;height:auto!important;max-height:calc(100vh - 106px)!important;resize:none!important}.chat-popover.expanded .chat-popover-inner{max-height:calc(100vh - 126px)!important}.chat-tabs{max-width:calc(100% - 80px)}}
  `;
  document.head.appendChild(css);
})();

function aiTokensExactV3312(s){ return normAI(s).replace(/[^a-z0-9ñ ]/g,' ').split(/\s+/).filter(Boolean); }
function aiHasTokenV3312(hay, tok){ return aiTokensExactV3312(hay).includes(normAI(tok)); }
function aiImportantTermsV3312(q){
  const stop = new Set(['quiero','quisiera','saber','sobre','tienen','tenes','tenes','hay','activos','activas','disponibles','info','informacion','todos','todas','cuales','lista','listado','mostrar','mostrame','ver','me','interesa','gustaria','estan','teniendo','ofrecen','ofreces','estudio','tomauno','curso','cursos','capacitacion','capacitaciones','taller','talleres','workshop','seminario','clase','clases','servicio','servicios','sesion','sesiones','evento','eventos','agenda','actividad','actividades','profesor','profesora','profesores','profe','profes','docente','docentes','disertante','disertantes','organizador','organiza','quien','dicta','da','del','de','la','el','los','las','un','una','alguno','alguna','para','con','como','donde','cuando','ustedes']);
  return aiTokensExactV3312(q).filter(w => w.length > 2 && !stop.has(w));
}
function aiIsGeneralListV3312(q,type){
  const n=normAI(q);
  const terms=aiImportantTermsV3312(n);
  if(type==='curso') return /(curso|cursos|capacitacion|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(n) && /(que|cuales|tienen|tenes|hay|disponibles|activos|info|informacion|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(n) && terms.length===0;
  if(type==='servicio') return /(servicio|servicios|sesion|sesiones|book|books|portfolio|trabajos|propuestas)/.test(n) && /(que|cuales|tienen|tenes|hay|disponibles|activos|info|informacion|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(n) && terms.length===0;
  if(type==='evento') return /(evento|eventos|agenda|actividad|actividades)/.test(n) && /(que|cuales|tienen|tenes|hay|disponibles|activos|info|informacion|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(n) && terms.length===0;
  return false;
}
function aiItemsV3312(types){
  const allow=new Set(types||['curso','servicio','evento']); const arr=[];
  if(allow.has('curso')) Object.entries(cursos||{}).forEach(([id,c])=>{ if(!c.oculto) arr.push({type:'curso',id,obj:c,title:c.titulo||'',extra:[c.desc,c.ig,c.profesor,c.disertante,c.organizador,c.docente,c.responsable,c.wp].join(' ')}); });
  if(allow.has('servicio')) Object.entries(serviciosDB||{}).forEach(([id,s])=>{ if(!s.oculto) arr.push({type:'servicio',id,obj:s,title:s.titulo||'',extra:[s.desc,s.ig,s.wp,s.dir,s.responsable].join(' ')}); });
  if(allow.has('evento')) Object.entries(eventosDB||{}).forEach(([id,e])=>{ if(e.estado==='activo'&&!e.oculto) arr.push({type:'evento',id,obj:e,title:e.titulo||'',extra:[e.desc,e.nombreOrg,e.organizador,e.ig,e.lugar,e.wpOrg].join(' ')}); });
  return arr;
}
function aiBestV3312(q,types){
  const n=normAI(q); const terms=aiImportantTermsV3312(n); if(!terms.length) return null;
  let best=null;
  aiItemsV3312(types).forEach(it=>{
    const title=normAI(it.title), extra=normAI(it.extra);
    let titleHits=0, extraHits=0;
    terms.forEach(t=>{ if(termHitAI(title,t)) titleHits++; else if(termHitAI(extra,t)) extraHits++; });
    let score=titleHits*25 + extraHits*3;
    if(types && types.length===1) score+=2;
    if(score>0 && (!best || score>best.score)) best={...it,score,titleHits,extraHits,terms};
  });
  return best && (best.titleHits>0 || best.score>=8) ? best : null;
}
function aiKnowledgeStrongV3312(q,mode){
  const n=normAI(q); const terms=aiImportantTermsV3312(n);
  let best=null;
  asistenteKnowledgeEntries().forEach(([id,k])=>{
    const keyText=[k.titulo||'',k.keys||'',k.command||''].join(' ');
    const all=[keyText,k.respuesta||''].join(' ');
    let score=0;
    if(mode==='profes'){
      const keyNorm=normAI(keyText);
      const hasProf = /(^|\s)(profesor|profesora|profesores|profe|profes|docente|docentes)(\s|$)/.test(keyNorm);
      const hasAcademia = /(^|\s)(academia|modelaje|materias)(\s|$)/.test(keyNorm) || /profesores de la academia|profes del curso de modelaje/.test(keyNorm);
      if(hasProf) score += 40; if(hasAcademia) score += 25;
    }
    terms.forEach(t=>{ if(aiHasTokenV3312(keyText,t)) score+=12; else if(termHitAI(normAI(all),t)) score+=2; });
    if(score>0 && (!best || score>best.score)) best={id,k,score};
  });
  return best && best.score>=25 ? best : null;
}
function aiDetailV3312(m){
  if(!m) return '';
  if(m.type==='curso') return detalleCursoAI(m.obj)+'\n#info:curso:'+m.id+'#';
  if(m.type==='servicio') return detalleServicioAI(m.obj)+'\n#info:servicio:'+m.id+'#';
  if(m.type==='evento') return detalleEventoAI(m.obj)+'\n#info:evento:'+m.id+'#';
  return '';
}

// Contacto con Javier: enlace directo si piden comunicarse/contacto.
const __buscarRespuestaAsistente_v3312_prev = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q=normAI(text||''); window._lastAiSuggestions=[]; window._lastAiSection=''; if(!q) return '';

  if(/(contactar|contactarme|comunicarme|comunicar|whatsapp|telefono|numero|hablar)/.test(q) && /(javier|dueno|dueño|mottola|tomauno|ustedes|contacto)/.test(q)){
    return '💬 **Contacto directo de Javier / Tomauno**\nPodés escribir por WhatsApp: https://wa.me/5493764354522?text=Hola%20Javier%2C%20vengo%20de%20la%20web%20Tomauno%20y%20quiero%20continuar%20mi%20consulta.';
  }
  if(/(direccion|ubicacion|ubicación|donde queda|mapa|maps)/.test(q)){
    window._lastAiSection='sec-ubicacion';
    return '📍 **Dirección del estudio**\nPedro Méndez 2069, Posadas, Misiones.\n\n🗺️ Google Maps: https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu\n#ubicacion';
  }
  if(aiIsGeneralListV3312(q,'curso')){ window._lastAiSection='sec-cursos'; return (typeof listaCursosAI_v339==='function'?listaCursosAI_v339():listaCursosAI('')); }
  if(aiIsGeneralListV3312(q,'servicio')){ window._lastAiSection='sec-servicios'; return (typeof listaServiciosAI_v339==='function'?listaServiciosAI_v339():listaServiciosAI('')); }
  if(aiIsGeneralListV3312(q,'evento')){ window._lastAiSection='sec-eventos'; return (typeof listaEventosAI_v339==='function'?listaEventosAI_v339():listaEventosAI()); }

  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|responsable|organizador|organiza|quien da|quien dicta)/.test(q)){
    const brain=aiKnowledgeStrongV3312(q,'profes');
    if(brain) return applyAIVariables(brain.k.respuesta||'', chatsDB[currentOpenChatId]||{});
    const ent=aiBestV3312(q,['curso','servicio','evento']);
    if(ent){ window._lastAiSection=ent.type==='curso'?'sec-cursos':ent.type==='servicio'?'sec-servicios':'sec-eventos'; return contactoEntidadAI(ent); }
    return 'Para decirte quién es el profesor, disertante u organizador necesito saber de qué curso, taller, servicio o evento me hablás. ¿Cuál te interesa?';
  }

  if(/(curso|cursos|capacitacion|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q)){
    const m=aiBestV3312(q,['curso']); if(m){ window._lastAiSection='sec-cursos'; return aiDetailV3312(m); }
    window._lastAiSection='sec-cursos'; return (typeof listaCursosAI_v339==='function'?listaCursosAI_v339():listaCursosAI(''));
  }
  if(/(servicio|servicios|sesion|sesiones|book|books|portfolio|alquiler|trabajos|propuestas)/.test(q)){
    const m=aiBestV3312(q,['servicio']); if(m){ window._lastAiSection='sec-servicios'; return aiDetailV3312(m); }
    window._lastAiSection='sec-servicios'; return (typeof listaServiciosAI_v339==='function'?listaServiciosAI_v339():listaServiciosAI(''));
  }
  if(/(evento|eventos|danzaterapia|decoracion|manualidades)/.test(q)){
    const m=aiBestV3312(q,['evento']); if(m){ window._lastAiSection='sec-eventos'; return aiDetailV3312(m); }
    window._lastAiSection='sec-eventos'; return (typeof listaEventosAI_v339==='function'?listaEventosAI_v339():listaEventosAI());
  }
  return __buscarRespuestaAsistente_v3312_prev(text);
};

// Evitar que “quiero contactarme con el dueño” active la ruta de pedir datos: primero contestamos contacto directo.
const __quiereHablarConJavierAI_v3312 = quiereHablarConJavierAI;
quiereHablarConJavierAI = function(text){
  const q=normAI(text||'');
  if(/(contactar|contactarme|comunicarme|whatsapp|telefono|numero)/.test(q) && /(javier|dueno|dueño|mottola|tomauno|ustedes)/.test(q)) return false;
  return __quiereHablarConJavierAI_v3312(text);
};

// Botones de acción: deduplicar por sección/tipo, y Info siempre operativo.
chatActionButtonsForMessage = function(text){
  const t=normAI(text||'');
  let btns=parseChatActions(text||[]);
  if((t.includes('cursos activos')||t.includes('seccion cursos')||t.includes('ver cursos')) && !btns.some(b=>b.sec==='sec-cursos')) btns.push({label:'🎓 Ver cursos',sec:'sec-cursos'});
  if((t.includes('eventos activos')||t.includes('seccion eventos')||t.includes('ver eventos')) && !btns.some(b=>b.sec==='sec-eventos')) btns.push({label:'🎪 Ver eventos',sec:'sec-eventos'});
  if((t.includes('servicios activos')||t.includes('servicios disponibles')||t.includes('seccion servicios')||t.includes('ver servicios')) && !btns.some(b=>b.sec==='sec-servicios')) btns.push({label:'📷 Ver servicios',sec:'sec-servicios'});
  if((t.includes('direccion del estudio')||t.includes('pedro mendez')) && !btns.some(b=>b.sec==='sec-ubicacion')) btns.push({label:'📍 Ver ubicación',sec:'sec-ubicacion'});
  const seen=new Set();
  btns=btns.filter(b=>{const k=b.url || (b.fn+':'+b.type+':'+b.id) || b.sec || b.label; if(seen.has(k)) return false; seen.add(k); return true;});
  if(!btns.length) return '';
  return '<div class="chat-action-row">'+btns.map(b=>{
    if(b.url) return '<button class="chat-action-btn" onclick="window.open(\''+b.url+'\',\'_blank\')">'+b.label+'</button>';
    if(b.fn) return '<button class="chat-action-btn" onclick="window.executeChatAction(\''+b.fn+'\',\''+b.type+'\',\''+String(b.id).replace(/'/g,"\\'")+'\')">'+b.label+'</button>';
    return '<button class="chat-action-btn" onclick="window.chatGoToSection(\''+b.sec+'\')">'+b.label+'</button>';
  }).join('')+'</div>';
};

// Ejecutar Info/Inscripción con pequeña demora para que el usuario vea el mensaje primero.
executeChatAction = function(fn,type,id){
  setTimeout(()=>{
    try{
      if(type==='curso'){
        if(fn==='inscripcion' && window.abrirInscripcion) window.abrirInscripcion(id); else if(window.abrirDetalle) window.abrirDetalle(id);
      }else if(type==='servicio'){
        if(window.abrirServicioDB) window.abrirServicioDB(id); else navScroll('sec-servicios');
      }else if(type==='evento'){
        if(fn==='inscripcion' && window.abrirInscEvento) window.abrirInscEvento(id); else if(window.abrirDetalleEvento) window.abrirDetalleEvento(id); else navScroll('sec-eventos');
      }
    }catch(e){console.warn('executeChatAction v33.12',e);}
  },90);
};

// Búsqueda pública: si hay coincidencia en TÍTULO, mostrar solo títulos. Evita que “fotografía” traiga modelaje por descripción/flyer.
window.filterCursos = function(){
  const inp=document.getElementById('course-search'); const qRaw=inp?.value||''; const q=normAI(qRaw); const cl=document.getElementById('search-clear'); const info=document.getElementById('search-info'); if(cl) cl.style.display=q?'block':'none';
  const cCards=[...document.querySelectorAll('.ccard')];
  const eCards=[...document.querySelectorAll('#eventos-grid .ev-card')];
  const cTitleMatches=cCards.filter(card=>{const id=card.dataset.id; const title=normAI(cursos?.[id]?.titulo || card.querySelector('.ctitle')?.textContent || ''); return q && title.includes(q);});
  const eTitleMatches=eCards.filter(card=>{const title=normAI(card.querySelector('.ctitle')?.textContent || ''); return q && title.includes(q);});
  const useTitleOnly= q && (cTitleMatches.length || eTitleMatches.length);
  let curVis=0, evVis=0;
  cCards.forEach(card=>{const id=card.dataset.id; const title=normAI(cursos?.[id]?.titulo || card.querySelector('.ctitle')?.textContent || ''); const txt=normAI((card.dataset.search||'')+' '+card.textContent); const match=!q || (useTitleOnly?title.includes(q):txt.includes(q)); card.style.display=match?'':'none'; if(match) curVis++;});
  eCards.forEach(card=>{const title=normAI(card.querySelector('.ctitle')?.textContent || ''); const txt=normAI((card.dataset.search||'')+' '+card.textContent); const match=!q || (useTitleOnly?title.includes(q):txt.includes(q)); card.style.display=match?'':'none'; if(match) evVis++;});
  if(info){ if(!q) info.textContent=''; else if(curVis&&evVis) info.textContent=(curVis+evVis)+' resultados para "'+qRaw+'"'; else if(curVis) info.textContent=curVis+' resultado'+(curVis!==1?'s':'')+' en cursos para "'+qRaw+'"'; else if(evVis) info.textContent=evVis+' resultado'+(evVis!==1?'s':'')+' en eventos para "'+qRaw+'"'; else info.textContent='0 resultados para "'+qRaw+'"'; }
  if(q && curVis===0 && evVis>0){ setTimeout(()=>document.getElementById('sec-eventos')?.scrollIntoView({behavior:'smooth',block:'start'}),140); }
};

// Deep link: /#chat, /#consulta o /#asistente abre el chat automáticamente.
(function(){
  function openHashChat(){ const h=String(location.hash||'').toLowerCase(); if(h==='#chat'||h==='#consulta'||h==='#asistente') setTimeout(()=>document.getElementById('chat-fab')?.click(),900); }
  window.addEventListener('hashchange', openHashChat); window.addEventListener('load', openHashChat); setTimeout(openHashChat,1200);
})();



/* =====================================================================
   v33.18 — JS mínimo: Resumen WhatsApp visible, logout ADM real,
   comandos manuales #ubicacion/#cursos/#servicios y limpieza de iconos.
   ===================================================================== */
(function(){
  function stripLeadingEmojis(label){
    return String(label||'')
      .replace(/^(?:\s|[\uFE0F\u200D]|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}])+/u,'')
      .trim() || String(label||'').trim();
  }
  try{
    quickReplyLabelText = function(label){ return stripLeadingEmojis(label); };
  }catch(e){}

  function currentChatIdFromDom(){
    return currentOpenChatId || '';
  }
  function fmtLine(label, value){
    value = String(value||'').trim();
    return value ? (label + value) : '';
  }
  window.generarResumenWhatsAppChat = function(id){
    id = id || currentChatIdFromDom();
    const c = chatsDB && chatsDB[id];
    if(!c){ toast('No hay chat activo para resumir'); return; }
    const msgs = chatMsgs(c).slice(-12).map(([,m]) => {
      const who = m.from === 'user' ? 'Usuario' : (m.from === 'admin' ? 'Tomauno' : 'Sistema');
      return '• ' + who + ': ' + String(m.text||'').replace(/\s+/g,' ').trim();
    }).filter(Boolean);
    const firstUser = chatMsgs(c).find(([,m]) => m.from === 'user')?.[1]?.text || '';
    const tema = c.temaPrincipal || detectarTemaConsulta(firstUser || c.lastMsg || '');
    const resumen = [
      '📌 *Consulta web Tomauno*',
      '',
      fmtLine('👤 *Nombre:* ', chatVisibleName(c,id)),
      fmtLine('📱 *WhatsApp:* ', c.wp || '-'),
      fmtLine('🕒 *Última actividad:* ', chatFullDate(c.updatedAt || c.createdAt)),
      fmtLine('📍 *Estado:* ', c.status || 'abierto'),
      fmtLine('🎯 *Interés detectado:* ', tema || '-'),
      fmtLine('💬 *Último mensaje:* ', c.lastMsg || '-'),
      '',
      '🧾 *Resumen de conversación:*',
      msgs.join('\n') || 'Sin mensajes registrados.'
    ].filter(x => x !== '').join('\n');
    copiarTextoChat(resumen);
    toast('📋 Resumen copiado para WhatsApp', true);
    const wp = String(c.wp||'').replace(/\D/g,'');
    if(wp){
      showConfirm('Resumen copiado. ¿Abrir WhatsApp del contacto para pegarlo?', () => {
        window.open('https://wa.me/549'+wp+'?text='+encodeURIComponent(resumen), '_blank');
      });
    }
  };

  function ensureResumenButton(){
    const id = currentChatIdFromDom();
    const actions = document.querySelector('#chat-popover.open .chat-admin-actions');
    if(!actions || !id || actions.querySelector('[data-action="resumen-wa"]')) return;
    const btn = document.createElement('button');
    btn.className = 'btn-out';
    btn.type = 'button';
    btn.title = 'Resumen para WhatsApp';
    btn.dataset.action = 'resumen-wa';
    btn.innerHTML = '<span class="ico">🧾</span>';
    btn.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); window.generarResumenWhatsAppChat(id); };
    const copyBtn = actions.querySelector('[title="Copiar conversación"]');
    if(copyBtn && copyBtn.nextSibling) actions.insertBefore(btn, copyBtn.nextSibling); else actions.insertBefore(btn, actions.firstChild);
  }

  const __abrirChatAdmin_v3318 = window.abrirChatAdmin;
  window.abrirChatAdmin = function(id, silent){
    const r = __abrirChatAdmin_v3318.call(this,id,silent);
    setTimeout(ensureResumenButton, 30);
    setTimeout(ensureResumenButton, 180);
    return r;
  };
  const __setChatPopover_v3318 = setChatPopover;
  setChatPopover = function(html){
    const r = __setChatPopover_v3318.apply(this, arguments);
    setTimeout(ensureResumenButton, 40);
    return r;
  };

  window.logoutAdminRealTomauno = async function(){
    try{ await update(ref(db,'tomauno/status'), {adminOnline:false, adminLast:Date.now()}); }catch(e){}
    adminOk = false;
    window._adminWasActive = false;
    try{ localStorage.removeItem('tomauno-admin-notify'); }catch(e){}
    try{ document.getElementById('chat-popover')?.classList.remove('open','expanded'); }catch(e){}
    try{ toggleAdmin(false); }catch(e){ window.cerrarAdmin && window.cerrarAdmin(); }
    updateAdminLiveIndicator();
    toast('🔒 Sesión admin cerrada', true);
  };
  function bindAdmLogout(){
    const el = document.getElementById('admin-live-indicator');
    if(!el || el.dataset.logoutBound) return;
    el.dataset.logoutBound = '1';
    el.title = 'Cerrar sesión admin';
    el.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      showConfirm('¿Cerrar sesión admin y volver a pedir PIN?', () => window.logoutAdminRealTomauno());
    }, true);
  }
  bindAdmLogout();
  setInterval(bindAdmLogout, 2000);

  const commandMap = {
    '#ubicacion':'📍 *Dirección del estudio*\nPedro Méndez 2069, Posadas, Misiones.\n\n🗺️ Google Maps: Abrir Google Maps #ubicacion#',
    '#cursos':'🎓 En la sección CURSOS podés ver las capacitaciones disponibles. #cursos#',
    '#servicios':'📷 En la sección SERVICIOS podés ver sesiones, books, retratos y producción. #servicios#',
    '#instagram':'📱 Nuestros Instagram son:\n@tomaunoestudio\n@tomaunomodels\n@tomaunocapacitaciones',
    '#whatsapp':'💬 También podés escribir directo por WhatsApp: Abrir WhatsApp'
  };
  const __enviarChatAdmin_v3318 = window.enviarChatAdmin;
  window.enviarChatAdmin = function(id, presetText){
    const inp = document.getElementById('chat-admin-text');
    if(!presetText && inp){
      const raw = String(inp.value||'').trim().toLowerCase();
      if(commandMap[raw]) inp.value = commandMap[raw];
    }
    return __enviarChatAdmin_v3318.apply(this, arguments);
  };
})();



/* =====================================================================
   v33.19 — UX conversacional: confirm compacto, notificaciones por actividad,
   nombre automático, resumen breve y lógica humana menos invasiva.
   ===================================================================== */
(function(){
  // 1) Confirmaciones más chicas y con botones claros: NO / SÍ.
  showConfirm = function(msg, onOk){
    const box = document.getElementById('mcontent');
    if(!box) return;
    box.innerHTML =
      '<div style="text-align:center;padding:2px 0 4px;max-width:360px;margin:0 auto;">' +
      '<div style="font-size:24px;margin-bottom:8px;">⚠️</div>' +
      '<div class="mtitle" style="font-size:20px;margin-bottom:8px;line-height:1;">Confirmar</div>' +
      '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;line-height:1.45;">' + escHtml(String(msg||'')) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      '<button class="btn-out" onclick="window.closeModal()" style="margin:0;padding:11px 12px;">No</button>' +
      '<button class="btn-main" id="confirm-ok-btn" style="margin:0;padding:11px 12px;">Sí</button>' +
      '</div></div>';
    openModal();
    const modal = document.querySelector('#moverlay .mbox');
    if(modal){ modal.style.maxWidth='420px'; modal.style.padding='24px 22px 26px'; }
    const ok = document.getElementById('confirm-ok-btn');
    if(ok) ok.onclick = () => { closeModal(); if(typeof onOk === 'function') onOk(); };
  };

  const __closeModal_v3319 = window.closeModal;
  window.closeModal = function(){
    try{ const modal = document.querySelector('#moverlay .mbox'); if(modal){ modal.style.maxWidth=''; modal.style.padding=''; } }catch(e){}
    return __closeModal_v3319.apply(this, arguments);
  };

  // 2) Notificaciones por MENSAJE nuevo, no solo por chat nuevo.
  let chatNotifyFirstLoad = true;
  let chatNotifySeen = (()=>{ try{return JSON.parse(localStorage.getItem('tomauno-chat-activity-seen')||'{}');}catch(e){return {};}})();
  function lastUserMessageInfo(c){
    const users = chatMsgs(c).filter(([,m]) => m && m.from === 'user' && !m.typing);
    if(!users.length) return {ts:0, text:''};
    const [,m] = users[users.length-1];
    return {ts:Number(m.createdAt || 0), text:String(m.text || '')};
  }
  onValue(ref(db,'tomauno/chats'), snap => {
    const data = snap.exists() ? snap.val() : {};
    const entries = Object.entries(data).filter(([,c]) => isValidChat(c));
    const fab = document.getElementById('chat-fab');
    const pending = entries.filter(([,c]) => c && c.status !== 'cerrado' && c.unreadAdmin);
    if(fab) fab.classList.toggle('has-new', isAdminNotifier() && pending.length > 0);

    if(chatNotifyFirstLoad){
      entries.forEach(([id,c]) => { const info = lastUserMessageInfo(c); chatNotifySeen[id] = Math.max(Number(chatNotifySeen[id]||0), info.ts || Number(c.updatedAt||0)); });
      try{ localStorage.setItem('tomauno-chat-activity-seen', JSON.stringify(chatNotifySeen)); }catch(e){}
      chatNotifyFirstLoad = false;
      return;
    }
    if(!isAdminNotifier()) return;

    const changed = pending
      .map(([id,c]) => ({id,c,info:lastUserMessageInfo(c)}))
      .filter(x => x.info.ts && x.info.ts > Number(chatNotifySeen[x.id]||0))
      .sort((a,b)=>b.info.ts-a.info.ts);
    if(!changed.length) return;
    const item = changed[0];
    changed.forEach(x => { chatNotifySeen[x.id] = x.info.ts; });
    try{ localStorage.setItem('tomauno-chat-activity-seen', JSON.stringify(chatNotifySeen)); }catch(e){}

    notifyAdminChat('Nuevo mensaje web', chatVisibleName(item.c,item.id) + ': ' + (item.info.text || 'Escribió desde la web'), item.id);
    try{
      const pop = document.getElementById('chat-popover');
      if(!pop || !pop.classList.contains('open')) setTimeout(()=>window.abrirChatAdmin && window.abrirChatAdmin(item.id), 120);
    }catch(e){}
  });

  // 3) Detección de nombre más amplia + respuesta breve de confirmación.
  function capName(n){
    return String(n||'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean).map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()).join(' ');
  }
  function detectNameV3319(text){
    const raw = String(text||'').trim().replace(/[.!?]+$/,'');
    if(!raw || extraerWhatsappAI(raw)) return '';
    const m = raw.match(/^(?:hola[,\s]*)?(?:mi\s+nombre\s+es|me\s+llamo|soy|me\s+dicen|nombre\s+es)\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,3})$/i);
    if(!m) return '';
    const n = capName(limpiarNombreChat(m[1]));
    if(!n || n.length < 2) return '';
    if(/^(Si|Sí|Ok|Dale|Bueno|Perfecto|Claro|Gracias|Quiero|Consulta|Web|Whatsapp|Telefono|Javier)$/i.test(n)) return '';
    return n;
  }
  extraerNombreAI = function(text){ return detectNameV3319(text); };

  const __enviarChatVisitante_v3319 = window.enviarChatVisitante;
  window.enviarChatVisitante = async function(id){
    const inp = document.getElementById('chat-text');
    const pendingText = String(inp?.value || '').trim();
    const detected = detectNameV3319(pendingText);
    const before = chatsDB?.[id] || {};
    const hadRealName = tieneNombreRealChat(before);
    const res = await __enviarChatVisitante_v3319.apply(this, arguments);
    if(detected){
      try{
        await update(ref(db,'tomauno/chats/'+id), {name:detected, updatedAt:Date.now()});
        try{ sessionStorage.setItem('tomauno-chat-name', detected); }catch(e){}
        if(!hadRealName || chatVisibleName(before,id) !== detected){
          await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'admin', text:'Genial, '+detected+' 😊 Ya agendé tu nombre.', time:chatTime(), createdAt:Date.now(), auto:true});
          await update(ref(db,'tomauno/chats/'+id), {lastMsg:'Nombre agendado: '+detected, unreadVisitor:true, updatedAt:Date.now()});
        }
      }catch(e){}
    }
    return res;
  };

  // 4) Si el usuario pidió Javier, pero luego pregunta por servicios/cursos/etc., no insistir con datos.
  const __manejarDatosHumanosPendientes_v3319 = manejarDatosHumanosPendientes;
  manejarDatosHumanosPendientes = async function(chatId, chat, userText){
    const q = normAI(userText||'');
    if(/\b(no|no gracias|despues|más tarde|mas tarde)\b/.test(q)){
      await update(ref(db,'tomauno/chats/'+chatId), {humanRequested:false, prioridad:false, updatedAt:Date.now()});
      return 'Perfecto, seguimos por acá 😊 Decime si querés ver cursos, servicios, ubicación o contacto.';
    }
    if(/(mostra|mostrar|ver|quiero|pasame|pasar|info|informacion).*(servicio|sesion|sesiones|book|foto|fotos)/.test(q) || /\bservicios\b/.test(q)){
      return 'Claro 😊 Te dejo la sección de servicios para que veas las opciones disponibles. #servicios#';
    }
    if(/(mostra|mostrar|ver|quiero|pasame|pasar|info|informacion).*(curso|cursos|capacitacion|capacitaciones|workshop|taller)/.test(q) || /\bcursos\b/.test(q)){
      return 'Claro 😊 Te dejo la sección de cursos disponibles. #cursos#';
    }
    if(/(ubicacion|ubicación|direccion|dirección|donde queda|mapa)/.test(q)){
      return '📍 Estamos en Pedro Méndez 2069, Posadas, Misiones. #ubicacion#';
    }
    return __manejarDatosHumanosPendientes_v3319.apply(this, arguments);
  };

  // 5) Resumen WA realmente breve: no copia toda la charla.
  window.generarResumenWhatsAppChat = function(id){
    id = id || currentOpenChatId || '';
    const c = chatsDB && chatsDB[id];
    if(!c){ toast('No hay chat activo para resumir'); return; }
    const msgs = chatMsgs(c).filter(([,m]) => m && !m.typing);
    const userMsgs = msgs.filter(([,m]) => m.from === 'user').map(([,m]) => String(m.text||'').trim()).filter(Boolean);
    const firstUser = userMsgs[0] || '';
    const lastUser = userMsgs[userMsgs.length-1] || c.lastMsg || '';
    const tema = c.temaPrincipal || detectarTemaConsulta((firstUser + ' ' + lastUser).trim());
    const resumenConversacion = [];
    if(firstUser) resumenConversacion.push('• Consulta inicial: ' + firstUser.replace(/\s+/g,' ').slice(0,180));
    if(lastUser && lastUser !== firstUser) resumenConversacion.push('• Último mensaje del usuario: ' + lastUser.replace(/\s+/g,' ').slice(0,180));
    if(c.humanRequested) resumenConversacion.push('• Estado: requiere respuesta personal de Javier.');
    if(!resumenConversacion.length) resumenConversacion.push('• Sin mensajes relevantes todavía.');
    const resumen = [
      '📌 *Consulta web Tomauno*','',
      '👤 *Nombre:* ' + chatVisibleName(c,id),
      '📱 *WhatsApp:* ' + (c.wp || '-'),
      '🕒 *Última actividad:* ' + (chatFullDate(c.updatedAt || c.createdAt) || '-'),
      '🎯 *Interés detectado:* ' + (tema || '-'),
      '💬 *Resumen:*',
      resumenConversacion.join('\n')
    ].join('\n');
    copiarTextoChat(resumen);
    toast('📋 Resumen breve copiado', true);
    const wp = String(c.wp||'').replace(/\D/g,'');
    if(wp){
      showConfirm('Resumen copiado. ¿Abrir WhatsApp del contacto?', () => window.open('https://wa.me/549'+wp+'?text='+encodeURIComponent(resumen), '_blank'));
    }
  };

  // 6) Asegurar que el botón Resumen exista aunque el chat se re-renderice.
  function ensureResumenBtnV3319(){
    const id = currentOpenChatId || '';
    const actions = document.querySelector('#chat-popover.open .chat-admin-actions');
    if(!actions || !id || actions.querySelector('[data-action="resumen-wa"]')) return;
    const btn = document.createElement('button');
    btn.className = 'btn-out'; btn.type = 'button'; btn.title = 'Resumen para WhatsApp'; btn.dataset.action = 'resumen-wa';
    btn.innerHTML = '<span class="ico">🧾</span>';
    btn.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); window.generarResumenWhatsAppChat(id); };
    actions.insertBefore(btn, actions.children[2] || actions.firstChild);
  }
  setInterval(ensureResumenBtnV3319, 1200);
  setTimeout(ensureResumenBtnV3319, 200);
})();



/* =====================================================================
   v33.20 — Ajuste fino conversación + notificaciones + resumen útil.
   - No toca Firebase/imports.
   - Corrige atención humana invasiva, saludos, nombre inmediato,
     resumen WA, notificaciones por ventana de atención y toolbar fullscreen.
   ===================================================================== */
(function(){
  const TEN_MIN = 10 * 60 * 1000;
  const nowTs = () => Date.now();

  function qnorm(t){ try{return normAI(t||'');}catch(e){return String(t||'').toLowerCase();} }
  function isSimpleGreetingV3320(text){
    const q = qnorm(text).replace(/[!.¡¿?]+/g,'').trim();
    return /^(hola|buen dia|buen día|buenas|buenas tardes|buenas noches|hey|holaa|hola buenas|hola buen dia|hola buen día)$/.test(q);
  }
  function saludoRespuestaV3320(text, chat){
    const q = qnorm(text);
    let saludo = 'Hola';
    if(/buenas noches/.test(q)) saludo = 'Buenas noches';
    else if(/buenas tardes/.test(q)) saludo = 'Buenas tardes';
    else if(/buen dia|buen día/.test(q)) saludo = 'Buen día';
    const n = chat && tieneNombreRealChat(chat) ? chatVisibleName(chat, currentOpenChatId || '') : '';
    return saludo + (n ? ', ' + n : '') + ' 😊 ¿En qué puedo ayudarte?';
  }
  function wantsOwnerHumanV3320(text){
    const q = qnorm(text);
    return /(hablar|comunicarme|contactarme|contactar|escribir|consultar).{0,35}(javier|dueño|dueno|encargado|responsable de tomauno|humano|persona)/.test(q) ||
           /(javier|dueño|dueno|encargado).{0,35}(hablar|contact|comunicar|responder)/.test(q);
  }
  function wantsSpecificTeacherContactV3320(text){
    const q = qnorm(text);
    return /(contact|hablar|comunicar|escribir|whatsapp|telefono|teléfono|numero|número).{0,45}(profesor|profesora|profe|docente|disertante|organizador|responsable)/.test(q) ||
           /(profesor|profesora|profe|docente|disertante|organizador|responsable).{0,45}(contact|whatsapp|telefono|teléfono|numero|número|hablar|comunicar)/.test(q);
  }
  function cleanInvasiveHumanTextV3320(resp, userText){
    if(wantsOwnerHumanV3320(userText)) return resp;
    let r = String(resp||'');
    // Si alguna respuesta vieja insiste en marcar para Javier sin que lo pidan,
    // no la mostramos: la reemplazamos por una guía neutral.
    if(/(voy dejando|dejo tu consulta|consulta marcada|marcada para Javier|Javier pueda responderte|dejame tu WhatsApp)/i.test(r)){
      return 'Puedo ayudarte con cursos, servicios, eventos, ubicación, Instagram y WhatsApp 😊\n\nDecime qué querés ver y te paso la información más directa.';
    }
    return r;
  }

  // Contacto humano SOLO por intención explícita de hablar con Javier/dueño/encargado.
  quiereHablarConJavierAI = function(text){ return wantsOwnerHumanV3320(text); };

  const __respuestaAtencionHumana_v3320 = respuestaAtencionHumanaAI;
  respuestaAtencionHumanaAI = function(chat, userText){
    if(!wantsOwnerHumanV3320(userText)) return cleanInvasiveHumanTextV3320(__respuestaAtencionHumana_v3320(chat,userText), userText);
    const tema = temaDesdeHistorialAI(chat, userText) || chat?.temaPrincipal || detectarTemaConsulta(userText) || '';
    const faltaNombre = !tieneNombreRealChat(chat);
    const faltaWp = !tieneWhatsAppChat(chat);
    let txt = 'Claro 😊 ¿Querés que deje tu consulta marcada para que Javier te responda personalmente?';
    if(tema) txt += '\n\nTema detectado: **' + tema + '**.';
    const faltan = [];
    if(faltaNombre) faltan.push('tu nombre');
    if(faltaWp) faltan.push('tu WhatsApp');
    if(faltan.length) txt += '\n\nSi respondés **Sí**, también dejame ' + faltan.join(' y ') + ' para que pueda ubicar tu consulta.';
    txt += '\n\nPodés responder: **Sí** o **No**.';
    return txt;
  };

  // Reemplazo controlado del automático: evita “Javier” salvo pedido explícito,
  // entiende saludos y diferencia contacto general/profesor.
  responderAutomaticoChat = async function(chatId, userText){
    try{
      let modo = asistenteModo();
      try{ const modoSnap = await get(ref(db,'tomauno/asistente/modo')); if(modoSnap.exists()) modo = modoSnap.val(); }catch(e){}
      if(modo !== 'automatico') return;

      let chat = chatsDB?.[chatId] || {};
      try{ const chatSnap = await get(ref(db,'tomauno/chats/'+chatId)); if(chatSnap.exists()) chat = chatSnap.val(); }catch(e){}

      const q = qnorm(userText);
      if(!q) return;

      let respuesta = '';
      let pendingTopics = [];

      if(isSimpleGreetingV3320(userText)){
        respuesta = saludoRespuestaV3320(userText, chat);
      } else if(wantsSpecificTeacherContactV3320(userText)){
        const match = bestPublishedTitleMatchAI(userText);
        if(match){
          respuesta = contactoEntidadAI(match);
          if(match.type==='curso') window._lastAiSection='sec-cursos';
          if(match.type==='servicio') window._lastAiSection='sec-servicios';
          if(match.type==='evento') window._lastAiSection='sec-eventos';
        } else {
          respuesta = 'Claro 😊 ¿De qué curso, taller, evento o servicio querés el contacto?\n\nAsí te paso el dato correcto y no te mareo con información que no corresponde.';
        }
      } else if(wantsOwnerHumanV3320(userText)){
        respuesta = respuestaAtencionHumanaAI(chat, userText);
        await update(ref(db,'tomauno/chats/'+chatId), {
          updatedAt:nowTs(), status:'abierto-auto', humanRequested:true, prioridad:true,
          temaPrincipal: temaDesdeHistorialAI(chat, userText) || detectarTemaConsulta(userText)
        });
      } else {
        const lastAuto = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
        // Si la última pregunta del asistente fue “Sí/No” para Javier y dice No, cancelamos.
        if(lastAuto && /consulta marcada para que Javier|responder: \*\*Sí\*\* o \*\*No\*\*/i.test(String(lastAuto[1].text||'')) && /^(no|no gracias|por ahora no)$/i.test(q)){
          await update(ref(db,'tomauno/chats/'+chatId), {humanRequested:false, prioridad:false, updatedAt:nowTs()});
          respuesta = 'Perfecto 😊 Seguimos por acá. Decime si querés ver cursos, servicios, ubicación o contacto.';
        } else {
          const picked = pickPendingTopicAI(chat, q);
          if(picked){ respuesta = picked.respuesta || ''; pendingTopics = []; }
          else { respuesta = buscarRespuestaAsistente(userText); pendingTopics = Array.isArray(window._lastAiSuggestions) ? window._lastAiSuggestions : []; }
          respuesta = cleanInvasiveHumanTextV3320(respuesta, userText);
        }
      }

      if(!respuesta) return;
      respuesta = applyAIVariables(respuesta, chat);

      const lastAuto2 = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
      if(lastAuto2 && qnorm(lastAuto2[1].text||'') === qnorm(respuesta)){
        respuesta = 'Claro 😊 Te lo vuelvo a orientar mejor. ¿Querés que te muestre cursos, servicios, ubicación o contacto? También podés contarme puntualmente qué necesitás y te ayudo.';
      }
      if(qnorm(chat.lastAutoUserText || '') === q && (nowTs() - Number(chat.lastAutoAt || 0)) < 10000) return;

      const typingRef = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno está escribiendo', time:chatTime(), createdAt:nowTs(), typing:true});
      await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:nowTs(), lastMsg:'Tomauno está escribiendo...', status:'abierto'});
      await new Promise(r=>setTimeout(r, Math.min(1500, Math.max(500, String(respuesta).length * 8))));
      try{ await remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+typingRef.key)); }catch(e){}
      await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'admin', text:respuesta, time:chatTime(), createdAt:nowTs(), auto:true});
      try{
        const sec = window._lastAiSection || '';
        window._lastAiSection = '';
        if(sec && typeof navScroll === 'function') setTimeout(() => navScroll(sec), 450);
      }catch(e){}
      await update(ref(db,'tomauno/chats/'+chatId), {
        updatedAt:nowTs(), lastMsg:cleanChatDisplayText(respuesta), status:'abierto-auto',
        unreadVisitor:true, unreadAdmin:true, temaPrincipal:detectarTemaConsulta(userText),
        pendingTopics, lastAutoUserText:userText, lastAutoAt:nowTs()
      });
    }catch(e){ console.error('Asistente automático v33.20:', e); }
  };

  // Nombre instantáneo: si dice “me llamo / mi nombre es / soy”, cambia local + Firebase + título inmediatamente.
  function capNameV3320(n){ return String(n||'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean).map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()).join(' '); }
  function detectNameAnyV3320(text){
    const raw = String(text||'').trim().replace(/[.!?]+$/,'');
    if(!raw || extraerWhatsappAI(raw)) return '';
    const m = raw.match(/^(?:hola[,\s]*)?(?:mi\s+nombre\s+es|me\s+llamo|soy|me\s+dicen|nombre\s+es)\s+([a-záéíóúñü]+(?:\s+[a-záéíóúñü]+){0,3})(?=\s*(?:,|\.|y\b|$))/i);
    if(!m) return '';
    const n = capNameV3320(limpiarNombreChat(m[1]));
    if(!n || n.length < 2 || /^(Si|Sí|Ok|Dale|Bueno|Perfecto|Claro|Gracias|Quiero|Consulta|Web|Whatsapp|Telefono|Javier)$/i.test(n)) return '';
    return n;
  }
  extraerNombreAI = function(text){ return detectNameAnyV3320(text); };

  window.enviarChatVisitante = async function(id){
    const inp = document.getElementById('chat-text');
    const text = inp?.value.trim();
    if(!text) return;
    inp.value=''; inp.focus();

    const existingChat = chatsDB?.[id] || {};
    const detectedName = detectNameAnyV3320(text) || isJustNameReply(text, existingChat);
    let fallbackName = '';
    try{ fallbackName = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}
    const finalName = limpiarNombreChat(detectedName || existingChat.name || fallbackName || chatAnonName(id, existingChat));

    // Actualización local inmediata para que el título no espere a cerrar/reabrir.
    try{
      chatsDB[id] = Object.assign({}, existingChat, {name: finalName, updatedAt:nowTs(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:nowTs()});
      if(currentOpenChatId === id){
        const t = document.querySelector('#chat-popover .chat-title');
        if(t) t.textContent = finalName.toUpperCase();
        const sub = document.querySelector('#chat-popover .chat-subline');
        if(sub) sub.innerHTML = 'WhatsApp: '+(chatsDB[id].wp || '—')+' · En línea ahora';
      }
    }catch(e){}

    await update(ref(db,'tomauno/chats/'+id), {name: finalName, status:'abierto', updatedAt:nowTs(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:nowTs()});
    await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'user', text, time:chatTime(), createdAt:nowTs()});
    try{ if(detectedName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}

    let queryForBot = text;
    if(detectedName){
      await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'admin', text:'Genial, '+detectedName+' 😊 Ya agendé tu nombre.', time:chatTime(), createdAt:nowTs(), auto:true});
      await update(ref(db,'tomauno/chats/'+id), {name:detectedName, lastMsg:'Nombre agendado: '+detectedName, unreadVisitor:true, updatedAt:nowTs()});
      queryForBot = stripNameFromMessageForAI(text, detectedName);
      if(!queryForBot || esSoloRespuestaNombre(text, existingChat)) return;
    }
    responderAutomaticoChat(id, queryForBot);
  };

  // Notificaciones: no avisar cada mensaje del chat activo; sí avisar otro chat o mismo chat tras 10 min.
  const __notifyAdminChat_v3320 = notifyAdminChat;
  const lastNotifyByChat = {};
  notifyAdminChat = function(title, body, chatId){
    const pop = document.getElementById('chat-popover');
    const isOpen = !!(pop && pop.classList.contains('open'));
    const sameActive = isOpen && chatId && currentOpenChatId === chatId;
    const last = Number(lastNotifyByChat[chatId || '_global'] || 0);
    const quiet = sameActive || (chatId && (nowTs() - last < TEN_MIN));
    if(quiet) return;
    lastNotifyByChat[chatId || '_global'] = nowTs();
    return __notifyAdminChat_v3320.apply(this, arguments);
  };

  let activitySeenV3320 = (()=>{ try{return JSON.parse(localStorage.getItem('tomauno-chat-activity-v3320')||'{}');}catch(e){return {};}})();
  let firstSnapV3320 = true;
  function lastUserTsV3320(c){
    const users = chatMsgs(c).filter(([,m]) => m && m.from === 'user' && !m.typing);
    if(!users.length) return Number(c?.updatedAt||0);
    return Number(users[users.length-1][1].createdAt || c?.updatedAt || 0);
  }
  onValue(ref(db,'tomauno/chats'), snap => {
    const data = snap.exists() ? snap.val() : {};
    const entries = Object.entries(data).filter(([,c])=>isValidChat(c));
    if(firstSnapV3320){ entries.forEach(([id,c])=>activitySeenV3320[id]=Math.max(Number(activitySeenV3320[id]||0),lastUserTsV3320(c))); firstSnapV3320=false; return; }
    if(!isAdminNotifier()) return;
    const changed = entries.map(([id,c])=>({id,c,ts:lastUserTsV3320(c)})).filter(x=>x.c.status!=='cerrado' && x.c.unreadAdmin && x.ts > Number(activitySeenV3320[x.id]||0)).sort((a,b)=>b.ts-a.ts);
    if(!changed.length) return;
    changed.forEach(x=>activitySeenV3320[x.id]=x.ts);
    try{ localStorage.setItem('tomauno-chat-activity-v3320', JSON.stringify(activitySeenV3320)); }catch(e){}
    const top = changed[0];
    const pop = document.getElementById('chat-popover');
    const closed = !pop || !pop.classList.contains('open');
    if(closed){ setTimeout(()=>window.abrirChatAdmin && window.abrirChatAdmin(top.id), 120); }
    // Si el mensaje viene de otro chat, avisar aunque estés en una conversación.
    if(closed || currentOpenChatId !== top.id || (nowTs()-Number(lastNotifyByChat[top.id]||0) > TEN_MIN)){
      notifyAdminChat('Nuevo mensaje web', chatVisibleName(top.c,top.id)+': '+(top.c.lastMsg||'Escribió desde la web'), top.id);
    }
  });

  // Resumen útil: tema + 3 primeros y 3 últimos mensajes del usuario.
  window.generarResumenWhatsAppChat = function(id){
    id = id || currentOpenChatId || '';
    const c = chatsDB && chatsDB[id];
    if(!c){ toast('No hay chat activo para resumir'); return; }
    const msgs = chatMsgs(c).filter(([,m]) => m && !m.typing);
    const userMsgs = msgs.filter(([,m]) => m.from === 'user').map(([,m]) => String(m.text||'').replace(/\s+/g,' ').trim()).filter(Boolean);
    const first = userMsgs.slice(0,3);
    const last = userMsgs.length > 6 ? userMsgs.slice(-3) : userMsgs.slice(3);
    const tema = c.temaPrincipal || detectarTemaConsulta(userMsgs.join(' '));
    const lines = [];
    if(first.length){ lines.push('• Primeros mensajes:'); first.forEach(x=>lines.push('  - '+x.slice(0,190))); }
    if(last.length){ lines.push('• Últimos mensajes:'); last.forEach(x=>lines.push('  - '+x.slice(0,190))); }
    if(c.humanRequested) lines.push('• Estado: requiere respuesta personal.');
    if(!lines.length) lines.push('• Sin mensajes relevantes todavía.');
    const resumen = [
      '📌 *Consulta web Tomauno*','',
      '👤 *Nombre:* ' + chatVisibleName(c,id),
      '📱 *WhatsApp:* ' + (c.wp || '-'),
      '🕒 *Última actividad:* ' + (chatFullDate(c.updatedAt || c.createdAt) || '-'),
      '🎯 *Tema detectado:* ' + (tema || '-'),
      '💬 *Resumen:*', lines.join('\n')
    ].join('\n');
    copiarTextoChat(resumen);
    toast('🧾 Resumen copiado para WhatsApp', true);
    const wp = String(c.wp||'').replace(/\D/g,'');
    if(wp){ showConfirm('Resumen copiado. ¿Abrir WhatsApp del contacto?', () => window.open('https://wa.me/549'+wp+'?text='+encodeURIComponent(resumen), '_blank')); }
  };

  // Botón resumen con icono distinto y siempre visible.
  function ensureResumenBtnV3320(){
    const id = currentOpenChatId || '';
    const actions = document.querySelector('#chat-popover.open .chat-admin-actions');
    if(!actions || !id) return;
    let btn = actions.querySelector('[data-action="resumen-wa"]');
    if(!btn){
      btn = document.createElement('button');
      btn.className = 'btn-out'; btn.type = 'button'; btn.dataset.action = 'resumen-wa';
      btn.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); window.generarResumenWhatsAppChat(id); };
      actions.insertBefore(btn, actions.children[1] || actions.firstChild);
    }
    btn.title = 'Resumen para WhatsApp';
    btn.innerHTML = '<span class="ico">🧾</span>';
  }
  setInterval(ensureResumenBtnV3320, 900);
  setTimeout(ensureResumenBtnV3320, 120);

  // Fullscreen: todos los botones en una barra visible horizontal.
  const css = document.createElement('style');
  css.textContent = `
    html body .chat-popover.expanded .chat-tools-block{max-height:none!important;overflow:visible!important;display:block!important;padding-bottom:4px!important;}
    html body .chat-popover.expanded .chat-quick-wrap,
    html body .chat-popover.expanded .chat-admin-actions{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;align-items:center!important;gap:7px!important;padding:4px 4px 7px 0!important;max-width:100%!important;scrollbar-width:thin;}
    html body .chat-popover.expanded .chat-quick,
    html body .chat-popover.expanded .chat-admin-actions .btn-out{flex:0 0 auto!important;}
    html body .chat-popover.expanded .chat-msgs{min-height:0!important;}
    html body .chat-popover.expanded .chat-panel{gap:8px!important;}
    html body .chat-popover .chat-admin-actions [data-action="resumen-wa"]{border-color:rgba(255,214,80,.45)!important;background:rgba(255,214,80,.08)!important;color:#fff!important;}
    html body .chat-popover .chat-admin-actions [data-action="resumen-wa"]::after{content:' Resumen';font-size:10px;margin-left:4px;font-weight:900;}
    @media(max-width:700px){html body .chat-popover.expanded .chat-quick-wrap,html body .chat-popover.expanded .chat-admin-actions{flex-wrap:nowrap!important;overflow-x:auto!important;}}
  `;
  document.head.appendChild(css);
})();


/* ─────────────────────────────────────────────────────────────────────────────
   PATCH V35 — chat estable mobile + bandeja limpia
   - No mueve la web automáticamente en celular mientras el chat está abierto.
   - Corrige X de cierre visible y elimina doble punto rojo.
   - Deja botones de acciones limpios, visibles y desplegables.
   - Reduce refrescos/saltos del chat al escribir.
───────────────────────────────────────────────────────────────────────────── */
(function(){
  const V35 = 'v35-chat-estable-mobile';
  window.TOMAUNO_PATCH_VERSION = V35;

  const isMobile35 = () => !!(window.matchMedia && window.matchMedia('(max-width:700px)').matches);
  const chatOpen35 = () => !!document.querySelector('#chat-popover.open');
  const root35 = document.documentElement;

  const css35 = document.createElement('style');
  css35.textContent = `
    :root{--chat-vvh:100dvh;}

    /* X de cierre: círculo + letra siempre visible */
    html body .chat-tab-close,
    html body .chat-inbox-side .chat-tab-close{
      display:inline-flex!important;align-items:center!important;justify-content:center!important;
      width:22px!important;height:22px!important;min-width:22px!important;border-radius:50%!important;
      background:rgba(255,255,255,.12)!important;border:1px solid rgba(255,255,255,.10)!important;
      color:#fff!important;font-size:16px!important;font-weight:900!important;line-height:1!important;
      opacity:.95!important;text-shadow:none!important;z-index:4!important;
    }
    html body .chat-tab-close:hover{background:var(--red)!important;color:#fff!important;border-color:rgba(255,255,255,.18)!important;}

    /* Evita doble punto rojo: usamos solo la luz oficial del chat */
    html body .chat-popover .chat-tab.unread::before,
    html body .chat-inbox-side .chat-tab.unread::before{display:none!important;content:none!important;}
    html body .chat-popover .chat-tab .chat-tab-light,
    html body .chat-inbox-side .chat-tab .chat-tab-light{
      width:11px!important;height:11px!important;min-width:11px!important;border-radius:50%!important;
      background:#3a4654!important;box-shadow:0 0 0 4px rgba(58,70,84,.12)!important;
    }
    html body .chat-popover .chat-tab.unread .chat-tab-light,
    html body .chat-inbox-side .chat-tab.unread .chat-tab-light,
    html body .chat-popover .chat-tab.waiting .chat-tab-light,
    html body .chat-inbox-side .chat-tab.waiting .chat-tab-light{
      background:#ff0612!important;box-shadow:0 0 0 5px rgba(232,0,10,.18),0 0 18px rgba(232,0,10,.75)!important;
      animation:tomaunoBlink35 1.05s infinite!important;
    }
    html body .chat-popover .chat-tab.priority .chat-tab-light,
    html body .chat-inbox-side .chat-tab.priority .chat-tab-light{
      background:#ffd54a!important;box-shadow:0 0 0 5px rgba(255,213,74,.16),0 0 18px rgba(255,213,74,.65)!important;
      animation:tomaunoBlink35 1.05s infinite!important;
    }
    @keyframes tomaunoBlink35{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.82)}}

    /* Botones admin limpios: icono solo, sin texto agregado */
    html body .chat-popover .chat-admin-actions [data-action="resumen-wa"]::after{content:''!important;display:none!important;}
    html body .chat-popover .chat-admin-actions .btn-out,
    html body .chat-popover .chat-admin-actions a.btn-out{
      font-size:0!important;overflow:hidden!important;text-indent:0!important;white-space:nowrap!important;
    }
    html body .chat-popover .chat-admin-actions .btn-out .ico,
    html body .chat-popover .chat-admin-actions a.btn-out .ico{
      font-size:16px!important;line-height:1!important;margin:0!important;display:inline-flex!important;
    }

    /* Desplegar/ocultar herramientas: estado claro y clickeable */
    html body #chat-tools-toggle{min-width:36px!important;height:32px!important;padding:0 10px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;position:relative!important;z-index:8!important;}
    html body .chat-tools-collapsed .chat-tools-block{display:none!important;}
    html body .chat-tools-collapsed #chat-tools-toggle{background:rgba(232,0,10,.24)!important;border-color:rgba(232,0,10,.55)!important;color:#fff!important;}

    /* Pantalla completa: acciones visibles, no tapadas */
    html body .chat-popover.expanded .chat-popover-inner{overflow:hidden!important;}
    html body .chat-popover.expanded .chat-panel{
      display:grid!important;grid-template-rows:minmax(0,1fr) auto auto auto!important;gap:8px!important;min-height:0!important;overflow:hidden!important;
    }
    html body .chat-popover.expanded .chat-msgs{grid-row:1!important;min-height:0!important;height:auto!important;max-height:none!important;overflow-y:auto!important;}
    html body .chat-popover.expanded .chat-row{grid-row:2!important;position:relative!important;z-index:5!important;}
    html body .chat-popover.expanded .chat-admin-tools{grid-row:3!important;max-height:none!important;overflow:visible!important;position:relative!important;z-index:6!important;}
    html body .chat-popover.expanded .chat-tools-block{
      grid-row:4!important;display:block!important;max-height:112px!important;overflow-y:auto!important;overflow-x:hidden!important;position:relative!important;z-index:6!important;
      padding:7px 2px 4px 0!important;border-top:1px solid rgba(255,255,255,.06)!important;background:#080808!important;
    }
    html body .chat-popover.expanded .chat-admin-actions,
    html body .chat-popover.expanded .chat-quick-wrap{display:flex!important;flex-wrap:wrap!important;gap:6px!important;overflow:visible!important;padding:0!important;margin:0 0 6px!important;}

    /* Mobile: chat fijo, sin temblor ni scroll de página */
    @media(max-width:700px){
      html.chat-open-mobile35, body.chat-open-mobile35{overflow:hidden!important;width:100%!important;height:100%!important;overscroll-behavior:none!important;}
      html body .chat-popover.open,
      html body .chat-popover.open.expanded{
        position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:auto!important;
        width:100vw!important;height:var(--chat-vvh)!important;max-height:var(--chat-vvh)!important;min-width:0!important;min-height:0!important;
        transform:none!important;border-radius:0!important;border-left:0!important;border-right:0!important;resize:none!important;
        background:#050505!important;z-index:999!important;overflow:hidden!important;
      }
      html body .chat-popover.open .chat-popover-inner{
        height:var(--chat-vvh)!important;max-height:var(--chat-vvh)!important;min-height:0!important;
        padding:10px!important;padding-top:max(10px,env(safe-area-inset-top))!important;padding-bottom:max(8px,env(safe-area-inset-bottom))!important;
        gap:7px!important;overflow:hidden!important;
      }
      html body .chat-popover.open:has(.chat-inbox-side) .chat-popover-inner{
        display:grid!important;grid-template-rows:auto auto minmax(0,1fr)!important;grid-template-columns:1fr!important;
      }
      html body .chat-popover.open .chat-inbox-side{
        grid-row:1!important;grid-column:1!important;display:flex!important;flex-direction:row!important;width:100%!important;height:auto!important;max-height:54px!important;
        overflow-x:auto!important;overflow-y:hidden!important;padding:5px!important;border-radius:14px!important;
      }
      html body .chat-popover.open .chat-inbox-side::before{display:none!important;}
      html body .chat-popover.open .chat-inbox-side .chat-tab{min-width:150px!important;max-width:170px!important;height:42px!important;min-height:42px!important;padding:6px 8px!important;}
      html body .chat-popover.open .chat-inbox-side .chat-tab-preview{display:none!important;}
      html body .chat-popover.open .chat-inbox-side .chat-tab-foot{font-size:9px!important;}
      html body .chat-popover.open .chat-head{grid-row:2!important;grid-column:1!important;min-height:42px!important;margin:0!important;padding-right:74px!important;overflow:hidden!important;}
      html body .chat-popover.open .chat-panel{grid-row:3!important;grid-column:1!important;display:grid!important;grid-template-rows:minmax(0,1fr) auto auto auto!important;gap:7px!important;min-height:0!important;height:100%!important;overflow:hidden!important;}
      html body .chat-popover.open .chat-msgs{grid-row:1!important;height:auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;padding:10px!important;scroll-behavior:auto!important;overscroll-behavior:contain!important;}
      html body .chat-popover.open .chat-row{grid-row:2!important;min-height:48px!important;margin:0!important;background:#050505!important;border:1px solid rgba(255,255,255,.20)!important;}
      html body .chat-popover.open .chat-row input,
      html body .chat-popover.open .chat-row textarea{font-size:16px!important;}
      html body .chat-popover.open .chat-admin-tools{grid-row:3!important;display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;max-height:36px!important;padding-bottom:2px!important;}
      html body .chat-popover.open .chat-tools-block{grid-row:4!important;max-height:48px!important;overflow-x:auto!important;overflow-y:hidden!important;white-space:nowrap!important;background:#050505!important;}
      html body .chat-popover.open .chat-quick-wrap{display:none!important;}
      html body .chat-popover.open .chat-admin-actions{display:flex!important;flex-wrap:nowrap!important;overflow-x:auto!important;overflow-y:hidden!important;gap:6px!important;padding:2px 54px 4px 0!important;margin:0!important;}
      html body .chat-popover.open .chat-admin-actions .btn-out,
      html body .chat-popover.open .chat-admin-actions a.btn-out{width:34px!important;height:34px!important;min-width:34px!important;}
      html body .chat-popover-close{top:max(8px,env(safe-area-inset-top))!important;right:10px!important;}
      html body .chat-max-btn{display:none!important;}
    }
  `;
  document.head.appendChild(css35);

  function setVisualHeight35(){
    const h = Math.round((window.visualViewport && window.visualViewport.height) || window.innerHeight || 0);
    if(h) root35.style.setProperty('--chat-vvh', h + 'px');
  }
  setVisualHeight35();
  window.addEventListener('resize', setVisualHeight35, {passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', setVisualHeight35, {passive:true});
    window.visualViewport.addEventListener('scroll', setVisualHeight35, {passive:true});
  }

  function syncMobileLock35(){
    const on = isMobile35() && chatOpen35();
    document.documentElement.classList.toggle('chat-open-mobile35', on);
    document.body.classList.toggle('chat-open-mobile35', on);
    if(on) setVisualHeight35();
  }
  const mo35 = new MutationObserver(syncMobileLock35);
  mo35.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class']});
  window.addEventListener('resize', syncMobileLock35, {passive:true});
  setInterval(syncMobileLock35, 900);
  setTimeout(syncMobileLock35, 120);

  // En celular no se mueve la web automáticamente mientras el chat está abierto.
  // Solo dejamos navegar cuando el usuario toca explícitamente un botón de acción.
  document.addEventListener('pointerdown', function(e){
    if(e.target && e.target.closest && e.target.closest('.chat-action-btn,[data-chat-nav],.chat-msgs a,.det-link,.chat-quick')){
      window.__tomaunoUserNav35 = true;
      setTimeout(()=>{ window.__tomaunoUserNav35 = false; }, 900);
    }
  }, true);

  const __navScroll35 = typeof navScroll === 'function' ? navScroll : null;
  if(__navScroll35){
    navScroll = function(id){
      if(isMobile35() && chatOpen35() && !window.__tomaunoUserNav35){
        return false;
      }
      window.__tomaunoUserNav35 = false;
      return __navScroll35.apply(this, arguments);
    };
    window.navScroll = navScroll;
  }

  const __maybeRunVisitorActionTags35 = typeof maybeRunVisitorActionTags === 'function' ? maybeRunVisitorActionTags : null;
  if(__maybeRunVisitorActionTags35){
    maybeRunVisitorActionTags = function(chatId, chat){
      if(isMobile35() && chatOpen35()) return;
      return __maybeRunVisitorActionTags35.apply(this, arguments);
    };
  }

  // Si el admin despliega/oculta acciones, no dejamos el estado visual a medias.
  const __toggleChatTools35 = window.toggleChatTools;
  window.toggleChatTools = function(){
    if(typeof __toggleChatTools35 === 'function') __toggleChatTools35.apply(this, arguments);
    const p = document.getElementById('chat-popover');
    const b = document.getElementById('chat-tools-toggle');
    const collapsed = !!(p && p.classList.contains('chat-tools-collapsed'));
    if(b){
      b.classList.toggle('on', !collapsed);
      b.textContent = collapsed ? '▴' : '▾';
      b.title = collapsed ? 'Mostrar botones' : 'Ocultar botones';
    }
  };

  // Refuerzo de bandeja: los chats pendientes titilan con una sola luz.
  const __adminChatTabsHtml35 = typeof adminChatTabsHtml === 'function' ? adminChatTabsHtml : null;
  if(__adminChatTabsHtml35){
    adminChatTabsHtml = function(activeId){
      const html = __adminChatTabsHtml35.apply(this, arguments);
      return String(html).replace(/<button class="chat-tab/g, '<button class="chat-tab').replace(/<span class="chat-tab-close"/g, '<span class="chat-tab-close" aria-label="Cerrar chat"');
    };
  }

  // Evita que al enfocar el input el navegador intente centrar toda la página.
  document.addEventListener('focusin', function(e){
    if(!isMobile35() || !chatOpen35()) return;
    const input = e.target && e.target.closest && e.target.closest('#chat-text,#chat-admin-text,.chat-row input,.chat-row textarea');
    if(!input) return;
    setTimeout(()=>{
      setVisualHeight35();
      const msgs = document.getElementById('chat-msgs');
      if(msgs) msgs.scrollTop = msgs.scrollHeight;
    }, 160);
  }, true);
})();


/* ─────────────────────────────────────────────────────────────────────────────
   PATCH V36 — bandeja en vivo + herramientas sin scroll + chat sin saltos
   - Los usuarios nuevos/nombres editados se refrescan en la bandeja sin cerrar/abrir.
   - Luces: verde online, gris offline, titilando solo si hay mensajes no leídos.
   - En pantalla completa las acciones se integran en la primera línea y no quedan tapadas.
   - En mobile no se fuerza autoscroll mientras el usuario escribe o lee.
───────────────────────────────────────────────────────────────────────────── */
(function(){
  window.TOMAUNO_PATCH_VERSION = 'v36-bandeja-viva-chat-fijo';
  const isMobile36 = () => !!(window.matchMedia && window.matchMedia('(max-width:700px)').matches);
  const isChatOpen36 = () => !!document.querySelector('#chat-popover.open');
  const isAdminChatOpen36 = () => isChatOpen36() && !!document.querySelector('.chat-inbox-side,.chat-list-item,#chat-admin-text');

  const css36 = document.createElement('style');
  css36.textContent = `
    /* Bandeja: una sola luz, semántica clara */
    html body .chat-popover .chat-tab::before,
    html body .chat-inbox-side .chat-tab::before{display:none!important;content:none!important;}
    html body .chat-inbox-side .chat-tab .chat-tab-light,
    html body .chat-popover .chat-tab .chat-tab-light{
      width:11px!important;height:11px!important;min-width:11px!important;border-radius:50%!important;
      background:#4b5563!important;box-shadow:0 0 0 4px rgba(75,85,99,.14)!important;animation:none!important;
    }
    html body .chat-inbox-side .chat-tab.online:not(.unread) .chat-tab-light,
    html body .chat-popover .chat-tab.online:not(.unread) .chat-tab-light{
      background:#39d477!important;box-shadow:0 0 0 5px rgba(57,212,119,.12),0 0 14px rgba(57,212,119,.45)!important;
    }
    html body .chat-inbox-side .chat-tab.unread .chat-tab-light,
    html body .chat-popover .chat-tab.unread .chat-tab-light{
      animation:tomaunoBlink36 1s infinite!important;
      background:#ffd54a!important;box-shadow:0 0 0 5px rgba(255,213,74,.18),0 0 18px rgba(255,213,74,.85)!important;
    }
    html body .chat-inbox-side .chat-tab.online.unread .chat-tab-light,
    html body .chat-popover .chat-tab.online.unread .chat-tab-light{
      background:#39d477!important;box-shadow:0 0 0 5px rgba(57,212,119,.20),0 0 20px rgba(57,212,119,.9)!important;
    }
    @keyframes tomaunoBlink36{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.28;transform:scale(.72)}}

    /* X siempre visible */
    html body .chat-tab-close{color:#fff!important;font-size:17px!important;font-weight:900!important;line-height:1!important;text-indent:0!important;}

    /* Herramientas: una sola zona, sin barra vertical inferior */
    html body .chat-popover.open .chat-panel{overflow:hidden!important;min-height:0!important;}
    html body .chat-popover.open .chat-admin-tools{
      display:flex!important;align-items:center!important;align-content:flex-start!important;gap:7px!important;flex-wrap:wrap!important;
      overflow:visible!important;max-height:none!important;min-height:38px!important;padding:0 0 2px!important;margin:0!important;
      scrollbar-width:none!important;background:#050505!important;border-top:1px solid rgba(255,255,255,.06)!important;padding-top:8px!important;
    }
    html body .chat-popover.open .chat-admin-tools::-webkit-scrollbar{display:none!important;}
    html body .chat-popover.open .chat-tools-block{display:none!important;max-height:0!important;overflow:hidden!important;padding:0!important;margin:0!important;border:0!important;}
    html body .chat-popover.open .chat-admin-tools .chat-admin-actions{display:contents!important;}
    html body .chat-popover.open .chat-admin-tools .chat-quick-label{display:none!important;}
    html body .chat-popover.open .chat-admin-tools .chat-quick-wrap{display:contents!important;}
    html body .chat-popover.open .chat-admin-tools .chat-filter,
    html body .chat-popover.open .chat-admin-tools .chat-quick,
    html body .chat-popover.open .chat-admin-tools .btn-out,
    html body .chat-popover.open .chat-admin-tools a.btn-out{
      flex:0 0 auto!important;min-width:36px!important;width:auto!important;height:34px!important;min-height:34px!important;
      display:inline-flex!important;align-items:center!important;justify-content:center!important;margin:0!important;
      border-radius:999px!important;white-space:nowrap!important;overflow:visible!important;line-height:1!important;
    }
    html body .chat-popover.open .chat-admin-tools .btn-out,
    html body .chat-popover.open .chat-admin-tools a.btn-out{width:36px!important;min-width:36px!important;padding:0!important;font-size:0!important;}
    html body .chat-popover.open .chat-admin-tools .btn-out .ico,
    html body .chat-popover.open .chat-admin-tools a.btn-out .ico{font-size:16px!important;display:inline-flex!important;margin:0!important;}
    html body .chat-popover.open .chat-admin-tools .chat-quick{padding:0 11px!important;font-size:11px!important;width:auto!important;min-width:0!important;}
    html body .chat-popover.open .chat-admin-tools .chat-quick .qr-text{display:inline!important;font-size:11px!important;margin-left:4px!important;}
    html body .chat-popover.open .chat-admin-tools .chat-quick .qr-ico{font-size:13px!important;margin:0!important;}
    html body .chat-popover.open.chat-tools-collapsed .chat-admin-tools .chat-quick,
    html body .chat-popover.open.chat-tools-collapsed .chat-admin-tools .btn-out,
    html body .chat-popover.open.chat-tools-collapsed .chat-admin-tools a.btn-out{display:none!important;}

    /* Pantalla completa: más alto para mensajes, herramientas dentro del layout */
    html body .chat-popover.open.expanded .chat-panel{display:grid!important;grid-template-rows:minmax(0,1fr) auto auto!important;gap:8px!important;}
    html body .chat-popover.open.expanded .chat-msgs{grid-row:1!important;min-height:0!important;overflow-y:auto!important;scroll-behavior:auto!important;}
    html body .chat-popover.open.expanded .chat-row{grid-row:2!important;}
    html body .chat-popover.open.expanded .chat-admin-tools{grid-row:3!important;}

    /* En mobile, cero temblor: el chat ocupa el viewport real y no mueve la página */
    @media(max-width:700px){
      html.chat-open-mobile35,body.chat-open-mobile35,
      html.chat-open-mobile36,body.chat-open-mobile36{overflow:hidden!important;height:100%!important;position:relative!important;overscroll-behavior:none!important;}
      html body .chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}
      html body .chat-popover.open .chat-admin-tools{max-height:78px!important;overflow:hidden!important;}
      html body .chat-popover.open .chat-admin-tools .chat-quick{height:30px!important;font-size:10px!important;padding:0 8px!important;}
      html body .chat-popover.open .chat-admin-tools .chat-filter,
      html body .chat-popover.open .chat-admin-tools .btn-out,
      html body .chat-popover.open .chat-admin-tools a.btn-out{height:30px!important;min-height:30px!important;min-width:32px!important;}
    }
  `;
  document.head.appendChild(css36);

  function syncMobileLock36(){
    const on = isMobile36() && isChatOpen36();
    document.documentElement.classList.toggle('chat-open-mobile36', on);
    document.body.classList.toggle('chat-open-mobile36', on);
  }
  window.addEventListener('resize', syncMobileLock36, {passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', syncMobileLock36, {passive:true});
    window.visualViewport.addEventListener('scroll', syncMobileLock36, {passive:true});
  }

  function mergeAdminTools36(){
    const pop = document.getElementById('chat-popover');
    const tools = pop?.querySelector('.chat-admin-tools');
    const block = pop?.querySelector('.chat-tools-block');
    if(!pop || !tools || !block) return;
    if(pop.dataset.toolsMergedV36 === '1') return;
    const qLabel = block.querySelector('.chat-quick-label');
    const qWrap = block.querySelector('.chat-quick-wrap');
    const actions = block.querySelector('.chat-admin-actions');
    if(qLabel) tools.appendChild(qLabel);
    if(qWrap) tools.appendChild(qWrap);
    if(actions) tools.appendChild(actions);
    pop.dataset.toolsMergedV36 = '1';
    syncMobileLock36();
  }
  window.mergeAdminTools36 = mergeAdminTools36;

  function refreshSidebar36(){
    if(!isAdminNotifier || !isAdminNotifier()) return;
    const pop = document.getElementById('chat-popover');
    if(!pop || !pop.classList.contains('open')) return;
    // Si estamos dentro de una conversación, refrescamos solo la bandeja lateral para no mover mensajes ni input.
    const side = pop.querySelector('.chat-inbox-side');
    if(side && typeof adminChatTabsHtml === 'function'){
      const html = adminChatTabsHtml(currentOpenChatId || '');
      if(html && side.outerHTML !== html) side.outerHTML = html;
      mergeAdminTools36();
      return;
    }
    // Si está abierta la pantalla de listado de chats, se regenera para que entren usuarios nuevos/nombres cambiados.
    if(!currentOpenChatId && pop.querySelector('.chat-list-item') && typeof abrirPanelChatsAdmin === 'function'){
      abrirPanelChatsAdmin();
      setTimeout(mergeAdminTools36, 30);
    }
  }
  let refreshTimer36 = null;
  function scheduleRefreshSidebar36(){
    clearTimeout(refreshTimer36);
    refreshTimer36 = setTimeout(refreshSidebar36, 180);
  }

  try{
    onValue(ref(db,'tomauno/chats'), () => {
      scheduleRefreshSidebar36();
    });
  }catch(e){}

  // Después de cualquier render de chat admin, fusiona herramientas y refresca sidebar sin tocar mensajes.
  const __abrirChatAdmin36 = window.abrirChatAdmin;
  if(typeof __abrirChatAdmin36 === 'function'){
    window.abrirChatAdmin = function(){
      const r = __abrirChatAdmin36.apply(this, arguments);
      setTimeout(()=>{ mergeAdminTools36(); refreshSidebar36(); }, 40);
      return r;
    };
  }
  const __abrirPanelChatsAdmin36 = window.abrirPanelChatsAdmin;
  if(typeof __abrirPanelChatsAdmin36 === 'function'){
    window.abrirPanelChatsAdmin = function(){
      const r = __abrirPanelChatsAdmin36.apply(this, arguments);
      setTimeout(syncMobileLock36, 40);
      return r;
    };
  }

  const __setChatPopover36 = window.setChatPopover;
  if(typeof __setChatPopover36 === 'function'){
    window.setChatPopover = function(){
      const r = __setChatPopover36.apply(this, arguments);
      setTimeout(()=>{ mergeAdminTools36(); syncMobileLock36(); }, 30);
      return r;
    };
  }

  // Toggle real: mantiene visibles los botones de control y esconde solo rápidas/acciones.
  const __toggleChatTools36 = window.toggleChatTools;
  window.toggleChatTools = function(){
    const pop = document.getElementById('chat-popover');
    if(pop){
      chatToolsCollapsed = !pop.classList.contains('chat-tools-collapsed');
      pop.classList.toggle('chat-tools-collapsed', chatToolsCollapsed);
      try{ localStorage.setItem('tomauno-chat-tools-collapsed', chatToolsCollapsed ? '1':'0'); }catch(e){}
      const b = document.getElementById('chat-tools-toggle');
      if(b){ b.textContent = chatToolsCollapsed ? '▴':'▾'; b.title = chatToolsCollapsed ? 'Mostrar botones':'Ocultar botones'; }
      mergeAdminTools36();
      return;
    }
    if(typeof __toggleChatTools36 === 'function') return __toggleChatTools36.apply(this, arguments);
  };

  // Scroll estable: si el usuario escribe o está leyendo arriba, no lo arrastramos al final.
  const __scrollChatSmart36 = typeof scrollChatSmart === 'function' ? scrollChatSmart : null;
  if(__scrollChatSmart36){
    scrollChatSmart = function(box){
      if(!box) return;
      const active = document.activeElement;
      const isTyping = active && (active.id === 'chat-text' || active.id === 'chat-admin-text');
      const distanceBottom = box.scrollHeight - box.scrollTop - box.clientHeight;
      if(isMobile36() && isChatOpen36() && isTyping) return;
      if(isMobile36() && isChatOpen36() && distanceBottom > 160) return;
      return __scrollChatSmart36.apply(this, arguments);
    };
    window.scrollChatSmart = scrollChatSmart;
  }

  // Si entran mensajes largos al visitante, mostrar desde arriba del mensaje, no al final.
  const __updateChatMessagesOnly36 = typeof updateChatMessagesOnly === 'function' ? updateChatMessagesOnly : null;
  if(__updateChatMessagesOnly36){
    updateChatMessagesOnly = function(id, adminView){
      const box = document.getElementById('chat-msgs');
      const beforeTop = box ? box.scrollTop : 0;
      const beforeHtml = box ? box.dataset.lastHtml : '';
      const active = document.activeElement;
      const userTyping = active && (active.id === 'chat-text' || active.id === 'chat-admin-text');
      const r = __updateChatMessagesOnly36.apply(this, arguments);
      if(box && isMobile36() && isChatOpen36() && userTyping){ box.scrollTop = beforeTop; return r; }
      return r;
    };
  }



/* =====================================================================
   v52 — Atención humana con espera real + acceso rápido admin logueado.
   Parche dentro del módulo para poder usar Firebase sin tocar imports.
   ===================================================================== */
(function(){
  const HUMAN_FALLBACK_MS = 60000;
  const humanTimers52 = Object.create(null);

  function humanWanted52(text){
    const q = (typeof normAI === 'function' ? normAI(text||'') : String(text||'').toLowerCase());
    return /(hablar|comunicarme|contactarme|contactar|escribir|consultar|atender|atencion|atención).{0,45}(javier|dueño|dueno|encargado|responsable|humano|persona)/.test(q) ||
           /(javier|dueño|dueno|encargado|responsable).{0,45}(hablar|contact|comunicar|responder|atender)/.test(q);
  }
  function exactKnowledge52(text){
    const q = typeof normAI === 'function' ? normAI(text || '') : String(text || '').toLowerCase().trim();
    if(!q) return null;
    try{
      if(typeof findKnowledgeByCommand === 'function'){
        const byCmd = findKnowledgeByCommand(text);
        if(byCmd && byCmd.k) return byCmd.k;
      }
      const entries = typeof asistenteKnowledgeEntries === 'function' ? asistenteKnowledgeEntries() : [];
      for(const [,k] of entries){
        const values = [k.titulo || '', k.command || ''].concat(String(k.keys || '').split(','));
        if(values.some(v => normAI(v) === q)) return k;
      }
    }catch(e){}
    return null;
  }
  function chatName52(chat,id){
    try{ return tieneNombreRealChat(chat) ? chatVisibleName(chat,id||'') : ''; }catch(e){ return (chat&&chat.name)||''; }
  }
  function humanWaitText52(chat,id){
    const n = chatName52(chat,id);
    return (n ? 'Gracias, '+n+'.\n' : '') + 'Aguardá un momento por favor, voy a intentar avisarle a Javier para que te responda por acá 😊';
  }
  function humanAskNameText52(){
    return 'Sí, con gusto 😊\nPuedo intentar avisarle a Javier para que te responda por acá.\n\n¿Cómo es tu nombre?';
  }
  function humanFallbackText52(){
    const url = 'https://wa.me/5493764354522?text=' + encodeURIComponent('Hola Javier, vengo de la web Tomauno y quiero continuar mi consulta.');
    return 'En este momento Javier puede estar ocupado.\n\nTe dejo el WhatsApp directo para que puedas escribirle: ' + url + '\n\nTambién podés dejarme tu consulta por acá y Javier la revisa apenas pueda.';
  }
  async function pushBot52(chatId, text, extra){
    await push(ref(db,'tomauno/chats/'+chatId+'/messages'), Object.assign({from:'admin', text, time:chatTime(), createdAt:Date.now(), auto:true}, extra||{}));
    await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:cleanChatDisplayText(text), unreadVisitor:true, status:'abierto-auto'});
  }
  function manualAdminAfter52(chat, since){
    try{
      return chatMsgs(chat).some(([,m]) => m && m.from === 'admin' && !m.auto && !m.typing && Number(m.createdAt||0) > Number(since||0));
    }catch(e){ return false; }
  }
  function scheduleFallback52(chatId, startedAt){
    clearTimeout(humanTimers52[chatId]);
    humanTimers52[chatId] = setTimeout(async function(){
      try{
        const snap = await get(ref(db,'tomauno/chats/'+chatId));
        if(!snap.exists()) return;
        const c = snap.val() || {};
        if(!c.humanRequested || !c.humanWaitStartedAt) return;
        if(c.humanFallbackSent) return;
        if(manualAdminAfter52(c, c.humanWaitStartedAt)) return;
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(c,chatId)||'Visitante')+': sigue esperando a Javier después de 60 segundos'); }catch(e){}
        try{ notifyAdminChat && notifyAdminChat('Atención humana pendiente', (chatVisibleName(c,chatId)||'Visitante')+': sigue esperando a Javier', chatId); }catch(e){}
        await pushBot52(chatId, humanFallbackText52(), {humanFallback:true});
        await update(ref(db,'tomauno/chats/'+chatId), {humanFallbackSent:true, awaitingHumanContact:true, prioridad:true, updatedAt:Date.now()});
      }catch(e){ console.warn('Fallback humano v52:', e); }
    }, HUMAN_FALLBACK_MS);
  }

  // Si el usuario pide a Javier, no lo sacamos enseguida a WhatsApp: pedimos nombre,
  // avisamos al admin y esperamos antes del fallback.
  const responderPrev52 = responderAutomaticoChat;
  responderAutomaticoChat = async function(chatId, userText){
    try{
      let modo = asistenteModo();
      try{ const modoSnap = await get(ref(db,'tomauno/asistente/modo')); if(modoSnap.exists()) modo = modoSnap.val(); }catch(e){}
      if(modo !== 'automatico') return;
      let chat = chatsDB?.[chatId] || {};
      try{ const chatSnap = await get(ref(db,'tomauno/chats/'+chatId)); if(chatSnap.exists()) chat = chatSnap.val(); }catch(e){}

      const exact = exactKnowledge52(userText);
      if(exact && exact.respuesta){
        await pushBot52(chatId, applyAIVariables(exact.respuesta || '', chat), {knowledge:true});
        return;
      }

      if(humanWanted52(userText)){
        const hasName = !!chatName52(chat, chatId);
        await update(ref(db,'tomauno/chats/'+chatId), {
          humanRequested:true, prioridad:true, unreadAdmin:true, updatedAt:Date.now(),
          awaitingHumanName:!hasName, humanFallbackSent:false,
          humanRequestedAt: Date.now(),
          temaPrincipal: (typeof temaDesdeHistorialAI==='function' ? temaDesdeHistorialAI(chat,userText) : '') || detectarTemaConsulta(userText)
        });
        try{ notifyAdminChat('Atención humana solicitada', chatVisibleName(chat,chatId)+': quiere hablar con Javier', chatId); }catch(e){}
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': quiere hablar con Javier'); }catch(e){}
        if(!hasName){
          await pushBot52(chatId, humanAskNameText52(), {humanPrompt:true});
          return;
        }
        const started = Date.now();
        await update(ref(db,'tomauno/chats/'+chatId), {awaitingHumanName:false, humanWaitStartedAt:started});
        await pushBot52(chatId, humanWaitText52(chat,chatId), {humanWait:true});
        scheduleFallback52(chatId, started);
        return;
      }

      // Si ya se derivó a Javier y el usuario acepta dejar una consulta,
      // no buscamos en Cerebro: pedimos consulta + WhatsApp.
      if(chat && chat.humanRequested && chat.humanFallbackSent && !chat.awaitingHumanName){
        const hasPhone = /(?:\+?54)?\s*(?:9\s*)?(?:\d[\s\-\.]*){8,}/.test(String(userText||''));
        const thanksText = hasPhone
          ? 'Gracias 😊 Ya quedó registrada tu consulta para Javier. Apenas pueda la revisa y te responde.'
          : 'Gracias 😊 Ya dejé registrada tu consulta para Javier. Si querés, pasame también tu WhatsApp para que pueda responderte más fácil.';
        await pushBot52(chatId, thanksText, {humanCollectAck:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'⭐ Consulta para Javier recibida', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, awaitingHumanContact:!hasPhone});
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': dejó una consulta para Javier'); }catch(e){}
        return;
      }
      if(chat && chat.humanRequested && !chat.awaitingHumanName){
        const qLeave = (typeof normAI === 'function' ? normAI(userText||'') : String(userText||'').toLowerCase());
        const wantsLeave = /(quiero|quisiera|puedo|voy a|dejo|dejar|mandar|enviar|hacer|hacerles|hacerte).{0,40}(consulta|mensaje|pregunta|dato|datos)/.test(qLeave) || /(dejar|dejo).{0,30}(consulta|mensaje)/.test(qLeave);
        if(wantsLeave){
          const askText = 'Perfecto 😊\nContame cuál es tu consulta y pasame tu WhatsApp para que Javier pueda responderte apenas la revise.';
          await pushBot52(chatId, askText, {humanCollect:true});
          await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Consulta pendiente para Javier', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, awaitingHumanContact:true});
          try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': quiere dejar una consulta'); }catch(e){}
          return;
        }
      }

      // Si estábamos esperando la consulta/datos para Javier, no disparamos respuestas de Cerebro.
      if(chat && chat.humanRequested && chat.awaitingHumanContact){
        const hasPhone = /(?:\+?54)?\s*(?:9\s*)?(?:\d[\s\-\.]*){8,}/.test(String(userText||''));
        const thanksText = hasPhone
          ? 'Gracias 😊 Ya quedó registrada tu consulta para Javier. Apenas pueda la revisa y te responde.'
          : 'Gracias 😊 Ya dejé registrada tu consulta. Si querés, pasame también tu WhatsApp para que Javier pueda responderte más fácil.';
        await pushBot52(chatId, thanksText, {humanCollectAck:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Consulta para Javier recibida', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, awaitingHumanContact:!hasPhone});
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': dejó una consulta para Javier'); }catch(e){}
        return;
      }

      // Si ya pidió Javier y faltaba nombre, una respuesta tipo “Sofía” inicia la espera.
      if(chat && chat.humanRequested && chat.awaitingHumanName){
        const possible = (typeof extraerNombreAI === 'function' ? extraerNombreAI(userText) : '') || (typeof isJustNameReply === 'function' ? isJustNameReply(userText, chat) : '');
        const n = typeof limpiarNombreChat === 'function' ? limpiarNombreChat(possible) : String(possible||'').trim();
        if(n && n.length >= 2){
          const started = Date.now();
          const newChat = Object.assign({}, chat, {name:n});
          await update(ref(db,'tomauno/chats/'+chatId), {name:n, awaitingHumanName:false, humanWaitStartedAt:started, humanFallbackSent:false, humanRequested:true, prioridad:true, unreadAdmin:true, updatedAt:started});
          await pushBot52(chatId, humanWaitText52(newChat,chatId), {humanWait:true});
          try{ notifyAdminChat('Atención humana solicitada', n+': espera a Javier', chatId); }catch(e){}
          try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, n+': espera a Javier'); }catch(e){}
          scheduleFallback52(chatId, started);
          return;
        }
      }
    }catch(e){ console.warn('Atención humana v52 previa:', e); }
    return responderPrev52.apply(this, arguments);
  };

  // Acceso rápido al panel admin: solo si ya está logueado/recordado.
  window.abrirAdminRapido = function(){
    try{
      if(typeof isAdminNotifier === 'function' && isAdminNotifier()){
        adminOk = true;
        window._adminWasActive = true;
        try{ localStorage.setItem('tomauno-admin-notify','1'); }catch(e){}
        toggleAdmin(true);
        toast('Panel admin abierto', true);
        return true;
      }
    }catch(e){}
    toast('Primero ingresá con PIN');
    return false;
  };
  document.addEventListener('click', function(ev){
    const live = ev.target && ev.target.closest && ev.target.closest('#admin-live-indicator');
    if(live){ ev.preventDefault(); ev.stopPropagation(); window.abrirAdminRapido(); }
  }, true);
  document.addEventListener('keydown', function(ev){
    if(ev.altKey && ev.shiftKey && String(ev.key||'').toLowerCase()==='a'){
      ev.preventDefault(); window.abrirAdminRapido();
    }
  });
})();

  // Primera pasada por si el render ya estaba en pantalla.
  setInterval(()=>{ if(isAdminChatOpen36()) mergeAdminTools36(); syncMobileLock36(); }, 1200);
  setTimeout(()=>{ mergeAdminTools36(); refreshSidebar36(); syncMobileLock36(); }, 120);
})();


/* =====================================================================
   v89 — Seguridad chat visitante + mobile sin temblores.
   - Usuario común nunca ve bandeja/tabs admin.
   - En celular no se reconstruye el chat mientras escribe.
   - El input queda dentro del alto visible del teclado.
   ===================================================================== */
(function(){
  const VERSION_89 = 'v89';
  const LS_ADMIN_89 = 'tomauno-admin-notify';
  let guardSetPopover89 = false;

  function adminReal89(){
    try{ return !!(adminOk || window._adminWasActive === true || localStorage.getItem(LS_ADMIN_89) === '1'); }
    catch(e){ return !!(adminOk || window._adminWasActive === true); }
  }
  function mobile89(){ return !!(window.matchMedia && window.matchMedia('(max-width:700px)').matches); }
  function ensureVersion89(){
    try{
      let tag=document.getElementById('tomauno-version-tag');
      if(!tag){
        const f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;
        tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);
      }
      tag.textContent='Tomauno '+VERSION_89;
    }catch(e){}
  }
  function setViewportVar89(){
    try{
      const h = (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--tu-vvh', Math.max(320, Math.floor(h)) + 'px');
    }catch(e){}
  }
  function injectCss89(){
    if(document.getElementById('patch-v89-chat-mobile-css')) return;
    const st=document.createElement('style');
    st.id='patch-v89-chat-mobile-css';
    st.textContent = `
      .tomauno-version-tag{display:block;margin-top:10px;font-size:10px;color:rgba(255,255,255,.28);letter-spacing:.12em;text-transform:uppercase;font-weight:800;}
      html body .chat-popover.tu89-visitor .chat-tabs,
      html body .chat-popover.tu89-visitor .chat-inbox-side,
      html body .chat-popover.tu89-visitor .chat-admin-actions,
      html body .chat-popover.tu89-visitor .chat-admin-tools,
      html body .chat-popover.tu89-visitor .chat-head-actions{display:none!important;}
      @media(max-width:700px){
        html.tu89-chat-visitor-open, body.tu89-chat-visitor-open{overflow:hidden!important;overscroll-behavior:none!important;}
        html body .chat-popover.tu89-visitor.open{
          left:8px!important;right:8px!important;top:auto!important;bottom:max(8px,env(safe-area-inset-bottom))!important;
          width:auto!important;height:calc(var(--tu-vvh,100dvh) - 18px)!important;max-height:calc(var(--tu-vvh,100dvh) - 18px)!important;
          transform:none!important;resize:none!important;border-radius:18px!important;overflow:hidden!important;
        }
        html body .chat-popover.tu89-visitor .chat-popover-inner{height:100%!important;max-height:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:12px!important;gap:8px!important;}
        html body .chat-popover.tu89-visitor .chat-head{flex:0 0 auto!important;margin-bottom:4px!important;}
        html body .chat-popover.tu89-visitor .chat-panel{flex:1 1 auto!important;min-height:0!important;display:flex!important;flex-direction:column!important;gap:8px!important;}
        html body .chat-popover.tu89-visitor .chat-msgs{flex:1 1 auto!important;min-height:0!important;max-height:none!important;overflow-y:auto!important;}
        html body .chat-popover.tu89-visitor .chat-row{flex:0 0 auto!important;margin:0!important;}
        html body .chat-popover.tu89-visitor .chat-name-row{flex:0 0 auto!important;margin:0!important;}
        html body .chat-popover.tu89-visitor .chat-bubble{max-width:94%!important;}
      }
    `;
    document.head.appendChild(st);
  }
  function adminHtml89(html){ return /chat-inbox-side|chat-tabs|BANDEJA DE CHATS|chat-admin-actions|chat-admin-tools|chat-admin-text|abrirChatAdmin\(/i.test(String(html||'')); }
  function visitorStartHtml89(){
    return '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>'+
      '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">'+
      '<div class="chat-bubble admin"><div>Hola 😊<br/><b>¿Cómo es tu nombre?</b></div><div class="chat-meta">Ahora</div></div>'+
      '</div><div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">➜</button></div></div>';
  }
  function visitorChatHtml89(id){
    try{
      const chat = chatsDB[id] || {};
      const inputVal = document.getElementById('chat-text')?.value || '';
      const msgs = renderMsgs(chat, false, id);
      return '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">'+escHtml(chatVisibleName(chat,id))+' · '+(isAdminOnline()?'🟢 Admin en línea':'⚫ Admin fuera de línea')+'</div></div></div>'+
        '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">'+(msgs || '<div class="chat-bubble admin">Hola '+escHtml(chat.name||'')+' 👋 ¿En qué puedo ayudarte?</div>')+
        ''+
        '</div><div class="chat-row"><input class="finput" id="chat-text" placeholder="Escribí tu mensaje..." value="'+escAttr(inputVal)+'" onkeydown="if(event.key===\'Enter\')window.enviarChatVisitante(\''+id+'\')"/><button class="chat-send" onclick="window.enviarChatVisitante(\''+id+'\')">➜</button></div></div>';
    }catch(e){ return visitorStartHtml89(); }
  }
  function safeVisitorHtml89(){
    try{
      if(currentVisitorChatId && chatsDB[currentVisitorChatId] && chatsDB[currentVisitorChatId].status !== 'cerrado') return visitorChatHtml89(currentVisitorChatId);
    }catch(e){}
    return visitorStartHtml89();
  }
  function markPopoverMode89(){
    try{
      const p=document.getElementById('chat-popover');
      if(!p) return;
      const isAdminDom=!!p.querySelector('.chat-inbox-side,.chat-tabs,.chat-admin-actions,.chat-admin-tools,#chat-admin-text');
      const visitor=p.classList.contains('open') && !isAdminDom;
      p.classList.toggle('tu89-visitor', visitor);
      document.body.classList.toggle('tu89-chat-visitor-open', visitor && mobile89());
      document.documentElement.classList.toggle('tu89-chat-visitor-open', visitor && mobile89());
    }catch(e){}
  }

  const setChatPopoverOriginal89 = setChatPopover;
  setChatPopover = function(html){
    if(guardSetPopover89) return setChatPopoverOriginal89.apply(this, arguments);
    if(!adminReal89() && adminHtml89(html)){
      html = safeVisitorHtml89();
    }
    const r = setChatPopoverOriginal89.call(this, html);
    setTimeout(markPopoverMode89, 0);
    setTimeout(markPopoverMode89, 80);
    return r;
  };
  window.setChatPopover = setChatPopover;

  const abrirPanelChatsAdminOriginal89 = window.abrirPanelChatsAdmin;
  window.abrirPanelChatsAdmin = abrirPanelChatsAdmin = function(){
    if(!adminReal89()){
      guardSetPopover89=true;
      try{ setChatPopover(safeVisitorHtml89()); } finally { guardSetPopover89=false; }
      setTimeout(markPopoverMode89, 0);
      return false;
    }
    return abrirPanelChatsAdminOriginal89.apply(this, arguments);
  };
  const abrirChatAdminOriginal89 = window.abrirChatAdmin;
  window.abrirChatAdmin = abrirChatAdmin = function(id, silent){
    if(!adminReal89()){
      guardSetPopover89=true;
      try{ setChatPopover(safeVisitorHtml89()); } finally { guardSetPopover89=false; }
      setTimeout(markPopoverMode89, 0);
      return false;
    }
    return abrirChatAdminOriginal89.apply(this, arguments);
  };

  const abrirChatVisitanteOriginal89 = abrirChatVisitante;
  abrirChatVisitante = function(id, silent){
    const active=document.activeElement;
    const pop=document.getElementById('chat-popover');
    const typing=active && active.id==='chat-text' && pop && pop.classList.contains('open') && id===currentVisitorChatId;
    if(typing){
      try{ updateChatMessagesOnly(id, false); markPopoverMode89(); }catch(e){}
      return;
    }
    const r = abrirChatVisitanteOriginal89.apply(this, arguments);
    setTimeout(markPopoverMode89, 0);
    return r;
  };
  window.abrirChatVisitante = abrirChatVisitante;

  const scrollChatSmartOriginal89 = scrollChatSmart;
  scrollChatSmart = function(box){
    if(!box) return;
    const active=document.activeElement;
    const visitorTyping=active && active.id==='chat-text';
    const distanceBottom = box.scrollHeight - box.scrollTop - box.clientHeight;
    if(visitorTyping) return;
    if(mobile89() && document.body.classList.contains('tu89-chat-visitor-open') && distanceBottom > 90) return;
    return scrollChatSmartOriginal89.apply(this, arguments);
  };
  window.scrollChatSmart = scrollChatSmart;

  const updateChatMessagesOnlyOriginal89 = updateChatMessagesOnly;
  updateChatMessagesOnly = function(id, adminView){
    if(!adminReal89()) adminView=false;
    const box=document.getElementById('chat-msgs');
    const input=document.getElementById('chat-text');
    const wasTyping=document.activeElement===input;
    const val=input ? input.value : '';
    const start=input ? input.selectionStart : null;
    const top=box ? box.scrollTop : 0;
    const r = updateChatMessagesOnlyOriginal89.call(this, id, adminView);
    if(wasTyping && input){
      input.value=val;
      try{ input.focus({preventScroll:true}); if(start!=null) input.setSelectionRange(start,start); }catch(e){ try{input.focus();}catch(_e){} }
      if(box) box.scrollTop=top;
    }
    setTimeout(markPopoverMode89, 0);
    return r;
  };
  window.updateChatMessagesOnly = updateChatMessagesOnly;

  function init89(){ injectCss89(); ensureVersion89(); setViewportVar89(); markPopoverMode89(); }
  if(window.visualViewport){ visualViewport.addEventListener('resize', setViewportVar89); visualViewport.addEventListener('scroll', setViewportVar89); }
  window.addEventListener('resize', setViewportVar89);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init89, {once:true}); else init89();
  setTimeout(init89,300); setTimeout(init89,1200); setInterval(markPopoverMode89, 1200);
})();


/* =====================================================================
   v33.22 - cierre final del chat. Este bloque queda ultimo dentro del
   modulo para que ningun parche viejo vuelva a pisar scroll, foco,
   lectura admin, notificaciones o escritura en vivo.
   ===================================================================== */
(function(){
  const TYPING_MAX_AGE = 12000;
  const VISITOR_CHAT_WIDTH = 330;

  function adminActiveFinal(){
    try{
      const pop = document.getElementById('chat-popover');
      const adminUi = !!(pop && pop.querySelector('#chat-admin-text,.chat-inbox-side,.chat-admin-tools'));
      if(document.body.classList.contains('tomauno-visitor-active') && !adminUi) return false;
      return isAdminNotifier();
    }catch(e){ return false; }
  }
  function visitorTypingNow(){
    const pop = document.getElementById('chat-popover');
    const inp = document.getElementById('chat-text');
    return !!(pop && pop.classList.contains('open') && inp && document.activeElement === inp && !adminActiveFinal());
  }
  function chatTypingText(chat){
    const lt = chat && chat.liveTyping;
    if(!lt || !lt.text || !lt.at || Date.now() - Number(lt.at) > TYPING_MAX_AGE) return '';
    return String(lt.text || '').trim();
  }
  function chatIsHumanFinal(chat){
    return !!(chat && (chat.humanMode || Number(chat.manualUntil || 0) > Date.now()));
  }
  function applyChatModeButtonFinal(id){
    const chat = chatsDB && chatsDB[id];
    const btn = document.querySelector('#chat-popover.open .chat-admin-tools .chat-filter.auto');
    if(!btn || !chat) return;
    const human = chatIsHumanFinal(chat);
    btn.classList.toggle('on', !human);
    btn.textContent = human ? '👤 HUMANO' : '🤖 AUTO';
    btn.title = human ? 'Este chat está en atención humana. Clic para volver a automático.' : 'Este chat está en automático. Clic para tomarlo manualmente.';
  }
  function adminViewingChatFinal(chatId){
    const pop = document.getElementById('chat-popover');
    return !!(chatId && pop && pop.classList.contains('open') && currentOpenChatId === chatId && pop.querySelector('#chat-admin-text,.chat-inbox-side'));
  }
  async function clearTypingMessagesFinal(chatId){
    try{
      const c = chatsDB && chatsDB[chatId];
      if(!c || !c.messages) return;
      const deletions = Object.entries(c.messages)
        .filter(([,m]) => m && m.typing)
        .map(([mid]) => remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+mid)).catch(()=>{}));
      if(deletions.length) await Promise.all(deletions);
    }catch(e){}
  }
  function beepStrongFinal(){
    try{ beep(); }catch(e){}
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if(!Ctx) return;
      const ctx = new Ctx();
      if(ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      [660, 920, 1180].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.11);
        gain.gain.setValueAtTime(0.0001, now + i * 0.11);
        gain.gain.exponentialRampToValueAtTime(0.32, now + i * 0.11 + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.11 + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.11);
        osc.stop(now + i * 0.11 + 0.18);
      });
      setTimeout(() => { try{ ctx.close(); }catch(e){} }, 900);
    }catch(e){}
  }
  function visitorChatIdFinal(){
    try{ return currentVisitorChatId || sessionStorage.getItem('tomauno-chat-id') || ''; }
    catch(e){ return currentVisitorChatId || ''; }
  }
  function syncChatGlobalsFinal(){
    try{
      window.currentVisitorChatId = currentVisitorChatId || '';
      window.currentOpenChatId = currentOpenChatId || '';
    }catch(e){}
  }
  function looksLikeRealNameFinal(text){
    const raw = String(text || '').trim();
    const clean = limpiarNombreChat(raw.replace(/^(me llamo|mi nombre es|soy)\s+/i,'').trim());
    if(clean && clean !== raw) return looksLikeRealNameFinal(clean);
    if(!raw || raw.length < 2 || raw.length > 36) return false;
    if(/[?¿!¡@#:/\\0-9]/.test(raw)) return false;
    if(/\b(info|curso|cursos|precio|precios|manualidades|quiero|consulta|consultar|hola|buenas|turno|inscribir|inscripcion|whatsapp|telefono|donde|ubicacion|servicio|servicios)\b/i.test(raw)) return false;
    return /^[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+(?:\s+[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+){0,2}$/.test(raw);
  }
  function hasRealVisitorNameFinal(chat){
    try{ return tieneNombreRealChat(chat); }
    catch(e){
      const n = String(chat && chat.name || '').trim();
      return !!(n && !/^Usuario\s+[A-Z]$/i.test(n) && !/consulta web|visitante|sin nombre/i.test(n));
    }
  }
  function safeDetectedNameFinal(text, chat){
    const raw = String(text || '').trim();
    if(!raw || /[?Â¿!Â¡@#:/\\0-9]/.test(raw)) return '';
    if(/\b(info|curso|cursos|precio|precios|manualidades|quiero|consulta|consultar|contacto|javier|servicio|servicios|ubicacion|telefono|whatsapp|donde|cuando|cuanto|pasas|tenes|hola|buenas)\b/i.test(raw)) return '';
    const explicit = /^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw);
    const asked = lastAdminAskedName(chat);
    if(!explicit && !asked) return '';
    const n = isJustNameReply(text, chat);
    return looksLikeRealNameFinal(n) ? limpiarNombreChat(n) : '';
  }
  function activityItemsFinal(){
    const arr = [];
    try{ Object.entries(cursos || {}).forEach(([id,c]) => { if(!c.oculto) arr.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.profesor,c.disertante,c.organizador,c.docente,c.responsable,c.nombreOrg,c.ig,c.wp].join(' ')}); }); }catch(e){}
    try{ Object.entries(eventosDB || {}).forEach(([id,e]) => { if(e.estado === 'activo' && !e.oculto) arr.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.nombreOrg,e.organizador,e.ig,e.wpOrg,e.lugar].join(' ')}); }); }catch(e){}
    try{ Object.entries(serviciosDB || {}).forEach(([id,s]) => { if(!s.oculto) arr.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.profesor,s.disertante,s.organizador,s.responsable,s.ig,s.wp].join(' ')}); }); }catch(e){}
    return arr;
  }
  function bestActivityByTitleFinal(text){
    const q = normAI(text || '');
    const stop = new Set(['quien','quién','es','el','la','los','las','del','de','curso','taller','evento','servicio','profesor','profesora','profe','docente','disertante','organizador','organiza','responsable','dueño','dueno','academia','tomauno','nivel','principiante']);
    const qTerms = q.split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
    let best = null;
    activityItemsFinal().forEach(it => {
      const title = normAI(it.title);
      const extra = normAI(it.extra);
      let score = 0;
      qTerms.forEach(t => {
        if(title.includes(t)) score += 4;
        else if(extra.includes(t)) score += 1;
      });
      if(title && q.includes(title)) score += 12;
      if(/fotograf/.test(q) && /fotograf/.test(title)) score += 5;
      if(/danzaterapia|danza/.test(q) && /danzaterapia|danza/.test(title + ' ' + extra)) score += 7;
      if(score > 0 && (!best || score > best.score)) best = Object.assign({score}, it);
    });
    return best && best.score >= 5 ? best : null;
  }
  function activityProfessorAnswerFinal(item){
    const o = item && item.obj || {};
    const who = o.profesor || o.disertante || o.docente || o.responsable || o.organizador || o.nombreOrg || '';
    const wp = o.wp || o.wpOrg || o.contacto || '';
    if(who || wp){
      return '**' + (item.title || 'Actividad') + '**\n' +
        (who ? '👤 Profesor/organizador: ' + who + '\n' : '') +
        (wp ? '💬 Contacto: https://wa.me/549' + String(wp).replace(/\D/g,'') : '');
    }
    return 'Para **' + (item.title || 'esa actividad') + '** no tengo cargado todavía el profesor u organizador. Puedo dejar tu consulta marcada para Javier.';
  }
  function installFinalCss(){
    if(document.getElementById('tu-v3322-chat-css')) return;
    const st = document.createElement('style');
    st.id = 'tu-v3322-chat-css';
    st.textContent = `
      body.tomauno-visitor-active .chat-popover.open:not(.expanded):not(:has(.chat-inbox-side)),
      body.tomauno-visitor-active .chat-popover.open.expanded:not(:has(.chat-inbox-side)),
      body:not(.tomauno-admin-active) .chat-popover.open:not(.expanded):not(:has(.chat-inbox-side)),
      body:not(.tomauno-admin-active) .chat-popover.open.expanded:not(:has(.chat-inbox-side)),
      .chat-popover.tomauno-chat-visitor.open:not(.expanded),
      .chat-popover.tomauno-chat-visitor.open.expanded,
      .chat-popover.tu89-visitor.open:not(.expanded),
      .chat-popover.tu89-visitor.open.expanded{
        left:auto!important;
        top:auto!important;
        transform:none!important;
        width:min(${VISITOR_CHAT_WIDTH}px, calc(100vw - 22px))!important;
        max-width:min(${VISITOR_CHAT_WIDTH}px, calc(100vw - 22px))!important;
        min-width:0!important;
        right:18px!important;
        bottom:82px!important;
        resize:none!important;
      }
      html body #chat-popover.open.tomauno-chat-visitor,
      html body #chat-popover.open.tomauno-chat-visitor.expanded,
      html body #chat-popover.open.tu89-visitor,
      html body #chat-popover.open.tu89-visitor.expanded,
      html body.tomauno-visitor-active #chat-popover.open,
      html body.tomauno-visitor-active #chat-popover.open.expanded,
      html body:not(.tomauno-admin-active) #chat-popover.open:not(:has(.chat-inbox-side)),
      html body:not(.tomauno-admin-active) #chat-popover.open.expanded:not(:has(.chat-inbox-side)){
        left:auto!important;
        top:auto!important;
        transform:none!important;
        width:min(${VISITOR_CHAT_WIDTH}px, calc(100vw - 22px))!important;
        max-width:min(${VISITOR_CHAT_WIDTH}px, calc(100vw - 22px))!important;
        min-width:0!important;
        right:16px!important;
        bottom:82px!important;
        height:min(58vh, 520px)!important;
        max-height:min(58vh, 520px)!important;
        min-height:0!important;
        resize:none!important;
      }
      html body.tomauno-visitor-active #chat-popover.open .chat-msgs,
      html body:not(.tomauno-admin-active) #chat-popover.open:not(:has(.chat-inbox-side)) .chat-msgs{
        min-height:0!important;
        padding-bottom:8px!important;
      }
      html body #chat-popover.open:has(.chat-list-item) .chat-popover-inner{
        max-height:calc(100vh - 82px)!important;
        overflow-y:auto!important;
        padding-right:10px!important;
      }
      html body #chat-popover.open:has(.chat-list-item){
        max-height:calc(100vh - 42px)!important;
      }
      html body #chat-popover.open .chat-list-item.priority{
        border-color:rgba(255,214,80,.55)!important;
        box-shadow:inset 3px 0 0 rgba(255,214,80,.95)!important;
      }
      html body #chat-popover.open.tu-human-chat,
      html body #chat-popover.open.tu-human-chat .chat-popover-inner{
        border-color:rgba(255,0,10,.85)!important;
        box-shadow:0 0 0 1px rgba(255,0,10,.45),0 0 24px rgba(255,0,10,.35)!important;
      }
      html body #chat-popover.open.tu-auto-chat,
      html body #chat-popover.open.tu-auto-chat .chat-popover-inner{
        border-color:rgba(255,255,255,.16)!important;
      }
      #notif-banner{
        z-index:99999!important;
      }
      .chat-live-typing{
        margin:8px 0 2px;
        padding:8px 10px;
        border:1px solid rgba(255,204,0,.32);
        background:rgba(255,204,0,.08);
        color:#ffe47a;
        border-radius:10px;
        font-size:11px;
        line-height:1.35;
      }
      .chat-live-typing strong{
        display:block;
        color:#fff;
        font-size:10px;
        letter-spacing:.08em;
        text-transform:uppercase;
        margin-bottom:3px;
      }
      .chat-human-countdown{
        margin-top:10px;
        display:inline-flex;
        align-items:center;
        gap:6px;
        border:1px solid rgba(255,255,255,.22);
        background:rgba(0,0,0,.18);
        color:#fff;
        border-radius:999px;
        padding:6px 10px;
        font-size:11px;
        font-weight:800;
      }
      .chat-human-countdown-num{
        display:inline-flex;
        align-items:center;
        justify-content:center;
        min-width:26px;
        height:24px;
        border-radius:50%;
        background:#fff;
        color:#e8000a;
        font-size:13px;
        font-weight:900;
      }
      .chat-tab.typing-live .chat-tab-preview,
      .chat-list-item.typing-live .tu-live-list-preview{color:#ffe47a!important;}
      .chat-tab.typing-live .chat-tab-light{
        background:#ffcc00!important;
        box-shadow:0 0 0 4px rgba(255,204,0,.16),0 0 14px rgba(255,204,0,.55)!important;
      }
      @media(max-width:700px){
        body.tomauno-visitor-active .chat-popover.open,
        body:not(.tomauno-admin-active) .chat-popover.open,
        .chat-popover.tomauno-chat-visitor.open,
        .chat-popover.tu89-visitor.open{
          width:auto!important;
          left:10px!important;
          right:10px!important;
          height:calc(100dvh - var(--tomauno-keyboard, 0px) - 22px)!important;
          max-height:calc(100dvh - var(--tomauno-keyboard, 0px) - 22px)!important;
        }
      }
    `;
    document.head.appendChild(st);
  }
  function preserveDraft(fn){
    const inp = document.getElementById('chat-text');
    const box = document.getElementById('chat-msgs');
    const keep = inp ? {value:inp.value,start:inp.selectionStart,end:inp.selectionEnd,focused:document.activeElement===inp} : null;
    const top = box ? box.scrollTop : 0;
    const r = fn();
    if(Date.now() < (window.__tomaunoVisitorSendingUntil || 0)) return r;
    if(keep && keep.focused){
      const next = document.getElementById('chat-text');
      if(next){
        next.value = keep.value;
        try{ next.focus({preventScroll:true}); next.setSelectionRange(keep.start, keep.end); }
        catch(e){ try{ next.focus(); }catch(_e){} }
      }
      const newBox = document.getElementById('chat-msgs');
      if(newBox) newBox.scrollTop = top;
    }
    return r;
  }
  function updateVisitorModeChromeFinal(id){
    const pop = document.getElementById('chat-popover');
    if(!pop || !pop.classList.contains('open') || adminActiveFinal()) return;
    const chat = chatsDB && chatsDB[id || visitorChatIdFinal()];
    const human = chatIsHumanFinal(chat);
    pop.classList.toggle('tu-human-chat', human);
    pop.classList.toggle('tu-auto-chat', !human);
    const sub = pop.querySelector('.chat-subline');
    if(sub) sub.textContent = human ? 'Javier está respondiendo' : 'Asistente Tomauno';
  }

  const prevScrollFinal = scrollChatSmart;
  scrollChatSmart = function(box){
    if(visitorTypingNow()) return;
    return prevScrollFinal.apply(this, arguments);
  };
  window.scrollChatSmart = scrollChatSmart;

  const prevUpdateMsgsFinal = updateChatMessagesOnly;
  updateChatMessagesOnly = function(id, adminView){
    if(visitorTypingNow()) return preserveDraft(() => prevUpdateMsgsFinal.call(this, id, false));
    const r = prevUpdateMsgsFinal.apply(this, arguments);
    setTimeout(renderLiveTypingFinal, 20);
    return r;
  };
  window.updateChatMessagesOnly = updateChatMessagesOnly;

  const prevOpenVisitorFinal = abrirChatVisitante;
  abrirChatVisitante = function(id, silent){
    currentVisitorChatId = id || currentVisitorChatId;
    syncChatGlobalsFinal();
    setTimeout(() => {
      if(adminActiveFinal()) return;
      const pop = document.getElementById('chat-popover');
      if(pop) pop.classList.remove('expanded', 'resizable', 'dragged');
    }, 0);
    if(visitorTypingNow() && id === visitorChatIdFinal()){
      updateChatMessagesOnly(id, false);
      return;
    }
    const r = preserveDraft(() => prevOpenVisitorFinal.apply(this, arguments));
    setTimeout(() => updateVisitorModeChromeFinal(id), 40);
    return r;
  };
  window.abrirChatVisitante = abrirChatVisitante;

  window.iniciarChatConNombre = async function(){
    if(currentVisitorChatId && chatsDB[currentVisitorChatId] && chatsDB[currentVisitorChatId].status !== 'cerrado'){
      const txt = document.getElementById('chat-text');
      if(txt && String(txt.value||'').trim()) return window.enviarChatVisitante(currentVisitorChatId);
      return abrirChatVisitante(currentVisitorChatId, true);
    }
    const rawName = (document.getElementById('chat-name')?.value || '').trim();
    const name = limpiarNombreChat(rawName);
    if(!looksLikeRealNameFinal(name)){
      toast('Escribi solo tu nombre para iniciar');
      const inp = document.getElementById('chat-name');
      if(inp){ inp.value=''; try{inp.focus({preventScroll:true});}catch(e){inp.focus();} }
      return;
    }
    window.__tomaunoVisitorSendingUntil = Date.now() + 1800;
    const nameInput = document.getElementById('chat-name');
    if(nameInput) nameInput.value = '';
    const now = Date.now();
    const chatRef = await push(ref(db,'tomauno/chats'), {
      name,
      wp:'',
      status:'abierto',
      createdAt:now,
      updatedAt:now,
      lastMsg:rawName,
      unreadAdmin:true,
      unreadVisitor:false,
      userOnline:true,
      userLastSeen:now
    });
    currentVisitorChatId = chatRef.key;
    currentOpenChatId = chatRef.key;
    syncChatGlobalsFinal();
    try{
      sessionStorage.setItem('tomauno-chat-id', currentVisitorChatId);
      sessionStorage.setItem('tomauno-chat-name', name);
    }catch(e){}
    await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {
      from:'admin',
      text:'Hola 😊\n¿Cómo es tu nombre?',
      time:chatTime(),
      createdAt:now - 2,
      auto:true,
      welcome:true
    });
    await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {
      from:'user',
      text:rawName,
      time:chatTime(),
      createdAt:now - 1
    });
    await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {
      from:'admin',
      text:'Hola '+name+' 😊 ¿En qué puedo ayudarte?',
      time:chatTime(),
      createdAt:Date.now(),
      auto:true
    });
    abrirChatVisitante(currentVisitorChatId, true);
    [40, 160, 420].forEach(ms => setTimeout(() => {
      const txt = document.getElementById('chat-text');
      const nam = document.getElementById('chat-name');
      if(txt) txt.value = '';
      if(nam) nam.value = '';
    }, ms));
  };

  const prevOpenAdminFinal = window.abrirChatAdmin;
  window.abrirChatAdmin = function(id, silent){
    currentOpenChatId = id || currentOpenChatId;
    syncChatGlobalsFinal();
    const r = prevOpenAdminFinal.apply(this, arguments);
    if(id){
      const readAt = Date.now();
      update(ref(db,'tomauno/chats/'+id), {
        unreadAdmin:false,
        adminReadAt:readAt
      }).catch(()=>{});
      try{
        const c = chatsDB[id];
        if(c) Object.assign(c, {
          unreadAdmin:false,
          adminReadAt:readAt
        });
      }catch(e){}
    }
    setTimeout(renderLiveTypingFinal, 30);
    setTimeout(decorateTypingListsFinal, 80);
    setTimeout(() => applyChatModeButtonFinal(id), 90);
    return r;
  };

  const prevNotifyFinal = notifyAdminChat;
  const notifySeenFinal = new Map();
  const prevShowNotifBannerFinal = showNotifBanner;
  showNotifBanner = function(titulo, detalle, icono='CHAT', onClick=null){
    prevShowNotifBannerFinal.call(this, titulo, detalle, icono, onClick);
    setTimeout(() => {
      const banner = document.getElementById('notif-banner');
      if(!banner || banner.querySelector('.notif-close-x')) return;
      const x = document.createElement('button');
      x.className = 'notif-close-x';
      x.type = 'button';
      x.textContent = '×';
      x.title = 'Cerrar notificación';
      x.style.cssText = 'position:absolute;top:7px;right:8px;width:24px;height:24px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:17px;font-weight:900;cursor:pointer;line-height:22px;';
      x.onclick = ev => {
        ev.preventDefault();
        ev.stopPropagation();
        if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        banner.style.transform = 'translateX(340px)';
      };
      banner.style.position = 'fixed';
      banner.appendChild(x);
    }, 0);
  };
  window.showNotifBanner = showNotifBanner;
  notifyAdminChat = function(title, body, chatId){
    if(!adminActiveFinal()) return;
    if(adminViewingChatFinal(chatId)) return;
    const sig = String(chatId || '') + '|' + String(title || '') + '|' + String(body || '').slice(0,90);
    const last = notifySeenFinal.get(sig) || 0;
    if(Date.now() - last < 6000) return;
    notifySeenFinal.set(sig, Date.now());
    try{ beepStrongFinal(); }catch(e){ try{ beep(); }catch(_e){} }
    try{
      showNotif();
      showNotifBanner(title || 'Nuevo mensaje web', body || 'Nuevo mensaje', 'CHAT', () => {
        if(chatId) window.abrirChatAdmin(chatId);
        else window.abrirPanelChatsAdmin && window.abrirPanelChatsAdmin();
      });
    }catch(e){
      try{ prevNotifyFinal.apply(this, arguments); }catch(_e){}
    }
    try{
      if('Notification' in window && Notification.permission === 'granted'){
        const n = new Notification(title || 'Nuevo mensaje web', {
          body: body || 'Nuevo mensaje desde la web',
          icon: 'https://i.imgur.com/oZnkCPD.png',
          badge: 'https://i.imgur.com/oZnkCPD.png',
          tag: chatId ? 'tomauno-chat-' + chatId : 'tomauno-chat',
          renotify:true,
          requireInteraction:false
        });
        n.onclick = () => {
          try{ window.focus(); }catch(e){}
          if(chatId) window.abrirChatAdmin(chatId);
          else window.abrirPanelChatsAdmin && window.abrirPanelChatsAdmin();
          n.close();
        };
      }
    }catch(e){}
    setTimeout(() => {
      const t = document.getElementById('toast');
      if(t && chatId){
        t.style.cursor = 'pointer';
        t.onclick = () => window.abrirChatAdmin(chatId);
      }
    }, 30);
  };
  window.notifyAdminChat = notifyAdminChat;

  window.tomaunoHumanAlarm = function(chatId, body){
    if(!adminActiveFinal()) return;
    beepStrongFinal();
    if(adminViewingChatFinal(chatId)) return;
    try{ notifyAdminChat('Atención humana solicitada', body || 'Hay una persona esperando a Javier', chatId); }catch(e){}
  };

  window.tomaunoToggleModoChatActual = async function(id){
    const chatId = id || currentOpenChatId;
    if(!chatId) return window.toggleModoAsistenteChat && window.toggleModoAsistenteChat();
    const c = (chatsDB && chatsDB[chatId]) || {};
    const toAuto = chatIsHumanFinal(c);
    if(toAuto){
      await update(ref(db,'tomauno/chats/'+chatId), {
        humanMode:false,
        manualUntil:0,
        waitingHuman:false,
        humanRequested:false,
        unreadAdmin:false
      }).catch(()=>{});
      await update(ref(db,'tomauno/asistente'), {modo:'automatico'}).catch(()=>{});
      try{ Object.assign(chatsDB[chatId] || {}, {humanMode:false, manualUntil:0, waitingHuman:false, humanRequested:false, unreadAdmin:false}); }catch(e){}
      toast('🤖 Este chat vuelve a automático', true);
    }else{
      await update(ref(db,'tomauno/chats/'+chatId), {
        humanMode:true,
        manualUntil:0,
        waitingHuman:false,
        humanRequested:false,
        unreadAdmin:false
      }).catch(()=>{});
      try{ Object.assign(chatsDB[chatId] || {}, {humanMode:true, manualUntil:0, waitingHuman:false, humanRequested:false, unreadAdmin:false}); }catch(e){}
      await clearTypingMessagesFinal(chatId);
      toast('👤 Este chat queda en humano', true);
    }
    applyChatModeButtonFinal(chatId);
    setTimeout(() => window.abrirChatAdmin && window.abrirChatAdmin(chatId, true), 80);
  };

  const prevToggleModeFinal = window.toggleModoAsistenteChat;
  window.toggleModoAsistenteChat = function(){
    if(isAdminNotifier() && currentOpenChatId && document.querySelector('#chat-popover.open #chat-admin-text')){
      return window.tomaunoToggleModoChatActual(currentOpenChatId);
    }
    return prevToggleModeFinal.apply(this, arguments);
  };

  const prevAdminSendFinal = window.enviarChatAdmin;
  window.enviarChatAdmin = async function(id, presetText=''){
    const chatId = id || currentOpenChatId;
    const r = await prevAdminSendFinal.apply(this, arguments);
    if(chatId){
      const manualUntil = Date.now() + 1000 * 60 * 60;
      await update(ref(db,'tomauno/chats/'+chatId), {
        humanMode:true,
        manualUntil,
        unreadAdmin:false,
        waitingHuman:false,
        humanRequested:false
      }).catch(()=>{});
      try{
        if(chatsDB[chatId]) Object.assign(chatsDB[chatId], {
          humanMode:true,
          manualUntil,
          unreadAdmin:false,
          waitingHuman:false,
          humanRequested:false
        });
      }catch(e){}
      await clearTypingMessagesFinal(chatId);
    }
    return r;
  };

  const prevAutoResponderFinal = responderAutomaticoChat || window.responderAutomaticoChat;
  if(typeof prevAutoResponderFinal === 'function'){
    const guardedAutoResponderFinal = async function(chatId, text){
      const c = chatsDB && chatsDB[chatId];
      if(c && (c.humanMode || Number(c.manualUntil || 0) > Date.now())) return;
      try{
        const snap = await get(ref(db,'tomauno/chats/'+chatId));
        if(snap.exists()){
          const fresh = snap.val() || {};
          if(fresh.humanMode || Number(fresh.manualUntil || 0) > Date.now()) return;
        }
      }catch(e){}
      return prevAutoResponderFinal.apply(this, arguments);
    };
    responderAutomaticoChat = guardedAutoResponderFinal;
    window.responderAutomaticoChat = guardedAutoResponderFinal;
  }

  const prevBuscarRespuestaFinal = buscarRespuestaAsistente;
  buscarRespuestaAsistente = function(text){
    const q = normAI(text || '');
    if(/(quien|quién|profesor|profesora|profe|docente|disertante|organizador|organiza|responsable).{0,80}(curso|taller|evento|servicio|fotograf|danzaterapia|danza)|((curso|taller|evento|servicio|fotograf|danzaterapia|danza).{0,80}(quien|quién|profesor|profesora|profe|docente|disertante|organizador|organiza|responsable))/.test(q)){
      const item = bestActivityByTitleFinal(text);
      if(item) return activityProfessorAnswerFinal(item);
    }
    if(/(quien|quién).{0,30}(dueno|dueño|javier|fundador|director)|((dueno|dueño|javier|fundador|director).{0,30}(tomauno|academia|estudio))/.test(q)){
      try{
        const matches = knowledgeMatchesAI(q);
        const good = matches.find(m => /javier|dueñ|duen|fundador|director|tomauno/i.test([m.k.titulo||'',m.k.keys||'',m.k.command||''].join(' ')));
        if(good && good.k && good.k.respuesta) return good.k.respuesta;
      }catch(e){}
      return 'Tomauno está dirigido por Javier. Si querés, también puedo pasarte su contacto directo.';
    }
    return prevBuscarRespuestaFinal.apply(this, arguments);
  };

  let typingTimerFinal = 0;
  let lastTypingSentFinal = '';
  function sendTypingFinal(forceClear=false){
    const id = visitorChatIdFinal();
    if(!id || adminActiveFinal()) return;
    const inp = document.getElementById('chat-text');
    const text = forceClear ? '' : String(inp?.value || '').trim();
    if(text === lastTypingSentFinal && !forceClear) return;
    lastTypingSentFinal = text;
    update(ref(db,'tomauno/chats/'+id+'/liveTyping'), {text, at:Date.now()}).catch(()=>{});
  }
  document.addEventListener('input', ev => {
    if(!ev.target || ev.target.id !== 'chat-text') return;
    clearTimeout(typingTimerFinal);
    typingTimerFinal = setTimeout(() => sendTypingFinal(false), 15);
  }, true);
  document.addEventListener('blur', ev => {
    if(ev.target && ev.target.id === 'chat-text') setTimeout(() => sendTypingFinal(true), 2500);
  }, true);

  let lastDirectVisitorSendFinal = {id:'', text:'', at:0};
  const prevVisitorSendFinal = window.enviarChatVisitante;

  async function ensureVisitorChatIdV24(){
    let id = '';
    try{ id = currentVisitorChatId || sessionStorage.getItem('tomauno-chat-id') || ''; }catch(e){ id = currentVisitorChatId || ''; }
    if(id) return id;

    const now = Date.now();
    let name = '';
    try{ name = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}
    name = limpiarNombreChat(name || 'Visitante');

    const chatRef = await push(ref(db,'tomauno/chats'), {
      name,
      wp:'',
      status:'abierto',
      createdAt:now,
      updatedAt:now,
      lastMsg:'',
      lastUserMsg:'',
      lastUserAt:0,
      unreadAdmin:false,
      unreadVisitor:false,
      userOnline:true,
      userLastSeen:now
    });

    id = chatRef.key;
    currentVisitorChatId = id;
    window.currentVisitorChatId = id;
    try{ sessionStorage.setItem('tomauno-chat-id', id); }catch(e){}
    return id;
  }

  async function sendVisitorDirectFinal(id){
    id = id || visitorChatIdFinal() || currentVisitorChatId;
    if(!id) id = await ensureVisitorChatIdV24();

    const inp = document.getElementById('chat-text');
    const text = String(inp?.value || '').trim();
    if(!text) return;

    if(lastDirectVisitorSendFinal.id === id && lastDirectVisitorSendFinal.text === text && Date.now() - lastDirectVisitorSendFinal.at < 1200) return;
    lastDirectVisitorSendFinal = {id, text, at:Date.now()};

    window.__tomaunoVisitorSendingUntil = Date.now() + 1800;

    if(inp){
      inp.value = '';
      try{ inp.focus({preventScroll:true}); }catch(e){ try{ inp.focus(); }catch(_e){} }
    }

    await update(ref(db,'tomauno/chats/'+id+'/liveTyping'), {text:'', at:Date.now()}).catch(()=>{});
    lastTypingSentFinal = '';

    let existingChat = chatsDB?.[id] || {};
    try{
      const snap = await get(ref(db,'tomauno/chats/'+id));
      if(snap.exists()) existingChat = snap.val() || existingChat;
    }catch(e){}

    let fallbackName = '';
    try{ fallbackName = sessionStorage.getItem('tomauno-chat-name') || ''; }catch(e){}

    const detectedName = safeDetectedNameFinal(text, existingChat);
    const keepName = hasRealVisitorNameFinal(existingChat) ? limpiarNombreChat(existingChat.name || '') : '';
    const repairedName = limpiarNombreChat(keepName || detectedName || fallbackName || chatAnonName(id, existingChat));
    const now = Date.now();

    try{
      await push(ref(db,'tomauno/chats/'+id+'/messages'), {
        from:'user',
        text,
        time:chatTime(),
        createdAt:now
      });
    }catch(saveErr){
      await new Promise(resolve => setTimeout(resolve, 260));
      try{
        await push(ref(db,'tomauno/chats/'+id+'/messages'), {
          from:'user',
          text,
          time:chatTime(),
          createdAt:Date.now()
        });
      }catch(saveErr2){
        const retryInput = document.getElementById('chat-text');
        if(retryInput) retryInput.value = text;
        throw saveErr2;
      }
    }

    const upd = {
      name:repairedName,
      status:'abierto',
      updatedAt:now,
      lastMsg:text,
      lastUserMsg:text,
      lastUserAt:now,
      unreadAdmin:true,
      userOnline:true,
      userLastSeen:now
    };

    await update(ref(db,'tomauno/chats/'+id), upd);
    try{ chatsDB[id] = Object.assign({}, chatsDB[id] || existingChat || {}, upd); }catch(e){}

    try{ if(detectedName && !keepName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}

    try{ updateChatMessagesOnly(id, false); }catch(e){}
    setTimeout(()=>{ try{ updateChatMessagesOnly(id, false); }catch(e){} }, 120);

    window.__tomaunoVisitorSendingUntil = Date.now() + 900;

    // Si el texto fue solo el nombre, no responder como si fuera consulta.
    if(detectedName && lastAdminAskedName(existingChat)) return;

    setTimeout(() => responderAutomaticoChat(id, text), 280);
  }

  window.enviarChatVisitante = sendVisitorDirectFinal;
  window.tomaunoEnviarVisitanteDirecto = sendVisitorDirectFinal;

  window.addEventListener('keydown', ev => {
    if(ev && ev.key === 'Enter' && ev.target && ev.target.id === 'chat-name'){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      window.iniciarChatConNombre();
      return;
    }
    if(!ev || ev.key !== 'Enter' || !ev.target || ev.target.id !== 'chat-text') return;
    const id = visitorChatIdFinal() || currentVisitorChatId || (() => { try{ return sessionStorage.getItem('tomauno-chat-id') || ''; }catch(e){ return ''; } })();
    if(!id) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    sendVisitorDirectFinal(id).finally(() => {
      const inp = document.getElementById('chat-text');
      if(inp) inp.value = '';
    });
  }, true);

  window.addEventListener('click', ev => {
    const btn = ev.target && ev.target.closest && ev.target.closest('#chat-popover.open .chat-name-row .chat-send');
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.iniciarChatConNombre();
  }, true);

  window.addEventListener('click', ev => {
    const btn = ev.target && ev.target.closest && ev.target.closest('#chat-popover.open .chat-send');
    const inp = document.getElementById('chat-text');
    if(!btn || !inp || !btn.closest('.chat-row')) return;
    const id = visitorChatIdFinal() || currentVisitorChatId || (() => { try{ return sessionStorage.getItem('tomauno-chat-id') || ''; }catch(e){ return ''; } })();
    if(!id) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    sendVisitorDirectFinal(id);
  }, true);

  function renderLiveTypingFinal(){
    if(!adminActiveFinal()) return;
    const pop = document.getElementById('chat-popover');
    if(!pop || !pop.classList.contains('open')) return;
    const id = currentOpenChatId;
    if(!id || !chatsDB[id]) return;
    const text = chatTypingText(chatsDB[id]);
    const msgs = pop.querySelector('.chat-msgs');
    let box = pop.querySelector('.chat-live-typing');
    if(!text){
      if(box) box.remove();
      return;
    }
    if(!box){
      box = document.createElement('div');
      box.className = 'chat-live-typing chat-bubble user';
      if(msgs) msgs.appendChild(box);
    }
    box.innerHTML = '<strong>Escribiendo ahora</strong>' + escHtml(text);
  }

  function decorateTypingListsFinal(){
    if(adminActiveFinal()){
      document.querySelectorAll('.chat-list-item,.chat-tab').forEach(el => {
        el.classList.remove('typing-live');
        el.querySelectorAll('.tu-live-list-preview').forEach(n => n.remove());
        const prev = el.querySelector('.chat-tab-preview');
        if(prev && /^Escribiendo\s*:/i.test(prev.textContent || '')) prev.textContent = '';
      });
    }
    return;
    if(!adminActiveFinal()) return;
    document.querySelectorAll('.chat-list-item,.chat-tab').forEach(el => el.classList.remove('typing-live'));
    Object.entries(chatsDB || {}).forEach(([id,c]) => {
      const text = chatTypingText(c);
      if(!text) return;
      document.querySelectorAll('.chat-list-item,.chat-tab').forEach(el => {
        const onclick = el.getAttribute('onclick') || '';
        if(!onclick.includes("abrirChatAdmin('"+id+"')")) return;
        el.classList.add('typing-live');
        const prev = el.querySelector('.chat-tab-preview');
        if(prev) prev.textContent = 'Escribiendo: ' + text;
        if(el.classList.contains('chat-list-item') && !el.querySelector('.tu-live-list-preview')){
          const line = document.createElement('div');
          line.className = 'tu-live-list-preview';
          line.style.cssText = 'font-size:11px;margin-top:2px;max-width:245px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          line.textContent = 'Escribiendo: ' + text;
          const body = el.querySelector('div[style*="flex:1"]') || el.firstElementChild;
          if(body) body.appendChild(line);
        }
      });
    });
  }

  function updateHumanCountdownFinal(){
    document.querySelectorAll('.chat-human-countdown[data-human-wait-start]').forEach(el => {
      const start = Number(el.getAttribute('data-human-wait-start') || 0);
      const num = el.querySelector('.chat-human-countdown-num');
      if(!start || !num) return;
      const remain = Math.max(0, 60 - Math.floor((Date.now() - start) / 1000));
      num.textContent = String(remain);
      if(remain <= 0){
        el.classList.add('done');
        el.innerHTML = '<span class="chat-human-countdown-num">0</span>Javier puede responder en cualquier momento';
      }
    });
  }

  onValue(ref(db,'tomauno/chats'), snap => {
    chatsDB = snap.exists() ? snap.val() : {};
    syncChatGlobalsFinal();
    renderLiveTypingFinal();
    decorateTypingListsFinal();
    updateHumanCountdownFinal();
    updateVisitorModeChromeFinal(visitorChatIdFinal());
  });

  const prevSetChatPopoverFinal = setChatPopover;
  setChatPopover = function(html){
    const active = document.activeElement;
    const pop = document.getElementById('chat-popover');
    const visitorInputActive = !!(
      active &&
      (active.id === 'chat-name' || active.id === 'chat-text') &&
      pop &&
      pop.classList.contains('open') &&
      !adminActiveFinal()
    );
    if(visitorInputActive){
      const oldId = active.id;
      const oldVal = active.value || '';
      const oldStart = active.selectionStart || 0;
      const oldEnd = active.selectionEnd || oldStart;
      const out = prevSetChatPopoverFinal.apply(this, arguments);
      setTimeout(() => {
        const next = document.getElementById(oldId);
        if(next && oldVal && !(next.value || '').trim()){
          next.value = oldVal;
          try{ next.focus({preventScroll:true}); next.setSelectionRange(oldStart, oldEnd); }catch(e){ try{ next.focus(); }catch(_e){} }
        }
      }, 0);
      return out;
    }
    return prevSetChatPopoverFinal.apply(this, arguments);
  };
  window.setChatPopover = setChatPopover;

  installFinalCss();
  syncChatGlobalsFinal();
  setInterval(() => { renderLiveTypingFinal(); decorateTypingListsFinal(); updateHumanCountdownFinal(); }, 1000);
})();


// ── TOMAUNO v24 HOTFIX FINAL ────────────────────────────────────────────────
// Objetivo: primer envío estable, maximizar sin temblores, limpiar duplicados
// de "Escribiendo", y evitar notificaciones por mensajes del asistente.
(function(){
  'use strict';

  function safe(fn){ try{return fn();}catch(e){ try{console.warn('tomauno v24:', e);}catch(_){} } }

  function isAdminView(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok') === '1' ||
             localStorage.getItem('tomauno-admin-notify') === '1' ||
             !!document.querySelector('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools');
    }) || false;
  }

  function stableChatBox(){
    return document.querySelector('#chat-popover.open .chat-msgs');
  }

  // Maximizar visitante: no debe disparar scroll loops.
  window.tomaunoToggleChatMaxV24 = function(){
    safe(function(){
      const pop = document.getElementById('chat-popover');
      if(!pop) return;
      pop.classList.toggle('expanded');
      pop.classList.toggle('tomauno-expanded');
      document.body.classList.toggle('chat-open-mobile', pop.classList.contains('expanded'));
      setTimeout(function(){
        const box = stableChatBox();
        if(box) box.scrollTop = box.scrollHeight;
      }, 60);
    });
  };

  // Captura clicks de botones de maximizar si existen con clases/títulos comunes.
  document.addEventListener('click', function(ev){
    const btn = ev.target && ev.target.closest && ev.target.closest(
      '#chat-popover.open .chat-max,#chat-popover.open .chat-expand,#chat-popover.open [data-chat-max],#chat-popover.open [title*="Max"],#chat-popover.open [title*="max"]'
    );
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    window.tomaunoToggleChatMaxV24();
  }, true);

  // Limpia el "Escribiendo:" duplicado en la lista izquierda.
  function cleanTypingList(){
    safe(function(){
      document.querySelectorAll('.tu-live-list-preview').forEach(n => n.remove());
      document.querySelectorAll('.chat-tab.typing-live,.chat-list-item.typing-live').forEach(el => el.classList.remove('typing-live'));
      document.querySelectorAll('.chat-tab-preview').forEach(el => {
        if(/^Escribiendo\s*:/i.test(el.textContent || '')) el.textContent = '';
      });
    });
  }

  // Evita que mensajes "typing" viejos queden como burbuja duplicada.
  function cleanOldTypingBubbles(){
    safe(function(){
      document.querySelectorAll('#chat-popover.open .chat-bubble.typing').forEach(b => {
        if(!/Escribiendo ahora/i.test(b.textContent || '')) b.remove();
      });
    });
  }

  // Si el usuario está escribiendo, nadie debe forzar scroll arriba/abajo.
  let userWritingUntil = 0;
  document.addEventListener('input', function(ev){
    if(ev.target && (ev.target.id === 'chat-text' || ev.target.id === 'chat-name')){
      userWritingUntil = Date.now() + 1800;
    }
  }, true);

  document.addEventListener('scroll', function(ev){
    const box = ev.target;
    if(box && box.classList && box.classList.contains('chat-msgs')){
      if(Date.now() < userWritingUntil){
        ev.stopPropagation();
      }
    }
  }, true);

  // CSS final de estabilidad.
  function css(){
    if(document.getElementById('tomauno-v24-final-css')) return;
    const st = document.createElement('style');
    st.id = 'tomauno-v24-final-css';
    st.textContent = `
      html body #chat-popover.open .chat-msgs{
        scroll-behavior:auto!important;
        overscroll-behavior:contain!important;
      }
      html body #chat-popover.open.tomauno-expanded,
      html body #chat-popover.open.expanded{
        width:min(760px,calc(100vw - 28px))!important;
        height:min(78vh,760px)!important;
        max-height:min(78vh,760px)!important;
      }
      @media(max-width:700px){
        html body #chat-popover.open.tomauno-expanded,
        html body #chat-popover.open.expanded{
          left:8px!important;
          right:8px!important;
          bottom:8px!important;
          width:auto!important;
          height:calc(100dvh - 18px)!important;
          max-height:calc(100dvh - 18px)!important;
        }
      }
      html body .chat-list-item .tu-live-list-preview{display:none!important;}
    `;
    document.head.appendChild(st);
  }

  css();
  cleanTypingList();
  cleanOldTypingBubbles();
  setInterval(cleanTypingList, 500);
  setInterval(cleanOldTypingBubbles, 900);
})();


// ── TOMAUNO v25 HOTFIX FINAL ────────────────────────────────────────────────
// Sonido primer mensaje, estados visuales, typing visible, fullscreen admin centrado,
// y botones rápidos visitante. No reemplaza funciones core: actúa como capa segura.
(function(){
  'use strict';

  function safe(fn){ try{return fn();}catch(e){ try{console.warn('tomauno v25:', e);}catch(_){} } }
  function now(){ return Date.now(); }

  function isAdmin(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok') === '1' ||
             localStorage.getItem('tomauno-admin-notify') === '1' ||
             !!document.querySelector('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools');
    }) || false;
  }

  function currentOpenId(){
    return safe(function(){
      return window.currentOpenChatId || window.currentVisitorChatId || sessionStorage.getItem('tomauno-chat-id') || '';
    }) || '';
  }

  function chats(){
    return safe(function(){ return window.chatsDB || {}; }) || {};
  }

  function lastUserMsg(c){
    let best = null;
    const ms = c && c.messages ? c.messages : {};
    Object.keys(ms || {}).forEach(k => {
      const m = ms[k] || {};
      if(m.from === 'user' && !m.typing && String(m.text || '').trim()){
        if(!best || Number(m.createdAt || 0) > Number(best.createdAt || 0)) best = m;
      }
    });
    return best;
  }

  // Sonido propio, no depende de beep() viejo.
  function tuBeep(level){
    safe(function(){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      const ctx = new AC();
      const t = ctx.currentTime;
      const pattern = level === 'human' ? [760, 980, 1180] : [860, 1040];
      pattern.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * .18);
        gain.gain.setValueAtTime(.0001, t + i * .18);
        gain.gain.exponentialRampToValueAtTime(level === 'human' ? .22 : .14, t + i * .18 + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, t + i * .18 + .15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * .18);
        osc.stop(t + i * .18 + .17);
      });
      setTimeout(() => safe(() => ctx.close()), 900);
    });
  }

  const seenUserSound = Object.create(null);
  const seenHumanSound = Object.create(null);

  // Sonar por mensaje real del usuario, incluyendo el nombre inicial.
  function soundForRealUserMessages(){
    safe(function(){
      if(!isAdmin()) return;
      const dbs = chats();
      Object.keys(dbs || {}).forEach(id => {
        const c = dbs[id] || {};
        if(c.status === 'cerrado') return;

        const m = lastUserMsg(c);
        if(!m) return;

        const stamp = id + '|' + String(m.createdAt || '') + '|' + String(m.text || '').slice(0,60);
        if(seenUserSound[stamp]) return;

        // Evita sonar por historial viejo al abrir la página.
        const age = now() - Number(m.createdAt || 0);
        if(age > 1000 * 60 * 3){
          seenUserSound[stamp] = 1;
          return;
        }

        seenUserSound[stamp] = 1;
        tuBeep(c.humanRequested || c.waitingHuman || c.priority ? 'human' : 'normal');
      });
    });
  }

  // Sonido fuerte cuando el usuario pidió humano.
  function soundForHumanRequest(){
    safe(function(){
      if(!isAdmin()) return;
      const dbs = chats();
      Object.keys(dbs || {}).forEach(id => {
        const c = dbs[id] || {};
        if(!(c.humanRequested || c.waitingHuman || c.priority)) return;

        const stamp = id + '|' + String(c.updatedAt || c.lastUserAt || '');
        if(seenHumanSound[stamp]) return;

        const age = now() - Number(c.updatedAt || c.lastUserAt || 0);
        if(age > 1000 * 60 * 5){
          seenHumanSound[stamp] = 1;
          return;
        }

        seenHumanSound[stamp] = 1;
        tuBeep('human');
        setTimeout(() => tuBeep('human'), 480);
      });
    });
  }

  // Al abrir un chat admin se marca leído y apaga amarillo.
  const oldAbrir = window.abrirChatAdmin;
  if(typeof oldAbrir === 'function' && !oldAbrir.__tuV25ReadWrap){
    const wrapped = function(chatId){
      const r = oldAbrir.apply(this, arguments);
      safe(function(){
        if(chatId && typeof db !== 'undefined' && typeof ref !== 'undefined' && typeof update !== 'undefined'){
          update(ref(db, 'tomauno/chats/' + chatId), {
            unreadAdmin:false,
            waitingHuman:false,
            readByAdminAt:Date.now()
          }).catch(()=>{});
        }
        setTimeout(applyAdminStates, 120);
      });
      return r;
    };
    wrapped.__tuV25ReadWrap = 1;
    window.abrirChatAdmin = wrapped;
    try{ abrirChatAdmin = wrapped; }catch(e){}
  }

  // Si Javier responde manualmente, deja de ser rojo HUMANO pendiente.
  const oldSendAdmin = window.enviarChatAdmin;
  if(typeof oldSendAdmin === 'function' && !oldSendAdmin.__tuV25HumanClear){
    const wrappedAdminSend = async function(){
      const id = window.currentOpenChatId || currentOpenId();
      const r = await oldSendAdmin.apply(this, arguments);
      safe(function(){
        if(id && typeof db !== 'undefined' && typeof ref !== 'undefined' && typeof update !== 'undefined'){
          update(ref(db, 'tomauno/chats/' + id), {
            humanRequested:false,
            waitingHuman:false,
            priority:false,
            unreadAdmin:false,
            readByAdminAt:Date.now(),
            humanMode:true,
            manualUntil:Date.now() + 1000*60*60
          }).catch(()=>{});
        }
      });
      setTimeout(applyAdminStates, 120);
      return r;
    };
    wrappedAdminSend.__tuV25HumanClear = 1;
    window.enviarChatAdmin = wrappedAdminSend;
    try{ enviarChatAdmin = wrappedAdminSend; }catch(e){}
  }

  function visitorOnline(c){
    const t = Number(c && (c.userLastSeen || c.lastSeen || c.updatedAt) || 0);
    return !!(c && (c.userOnline || (t && now() - t < 90000)));
  }

  function applyAdminStates(){
    safe(function(){
      if(!isAdmin()) return;
      const dbs = chats();

      document.querySelectorAll('.chat-tab,.chat-list-item,.chat-inbox-item,[data-chat-id]').forEach(el => {
        const id = el.getAttribute('data-chat-id') || el.dataset.chatId || '';
        const c = id ? dbs[id] : null;
        if(!c) return;

        const pendingHuman = !!(c.humanRequested || c.waitingHuman || c.priority);
        const unread = !!c.unreadAdmin;
        const online = visitorOnline(c);

        el.classList.toggle('tu-state-human', pendingHuman);
        el.classList.toggle('tu-state-unread', !pendingHuman && unread);
        el.classList.toggle('tu-state-online', !pendingHuman && !unread && online);
        el.classList.toggle('tu-state-offline', !pendingHuman && !unread && !online);

        let badge = el.querySelector('.tu-state-badge');
        if(!badge){
          badge = document.createElement('span');
          badge.className = 'tu-state-badge';
          const title = el.querySelector('.chat-tab-name,.chat-list-name,.chat-name,strong,b') || el.firstElementChild || el;
          title.appendChild(badge);
        }

        badge.textContent = pendingHuman ? ' HUMANO' : unread ? ' NUEVO' : online ? ' ONLINE' : ' OFF';
      });
    });
  }

  // Typing en admin: que se vea abajo y no quede tapado por la burbuja anterior.
  function keepTypingVisible(){
    safe(function(){
      if(!isAdmin()) return;
      const pop = document.getElementById('chat-popover');
      if(!pop || !pop.classList.contains('open')) return;

      const box = pop.querySelector('.chat-msgs');
      if(!box) return;

      const typing = pop.querySelector('.tu-live-typing,.chat-typing-live,.typing-live,.chat-bubble.typing');
      if(!typing) return;

      // Solo bajamos si el admin está en el fondo o casi en el fondo.
      const nearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 180;
      if(nearBottom) box.scrollTop = box.scrollHeight;
    });
  }

  // Botones rápidos en visitante.
  function quickButton(label, value){
    return '<button type="button" class="tu-quick-btn" data-tu-msg="'+label+'">'+value+'</button>';
  }

  function ensureVisitorQuickButtons(){
    safe(function(){
      if(isAdmin()) return;
      const pop = document.getElementById('chat-popover');
      if(!pop || !pop.classList.contains('open')) return;
      if(pop.querySelector('.tu-quick-actions')) return;

      const row = pop.querySelector('.chat-row');
      if(!row) return;

      const bar = document.createElement('div');
      bar.className = 'tu-quick-actions';
      bar.innerHTML =
        quickButton('Cursos activos','Cursos') +
        quickButton('Eventos activos','Eventos') +
        quickButton('Servicios disponibles','Servicios') +
        quickButton('Ubicación','Ubicación') +
        quickButton('Quiero hablar con Javier','Humano');

      row.parentNode.insertBefore(bar, row);
    });
  }

  document.addEventListener('click', function(ev){
    const btn = ev.target && ev.target.closest && ev.target.closest('.tu-quick-btn');
    if(!btn) return;

    ev.preventDefault();
    ev.stopPropagation();

    const text = btn.getAttribute('data-tu-msg') || btn.textContent || '';
    const inp = document.getElementById('chat-text');
    if(inp){
      inp.value = text;
      inp.dispatchEvent(new Event('input', {bubbles:true}));
      setTimeout(() => {
        if(typeof window.enviarChatVisitante === 'function') window.enviarChatVisitante();
      }, 40);
    }
  }, true);

  // Fullscreen admin centrado.
  function centerAdminFullscreen(){
    safe(function(){
      const pop = document.getElementById('chat-popover');
      if(!pop || !pop.classList.contains('open')) return;
      const isExpanded = pop.classList.contains('expanded') || pop.classList.contains('tomauno-expanded');
      const adminUi = !!pop.querySelector('#chat-admin-text,.chat-inbox-side,.chat-admin-tools');
      if(isExpanded && adminUi) pop.classList.add('tu-admin-centered');
      else pop.classList.remove('tu-admin-centered');
    });
  }

  function css(){
    if(document.getElementById('tomauno-v25-css')) return;
    const st = document.createElement('style');
    st.id = 'tomauno-v25-css';
    st.textContent = `
      .tu-state-badge{
        margin-left:6px;
        font-size:10px;
        font-weight:900;
        letter-spacing:.04em;
      }
      .tu-state-human{
        border-color:rgba(255,54,54,.95)!important;
        box-shadow:0 0 0 1px rgba(255,54,54,.35),0 0 18px rgba(255,54,54,.18)!important;
      }
      .tu-state-human .tu-state-badge{color:#ff3b3b!important;}
      .tu-state-unread{
        border-color:rgba(245,198,66,.95)!important;
        box-shadow:0 0 0 1px rgba(245,198,66,.35),0 0 18px rgba(245,198,66,.13)!important;
      }
      .tu-state-unread .tu-state-badge{color:#f5c842!important;}
      .tu-state-online .tu-state-badge{color:#4caf7d!important;}
      .tu-state-offline{opacity:.72;}
      .tu-state-offline .tu-state-badge{color:#858585!important;}

      #chat-popover.open .tu-quick-actions{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        padding:6px 4px 8px;
      }
      #chat-popover.open .tu-quick-btn{
        border:1px solid rgba(255,255,255,.12);
        background:rgba(255,255,255,.045);
        color:#fff;
        border-radius:999px;
        padding:7px 10px;
        font-size:11px;
        font-weight:800;
        cursor:pointer;
      }
      #chat-popover.open .tu-quick-btn:hover{
        border-color:rgba(232,0,10,.5);
        background:rgba(232,0,10,.13);
      }

      #chat-popover.open.tu-admin-centered,
      #chat-popover.open.expanded.tu-admin-centered,
      #chat-popover.open.tomauno-expanded.tu-admin-centered{
        position:fixed!important;
        left:50%!important;
        right:auto!important;
        top:50%!important;
        bottom:auto!important;
        transform:translate(-50%,-50%)!important;
        width:min(1120px,calc(100vw - 42px))!important;
        height:min(82vh,780px)!important;
        max-height:min(82vh,780px)!important;
        z-index:99998!important;
      }

      #chat-popover.open .chat-msgs{
        scroll-behavior:auto!important;
        padding-bottom:22px!important;
      }
    `;
    document.head.appendChild(st);
  }

  css();
  setInterval(soundForRealUserMessages, 900);
  setInterval(soundForHumanRequest, 1300);
  setInterval(applyAdminStates, 900);
  setInterval(keepTypingVisible, 250);
  setInterval(ensureVisitorQuickButtons, 900);
  setInterval(centerAdminFullscreen, 500);
  setTimeout(function(){ applyAdminStates(); ensureVisitorQuickButtons(); centerAdminFullscreen(); }, 600);
})();


// ── TOMAUNO v26 HOTFIX FINAL ────────────────────────────────────────────────
// Ajustes: scroll visitante al recibir respuesta, chat más alto, botones compactos,
// búsqueda profesor en cursos/eventos/servicios, sonido desbloqueable y más confiable.
(function(){
  'use strict';

  function safe(fn){ try{return fn();}catch(e){ try{console.warn('tomauno v26:', e);}catch(_){} } }
  function ts(){ return Date.now(); }

  function isAdmin(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok') === '1' ||
             localStorage.getItem('tomauno-admin-notify') === '1' ||
             !!document.querySelector('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools');
    }) || false;
  }

  function pop(){ return document.getElementById('chat-popover'); }
  function msgBox(){ return document.querySelector('#chat-popover.open .chat-msgs'); }

  function currentChatIdAny(){
    return safe(function(){
      return window.currentOpenChatId || window.currentVisitorChatId || sessionStorage.getItem('tomauno-chat-id') || '';
    }) || '';
  }

  // ── 1) SCROLL VISITANTE CUANDO RESPONDE ADM / IA ─────────────────────────
  let lastVisitorScrollKey = '';
  function scrollVisitorBottom(force){
    safe(function(){
      if(isAdmin()) return;
      const box = msgBox();
      if(!box) return;
      const active = document.activeElement;
      const writing = active && (active.id === 'chat-text' || active.id === 'chat-name');
      // Si está escribiendo, solo bajamos si force=true o si ya estaba cerca del fondo.
      const nearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 210;
      if(force || !writing || nearBottom){
        requestAnimationFrame(function(){
          box.scrollTop = box.scrollHeight;
          setTimeout(function(){ box.scrollTop = box.scrollHeight; }, 80);
        });
      }
    });
  }

  function lastVisibleMessageKey(){
    return safe(function(){
      const bubbles = Array.from(document.querySelectorAll('#chat-popover.open .chat-bubble'));
      if(!bubbles.length) return '';
      const b = bubbles[bubbles.length - 1];
      return (b.className || '') + '|' + (b.textContent || '').slice(-160);
    }) || '';
  }

  function watchVisitorMessages(){
    if(isAdmin()) return;
    const key = lastVisibleMessageKey();
    if(key && key !== lastVisitorScrollKey){
      lastVisitorScrollKey = key;
      // Si aparece una respuesta admin/auto o cambia el contenido, bajamos.
      scrollVisitorBottom(true);
    }
  }

  // Al tocar botones rápidos, bajar también.
  document.addEventListener('click', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.tu-quick-btn')){
      setTimeout(function(){ scrollVisitorBottom(true); }, 120);
      setTimeout(function(){ scrollVisitorBottom(true); }, 700);
    }
  }, true);

  // ── 2) BOTONES VISITANTE MÁS COMPACTOS ───────────────────────────────────
  function compactQuickButtons(){
    safe(function(){
      if(isAdmin()) return;
      const wrap = document.querySelector('#chat-popover.open .tu-quick-actions');
      if(!wrap) return;
      const map = [
        ['Cursos activos', '🎓', 'Cursos'],
        ['Eventos activos', '📅', 'Eventos'],
        ['Servicios disponibles', '🛠️', 'Servicios'],
        ['Ubicación', '📍', ''],
        ['Quiero hablar con Javier', '👤', '']
      ];
      wrap.innerHTML = map.map(function(x){
        return '<button type="button" class="tu-quick-btn tu-quick-compact" title="'+x[2]+'" data-tu-msg="'+x[0]+'"><span>'+x[1]+'</span>'+(x[2] ? '<em>'+x[2]+'</em>' : '')+'</button>';
      }).join('');
    });
  }

  // ── 3) CHAT PC MÁS ALTO ──────────────────────────────────────────────────
  function css(){
    if(document.getElementById('tomauno-v26-css')) return;
    const st = document.createElement('style');
    st.id = 'tomauno-v26-css';
    st.textContent = `
      @media(min-width:701px){
        html body.tomauno-visitor-active #chat-popover.open,
        html body:not(.tomauno-admin-active) #chat-popover.open:not(:has(.chat-inbox-side)){
          height:min(72vh,660px)!important;
          max-height:min(72vh,660px)!important;
          width:min(360px,calc(100vw - 22px))!important;
          max-width:min(360px,calc(100vw - 22px))!important;
        }
        html body.tomauno-visitor-active #chat-popover.open.expanded,
        html body.tomauno-visitor-active #chat-popover.open.tomauno-expanded{
          width:min(720px,calc(100vw - 28px))!important;
          height:min(82vh,760px)!important;
          max-height:min(82vh,760px)!important;
        }
      }

      #chat-popover.open .tu-quick-actions{
        display:flex!important;
        flex-wrap:nowrap!important;
        gap:5px!important;
        padding:4px 2px 7px!important;
        overflow-x:auto!important;
        scrollbar-width:none!important;
      }
      #chat-popover.open .tu-quick-actions::-webkit-scrollbar{display:none!important;}
      #chat-popover.open .tu-quick-btn.tu-quick-compact{
        min-width:auto!important;
        height:31px!important;
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        gap:4px!important;
        padding:6px 8px!important;
        border-radius:999px!important;
        white-space:nowrap!important;
        flex:0 0 auto!important;
      }
      #chat-popover.open .tu-quick-btn.tu-quick-compact span{font-size:14px!important;line-height:1!important;}
      #chat-popover.open .tu-quick-btn.tu-quick-compact em{
        font-style:normal!important;
        font-size:10px!important;
        font-weight:900!important;
      }
      #chat-popover.open .chat-msgs{
        scroll-behavior:auto!important;
        padding-bottom:26px!important;
      }
      #chat-popover.open .chat-row{
        flex-shrink:0!important;
      }
      .tu-sound-unlock{
        position:fixed;
        right:18px;
        bottom:18px;
        z-index:100000;
        border:1px solid rgba(255,255,255,.18);
        background:rgba(20,20,20,.94);
        color:#fff;
        border-radius:999px;
        padding:9px 12px;
        font-size:12px;
        font-weight:900;
        box-shadow:0 12px 30px rgba(0,0,0,.32);
        cursor:pointer;
      }
    `;
    document.head.appendChild(st);
  }

  // ── 4) BUSCAR PROFESOR / ORGANIZADOR EN EVENTOS Y SERVICIOS SIN DECIR "CURSO" ──
  function normalize(s){
    try{ if(typeof normAI === 'function') return normAI(s); }catch(e){}
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9ñ\s]/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function impTerms(q){
    const stop = new Set('quien quien es cual cual es como donde curso cursos evento eventos servicio servicios profe profesor profesora docente disertante organizador organiza la el de del en un una para por con y o a los las me podes puedes decir contar informar sobre'.split(' '));
    return normalize(q).split(/\s+/).filter(w => w.length > 2 && !stop.has(w));
  }

  const oldBestPublishedTitleMatchAI = (typeof bestPublishedTitleMatchAI === 'function') ? bestPublishedTitleMatchAI : null;
  bestPublishedTitleMatchAI = function(q){
    const old = oldBestPublishedTitleMatchAI ? oldBestPublishedTitleMatchAI(q) : null;
    if(old) return old;

    const nq = normalize(q);
    const terms = impTerms(q);
    if(!terms.length) return null;

    const items = [];
    try{
      Object.entries(cursos || {}).forEach(([id,c]) => {
        if(!c || c.oculto) return;
        items.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.disertante,c.profesor,c.organizador,c.docente,c.wp].join(' ')});
      });
      Object.entries(serviciosDB || {}).forEach(([id,s]) => {
        if(!s || s.oculto) return;
        items.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.ig,s.wp,s.dir,s.profesor,s.docente,s.organizador].join(' ')});
      });
      Object.entries(eventosDB || {}).forEach(([id,e]) => {
        if(!e || e.oculto) return;
        // No exigimos estado activo porque algunos eventos cargados usan otros estados.
        items.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.ig,e.nombreOrg,e.wpOrg,e.lugar,e.profesor,e.docente,e.disertante,e.organizador].join(' ')});
      });
    }catch(e){}

    let best = null;
    items.forEach(it => {
      const hay = normalize([it.title, it.extra].join(' '));
      let hits = 0;
      terms.forEach(t => {
        if(hay.includes(t)) hits += 1;
      });
      if(!hits) return;
      let score = hits * 10;
      if(normalize(it.title).includes(terms.join(' '))) score += 20;
      if(/profesor|profesora|profe|docente|disertante|organizador|quien|quién/.test(nq)) score += 6;
      if(/evento|casting|beauty|ciudad/.test(nq) && it.type === 'evento') score += 6;
      if(/servicio|book|portfolio|sesion|sesiones/.test(nq) && it.type === 'servicio') score += 5;
      if(!best || score > best.sc) best = Object.assign({}, it, {sc:score, titleHits:hits, extraHits:0});
    });

    return best && best.sc >= 10 ? best : null;
  };

  // Override puntual: si pregunta "quién/profe/docente/organizador" intenta match global primero.
  const oldBuscarRespuestaAsistenteV26 = (typeof buscarRespuestaAsistente === 'function') ? buscarRespuestaAsistente : null;
  buscarRespuestaAsistente = function(text){
    const q = normalize(text);
    if(/(quien|quién|profe|profesor|profesora|docente|disertante|organizador|organiza|quien da|quien dicta)/.test(q)){
      const m = bestPublishedTitleMatchAI(text);
      if(m && typeof contactoEntidadAI === 'function'){
        if(m.type === 'curso') window._lastAiSection = 'sec-cursos';
        if(m.type === 'servicio') window._lastAiSection = 'sec-servicios';
        if(m.type === 'evento') window._lastAiSection = 'sec-eventos';
        return contactoEntidadAI(m);
      }
    }
    return oldBuscarRespuestaAsistenteV26 ? oldBuscarRespuestaAsistenteV26(text) : '';
  };

  // ── 5) SONIDO: DESBLOQUEO + FALLBACK MÁS FUERTE ─────────────────────────
  let audioUnlocked = false;
  let audioCtx = null;

  function unlockAudio(showButton){
    safe(function(){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      if(!audioCtx) audioCtx = new AC();
      if(audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.03);
      audioUnlocked = true;
      const btn = document.querySelector('.tu-sound-unlock');
      if(btn) btn.remove();
    });
  }

  function showSoundUnlock(){
    safe(function(){
      if(!isAdmin() || audioUnlocked || document.querySelector('.tu-sound-unlock')) return;
      const btn = document.createElement('button');
      btn.className = 'tu-sound-unlock';
      btn.textContent = '🔊 Activar sonido';
      btn.onclick = function(){ unlockAudio(false); tuBeepV26('normal'); };
      document.body.appendChild(btn);
    });
  }

  function tuBeepV26(kind){
    safe(function(){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      if(!audioCtx) audioCtx = new AC();
      if(audioCtx.state === 'suspended'){
        showSoundUnlock();
        audioCtx.resume().catch(()=>{});
      }

      const start = audioCtx.currentTime + 0.02;
      const freqs = kind === 'human' ? [720, 920, 1160, 920] : [880, 1120, 880];
      freqs.forEach(function(freq, i){
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start + i * .16);
        gain.gain.setValueAtTime(.0001, start + i * .16);
        gain.gain.exponentialRampToValueAtTime(kind === 'human' ? .28 : .20, start + i * .16 + .025);
        gain.gain.exponentialRampToValueAtTime(.0001, start + i * .16 + .13);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start + i * .16);
        osc.stop(start + i * .16 + .15);
      });
    });
  }

  document.addEventListener('click', function(){ unlockAudio(false); }, true);
  document.addEventListener('keydown', function(){ unlockAudio(false); }, true);

  // Refuerzo: cuando entra notificación propia, sonar también por función vieja.
  const oldNotifyV26 = window.notifyAdminChat;
  if(typeof oldNotifyV26 === 'function' && !oldNotifyV26.__tuV26Sound){
    const wrappedNotify = function(title, body, chatId){
      const r = oldNotifyV26.apply(this, arguments);
      safe(function(){
        if(isAdmin()) tuBeepV26(/humano|atencion|atención/i.test(String(title||'') + ' ' + String(body||'')) ? 'human' : 'normal');
      });
      return r;
    };
    wrappedNotify.__tuV26Sound = 1;
    window.notifyAdminChat = wrappedNotify;
    try{ notifyAdminChat = wrappedNotify; }catch(e){}
  }

  // Refuerzo por Firebase: suena ante último mensaje real de usuario reciente.
  const heard = Object.create(null);
  function soundRecentUserMessage(){
    safe(function(){
      if(!isAdmin()) return;
      const dbs = window.chatsDB || {};
      Object.keys(dbs).forEach(function(id){
        const c = dbs[id] || {};
        const ms = c.messages || {};
        let best = null;
        Object.keys(ms).forEach(function(k){
          const m = ms[k] || {};
          if(m.from === 'user' && !m.typing && String(m.text||'').trim()){
            if(!best || Number(m.createdAt||0) > Number(best.createdAt||0)) best = m;
          }
        });
        if(!best) return;
        const age = ts() - Number(best.createdAt || 0);
        if(age > 1000 * 60 * 4) return;
        const key = id + '|' + String(best.createdAt||'') + '|' + String(best.text||'').slice(0,80);
        if(heard[key]) return;
        heard[key] = 1;
        tuBeepV26((c.humanRequested || c.waitingHuman || c.priority) ? 'human' : 'normal');
      });
    });
  }

  css();
  compactQuickButtons();
  scrollVisitorBottom(false);
  setInterval(watchVisitorMessages, 350);
  setInterval(compactQuickButtons, 1300);
  setInterval(showSoundUnlock, 2500);
  setInterval(soundRecentUserMessage, 900);
})();
