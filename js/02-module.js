// ExtraÃ­do de <script type="module">
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

// â”€â”€ PRESENCIA / USUARIOS ONLINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ ADMIN ACCESS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    '<div class="mtitle" style="font-size:26px;margin-bottom:12px;text-align:center;line-height:1;">ðŸ” ACCESO</div>' +
    '<label class="flbl" style="text-align:center;display:block;">PIN ADM</label>' +
    '<input class="finput" id="pin-inp" type="password" placeholder="â€¢â€¢â€¢â€¢" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.25em;margin-bottom:10px;" onkeydown="if(event.key===\'Enter\')window.submitPin()"/>' +
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
  if (v === PIN) { adminOk = true; closeModal(); toggleAdmin(true); toast('âœ… Bienvenido', true); }
  else toast('âŒ PIN incorrecto');
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

// â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
try{ window._adminWasActive = localStorage.getItem('tomauno-admin-notify') === '1'; }catch(e){}
function isAdminNotifier(){ try { return !!(adminOk || window._adminWasActive || localStorage.getItem('tomauno-admin-notify') === '1'); } catch(e) { return !!(adminOk || window._adminWasActive); } }
function updateAdminLiveIndicator(){
  const el=document.getElementById('admin-live-indicator'), tx=document.getElementById('admin-live-text');
  if(!el||!tx) return;
  if(isAdminNotifier()){
    const online = isAdminOnline ? isAdminOnline() : true;
    el.className = 'admin-live-indicator ' + (online ? 'on' : 'off');
    tx.textContent = (online ? 'ADM *' : 'ADM !') + (asistenteModo && asistenteModo() === 'automatico' ? ' Â· AUTO *' : '');
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
    if(isAdminNotifier()){beep();showNotifBanner('Nueva inscripciÃ³n', nombre + (curso ? ' Â· ' + curso : ''), 'ðŸ‘¥', () => window.irAPlanillaCurso(newest?.cursoId));showNotif();}
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
    beep(); showNotif(); showNotifBanner('Nuevo servicio registrado', newest?.titulo || 'Servicio sin tÃ­tulo', 'ðŸ› ï¸', () => window.irAAdminTab('servicios-adm'));
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
      showNotifBanner('Nueva reseÃ±a pendiente', (newest?.name || 'Alumno') + ' Â· ' + (newest?.course || 'Sin curso'), 'â­', () => window.irAAdminTab('testimonios-adm'));
      showNotif();
    }
  }
  prevTestCount = c;
  renderTestimonios();
  renderTestimoniosAdmin();
  updateStats();
});

// â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ RENDER CURSOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    g.innerHTML = '<div style="color:var(--text3);padding:60px 0;text-align:center;font-size:14px;">No hay cursos publicados aÃºn</div>';
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
    const badgeTxt = c.finalizado ? 'ðŸ Finalizado' : full ? 'ðŸ”´ Sin cupos' : ses ? ('ðŸ“… Turnos Â· ' + insc) : 'âœ¦ Activo';
    const searchData = ((c.titulo || '') + ' ' + (c.desc || '') + ' ' + (c.fecha || '') + ' ' + (c.lugar || '') + ' ' + (c.ig || '')).toLowerCase();
    return '<div class="ccard' + (c.finalizado ? ' fin' : '') + '" style="animation:up .45s ' + (i * .07) + 's both;cursor:pointer;" draggable="true" data-id="' + k + '" data-search="' + searchData.replace(/"/g, '') + '" ondragstart="window.dragStart(event,\'' + k + '\')" onclick="window.abrirDetalle(\'' + k + '\')">' +
      '<div class="cimg">' +
      (c.img
        ? '<img src="' + c.img + '" alt="' + (c.titulo || '').replace(/"/g, '') + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/><div class="cimg-placeholder" style="display:none"><span class="icon">ðŸ“·</span><span class="brand">TOMA<em>UNO</em></span></div>'
        : '<div class="cimg-placeholder"><span class="icon">' + (c.icon || 'ðŸ“·') + '</span><span class="brand">TOMA<em>UNO</em></span></div>') +
      '<span class="cbadge ' + badgeClass + '">' + badgeTxt + '</span>' +
      (c.cupos > 0 ? '<span class="ccupos-badge">ðŸ‘¥ ' + insc + '/' + c.cupos + '</span>' : '') +
      '</div>' +
      '<div class="cbody">' +
      '<div class="ctitle">' + (c.titulo || 'Sin tÃ­tulo') + '</div>' +
      '<div class="cdesc">' + (c.desc || '').replace(/\n/g, ' ') + '</div>' +
      '<div class="cmeta">' +
      (c.fecha ? '<span class="chip">ðŸ“… ' + fFecha(c.fecha) + '</span>' : '') +
      (c.hora ? '<span class="chip">â° ' + c.hora + '</span>' : '') +
      (c.lugar ? '<span class="chip">ðŸ“ ' + (c.lugar.split('-')[0].trim()) + '</span>' : '') +
      (!c.cupos ? '<span class="chip">ðŸ‘¥ ' + insc + ' inscripto' + (insc !== 1 ? 's' : '') + '</span>' : '') +
      '</div>' +
      '<div class="cfoot">' +
      '<div class="cprice' + (!c.costo ? ' free' : '') + '">' + (c.costo ? '$ ' + Number(c.costo).toLocaleString('es-AR') : 'GRATIS') + '</div>' +
      '<div class="cfoot-btns">' +
      '<button class="cbtn-info" onclick="event.stopPropagation();window.abrirDetalle(\'' + k + '\')">MÃ¡s info</button>' +
      '<button class="cbtn" ' + (c.finalizado || full ? 'disabled' : '') + ' onclick="event.stopPropagation();' + (ses ? 'window.abrirSesiones(\'' + k + '\')' : 'window.abrirInscripcion(\'' + k + '\')') + '">' +
      (c.finalizado ? 'Finalizado' : full ? 'Sin cupos' : ses ? 'ðŸ“… Turnos' : 'âœï¸ Inscribirme') +
      '</button>' +
      '</div></div></div></div>';
  }).join('');
}

// â”€â”€ DETALLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.abrirDetalle = (id) => {
  const c = cursos[id]; if (!c) return;
  // Contar inscriptos SOLO de este curso
  const insc = Object.values(inscripciones).filter(x => x.cursoId === id).length;
  const full = c.cupos > 0 && insc >= c.cupos;
  const ses = c.tipo === 'sesiones';
  const esExterno = c.dniOrg && c.dniOrg !== 'tomauno';
  document.getElementById('mcontent').innerHTML =
    '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">' +
    (!esExterno ? '<span style="background:rgba(232,0,10,.15);color:var(--red);border:1px solid rgba(232,0,10,.3);font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px;letter-spacing:.08em;">âœ¦ CERTIFICADO TOMAUNO</span>' : '<span style="background:rgba(90,60,220,.12);color:#a78bfa;border:1px solid rgba(90,60,220,.25);font-size:10px;font-weight:800;padding:4px 12px;border-radius:20px;">ORGANIZADOR EXTERNO</span>') +
    '</div>' +
    (c.img ? '<img src="' + c.img + '" style="width:100%;border-radius:var(--radius-sm);margin-bottom:16px;max-height:420px;object-fit:contain;background:#0a0a0a;display:block;cursor:zoom-in;" onclick="window.verFlyerFull(this.src)" onerror="this.style.display=\'none\'"/>' : '') +
    '<div class="mtitle">' + (c.titulo || 'Sin tÃ­tulo') + '</div>' +
    '<div class="msub">' + insc + ' inscripto' + (insc !== 1 ? 's' : '') + (c.cupos > 0 ? ' Â· ' + (c.cupos - insc) + ' cupos restantes' : '') + '</div>' +
    '<div class="cmeta" style="margin-bottom:18px;">' +
    (c.fecha ? '<span class="chip">ðŸ“… ' + fFecha(c.fecha) + '</span>' : '') +
    (c.hora ? '<span class="chip">â° ' + c.hora + '</span>' : '') +
    (c.lugar ? '<span class="chip">ðŸ“ ' + c.lugar + '</span>' : '') +
    (c.costo ? '<span class="chip accent">ðŸ’° $ ' + Number(c.costo).toLocaleString('es-AR') + '</span>' : '<span class="chip" style="color:#00d25a;">âœ¦ GRATIS</span>') +
    '</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.7;white-space:pre-line;margin-bottom:18px;">' + (c.desc || '') + '</div>' +
    '<div class="det-links">' +
    (c.ig ? '<a rel="noopener noreferrer" href="https://instagram.com/' + c.ig + '" target="_blank" class="det-link ig">ðŸ“¸ @' + c.ig + '</a>' : '') +
    (c.wp ? '<a rel="noopener noreferrer" href="https://wa.me/549' + c.wp.replace(/\D/g, '') + '" target="_blank" class="det-link wp">ðŸ’¬ Consultar</a>' : '') +
    (c.extraUrl ? '<a rel="noopener noreferrer" href="' + safeUrl(c.extraUrl) + '" target="_blank" class="extra-link-btn">ðŸ”— ' + escHtml(c.extraText || 'Ver mÃ¡s informaciÃ³n') + '</a>' : '') +
    '</div>' +
    (!c.finalizado && !full ?
      '<button class="btn-main" style="margin-top:16px;" onclick="' + (ses ? 'window.abrirSesiones(\'' + id + '\')' : 'window.abrirInscripcion(\'' + id + '\')') + '">' +
      (ses ? 'ðŸ“… Elegir mi turno' : 'âœï¸ Quiero inscribirme') + '</button>' : '') +
    '<div style="display:flex;gap:10px;margin-top:8px;">' +
    '<button class="btn-out" style="flex:1;" onclick="window.closeModal()">Cerrar</button>' +
    '<button class="btn-out" style="flex:1;border-color:rgba(232,0,10,.3);color:var(--red);" onclick="window.compartirCurso(\'' + id + '\')">ðŸ”— Compartir</button>' +
    '</div>';
  openModal();
};

// â”€â”€ INSCRIPCION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.abrirInscripcion = (id, inscId = '') => {
  const c = cursos[id]; if (!c) return;
  const edit = inscId && inscripciones[inscId] ? inscripciones[inscId] : null;
  const cr = Object.assign({dni:true, edad:true, ig:true, email:false, altura:false, medidas:false}, c.camposReq || {});
  const esSes = c.tipo === 'sesiones';
  const dniField = (!esSes && cr.dni !== false) ? '<input class="finput" id="f-dni" placeholder="DNI *" type="number" value="'+escAttr(edit?.dni || '')+'"/>' : '<input type="hidden" id="f-dni" value="'+escAttr(edit?.dni || '0')+'"/>';
  const edadField = cr.edad !== false ? '<input class="finput" id="f-edad" placeholder="Edad *" type="number" oninput="window.chkMenor()" value="'+escAttr(edit?.edad || '')+'"/>' : '<input type="hidden" id="f-edad" value="'+escAttr(edit?.edad || '18')+'"/>';
  const igField = cr.ig !== false ? '<input class="finput" id="f-ig" placeholder="Instagram (sin @)" value="'+escAttr(edit?.ig || '')+'"/>' : '';
  const emailField = cr.email ? '<input class="finput" id="f-email" placeholder="Email *" type="email" value="'+escAttr(edit?.email || '')+'"/>' : '';
  const alturaRow = (cr.altura || cr.medidas)
    ? '<div class="frow2" style="gap:8px;margin-bottom:8px;">' + (cr.altura ? '<input class="finput" id="f-altura" placeholder="Altura (ej: 1,62)" value="'+escAttr(edit?.altura || '')+'" style="margin:0;"/>' : '') + (cr.medidas ? '<input class="finput" id="f-medidas" placeholder="Medidas (ej: 78/59/79)" value="'+escAttr(edit?.medidas || '')+'" style="margin:0;"/>' : '') + '</div>'
    : '';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">INSCRIPCIÃ“N</div>' +
    '<div class="msub">' + (c.titulo || '') + (c.fecha ? ' Â· ' + fFecha(c.fecha) : '') + '</div>' +
    '<div class="mlbl">Datos personales</div>' +
    '<input class="finput" id="f-nom" placeholder="Nombre y apellido *" value="'+escAttr(edit?.nombre || '')+'"/>' +
    dniField + edadField + '<input class="finput" id="f-localidad" placeholder="Localidad (opcional)" value="'+escAttr(edit?.localidad || '')+'"/>' + campoEspecialHtml(c, edit) + igField + emailField + alturaRow +
    '<input class="finput" id="f-wp" placeholder="WhatsApp * ej: 3764123456" type="tel" value="'+escAttr(edit?.wp || '')+'"/>' +
    '<div id="tutor-box" style="display:none;">' +
    '<div class="mlbl" style="color:#f5c842;">âš ï¸ Menor de edad â€” Datos del tutor/a</div>' +
    '<div class="tutor-box"><input class="finput" id="f-tnombre" placeholder="Nombre del tutor/a" value="'+escAttr(edit?.tutorNombre || '')+'"/><input class="finput" id="f-twp" placeholder="WhatsApp del tutor/a *" type="tel" value="'+escAttr(edit?.tutorWp || '')+'"/></div>' +
    '</div>' +
    opcionesCursoHtml(c, edit?.opcionesElegidas || []) +
    '<div class="mlbl">Detalle del pedido / aclaraciones</div>' +
    '<textarea class="finput" id="f-detalle-pedido" rows="3" placeholder="Ej: Quiero 2 fotos impresas de la misma coreografia, o pago una parte ahora">'+escHtml(edit?.detallePedido || '')+'</textarea>' +
    '<div style="font-size:11px;color:var(--text3);margin:6px 0 14px;">* Campos obligatorios</div>' +
    '<button class="btn-main" onclick="window.confirmarInsc(\'' + id + '\')">âœ… Confirmar inscripciÃ³n</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  if (edit) {
    const btn = document.querySelector('#mcontent .btn-main');
    if (btn) {
      btn.textContent = 'Guardar cambios';
      btn.onclick = () => window.guardarInscCursoEdit(inscId);
    }
  }
  window.chkMenor();
  window.actualizarTotalOpcionesCurso();
};

window.chkMenor = () => {
  const edadInput = document.getElementById('f-edad') || document.getElementById('fev-edad');
  const e = parseInt(edadInput?.value) || 0;
  const b = document.getElementById('tutor-box');
  if (b) b.style.display = e > 0 && e < 18 ? 'block' : 'none';
};

function parseOpcionesTexto(raw){
  return String(raw || '')
    .split(/[\n;]+/)
    .map(x => x.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(',');
      const nombre = (parts.shift() || '').trim();
      const precioRaw = parts.join(',').trim();
      const precio = parseInt(String(precioRaw).replace(/\$/g,'').replace(/\./g,'').replace(/[^\d-]/g,''), 10) || 0;
      return nombre ? {nombre, precio} : null;
    })
    .filter(Boolean);
}
function dineroOpt(n){ return '$ ' + Number(n || 0).toLocaleString('es-AR'); }
function resumenOpcionesElegidas(i){
  const ops = Array.isArray(i?.opcionesElegidas) ? i.opcionesElegidas : [];
  if(!ops.length) return '';
  return ops.map(o => (o.nombre || '') + (o.precio ? ' (' + dineroOpt(o.precio) + ')' : '')).join(' Â· ');
}
function campoEspecialLabelCurso(c){
  return String(c?.campoEspecialLabel || c?.campoEspecial || '').trim();
}
function campoEspecialHtml(c, i){
  const label = campoEspecialLabelCurso(c);
  if(!label) return '';
  return '<input class="finput" id="f-campo-especial" placeholder="'+escAttr(label)+'" value="'+escAttr(i?.campoEspecialValor || '')+'"/>';
}
function opcionesCursoHtml(c, seleccionadas = []){
  const ops = parseOpcionesTexto(c?.opcionesTexto || c?.serviciosTexto || '');
  if(!ops.length) return '';
  const selected = new Set((Array.isArray(seleccionadas) ? seleccionadas : []).map(o => String(o.nombre || '').trim().toLowerCase()));
  return '<div class="mlbl">Opciones / servicios</div><div id="curso-opciones-box" style="background:#0d0d0d;border:1px solid var(--border);border-radius:12px;padding:10px;margin:4px 0 12px;">' +
    ops.map((o,idx) => '<label style="display:flex;align-items:center;gap:8px;padding:7px 2px;font-size:13px;color:#fff;cursor:pointer;"><input type="checkbox" class="curso-opcion-check" data-nombre="'+escAttr(o.nombre)+'" data-precio="'+o.precio+'" onchange="window.actualizarTotalOpcionesCurso()" style="accent-color:var(--red);" '+(selected.has(String(o.nombre||'').trim().toLowerCase())?'checked':'')+'><span style="flex:1;">'+escHtml(o.nombre)+'</span><strong style="color:var(--red);">'+dineroOpt(o.precio)+'</strong></label>').join('') +
    '<div style="border-top:1px solid var(--border);margin-top:6px;padding-top:8px;font-size:13px;font-weight:900;color:#fff;display:flex;justify-content:space-between;"><span>Total seleccionado</span><span id="curso-opciones-total">$ 0</span></div>' +
    '</div>';
}
window.actualizarTotalOpcionesCurso = () => {
  const checks = Array.from(document.querySelectorAll('.curso-opcion-check:checked'));
  const total = checks.reduce((acc, el) => acc + (parseInt(el.dataset.precio || '0', 10) || 0), 0);
  const out = document.getElementById('curso-opciones-total');
  if(out) out.textContent = dineroOpt(total);
};
function leerOpcionesSeleccionadasCurso(){
  const ops = Array.from(document.querySelectorAll('.curso-opcion-check:checked')).map(el => ({
    nombre: el.dataset.nombre || '',
    precio: parseInt(el.dataset.precio || '0', 10) || 0
  })).filter(o => o.nombre);
  return {opcionesElegidas: ops, opcionesTotal: ops.reduce((a,o)=>a+Number(o.precio||0),0)};
}

window.confirmarInsc = async (id) => {
  const nom = document.getElementById('f-nom')?.value.trim();
  const dni = document.getElementById('f-dni')?.value.trim();
  const edad = parseInt(document.getElementById('f-edad')?.value) || 0;
  const ig = document.getElementById('f-ig')?.value.trim() || '';
  const localidad = document.getElementById('f-localidad')?.value.trim() || '';
  const wp = document.getElementById('f-wp')?.value.trim();
  const tn = document.getElementById('f-tnombre')?.value.trim() || '';
  const twp = document.getElementById('f-twp')?.value.trim() || '';
  if (!nom) { toast('âš ï¸ El nombre es obligatorio'); return; }
  if (!wp) { toast('âš ï¸ El nÃºmero de celular es obligatorio'); return; }
  const c = cursos[id];
  const cr = Object.assign({dni:true, edad:true, ig:true}, c.camposReq || {});
  if (cr.dni !== false && !dni) { toast('âš ï¸ CompletÃ¡ el DNI'); return; }
  if (cr.edad !== false && !edad) { toast('âš ï¸ CompletÃ¡ la edad'); return; }
  if (edad < 18 && !twp) { toast('âš ï¸ IngresÃ¡ el WP del tutor'); return; }
  const altura = document.getElementById('f-altura')?.value.trim() || '';
  const medidas = document.getElementById('f-medidas')?.value.trim() || '';
  const email = document.getElementById('f-email')?.value.trim() || '';
  const campoEspecialLabel = campoEspecialLabelCurso(c);
  const campoEspecialValor = campoEspecialLabel ? (document.getElementById('f-campo-especial')?.value.trim() || '') : '';
  const detallePedido = document.getElementById('f-detalle-pedido')?.value.trim() || '';
  const opciones = leerOpcionesSeleccionadasCurso();
  await push(ref(db, 'tomauno/inscripciones'), {
    cursoId: id, cursoTitulo: c.titulo || '',
    nombre: nom, dni: dni || '', edad: edad, ig: ig, wp: wp,
    tutorNombre: tn || null, tutorWp: twp || null,
    localidad: localidad,
    altura: altura, medidas: medidas, email: email,
    campoEspecialLabel: campoEspecialLabel,
    campoEspecialValor: campoEspecialValor,
    detallePedido: detallePedido,
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}),
    creado: Date.now(),
    opcionesElegidas: opciones.opcionesElegidas,
    opcionesTotal: opciones.opcionesTotal,
    pagos: genPagos(c)
  });
  const waText = [
    'ðŸ”´ *NUEVA PRE-INSCRIPCIÃ“N WEB TOMAUNO*',
    'ðŸ“š *Curso:* ' + (c.titulo || '') + (c.fecha ? ' - ' + fFecha(c.fecha) : '') + (c.hora ? ' ' + c.hora : ''),
    'ðŸ‘¤ *Nombre:* ' + nom,
    'ðŸ“„ *DNI:* ' + (dni || '-'),
    'ðŸŽ‚ *Edad:* ' + edad,
  ];
  if (localidad) waText.push('ðŸ“ Localidad: ' + localidad);
  if (ig) waText.push('ðŸ“¸ IG: @' + ig);
  if (altura) waText.push('ðŸ“ Altura: ' + altura);
  if (medidas) waText.push('ðŸ“ Medidas: ' + medidas);
  if (email) waText.push('ðŸ“§ Email: ' + email);
  if (opciones.opcionesElegidas.length) {
    waText.push('', 'ðŸ§¾ *Opciones elegidas:*');
    opciones.opcionesElegidas.forEach(o => waText.push('- ' + o.nombre + ': ' + dineroOpt(o.precio)));
    waText.push('ðŸ’° *Total opciones:* ' + dineroOpt(opciones.opcionesTotal));
  }
  waText.push('ðŸ“± WP Alumno: ' + wp);
  if (twp) waText.push('ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ WP Tutor: ' + twp);
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(waText.join('\n'));
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:12px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">âœ…</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">Â¡DATOS REGISTRADOS!</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Tu inscripciÃ³n fue guardada correctamente.<br/>Al presionar Aceptar se enviarÃ¡n tus datos al WhatsApp de Javier.</div>' +
    '<button class="btn-main" id="wa-confirm-btn">âœ… Aceptar â€” Enviar a WhatsApp</button>' +
    '</div>';
  document.getElementById('wa-confirm-btn').onclick = () => {
    window.open(window._pendingWaUrl, '_blank');
    closeModal();
    toast('ðŸŽ‰ Â¡Listo! Te contactamos pronto');
  };
};

window.guardarInscCursoEdit = async (inscId) => {
  const old = inscripciones[inscId];
  if (!old) { toast('Inscripcion no encontrada'); return; }
  const c = cursos[old.cursoId];
  if (!c) { toast('Curso no encontrado'); return; }
  const nom = document.getElementById('f-nom')?.value.trim();
  const dni = document.getElementById('f-dni')?.value.trim();
  const edad = parseInt(document.getElementById('f-edad')?.value) || 0;
  const ig = document.getElementById('f-ig')?.value.trim() || '';
  const localidad = document.getElementById('f-localidad')?.value.trim() || '';
  const wp = document.getElementById('f-wp')?.value.trim();
  const tn = document.getElementById('f-tnombre')?.value.trim() || '';
  const twp = document.getElementById('f-twp')?.value.trim() || '';
  if (!nom) { toast('El nombre es obligatorio'); return; }
  if (!wp) { toast('El numero de celular es obligatorio'); return; }
  const cr = Object.assign({dni:true, edad:true, ig:true}, c.camposReq || {});
  if (cr.dni !== false && !dni) { toast('Completa el DNI'); return; }
  if (cr.edad !== false && !edad) { toast('Completa la edad'); return; }
  if (edad < 18 && !twp) { toast('Ingresa el WP del tutor'); return; }
  const campoEspecialLabel = campoEspecialLabelCurso(c);
  const opciones = leerOpcionesSeleccionadasCurso();
  await update(ref(db, 'tomauno/inscripciones/' + inscId), {
    cursoId: old.cursoId,
    cursoTitulo: c.titulo || old.cursoTitulo || '',
    nombre: nom,
    dni: dni || '',
    edad: edad,
    ig: ig,
    wp: wp,
    tutorNombre: tn || null,
    tutorWp: twp || null,
    localidad: localidad,
    altura: document.getElementById('f-altura')?.value.trim() || '',
    medidas: document.getElementById('f-medidas')?.value.trim() || '',
    email: document.getElementById('f-email')?.value.trim() || '',
    campoEspecialLabel: campoEspecialLabel,
    campoEspecialValor: campoEspecialLabel ? (document.getElementById('f-campo-especial')?.value.trim() || '') : '',
    detallePedido: document.getElementById('f-detalle-pedido')?.value.trim() || '',
    opcionesElegidas: opciones.opcionesElegidas,
    opcionesTotal: opciones.opcionesTotal,
    actualizado: Date.now()
  });
  closeModal();
  renderAlumnos();
  toast('Cambios guardados', true);
};

function genPagos(c) {
  if (c.pagoTipo === 'cuotas' && c.meses > 0) {
    const mm = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const n = new Date();
    const montoBase = Number(c.costo) || 0;
    const p = [{label:'InscripciÃ³n', estado:'pendiente', monto:montoBase || '', nota:''}];
    for (let i = 0; i < c.meses; i++) {
      const d = new Date(n.getFullYear(), n.getMonth() + i, 1);
      p.push({label: mm[d.getMonth()] + ' ' + d.getFullYear(), estado:'pendiente', monto:montoBase || '', nota:''});
    }
    return p;
  }
  return [{label:'Pago Ãºnico', estado:'pendiente', monto:Number(c.costo) || '', nota:''}];
}

// â”€â”€ SESIONES / TURNOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.abrirSesiones = (id) => {
  const c = cursos[id]; if (!c) return;
  const slots = genSlots(c);
  const ocup = Object.values(inscripciones).filter(i => i.cursoId === id && i.turno);
  const libres = slots.filter(s => !ocup.find(i => i.turno === s)).length;
  let html = '<div class="mtitle">ELEGÃ TU TURNO</div>' +
    '<div class="msub">' + (c.titulo || '') + (c.fecha ? ' Â· ' + fFecha(c.fecha) : '') + ' Â· <span style="color:#4caf7d;">' + libres + ' disponibles</span></div>' +
    '<div class="slots-grid">';
  slots.forEach(s => {
    const q = ocup.find(i => i.turno === s);
    html += '<div class="slot ' + (q ? 'ocupado' : 'libre') + '" data-id="' + id + '" data-slot="' + s + '" ' + (q ? '' : 'onclick="window.selTurno(this)"') + '>' +
      '<div class="slot-t">' + s + '</div>' +
      '<div class="slot-n">' + (q ? (q.nombre || '').split(' ')[0] : 'âœ“ Libre') + '</div>' +
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
    '<div class="msub">' + (c ? c.titulo : '') + ' Â· <strong style="color:var(--red);">' + turno + '</strong></div>' +
    '<div class="mlbl">Tus datos</div>' +
    '<input class="finput" id="f-nom" placeholder="Nombre y apellido *"/>' +
    '<div class="frow2">' +
    '<input class="finput" id="f-dni" placeholder="DNI *" type="number"/>' +
    '<input class="finput" id="f-edad" placeholder="Edad *" type="number" oninput="window.chkMenor()"/>' +
    '</div>' +
    '<input class="finput" id="f-ig" placeholder="Instagram (sin @) *"/>' +
    '<input class="finput" id="f-wp" placeholder="WhatsApp * ej: 3764123456" type="tel"/>' +
    '<div id="tutor-box" style="display:none;">' +
    '<div class="mlbl" style="color:#f5c842;">âš ï¸ Menor de edad</div>' +
    '<div class="tutor-box"><input class="finput" id="f-tnombre" placeholder="Nombre tutor/a"/><input class="finput" id="f-twp" placeholder="WP tutor/a *" type="tel"/></div>' +
    '</div>' +
    '<button class="btn-main" onclick="window.confirmarTurno(\'' + id + '\',\'' + turno + '\')">âœ… Confirmar turno ' + turno + '</button>' +
    '<button class="btn-out" onclick="window.abrirSesiones(\'' + id + '\')">â† Volver</button>';
};

window.confirmarTurno = async (id, turno) => {
  const nom = document.getElementById('f-nom')?.value.trim();
  const dni = document.getElementById('f-dni')?.value.trim();
  const edad = parseInt(document.getElementById('f-edad')?.value) || 0;
  const ig = document.getElementById('f-ig')?.value.trim();
  const wp = document.getElementById('f-wp')?.value.trim();
  const twp = document.getElementById('f-twp')?.value.trim() || '';
  if (!nom) { toast('âš ï¸ El nombre es obligatorio'); return; }
  if (!wp) { toast('âš ï¸ El nÃºmero de celular es obligatorio'); return; }
  if (!dni || !edad || !ig) { toast('âš ï¸ CompletÃ¡ todos los campos'); return; }
  if (edad < 18 && !twp) { toast('âš ï¸ IngresÃ¡ el WP del tutor'); return; }
  if (Object.values(inscripciones).find(i => i.cursoId === id && i.turno === turno)) {
    toast('âš ï¸ Ese turno ya fue tomado, elegÃ­ otro');
    abrirSesiones(id);
    return;
  }
  const c = cursos[id];
  await push(ref(db, 'tomauno/inscripciones'), {
    cursoId: id, cursoTitulo: c ? c.titulo : '', nombre: nom, dni, edad, ig, wp,
    tutorWp: twp || null, turno,
    fecha: new Date().toLocaleDateString('es-AR'),
    hora: new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}),
    pagos: [{label:'Pago Ãºnico', estado:'pendiente', monto:'', nota:''}]
  });
  const tText = [
    'ðŸ“… NUEVO TURNO RESERVADO',
    'ðŸ“¸ SesiÃ³n: ' + (c ? c.titulo : '') + (c && c.fecha ? ' - ' + fFecha(c.fecha) : ''),
    'â° Turno: ' + turno,
    'ðŸ‘¤ Nombre: ' + nom,
    'ðŸŽ‚ Edad: ' + edad,
    'ðŸ“¸ IG: @' + ig,
    'ðŸ“± WP: ' + wp,
  ];
  if (twp) tText.push('ðŸ‘¨â€ðŸ‘©â€ðŸ‘§ WP Tutor: ' + twp);
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(tText.join('\n'));
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:12px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">âœ…</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">Â¡TURNO RESERVADO!</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Tu turno quedÃ³ registrado correctamente.<br/>Al presionar Aceptar se enviarÃ¡n tus datos al WhatsApp de Javier.</div>' +
    '<button class="btn-main" id="wa-turno-btn">âœ… Aceptar â€” Enviar a WhatsApp</button>' +
    '</div>';
  document.getElementById('wa-turno-btn').onclick = () => {
    window.open(window._pendingWaUrl, '_blank');
    closeModal();
    toast('ðŸŽ‰ Â¡Turno confirmado!');
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
    '<div class="msub" style="margin-bottom:16px;">' + (c.titulo || '') + ' Â· ' + ocup.length + ' reservados Â· ' + (slots.length - ocup.length) + ' libres</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">' +
    '<button class="bsm bl" id="btn-cp-full">ðŸ“‹ Copiar planilla</button>' +
    '<button class="bsm bl" id="btn-cp-nom">ðŸ‘¤ Solo nombres</button>' +
    '<a rel="noopener noreferrer" href="https://cronometro-two.vercel.app/" target="_blank" class="bsm gr" style="text-decoration:none;">â±ï¸ CronÃ³metro</a>' +
    '</div>' +
    '<textarea id="txt-comp" readonly style="width:100%;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;color:var(--text);font-size:12px;font-family:monospace;resize:vertical;min-height:180px;margin-bottom:8px;"></textarea>' +
    '<textarea id="txt-nom" readonly style="width:100%;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;color:var(--text);font-size:12px;font-family:monospace;resize:vertical;min-height:100px;"></textarea>' +
    '<button class="btn-out" onclick="window.closeModal()" style="margin-top:10px;">Cerrar</button>';
  openModal();
  document.getElementById('txt-comp').value = textoCompleto;
  document.getElementById('txt-nom').value = soloNombres;
  document.getElementById('btn-cp-full').onclick = () => navigator.clipboard.writeText(textoCompleto).then(() => toast('ðŸ“‹ Planilla copiada'));
  document.getElementById('btn-cp-nom').onclick = () => navigator.clipboard.writeText(soloNombres).then(() => toast('ðŸ‘¤ Nombres copiados'));
};

// â”€â”€ ADMIN TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ AGREGAR CURSO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.agregarCurso = async () => {
  const titulo = document.getElementById('nc-titulo')?.value.trim();
  if (!titulo) { toast('âš ï¸ El tÃ­tulo es obligatorio'); return; }
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
    icon: document.getElementById('nc-icon')?.value.trim() || 'ðŸ“·',
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
  toast('âœ… Curso publicado');
  setAtab('cursos');
};

window.editCurso = (id) => {
  const c = cursos[id]; if (!c) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR CURSO</div>' +
    '<div class="msub" style="margin-bottom:16px;">ModificÃ¡ los datos y guardÃ¡</div>' +
    '<label class="flbl">TÃ­tulo</label>' +
    '<input class="finput" id="ec-titulo" value="' + (c.titulo || '').replace(/"/g, '&quot;') + '"/>' +
    '<label class="flbl">DescripciÃ³n</label>' +
    '<textarea class="finput" id="ec-desc" rows="5">' + (c.desc || '') + '</textarea>' +
    '<label class="flbl">Campo especial del formulario</label>' +
    '<input class="finput" id="ec-campo-especial-label" value="' + escAttr(c.campoEspecialLabel || c.campoEspecial || '') + '" placeholder="Nombre del campo adicional"/>' +
    '<div style="font-size:10px;color:var(--text3);margin:-4px 0 10px;">Si queda vacio, no aparece en el formulario publico.</div>' +
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
    '<div class="frow2"><div><label class="flbl">Texto link extra</label><input class="finput" id="ec-extra-text" value="' + (c.extraText || '').replace(/"/g, '&quot;') + '" placeholder="Ver mÃ¡s info"/></div><div><label class="flbl">URL link extra</label><input class="finput" id="ec-extra-url" value="' + (c.extraUrl || '').replace(/"/g, '&quot;') + '" placeholder="https://..."/></div></div>' +
    '<label class="flbl">Link grupo WhatsApp</label>' +
    '<input class="finput" id="ec-gwa" value="' + (c.grupoWA || '') + '" placeholder="https://chat.whatsapp.com/..."/>' +
    '<label class="flbl">Tipo de pago</label>' +
    '<select class="finput" id="ec-pago-tipo">' +
    '<option value="unico" ' + ((c.pagoTipo || 'unico') === 'unico' ? 'selected' : '') + '>Pago Ãºnico</option>' +
    '<option value="cuotas" ' + (c.pagoTipo === 'cuotas' ? 'selected' : '') + '>InscripciÃ³n + cuotas</option>' +
    '</select>' +
    '<label class="flbl">DuraciÃ³n en meses (solo si cuotas)</label>' +
    '<input class="finput" id="ec-meses" type="number" value="' + (c.meses || 0) + '" placeholder="0"/>' +
    '<button class="btn-main" onclick="window.guardarEdit(\'' + id + '\')">ðŸ’¾ Guardar cambios</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarEdit = async (id) => {
  const titulo = document.getElementById('ec-titulo')?.value.trim();
  if (!titulo) { toast('âš ï¸ El tÃ­tulo es obligatorio'); return; }
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
    campoEspecialLabel: document.getElementById('ec-campo-especial-label')?.value.trim() || '',
    pagoTipo: document.getElementById('ec-pago-tipo')?.value || 'unico',
    meses: parseInt(document.getElementById('ec-meses')?.value) || 0,
  });
  closeModal();
  toast('âœ… Curso actualizado');
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
      '<div class="admin-ci-tit" style="' + (c.finalizado ? 'text-decoration:line-through;opacity:.4' : '') + '"><span style="color:var(--text3);font-size:12px;font-weight:700;margin-right:6px;">#' + (idx+1) + '</span>' + (c.titulo || 'Sin tÃ­tulo') + '</div>' +
      '<div class="admin-ci-sub">' + (c.fecha ? fFecha(c.fecha) : 'Sin fecha') + ' Â· ' + n + ' inscripto' + (n !== 1 ? 's' : '') + ' Â· ' + (c.oculto ? 'ðŸ™ˆ Oculto' : 'ðŸ‘ï¸ Visible') + (c.grupoWA ? ' Â· <a rel="noopener noreferrer" href="' + c.grupoWA + '" target="_blank" style="color:#25d366;text-decoration:none;">ðŸ’¬ Grupo WA</a>' : '') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
      '<button class="bsm bl" onclick="window.verAlumnosCurso(\'' + k + '\')">'
      + 'ðŸ‘¥ ' + n + ' Alumnos</button>' +
      '<button class="bsm gr" onclick="window.editCurso(\'' + k + '\')">âœï¸ Editar</button>' +
      (c.tipo === 'sesiones' ? '<button class="bsm bl" onclick="window.verPlanillaTurnos(\'' + k + '\')">ðŸ“‹ Turnos</button>' : '') +
      '<button class="bsm bl" onclick="window.copiarLinkCurso(\'' + k + '\')">ðŸ”— Link</button>' +
      '<button class="bsm ' + (c.finalizado ? 'gr' : 'bl') + '" onclick="window.togFin(\'' + k + '\',' + !c.finalizado + ')">' + (c.finalizado ? 'âœ… Reactivar' : 'ðŸ Finalizar') + '</button>' +
      '<button class="bsm ' + (c.oculto ? 'gr' : 'bl') + '" onclick="window.togOc(\'' + k + '\',' + !c.oculto + ')">' + (c.oculto ? 'ðŸ‘ï¸ Mostrar' : 'ðŸ™ˆ Ocultar') + '</button>' +
      '<button class="bsm re" onclick="window.delCurso(\'' + k + '\')">ðŸ—‘ï¸</button>' +
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
  showConfirm('Â¿Eliminar este curso permanentemente?', async () => {
    await remove(ref(db, 'tomauno/cursos/' + id));
    toast('ðŸ—‘ï¸ Curso eliminado');
  });
};

window.copiarLinkCurso = (id) => {
  const url = window.location.origin + window.location.pathname + '#curso-' + id;
  navigator.clipboard.writeText(url).then(() => toast('ðŸ”— Link copiado'));
};

window.compartirCurso = (id) => {
  const url = window.location.origin + window.location.pathname + '#curso-' + id;
  navigator.clipboard.writeText(url).then(() => {
    toast('ðŸ”— Link copiado â€” compartilo donde quieras');
  });
};

// â”€â”€ ALUMNOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderFiltros() {
  const s = document.getElementById('filtro-curso'); if (!s) return;
  const cur = s.value;
  s.innerHTML = '<option value="">Todos los cursos</option>' +
    Object.entries(cursos).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0))
      .map(([k, c]) => '<option value="' + k + '" ' + (k === cur ? 'selected' : '') + '>' + (c.titulo || k) + '</option>').join('');
  // TambiÃ©n el select de testimonios
  const st = document.getElementById('nt-curso'); if (!st) return;
  st.innerHTML = '<option value="">Sin curso especÃ­fico</option>' +
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
  const pagos = i.pagos || [{label:'Pago Ãºnico', estado:'pendiente', monto:(cur && cur.costo) ? Number(cur.costo) : ''}];
  const pagadas = pagos.filter(p => p.estado === 'pagado').length;
  const parciales = pagos.filter(p => p.estado === 'parcial').length;
  const pendientes = pagos.filter(p => p.estado === 'pendiente').length;
  let monto = pagos.reduce((acc,p) => acc + ((p.estado === 'pagado' || p.estado === 'parcial') ? (parseFloat(String(p.monto||'').replace(',','.')) || 0) : 0), 0);
  if (!monto && pagadas > 0 && cur && cur.costo) monto = Number(cur.costo) || 0;
  const estado = pagadas ? 'pagado' : parciales ? 'parcial' : 'pendiente';
  return {pagos,pagadas,parciales,pendientes,monto,estado};
}

function totalContratadoAlumno(i, cur){
  const manual = parseFloat(String(i?.totalManual || '').replace(',','.')) || 0;
  if (manual > 0) return manual;
  const opcionesTotal = Number(i?.opcionesTotal || 0);
  if (opcionesTotal > 0) return opcionesTotal;
  return Number(cur?.costo || 0) || 0;
}
function saldoAlumno(i, cur){
  const pagado = getPagoAlumnoInfo(i, cur).monto;
  return Math.max(0, totalContratadoAlumno(i, cur) - pagado);
}

function getAlumnosFiltrados() {
  const filtro = document.getElementById('filtro-curso')?.value || '';
  const q = (document.getElementById('admin-person-search')?.value || '').toLowerCase().trim();
  let lista = Object.entries(inscripciones).sort((a, b) => ((b[1].creado || 0) - (a[1].creado || 0)));
  if (filtro) lista = lista.filter(([, i]) => i.cursoId === filtro);
  if (q) lista = lista.filter(([,i]) => {
    const cur = cursos[i.cursoId] || {};
    const hay = [i.nombre,i.dni,i.edad,i.ig,i.wp,i.tutorWp,i.localidad,i.campoEspecialLabel,i.campoEspecialValor,i.detallePedido,i.cursoTitulo,cur.titulo,i.turno,resumenOpcionesElegidas(i),i.opcionesTotal].join(' ').toLowerCase();
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
    if(matchTextAdmin([i.nombre,i.dni,i.wp,i.ig,i.localidad,titulo,i.turno], q)) rows.push({tipo:'Curso', nombre:i.nombre, ref:titulo, extra:(i.turno?'â° '+i.turno+' Â· ':'')+(i.fecha||''), wp:i.wp, ig:i.ig, action:'window.verAlumnosCurso && window.verAlumnosCurso(\''+(i.cursoId||'')+'\')'});
  });
  Object.entries(servicioRegsDB || {}).forEach(([id,i]) => {
    const srv = serviciosDB[i.servicioId] || {};
    const titulo = i.servicioTitulo || srv.titulo || 'Servicio';
    if(matchTextAdmin([i.nombre,i.dni,i.wp,i.ig,i.localidad,titulo,i.turno], q)) rows.push({tipo:'Servicio', nombre:i.nombre, ref:titulo, extra:(i.turno?'â° '+i.turno+' Â· ':'')+(i.fecha||''), wp:i.wp, ig:i.ig, action:'window.abrirServicioDB && window.abrirServicioDB(\''+(i.servicioId||'')+'\')'});
  });
  Object.entries(evInscDB || {}).forEach(([id,i]) => {
    const ev = eventosDB[i.evId] || {};
    const titulo = i.evTitulo || ev.titulo || 'Evento';
    if(matchTextAdmin([i.nombre,i.dni,i.wp,i.ig,i.localidad,titulo,i.turno], q)) rows.push({tipo:'Evento', nombre:i.nombre, ref:titulo, extra:(i.turno?'â° '+i.turno+' Â· ':'')+(i.fecha||''), wp:i.wp, ig:i.ig, action:'window.verInscEventoAdmin && window.verInscEventoAdmin(\''+(i.evId||'')+'\')'});
  });
  const shown = rows.slice(0,30);
  box.classList.add('on');
  box.innerHTML = '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px;"><div style="font-size:12px;color:var(--text2);font-weight:800;">Resultados rÃ¡pidos: '+rows.length+'</div><div style="font-size:10px;color:var(--text3);">Cursos Â· servicios Â· eventos</div></div>' +
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
  const totalContratado = lista.reduce((acc, [,i]) => acc + totalContratadoAlumno(i, cursos[i.cursoId]), 0);
  const totalSaldo = lista.reduce((acc, [,i]) => acc + saldoAlumno(i, cursos[i.cursoId]), 0);
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
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#fff;">$ ' + totalContratado.toLocaleString('es-AR') + '</div><div class="admin-metric-l">Total pactado</div></div>' +
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#4caf7d;">$ ' + totalMonto.toLocaleString('es-AR') + '</div><div class="admin-metric-l">Total registrado</div></div>' +
      '<div class="admin-metric"><div class="admin-metric-n" style="color:#f5c842;">$ ' + totalSaldo.toLocaleString('es-AR') + '</div><div class="admin-metric-l">Saldo</div></div>' +
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
    const resumenPagos = 'âœ… ' + pinfo.pagadas + ' Â· âš¡ ' + pinfo.parciales + ' Â· â³ ' + pinfo.pendientes + (pinfo.monto ? ' Â· $ ' + pinfo.monto.toLocaleString('es-AR') : '');
    const resumenOps = resumenOpcionesElegidas(i);
    const especialLabel = i.campoEspecialLabel || campoEspecialLabelCurso(cur);
    const especialValor = String(i.campoEspecialValor || '').trim();
    const especialTxt = especialLabel && especialValor ? '<div class="student-sub" style="color:#8fc7ff;white-space:normal;">' + escHtml(especialLabel) + ': ' + escHtml(especialValor) + '</div>' : '';
    const pactado = totalContratadoAlumno(i, cur);
    const saldo = saldoAlumno(i, cur);
    const waText = 'Hola ' + (i.nombre||'').split(' ')[0] + '! Te escribimos de Tomauno para confirmarte tu pre-inscripciÃ³n a ' + cursoNombre + '. En breve nos comunicamos con los detalles. Muchas gracias!';
    const waLink = 'https://wa.me/549' + (i.wp||'').replace(/\D/g,'') + '?text=' + waEncode(waText);
    return '<tr data-insc-id="' + escAttr(k) + '">' +
      '<td class="row-index">' + (idx+1) + '</td>' +
      '<td title="' + escHtml(i.nombre||'') + '"><div class="student-name">' + escHtml(i.nombre||'-') + '</div><div class="student-sub">' + escHtml(i.fecha||'') + (i.hora?' Â· '+escHtml(i.hora):'') + '</div>' + (i.turno ? '<div class="student-sub" style="color:var(--red);">â° '+escHtml(i.turno)+'</div>' : '') + (resumenOps ? '<div class="student-sub" style="color:#f5c842;white-space:normal;">ðŸ§¾ '+escHtml(resumenOps)+' Â· Total '+dineroOpt(i.opcionesTotal)+'</div>' : '') + '</td>' +
      '<td>' + escHtml(i.edad||'-') + '</td>' +
      '<td>' + escHtml(i.dni||'-') + '</td>' +
      (mostrarCurso ? '<td><div class="course-cell" title="' + escHtml(cursoNombre) + '">' + escHtml(cursoNombre) + '</div></td>' : '') +
      '<td>' + (i.ig ? '<a rel="noopener noreferrer" href="https://instagram.com/'+escHtml(i.ig.replace('@',''))+'" target="_blank" class="ig-link">@'+escHtml(i.ig.replace('@',''))+'</a>' : '<span class="tds">-</span>') + '</td>' +
      '<td><a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp||'').replace(/\D/g,'') + '" target="_blank" class="wabtn">' + escHtml(i.wp||'-') + '</a></td>' +
      '<td>' + (i.tutorWp ? '<a rel="noopener noreferrer" href="https://wa.me/549'+i.tutorWp.replace(/\D/g,'')+'" target="_blank" class="wabtn" style="font-size:10px;">'+escHtml(i.tutorWp)+'</a>' : '<span class="tds">-</span>') + '</td>' +
      '<td><div class="pay-summary"><span class="pay-pill ' + estadoClass + '">' + estadoTxt + '</span><span class="pay-summary-text" title="' + escHtml(resumenPagos) + '">Pactado ' + dineroOpt(pactado) + ' Â· Abonado ' + dineroOpt(pinfo.monto) + (saldo ? ' Â· Saldo ' + dineroOpt(saldo) : '') + '</span><button class="pay-chip-btn" onclick="window.abrirPagosAlumno(\'' + k + '\')">Pagos</button></div></td>' +
      '<td><div class="action-mini"><a rel="noopener noreferrer" href="' + waLink + '" target="_blank" class="bsm gr" style="text-decoration:none;">WA</a><button class="bsm bl" onclick="window.enviarTicketPagoAlumno(\'' + k + '\')">Ticket</button><button class="bsm re" onclick="window.delInsc(\'' + k + '\')">âœ•</button></div></td>' +
      '</tr>';
  }).join('') +
  '<tr style="background:#0d0d0d;border-top:2px solid var(--red);"><td colspan="' + (mostrarCurso ? 10 : 9) + '" style="padding:12px;font-size:12px;color:var(--text2);font-weight:700;white-space:normal;">ðŸ“Š ' + (cursoSeleccionado ? escHtml(cursoSeleccionado.titulo || '') + ' Â· ' : '') + 'Total: ' + lista.length + ' Â· âœ… Con pago: ' + conPago + ' Â· âš¡ Parciales: ' + parcial + ' Â· â³ Pendientes: ' + pendientesPersonas + ' Â· ðŸ’° Total registrado: $ ' + totalMonto.toLocaleString('es-AR') + '</td></tr>';
  tb.querySelectorAll('tr[data-insc-id]').forEach(row => {
    const id = row.dataset.inscId;
    const i = inscripciones[id];
    const actions = row.querySelector('.action-mini');
    if (i && actions && !actions.querySelector('.edit-insc-btn')) {
      const btn = document.createElement('button');
      btn.className = 'bsm bl edit-insc-btn';
      btn.textContent = 'Editar';
      btn.onclick = () => window.abrirInscripcion(i.cursoId, id);
      actions.insertBefore(btn, actions.children[1] || null);
    }
    const cur = i ? cursos[i.cursoId] : null;
    const label = i ? (i.campoEspecialLabel || campoEspecialLabelCurso(cur)) : '';
    const cleanEspecial = String(i.campoEspecialValor || '').trim();
    if (label && cleanEspecial && row.cells[1] && !row.cells[1].querySelector('.campo-especial-row')) {
      row.cells[1].insertAdjacentHTML('beforeend', '<div class="student-sub campo-especial-row" style="color:#8fc7ff;white-space:normal;">'+escHtml(label)+': '+escHtml(cleanEspecial)+'</div>');
    }
    const igCell = row.cells[mostrarCurso ? 5 : 4];
    if (i && i.localidad && igCell && !igCell.querySelector('.localidad-row')) {
      igCell.insertAdjacentHTML('beforeend', '<div class="student-sub localidad-row" style="color:var(--text3);font-size:10px;white-space:normal;">Localidad: '+escHtml(i.localidad)+'</div>');
    }
    if (i && i.totalManual && row.cells[1] && !row.cells[1].querySelector('.total-manual-row')) {
      row.cells[1].insertAdjacentHTML('beforeend', '<div class="student-sub total-manual-row" style="color:#f5c842;white-space:normal;">Total real: '+dineroOpt(i.totalManual)+'</div>');
    }
    if (i && i.detallePedido && row.cells[1] && !row.cells[1].querySelector('.detalle-pedido-row')) {
      row.cells[1].insertAdjacentHTML('beforeend', '<div class="student-sub detalle-pedido-row" style="color:#d7d7d7;white-space:normal;">Detalle: '+escHtml(i.detallePedido)+'</div>');
    }
  });
};

window.abrirPagosAlumno = (id) => {
  const i = inscripciones[id]; if (!i) return;
  const cur = cursos[i.cursoId];
  const pinfo = getPagoAlumnoInfo(i, cur);
  const montoDefault = Number(cur?.costo || 0) || '';
  const pagos = pinfo.pagos.map(p => ({...p, monto: (p.monto === undefined || p.monto === null || p.monto === '') ? montoDefault : p.monto}));
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">PAGOS</div>' +
    '<div class="msub" style="margin-bottom:16px;">' + escHtml(i.nombre||'Alumno') + ' Â· ' + escHtml(i.cursoTitulo || cur?.titulo || '') + '</div>' +
    '<div style="background:#0d0d0d;border:1px solid var(--border);border-radius:12px;padding:10px;margin-bottom:12px;">' +
      '<label class="flbl">Total real acordado</label>' +
      '<div style="display:flex;gap:8px;align-items:center;"><input class="mini-input" id="pay-total-manual" type="number" value="' + escAttr(i.totalManual || totalContratadoAlumno(i, cur) || '') + '" placeholder="Total real"/><button class="bsm bl" onclick="window.guardarTotalAlumno(\'' + id + '\')">Guardar total</button></div>' +
      '<div style="font-size:10px;color:var(--text3);margin-top:6px;">Usalo cuando el detalle del pedido cambia el total automatico.</div>' +
    '</div>' +
    '<div style="display:grid;gap:10px;">' +
    pagos.map((p, idx) => {
      const clr = p.estado==='pagado'?'#4caf7d':p.estado==='parcial'?'#f5c842':'#e05252';
      return '<div style="display:grid;grid-template-columns:1fr 120px 120px;gap:8px;align-items:center;background:#0d0d0d;border:1px solid var(--border);border-radius:12px;padding:10px;">' +
        '<div><div style="font-size:12px;font-weight:800;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(p.label||'Pago') + '</div><div style="font-size:10px;color:var(--text3);margin-top:2px;">Cuota / concepto</div></div>' +
        '<select class="mini-input pago-estado-input" data-idx="' + idx + '" style="color:' + clr + ';font-weight:800;">' +
          '<option value="pendiente" ' + (p.estado==='pendiente'?'selected':'') + '>Pendiente</option>' +
          '<option value="parcial" ' + (p.estado==='parcial'?'selected':'') + '>Parcial</option>' +
          '<option value="pagado" ' + (p.estado==='pagado'?'selected':'') + '>Pagado</option>' +
        '</select>' +
        '<input class="mini-input pago-monto-input" data-idx="' + idx + '" type="number" value="' + escHtml((p.monto === undefined || p.monto === null || p.monto === '') ? montoDefault : p.monto) + '" placeholder="Monto" />' +
      '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-top:14px;"><button class="btn-out" style="flex:1;" onclick="window.addCuota(\'' + id + '\')">+ Agregar cuota</button><button class="btn-main" style="flex:1;" onclick="window.guardarPagosAlumno(\'' + id + '\')">Guardar pagos</button></div>';
  openModal();
};

window.guardarTotalAlumno = async (id) => {
  const totalManual = parseFloat(String(document.getElementById('pay-total-manual')?.value || '').replace(',','.')) || 0;
  await update(ref(db, 'tomauno/inscripciones/' + id), {totalManual: totalManual || null});
  toast('Total actualizado', true);
  renderAlumnos();
};

window.guardarPagosAlumno = async (id) => {
  const insc = inscripciones[id]; if (!insc) return;
  const pagos = [...(insc.pagos || [])];
  document.querySelectorAll('.pago-estado-input').forEach(el => {
    const idx = parseInt(el.dataset.idx, 10);
    if (!Number.isFinite(idx) || !pagos[idx]) return;
    const estado = el.value || 'pendiente';
    const montoEl = document.querySelector('.pago-monto-input[data-idx="' + idx + '"]');
    const monto = montoEl ? montoEl.value : pagos[idx].monto;
    pagos[idx] = {...pagos[idx], estado, monto, fechaPago: (estado === 'pagado' || estado === 'parcial') ? (pagos[idx].fechaPago || new Date().toLocaleDateString('es-AR')) : (pagos[idx].fechaPago || '')};
  });
  await update(ref(db, 'tomauno/inscripciones/' + id), {pagos});
  closeModal();
  renderAlumnos();
  toast('Pagos guardados', true);
};

window.updMontoPagoAlumno = async (id, idx, monto) => {
  const insc = inscripciones[id]; if (!insc) return;
  const pagos = [...(insc.pagos || [])];
  pagos[idx] = {...pagos[idx], monto};
  await update(ref(db, 'tomauno/inscripciones/' + id), {pagos});
  toast('ðŸ’° Monto actualizado');
};

window.updPago = async (id, idx, estado) => {
  const insc = inscripciones[id]; if (!insc) return;
  const cur = cursos[insc.cursoId];
  const pagos = [...(insc.pagos || [])];
  const montoDefault = Number(cur?.costo || 0) || '';
  pagos[idx] = {...pagos[idx], estado, monto: (pagos[idx].monto === undefined || pagos[idx].monto === null || pagos[idx].monto === '') ? montoDefault : pagos[idx].monto, fechaPago: (estado === 'pagado' || estado === 'parcial') ? (pagos[idx].fechaPago || new Date().toLocaleDateString('es-AR')) : (pagos[idx].fechaPago || '')};
  await update(ref(db, 'tomauno/inscripciones/' + id), {pagos});
  toast('ðŸ’° Pago actualizado');
};


window.enviarTicketPagoAlumno = (id) => {
  const i = inscripciones[id]; if (!i) return;
  const cur = cursos[i.cursoId];
  const cursoNombre = i.cursoTitulo || cur?.titulo || 'Curso';
  const pagos = i.pagos || [];
  const total = pagos.reduce((acc,p) => acc + ((p.estado === 'pagado' || p.estado === 'parcial') ? (parseFloat(String(p.monto||'').replace(',','.')) || 0) : 0), 0);
  const contratado = totalContratadoAlumno(i, cur);
  const saldo = saldoAlumno(i, cur);
  const fechaTicket = new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
  const ops = Array.isArray(i.opcionesElegidas) ? i.opcionesElegidas : [];
  const detalleOps = ops.map(o => '- ' + (o.nombre || '') + ': ' + dineroOpt(o.precio)).join('\n');
  const detalle = pagos.map((p, idx) => {
    const icon = p.estado === 'pagado' ? 'âœ…' : p.estado === 'parcial' ? 'âš¡' : 'â³';
    const monto = p.monto ? ('$ ' + Number(String(p.monto).replace(',','.')).toLocaleString('es-AR')) : '$ 0';
    const fecha = p.fechaPago ? (' Â· ' + p.fechaPago) : '';
    return icon + ' ' + (p.label || ('Pago ' + (idx+1))) + ': ' + estadoPagoTxt(p.estado) + ' Â· ' + monto + fecha;
  }).join('\n');
  const msg = '*Historial de pagos - Tomauno*\n\n' +
    'Alumno/a: ' + (i.nombre || '-') + '\n' +
    'Fecha ticket: ' + fechaTicket + '\n' +
    'Curso: ' + cursoNombre + '\n' +
    'DNI: ' + (i.dni || '-') + '\n\n' +
    (ops.length ? '*Opciones elegidas:*\n' + detalleOps + '\nTotal opciones: ' + dineroOpt(i.opcionesTotal || 0) + '\n\n' : '') +
    (i.detallePedido ? '*Detalle del pedido:*\n' + i.detallePedido + '\n\n' : '') +
    '*Pagos registrados:*\n' + (detalle || 'Sin pagos registrados') + '\n\n' +
    'Total contratado: $ ' + contratado.toLocaleString('es-AR') + '\n' +
    'Total abonado/registrado: $ ' + total.toLocaleString('es-AR') + '\n' +
    'Saldo: $ ' + saldo.toLocaleString('es-AR') + '\n\n' +
    'Gracias por formar parte de Tomauno.';
  const wp = (i.wp || '').replace(/\D/g,'');
  const optionRows = ops.map(o => ({
    label: o.nombre || 'OpciÃ³n',
    estado: 'Elegido',
    monto: dineroOpt(o.precio),
    fecha: '-'
  }));
  const rows = optionRows.concat(pagos.map((p, idx) => ({
    label: p.label || ('Pago ' + (idx+1)),
    estado: estadoPagoTxt(p.estado),
    monto: p.monto ? ('$ ' + Number(String(p.monto).replace(',','.')).toLocaleString('es-AR')) : '$ 0',
    fecha: p.fechaPago || '-'
  })));
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:8px;">TICKET DE PAGOS</div>' +
    '<div class="msub" style="margin-bottom:16px;">' + escHtml(i.nombre || '-') + ' Â· ' + escHtml(cursoNombre) + '</div>' +
    '<div style="background:#fff;border-radius:14px;padding:12px;overflow:auto;"><canvas id="ticket-canvas" width="900" height="1200" style="width:100%;max-width:520px;display:block;margin:0 auto;border-radius:10px;"></canvas></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">' +
    '<button class="btn-main" style="flex:1;min-width:170px;margin-top:0;" onclick="window.descargarTicketPNG()">Descargar PNG</button>' +
    '<button class="btn-out" style="flex:1;min-width:150px;margin-top:0;" onclick="navigator.clipboard.writeText(window._ticketText||\'\').then(()=>toast(\'Ticket copiado\',true))">Copiar texto</button>' +
    (wp ? '<a class="btn-out" style="flex:1;min-width:150px;margin-top:0;text-decoration:none;text-align:center;" target="_blank" rel="noopener noreferrer" href="https://wa.me/549' + wp + '?text=' + waEncode(msg) + '">Enviar WA</a>' : '') +
    '</div>' +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
  window._ticketText = msg;
  setTimeout(()=>drawTicketCanvas({alumno:i.nombre||'-', curso:cursoNombre, dni:i.dni||'-', wp:i.wp||'-', fechaTicket, detallePedido:i.detallePedido||'', total, contratado, saldo, rows}), 50);
};

function drawTicketCanvas(data){
  const c=document.getElementById('ticket-canvas'); if(!c) return;
  const ctx=c.getContext('2d');
  const W=c.width,H=c.height;
  const wrapTicketText = (text, x, y, maxWidth, lineHeight) => {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    let line = '';
    words.forEach(word => {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line, x, y);
    return y + lineHeight;
  };
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,220);grad.addColorStop(0,'#050505');grad.addColorStop(1,'#b5000a');ctx.fillStyle=grad;ctx.fillRect(0,0,W,190);
  ctx.fillStyle='#e8000a';ctx.beginPath();ctx.arc(770,0,210,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(875,1120,300,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e8000a';ctx.beginPath();ctx.arc(760,1210,260,0,Math.PI*2);ctx.fill();
  ctx.font='900 54px Arial';ctx.fillStyle='#fff';ctx.fillText('TOMA',50,82);ctx.fillStyle='#ff151f';ctx.fillText('UNO',220,82);
  ctx.font='700 18px Arial';ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillText('Cursos & Servicios',52,116);
  ctx.font='900 42px Arial';ctx.fillStyle='#fff';ctx.textAlign='right';ctx.fillText('TICKET DE PAGOS',850,104);ctx.textAlign='left';
  ctx.font='700 18px Arial';ctx.fillStyle='rgba(255,255,255,.85)';ctx.textAlign='right';ctx.fillText('Emitido: '+String(data.fechaTicket||''),850,136);ctx.textAlign='left';
  ctx.fillStyle='#f7f7f7';ctx.fillRect(50,230,800,185);
  ctx.strokeStyle='#ddd';ctx.strokeRect(50,230,800,185);
  ctx.font='700 18px Arial';ctx.fillStyle='#777';ctx.fillText('ALUMNO/A',75,265);ctx.fillText('CURSO',75,330);ctx.fillText('DNI',555,265);ctx.fillText('WHATSAPP',555,330);
  ctx.font='900 27px Arial';ctx.fillStyle='#111';ctx.fillText(String(data.alumno).slice(0,28),75,298);ctx.font='800 24px Arial';ctx.fillText(String(data.curso).slice(0,34),75,363);
  ctx.font='800 24px Arial';ctx.fillText(String(data.dni),555,298);ctx.fillText(String(data.wp),555,363);
  let y=485;
  ctx.fillStyle='#e8000a';ctx.fillRect(50,y-45,800,42);
  ctx.font='900 18px Arial';ctx.fillStyle='#fff';ctx.fillText('CONCEPTO',72,y-18);ctx.fillText('ESTADO',410,y-18);ctx.fillText('FECHA',570,y-18);ctx.fillText('MONTO',735,y-18);
  ctx.font='700 18px Arial';
  data.rows.forEach((r,idx)=>{ctx.fillStyle=idx%2?'#fff':'#f3f3f3';ctx.fillRect(50,y,800,58);ctx.strokeStyle='#e1e1e1';ctx.strokeRect(50,y,800,58);ctx.font='700 16px Arial';ctx.fillStyle='#222';wrapTicketText(String(r.label),72,y+24,300,18);ctx.font='700 18px Arial';ctx.fillStyle=r.estado==='Pagado'?'#078b42':r.estado==='Parcial'?'#c09000':r.estado==='Elegido'?'#e8000a':'#b5000a';ctx.fillText(r.estado,410,y+36);ctx.fillStyle='#222';ctx.fillText(r.fecha,570,y+36);ctx.textAlign='right';ctx.fillText(r.monto,825,y+36);ctx.textAlign='left';y+=58;});
  if (data.detallePedido) { ctx.font='800 18px Arial';ctx.fillStyle='#777';ctx.fillText('DETALLE DEL PEDIDO',60,805);ctx.font='700 18px Arial';ctx.fillStyle='#222';wrapTicketText(data.detallePedido,60,835,390,24); }
  ctx.fillStyle='#111';ctx.fillRect(455,880,395,132);ctx.font='800 18px Arial';ctx.fillStyle='#fff';ctx.fillText('TOTAL',480,915);ctx.textAlign='right';ctx.fillText('$ '+Number(data.contratado||0).toLocaleString('es-AR'),825,915);ctx.textAlign='left';ctx.fillText('ABONADO',480,955);ctx.textAlign='right';ctx.fillText('$ '+Number(data.total||0).toLocaleString('es-AR'),825,955);ctx.textAlign='left';ctx.fillStyle='#ff151f';ctx.font='900 26px Arial';ctx.fillText('SALDO',480,995);ctx.textAlign='right';ctx.fillText('$ '+Number(data.saldo||0).toLocaleString('es-AR'),825,995);ctx.textAlign='left';
  ctx.font='700 18px Arial';ctx.fillStyle='#555';ctx.fillText('Gracias por formar parte de Tomauno.',60,1025);ctx.fillText('Pedro MÃ©ndez 2069 Â· Posadas Â· @tomaunomodels Â· 3764354522',60,1060);
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
    toast('âœ… Cuota agregada');
  });
};

window.delInsc = async (id) => {
  showConfirm('Â¿Eliminar esta inscripciÃ³n?', async () => {
    await remove(ref(db, 'tomauno/inscripciones/' + id));
    toast('ðŸ—‘ï¸ InscripciÃ³n eliminada');
  });
};

// â”€â”€ GRUPO WA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.abrirGrupoWA = () => {
  const f = document.getElementById('filtro-curso')?.value;
  if (!f) { toast('SeleccionÃ¡ un curso primero'); return; }
  const c = cursos[f];
  const lista = Object.values(inscripciones).filter(i => i.cursoId === f);
  if (!lista.length) { toast('Sin inscriptos en ese curso'); return; }
  let html = '<div class="mtitle" style="margin-bottom:12px;">ðŸ’¬ GRUPO WHATSAPP</div>' +
    '<div class="msub">' + (c ? c.titulo : '') + ' Â· ' + lista.length + ' inscriptos</div>';
  if (c && c.grupoWA) {
    html += '<a rel="noopener noreferrer" href="' + c.grupoWA + '" target="_blank" class="btn-main" style="text-decoration:none;background:#25d366;margin-top:16px;">ðŸ’¬ Abrir/compartir link del grupo</a>' +
      '<div style="margin:20px 0 8px;font-size:12px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:.08em;">O enviar invitaciÃ³n individual</div>' +
      lista.map(i =>
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">' +
        '<span style="font-size:13px;">' + (i.nombre || '') + '</span>' +
        '<a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('Hola ' + (i.nombre || '').split(' ')[0] + '! Te comparto el link del grupo: ' + c.grupoWA) + '" target="_blank" class="wabtn">ðŸ’¬ Invitar</a>' +
        '</div>'
      ).join('');
  } else {
    html += '<div style="background:#1a1a1a;border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin:16px 0;font-size:13px;color:var(--text3);">Sin link de grupo. PodÃ©s editar el curso y agregar el link.</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:8px;font-weight:700;">Enviar mensaje individual:</div>' +
      lista.map(i =>
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);">' +
        '<span style="font-size:13px;">' + (i.nombre || '') + '</span>' +
        '<a rel="noopener noreferrer" href="https://wa.me/549' + (i.wp || '').replace(/\D/g, '') + '" target="_blank" class="wabtn">ðŸ’¬ WA</a>' +
        '</div>'
      ).join('');
  }
  html += '<button class="btn-out" onclick="window.closeModal()" style="margin-top:16px;">Cerrar</button>';
  document.getElementById('mcontent').innerHTML = html;
  openModal();
};

// â”€â”€ EXPORTAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    const cols = ['NÂ°','Nombre','DNI','Edad','Instagram','WhatsApp','Fecha','Opciones','Total opciones', ...paymentLabels, 'Total alumno'];
    const rows = lista.map(([,i], idx) => {
      const pagos = i.pagos || [];
      const amounts = paymentLabels.map(l => payAmount(pagos.find(p => (p.label || 'Pago') === l)));
      const totalAlumno = amounts.reduce((a,b)=>a+b,0);
      return [idx+1, i.nombre||'', i.dni||'', i.edad||'', i.ig||'', i.wp||'', i.fecha||'', resumenOpcionesElegidas(i), i.opcionesTotal || 0, ...amounts, totalAlumno];
    });
    const totals = paymentLabels.map(l => lista.reduce((a,[,i]) => a + payAmount((i.pagos||[]).find(p => (p.label || 'Pago') === l)), 0));
    rows.push(['TOTAL POR CONCEPTO','','','','','','','','', ...totals, totals.reduce((a,b)=>a+b,0)]);
    descargarExcelCsv('tomauno_pagos_' + cn.replace(/[^a-zA-Z0-9]/g,'_') + '.csv', 'Tomauno â€” Pagos â€” ' + cn, cols, rows);
    return;
  }

  const cols = ['NÂ°','Nombre','DNI','Edad','Curso','Instagram','WhatsApp','Fecha','Opciones','Total opciones','Total registrado'];
  const rows = lista.map(([,i], idx) => {
    const cur = cursos[i.cursoId];
    const total = (i.pagos || []).reduce((a,p)=>a+payAmount(p),0);
    return [idx+1, i.nombre||'', i.dni||'', i.edad||'', i.cursoTitulo || cur?.titulo || '', i.ig||'', i.wp||'', i.fecha||'', resumenOpcionesElegidas(i), i.opcionesTotal || 0, total];
  });
  rows.push(['TOTAL GENERAL','','','','','','','','','', rows.reduce((a,r)=>a+(Number(r[10])||0),0)]);
  descargarExcelCsv('tomauno_inscripciones_todos_los_cursos.csv', 'Tomauno â€” Pagos â€” Todos los cursos', cols, rows);
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
    head = '<tr><th>#</th><th>Nombre</th><th>DNI</th><th>Edad</th><th>IG</th><th>WP</th><th>Fecha</th><th>Opciones</th><th>Total opciones</th>' + paymentLabels.map(l => '<th>' + escHtml(l) + '</th>').join('') + '<th>Total</th></tr>';
    rows = lista.map(([,i], idx) => {
      const pagos = i.pagos || [];
      const totalAlumno = pagos.reduce((a,p)=>a+payAmount(p),0);
      return '<tr><td>' + (idx+1) + '</td><td>' + escHtml(i.nombre||'') + '</td><td>' + escHtml(i.dni||'') + '</td><td>' + escHtml(i.edad||'') + '</td><td>@' + escHtml(i.ig||'') + '</td><td>' + escHtml(i.wp||'') + '</td><td>' + escHtml(i.fecha||'') + '</td><td>' + escHtml(resumenOpcionesElegidas(i) || '-') + '</td><td>$ ' + Number(i.opcionesTotal || 0).toLocaleString('es-AR') + '</td>' +
        paymentLabels.map(l => '<td>' + payCell(pagos.find(p => (p.label || 'Pago') === l)) + '</td>').join('') +
        '<td><strong>$ ' + totalAlumno.toLocaleString('es-AR') + '</strong></td></tr>';
    }).join('');
    const totals = paymentLabels.map(l => lista.reduce((a,[,i]) => a + payAmount((i.pagos||[]).find(p => (p.label || 'Pago') === l)), 0));
    const grand = totals.reduce((a,b)=>a+b,0);
    totalsRow = '<tr class="total-row"><td colspan="9">TOTAL POR CONCEPTO</td>' + totals.map(t => '<td>$ ' + t.toLocaleString('es-AR') + '</td>').join('') + '<td>$ ' + grand.toLocaleString('es-AR') + '</td></tr>';
  } else {
    head = '<tr><th>#</th><th>Nombre</th><th>DNI</th><th>Edad</th><th>Curso</th><th>IG</th><th>WP</th><th>Fecha</th><th>Opciones</th><th>Total opciones</th><th>Pago</th><th>Monto</th></tr>';
    rows = lista.map(([,i], idx) => {
      const cur = cursos[i.cursoId];
      const p = getPagoAlumnoInfo(i, cur);
      const estadoTxt = p.estado === 'pagado' ? 'Con pagos' : p.estado === 'parcial' ? 'Parcial' : 'Pendiente';
      return '<tr><td>' + (idx+1) + '</td><td>' + escHtml(i.nombre||'') + '</td><td>' + escHtml(i.dni||'') + '</td><td>' + escHtml(i.edad||'') + '</td><td>' + escHtml(i.cursoTitulo || cur?.titulo || '') + '</td><td>@' + escHtml(i.ig||'') + '</td><td>' + escHtml(i.wp||'') + '</td><td>' + escHtml(i.fecha||'') + '</td><td>' + escHtml(resumenOpcionesElegidas(i) || '-') + '</td><td>$ ' + Number(i.opcionesTotal || 0).toLocaleString('es-AR') + '</td><td>' + estadoTxt + '</td><td>$ ' + Number(p.monto||0).toLocaleString('es-AR') + '</td></tr>';
    }).join('');
  }
  const total = lista.reduce((a,[,i]) => a + getPagoAlumnoInfo(i, cursos[i.cursoId]).monto, 0);
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tomauno</title><link rel="stylesheet" href="css/03-style-03.css"/></head><body><div class="head"><div class="brand">TOMA<span>UNO</span></div><div class="course-title">' + escHtml(cn) + '</div><div class="meta">Planilla de alumnos Â· ' + new Date().toLocaleDateString('es-AR') + '</div></div><div class="summary"><div class="box">Inscriptos: ' + lista.length + '</div><div class="box">Total registrado: $ ' + total.toLocaleString('es-AR') + '</div></div><table><thead>' + head + '</thead><tbody>' + rows + totalsRow + '</tbody></table></body></html>');
  win.document.close();
  setTimeout(() => win.print(), 400);
};

// â”€â”€ SERVICIOS HARDCODED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Exportaciones de cursos con campo especial y saldo.
window.exportarExcel = () => {
  const {filtro, lista} = getAlumnosFiltrados();
  const cn = filtro && cursos[filtro] ? cursos[filtro].titulo : 'Todos los cursos';
  const selectedCourse = filtro && cursos[filtro] ? cursos[filtro] : null;
  const cr = Object.assign({dni:true, edad:true, ig:true, email:false, altura:false, medidas:false}, selectedCourse?.camposReq || {});
  const especialHeader = (filtro && cursos[filtro] ? campoEspecialLabelCurso(cursos[filtro]) : '') || (lista.map(([,i]) => i.campoEspecialLabel || campoEspecialLabelCurso(cursos[i.cursoId])).find(Boolean)) || 'Dato especial';
  const hasEspecial = lista.some(([,i]) => String(i.campoEspecialValor || '').trim());
  const hasDetalle = lista.some(([,i]) => i.detallePedido);
  const hasOpciones = lista.some(([,i]) => resumenOpcionesElegidas(i));
  const hasTutor = lista.some(([,i]) => i.tutorNombre || i.tutorWp);
  const includeAll = !selectedCourse;
  const cols = ['Nro','Nombre'];
  if(includeAll || cr.dni !== false) cols.push('DNI');
  if(includeAll || cr.edad !== false) cols.push('Edad');
  cols.push('Curso');
  if(hasEspecial) cols.push(especialHeader);
  if(hasDetalle) cols.push('Detalle pedido');
  cols.push('Localidad');
  if(includeAll || cr.ig !== false) cols.push('Instagram');
  cols.push('WhatsApp alumno');
  if(includeAll || hasTutor){ cols.push('Tutor','WhatsApp tutor'); }
  if(includeAll || cr.email) cols.push('Email');
  if(includeAll || cr.altura) cols.push('Altura');
  if(includeAll || cr.medidas) cols.push('Medidas');
  cols.push('Fecha');
  if(hasOpciones) cols.push('Opciones');
  cols.push('Total contratado','Total abonado','Saldo');
  const rows = lista.map(([,i], idx) => {
    const cur = cursos[i.cursoId];
    const pinfo = getPagoAlumnoInfo(i, cur);
    const row = [idx+1, i.nombre||''];
    if(includeAll || cr.dni !== false) row.push(i.dni||'');
    if(includeAll || cr.edad !== false) row.push(i.edad||'');
    row.push(i.cursoTitulo || cur?.titulo || '');
    if(hasEspecial) row.push(i.campoEspecialValor || '');
    if(hasDetalle) row.push(i.detallePedido || '');
    row.push(i.localidad || '');
    if(includeAll || cr.ig !== false) row.push(i.ig||'');
    row.push(i.wp||'');
    if(includeAll || hasTutor) row.push(i.tutorNombre||'', i.tutorWp||'');
    if(includeAll || cr.email) row.push(i.email||'');
    if(includeAll || cr.altura) row.push(i.altura||'');
    if(includeAll || cr.medidas) row.push(i.medidas||'');
    row.push(i.fecha||'');
    if(hasOpciones) row.push(resumenOpcionesElegidas(i));
    row.push(totalContratadoAlumno(i, cur), pinfo.monto, saldoAlumno(i, cur));
    return row;
  });
  const totalIdx = cols.indexOf('Total contratado');
  const abonadoIdx = cols.indexOf('Total abonado');
  const saldoIdx = cols.indexOf('Saldo');
  const totalRow = Array(cols.length).fill('');
  totalRow[0] = 'TOTAL';
  totalRow[totalIdx] = rows.reduce((a,r)=>a+(Number(r[totalIdx])||0),0);
  totalRow[abonadoIdx] = rows.reduce((a,r)=>a+(Number(r[abonadoIdx])||0),0);
  totalRow[saldoIdx] = rows.reduce((a,r)=>a+(Number(r[saldoIdx])||0),0);
  rows.push(totalRow);
  descargarExcelCsv('tomauno_inscripciones_' + String(cn).replace(/[^a-zA-Z0-9]/g,'_') + '.csv', 'Tomauno - Inscripciones - ' + cn, cols, rows);
};

window.exportarPDF = () => {
  const {filtro, lista} = getAlumnosFiltrados();
  const cn = filtro && cursos[filtro] ? cursos[filtro].titulo : 'Todos los cursos';
  const especialHeader = (filtro && cursos[filtro] ? campoEspecialLabelCurso(cursos[filtro]) : '') || (lista.map(([,i]) => i.campoEspecialLabel || campoEspecialLabelCurso(cursos[i.cursoId])).find(Boolean)) || 'Dato especial';
  const totalAbonado = lista.reduce((a,[,i]) => a + getPagoAlumnoInfo(i, cursos[i.cursoId]).monto, 0);
  const totalSaldo = lista.reduce((a,[,i]) => a + saldoAlumno(i, cursos[i.cursoId]), 0);
  const rows = lista.map(([id,i], idx) => {
    const cur = cursos[i.cursoId];
    const pinfo = getPagoAlumnoInfo(i, cur);
    const especialValor = String(i.campoEspecialValor || '').trim();
    const especial = (i.campoEspecialLabel || campoEspecialLabelCurso(cur)) && especialValor ? especialValor : '-';
    return '<tr><td>'+(idx+1)+'</td><td>'+escHtml(i.nombre||'')+'</td><td>'+escHtml(i.dni||'')+'</td><td>'+escHtml(i.edad||'')+'</td><td>'+escHtml(i.cursoTitulo || cur?.titulo || '')+'</td><td>'+escHtml(especial)+'</td><td>'+escHtml(i.detallePedido || '-')+'</td><td>'+escHtml(resumenOpcionesElegidas(i) || '-')+'</td><td>$ '+totalContratadoAlumno(i, cur).toLocaleString('es-AR')+'</td><td>$ '+pinfo.monto.toLocaleString('es-AR')+'</td><td>$ '+saldoAlumno(i, cur).toLocaleString('es-AR')+'</td></tr>';
  }).join('');
  const win = window.open('', '_blank');
  if(!win) return;
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Tomauno</title><link rel="stylesheet" href="css/03-style-03.css"/></head><body><div class="head"><div class="brand">TOMA<span>UNO</span></div><div class="course-title">'+escHtml(cn)+'</div><div class="meta">Planilla de alumnos - '+new Date().toLocaleDateString('es-AR')+'</div></div><div class="summary"><div class="box">Inscriptos: '+lista.length+'</div><div class="box">Abonado: $ '+totalAbonado.toLocaleString('es-AR')+'</div><div class="box">Saldo: $ '+totalSaldo.toLocaleString('es-AR')+'</div></div><table><thead><tr><th>#</th><th>Nombre</th><th>DNI</th><th>Edad</th><th>Curso</th><th>'+escHtml(especialHeader)+'</th><th>Detalle pedido</th><th>Opciones</th><th>Total</th><th>Abonado</th><th>Saldo</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>');
  win.document.close();
  setTimeout(() => win.print(), 400);
};

const SERVICIOS = [
  {icon:'ðŸ“·', title:'SESIONES FOTOGRÃFICAS', desc:'Capturamos tu esencia con luz profesional y direcciÃ³n de arte.\n\nRealizamos sesiones de:\nâ€¢ Retratos artÃ­sticos y editoriales\nâ€¢ Book de modelos (principiantes y profesionales)\nâ€¢ Moda y lookbook\nâ€¢ Fotos para redes sociales / contenido\nâ€¢ Sesiones en estudio o locaciÃ³n exterior\n\nCada sesiÃ³n incluye selecciÃ³n de imÃ¡genes editadas en alta resoluciÃ³n.', wp:'3764354522'},
  {icon:'ðŸŽ­', title:'MODELAJE', desc:'FormaciÃ³n integral para modelos de todos los niveles.\n\nIncluye:\nâ€¢ Asesoramiento de imagen y posado\nâ€¢ TÃ©cnicas de pasarela y desfile\nâ€¢ Book fotogrÃ¡fico profesional incluido\nâ€¢ VinculaciÃ³n con agencias y productoras\nâ€¢ Clases grupales e individuales\n\nIdeal para quienes quieren iniciar o potenciar su carrera en el modelaje.', wp:'3764354522'},
  {icon:'ðŸŽ“', title:'CAPACITACIONES', desc:'Workshops y cursos presenciales para fotÃ³grafos y creativos.\n\nFormatos disponibles:\nâ€¢ Workshops intensivos (1 dÃ­a)\nâ€¢ Cursos regulares (mensuales)\nâ€¢ Charlas temÃ¡ticas\nâ€¢ Capacitaciones in-company\n\nTemÃ¡ticas: fotografÃ­a de retrato, iluminaciÃ³n, ediciÃ³n, branding personal y mÃ¡s.', wp:'3764354522'},
  {icon:'ðŸŽ¬', title:'PRODUCCIÃ“N', desc:'Contenido audiovisual profesional para tu marca o proyecto.\n\nRealizamos:\nâ€¢ Videos para redes sociales (Reels, TikTok, YouTube)\nâ€¢ ProducciÃ³n de eventos\nâ€¢ FotografÃ­a y video corporativo\nâ€¢ Contenido para campaÃ±as publicitarias\nâ€¢ DirecciÃ³n creativa integral\n\nContactanos para cotizaciÃ³n segÃºn tu proyecto.', wp:'3764354522'}
];

window.abrirServicio = (idx) => {
  const s = SERVICIOS[idx]; if (!s) return;
  document.getElementById('mcontent').innerHTML =
    '<div style="font-size:52px;text-align:center;margin-bottom:12px;">' + s.icon + '</div>' +
    '<div class="mtitle" style="text-align:center;">' + s.title + '</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.75;white-space:pre-line;margin:16px 0 20px;">' + s.desc + '</div>' +
    '<a rel="noopener noreferrer" href="https://wa.me/549' + s.wp + '?text=' + encodeURIComponent('Hola! Me interesa el servicio de ' + s.title + '. Â¿Pueden darme mÃ¡s info?') + '" target="_blank" class="btn-main" style="text-decoration:none;">ðŸ’¬ Consultar por WhatsApp</a>' +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};

// â”€â”€ SERVICIOS FIREBASE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.agregarServicio = async () => {
  const titulo = document.getElementById('ns-titulo')?.value.trim();
  if (!titulo) { toast('âš ï¸ El tÃ­tulo es obligatorio'); return; }
  await push(ref(db, 'tomauno/servicios'), {
    titulo,
    tipo: document.getElementById('ns-tipo')?.value || 'servicio',
    desc: document.getElementById('ns-desc')?.value.trim() || '',
    precio: parseInt(document.getElementById('ns-precio')?.value) || 0,
    icon: document.getElementById('ns-icon')?.value.trim() || 'ðŸ“·',
    img: document.getElementById('ns-img')?.value.trim() || '',
    extraText: document.getElementById('ns-extra-text')?.value.trim() || '',
    extraUrl: document.getElementById('ns-extra-url')?.value.trim() || '',
    dir: document.getElementById('ns-dir')?.value.trim() || 'Pedro MÃ©ndez 2069, Posadas',
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
  document.getElementById('ns-icon').value = 'ðŸ“·';
  toast('âœ… Servicio publicado');
};

function renderServiciosAdmin() {
  const w = document.getElementById('admin-servicios-list'); if (!w) return;
  const lista = Object.entries(serviciosDB).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin servicios en Firebase aÃºn</div>'; return; }
  w.innerHTML = lista.map(([k, s], idx) =>
    '<div class="admin-ci">' +
    '<div class="admin-ci-info">' +
    '<div class="admin-ci-tit"><span style="color:var(--text3);font-size:12px;margin-right:6px;">#' + (idx+1) + '</span>' + (s.icon || 'ðŸ“·') + ' ' + (s.titulo || 'Sin tÃ­tulo') + '</div>' +
    '<div class="admin-ci-sub">' + (s.precio ? '$ ' + Number(s.precio).toLocaleString('es-AR') : 'Sin precio') + ' Â· ' + (s.oculto ? 'ðŸ™ˆ Oculto' : 'ðŸ‘ï¸ Visible') + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
    '<button class="bsm gr" onclick="window.editServicio(\'' + k + '\')">âœï¸ Editar</button>' +
    '<button class="bsm ' + (s.oculto ? 'gr' : 'bl') + '" onclick="window.togSrvOc(\'' + k + '\',' + !s.oculto + ')">' + (s.oculto ? 'ðŸ‘ï¸ Mostrar' : 'ðŸ™ˆ Ocultar') + '</button>' +
    '<button class="bsm re" onclick="window.delServicio(\'' + k + '\')">ðŸ—‘ï¸</button>' +
    '</div></div>'
  ).join('');
}

function renderServiciosPublicos() {
  const g = document.getElementById('servicios-db-grid'); if (!g) return;
  const lista = Object.entries(serviciosDB).filter(([, s]) => !s.oculto).sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) { g.innerHTML = ''; return; }
  g.innerHTML = lista.map(([k, s]) =>
    '<div class="srv-card" onclick="window.abrirServicioDB(\'' + k + '\')">' +
    '<div class="srv-icon">' + (s.img ? '<img src="' + s.img + '" style="width:100%;height:140px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:12px;" onerror="this.outerHTML=\'<span style=font-size:44px>' + (s.icon || 'ðŸ“·') + '</span>\'"/>' : (s.icon || 'ðŸ“·')) + '</div>' +
    '<div class="srv-title">' + (s.titulo || '') + '</div>' +
    (s.tipo==='sesiones' ? '<div style="font-size:10px;color:#a78bfa;font-weight:800;margin-bottom:8px;letter-spacing:.08em;text-transform:uppercase;">ðŸ“… Reserva con turnos</div>' : '') +
    '<div class="srv-desc">' + (s.desc || '').replace(/\n/g,' ').substring(0, 90) + (s.desc && s.desc.length > 90 ? '...' : '') + '</div>' +
    (s.precio ? '<div class="srv-price">$ ' + Number(s.precio).toLocaleString('es-AR') + '</div>' : '') +
    '<div class="srv-cta">' + (s.tipo==='sesiones'?'Reservar turno â†’':'Ver mÃ¡s â†’') + '</div>' +
    '</div>'
  ).join('');
}

window.abrirServicioDB = (id) => {
  const s = serviciosDB[id]; if (!s) return;
  const wp = s.wp || '3764354522';
  document.getElementById('mcontent').innerHTML =
    (s.img ? '<img src="' + s.img + '" style="width:100%;border-radius:var(--radius-sm);margin-bottom:16px;max-height:280px;object-fit:contain;background:#0a0a0a;" onerror="this.style.display=\'none\'"/>' : '<div style="font-size:52px;text-align:center;margin-bottom:12px;">' + (s.icon || 'ðŸ“·') + '</div>') +
    '<div class="mtitle">' + (s.titulo || '') + '</div>' +
    (s.precio ? '<div style="font-family:var(--display);font-size:32px;color:var(--red);margin:8px 0 16px;">$ ' + Number(s.precio).toLocaleString('es-AR') + '</div>' : '') +
    '<div style="font-size:14px;color:var(--text2);line-height:1.75;white-space:pre-line;margin-bottom:20px;">' + (s.desc || '') + '</div>' +
    (s.dir ? '<div style="font-size:13px;color:var(--text2);margin-bottom:10px;">ðŸ“ ' + s.dir + '</div>' : '') +
    (s.ig ? '<a rel="noopener noreferrer" href="https://instagram.com/' + s.ig + '" target="_blank" class="det-link ig" style="margin-bottom:12px;display:inline-flex;">ðŸ“¸ @' + s.ig + '</a>' : '') +
    (s.tipo==='sesiones' ? '<button class="btn-main" style="margin-top:8px;" onclick="window.abrirTurnosServicio(\'' + id + '\')">ðŸ“… Elegir turno</button>' : '<a rel="noopener noreferrer" href="https://wa.me/549' + wp + '?text=' + encodeURIComponent('Hola! Me interesa el servicio: ' + (s.titulo || '') + '. Â¿Pueden darme mÃ¡s info?') + '" target="_blank" class="btn-main" style="text-decoration:none;margin-top:8px;">ðŸ’¬ Consultar por WhatsApp</a>') +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};


window.editServicio = (id) => {
  const s = serviciosDB[id]; if (!s) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR SERVICIO</div>' +
    '<div class="msub" style="margin-bottom:14px;">ModificÃ¡ los datos del servicio.</div>' +
    '<label class="flbl">TÃ­tulo *</label><input class="finput" id="es-titulo" value="' + escAttr(s.titulo || '') + '"/>' +
    '<label class="flbl">Modalidad</label><select class="finput" id="es-tipo" onchange="document.getElementById(\'es-turnos-config\').style.display=this.value===\'sesiones\'?\'block\':\'none\'"><option value="servicio" '+((s.tipo||'servicio')==='servicio'?'selected':'')+'>Servicio informativo</option><option value="sesiones" '+(s.tipo==='sesiones'?'selected':'')+'>Con turnos / reservas</option></select>' +
    '<div id="es-turnos-config" style="display:'+(s.tipo==='sesiones'?'block':'none')+';background:#1a0000;border:1px solid #3a0000;border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;"><div class="frow2"><div><label class="flbl">Hora inicio</label><input class="finput" id="es-h-ini" type="time" value="'+(s.horaInicio||'09:00')+'" style="color-scheme:dark"/></div><div><label class="flbl">Hora fin</label><input class="finput" id="es-h-fin" type="time" value="'+(s.horaFin||'22:00')+'" style="color-scheme:dark"/></div></div><div class="frow2"><div><label class="flbl">DuraciÃ³n turno</label><input class="finput" id="es-dur" type="number" value="'+(s.duracion||30)+'"/></div><div><label class="flbl">Descansos</label><input class="finput" id="es-descansos" value="'+escAttr(s.descansos||'')+'"/></div></div></div>' +
    '<label class="flbl">DescripciÃ³n</label><textarea class="finput" id="es-desc" rows="4">' + escHtml(s.desc || '') + '</textarea>' +
    '<div class="frow2"><div><label class="flbl">Precio desde ($)</label><input class="finput" id="es-precio" type="number" value="'+(s.precio||0)+'"/></div><div><label class="flbl">Icono</label><input class="finput" id="es-icon" maxlength="4" value="'+escAttr(s.icon||'ðŸ“·')+'"/></div></div>' +
    '<label class="flbl">URL imagen</label><input class="finput" id="es-img" value="'+escAttr(s.img||'')+'" placeholder="https://i.imgur.com/..."/>' +
    '<label class="flbl">DirecciÃ³n</label><div style="display:flex;gap:6px;"><input class="finput" id="es-dir" value="'+escAttr(s.dir||'')+'" style="margin:0;"/><button type="button" onclick="document.getElementById(\'es-dir\').value=\'Pedro MÃ©ndez 2069, Posadas, Misiones\'" style="background:var(--gray3);border:none;color:var(--text2);border-radius:var(--radius-sm);padding:0 12px;font-size:11px;cursor:pointer;font-family:var(--font);">ðŸ“ Estudio</button></div>' +
    '<div class="frow2"><div><label class="flbl">Instagram</label><input class="finput" id="es-ig" value="'+escAttr(s.ig||'')+'"/></div><div><label class="flbl">WhatsApp</label><input class="finput" id="es-wp" value="'+escAttr(s.wp||'')+'"/></div></div>' +
    '<label class="flbl">Campos del formulario si usa turnos</label><div style="background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;display:flex;flex-wrap:wrap;gap:10px;"><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-ig" '+((s.camposReq||{}).ig!==false?'checked':'')+' style="accent-color:var(--red);"> Instagram</label><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-email" '+((s.camposReq||{}).email?'checked':'')+' style="accent-color:var(--red);"> Email</label><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-altura" '+((s.camposReq||{}).altura?'checked':'')+' style="accent-color:var(--red);"> Altura</label><label style="display:flex;align-items:center;gap:6px;font-size:13px;"><input type="checkbox" id="es-req-medidas" '+((s.camposReq||{}).medidas?'checked':'')+' style="accent-color:var(--red);"> Medidas</label></div><div style="font-size:10px;color:var(--text3);margin-top:4px;">Nombre, WhatsApp y edad son siempre obligatorios. DNI no se pide en servicios.</div>' +
    '<button class="btn-main" onclick="window.guardarEditServicio(\''+id+'\')">ðŸ’¾ Guardar cambios</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarEditServicio = async (id) => {
  const titulo = document.getElementById('es-titulo')?.value.trim();
  if (!titulo) { toast('El tÃ­tulo es obligatorio'); return; }
  await update(ref(db,'tomauno/servicios/'+id), {
    titulo,
    tipo: document.getElementById('es-tipo')?.value || 'servicio',
    desc: document.getElementById('es-desc')?.value.trim() || '',
    precio: parseInt(document.getElementById('es-precio')?.value) || 0,
    icon: document.getElementById('es-icon')?.value.trim() || 'ðŸ“·',
    img: document.getElementById('es-img')?.value.trim() || '',
    dir: document.getElementById('es-dir')?.value.trim() || 'Pedro MÃ©ndez 2069, Posadas, Misiones',
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
  toast('âœ… Servicio actualizado');
};

window.togSrvOc = async (id, v) => { await update(ref(db, 'tomauno/servicios/' + id), {oculto: v}); };
window.delServicio = async (id) => {
  showConfirm('Â¿Eliminar este servicio?', async () => {
    await remove(ref(db, 'tomauno/servicios/' + id));
    toast('ðŸ—‘ï¸ Servicio eliminado');
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
  let html = '<div class="mtitle">ELEGÃ TU TURNO</div><div class="msub">' + (s.titulo || '') + ' Â· <span style="color:#4caf7d;">' + libres + ' disponibles</span></div><div class="slots-grid">';
  slots.forEach(x => {
    const q = ocup.find(i => i.turno === x);
    html += '<div class="slot ' + (q ? 'ocupado' : 'libre') + '" data-id="' + id + '" data-slot="' + x + '" ' + (q ? '' : 'onclick="window.selTurnoServicio(this)"') + '><div class="slot-t">' + x + '</div><div class="slot-n">' + (q ? (q.nombre || '').split(' ')[0] : 'âœ“ Libre') + '</div></div>';
  });
  html += '</div><button class="btn-out" style="margin-top:16px;" onclick="window.closeModal()">Cancelar</button>';
  document.getElementById('mcontent').innerHTML = html; openModal();
};
window.selTurnoServicio = (el) => { window.abrirReservaServicio(el.dataset.id, el.dataset.slot); };
window.abrirReservaServicio = (id, turno) => {
  const s = serviciosDB[id]; if (!s) return;
  const cr = Object.assign({dni:false, edad:true, ig:true, email:false, altura:false, medidas:false}, s.camposReq || {});
  document.getElementById('mcontent').innerHTML = '<div class="mtitle">RESERVAR TURNO</div><div class="msub">' + (s.titulo||'') + ' Â· <strong style="color:var(--red);">' + turno + '</strong></div>' +
    '<input type="hidden" id="fsv-turno" value="' + turno + '"/>' +
    '<input class="finput" id="fsv-nom" placeholder="Nombre y apellido *"/>' +
    '<input type="hidden" id="fsv-dni" value=""/>' +
    '<input class="finput" id="fsv-edad" placeholder="Edad *" type="number"/>' +
    (cr.ig !== false ? '<input class="finput" id="fsv-ig" placeholder="Instagram (sin @)"/>' : '') +
    (cr.email ? '<input class="finput" id="fsv-email" placeholder="Email *" type="email"/>' : '') +
    '<input class="finput" id="fsv-wp" placeholder="WhatsApp * ej: 3764123456" type="tel"/>' +
    '<input class="finput" id="fsv-localidad" placeholder="Localidad (opcional)"/>' +
    '<button class="btn-main" onclick="window.confirmarReservaServicio(\'' + id + '\')">âœ… Confirmar turno</button><button class="btn-out" onclick="window.abrirTurnosServicio(\'' + id + '\')">â† Volver</button>';
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
  await push(ref(db,'tomauno/servicioRegs'), {servicioId:id, servicioTitulo:s.titulo||'', nombre:nom, wp, dni, edad, ig, email, localidad, turno, fecha:new Date().toLocaleDateString('es-AR'), creado:Date.now(), pagos:[{label:'Pago Ãºnico', estado:'pendiente', monto:''}]});
  const waText = 'ðŸ“… *NUEVA RESERVA DE SERVICIO*\n\nðŸ› ï¸ *Servicio:* '+(s.titulo||'')+'\nâ° *Turno:* '+turno+'\nðŸ‘¤ *Nombre:* '+nom+'\nðŸ“± *WhatsApp:* '+wp+(ig?'\nðŸ“¸ *Instagram:* @'+ig:'')+(localidad?'\nðŸ“ *Localidad:* '+localidad:'');
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(waText);
  document.getElementById('mcontent').innerHTML = '<div style="text-align:center;padding:12px 0;"><div style="font-size:52px;margin-bottom:16px;">âœ…</div><div class="mtitle">TURNO REGISTRADO</div><div style="font-size:14px;color:var(--text2);line-height:1.6;margin:14px 0 20px;">Tu turno quedÃ³ registrado. Al presionar Aceptar se enviarÃ¡n tus datos a Tomauno por WhatsApp.</div><button class="btn-main" onclick="window.open(window._pendingWaUrl,\'_blank\');window.closeModal();">Aceptar â€” Enviar a WhatsApp</button></div>';
};

// â”€â”€ TESTIMONIOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderTestimonios() {
  const g = document.getElementById('test-grid'); if (!g) return;
  const lista = Object.entries(testimoniosDB)
    .filter(([, t]) => !t.pendiente)
    .sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));
  if (!lista.length) {
    g.innerHTML = '<div style="color:var(--text3);font-size:14px;padding:20px 0;">Los testimonios aparecerÃ¡n aquÃ­.</div>';
    return;
  }
  g.innerHTML = lista.map(([k, t]) => {
    const stars = 'â˜…'.repeat(parseInt(t.stars) || 5);
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
  if (!lista.length) { w.innerHTML = '<div style="color:var(--text3);font-size:13px;">Sin testimonios aÃºn</div>'; return; }
  w.innerHTML = lista.map(([k, t]) =>
    '<div class="admin-ci">' +
    '<div class="admin-ci-info">' +
    '<div class="admin-ci-tit">' + ('â­'.repeat(parseInt(t.stars)||5)) + ' ' + (t.name || 'AnÃ³nimo') + '</div>' +
    '<div class="admin-ci-sub">' + (t.course || '') + (t.ig ? ' Â· @' + String(t.ig).replace('@','') : '') + ' Â· "' + (t.text || '').substring(0, 60) + '..."</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-items:center;">' +
    '<select class="mini-input" style="width:116px;height:32px;font-size:11px;font-weight:800;color:' + (t.pendiente ? '#f5c842' : '#4caf7d') + ';" onchange="window.setTestEstado(\'' + k + '\',this.value)">' +
      '<option value="publicado" ' + (!t.pendiente?'selected':'') + '>Publicado</option>' +
      '<option value="pendiente" ' + (t.pendiente?'selected':'') + '>Pendiente</option>' +
    '</select>' +
    '<button class="bsm bl" onclick="window.editTest(\'' + k + '\')">âœï¸ Editar</button>' +
    '<button class="bsm re" onclick="window.delTest(\'' + k + '\')">ðŸ—‘ï¸</button>' +
    '</div></div>'
  ).join('');
}

window.setTestEstado = async (id, estado) => {
  await update(ref(db, 'tomauno/testimonios/' + id), {pendiente: estado === 'pendiente'});
  toast(estado === 'pendiente' ? 'â³ Testimonio pendiente' : 'âœ… Testimonio publicado', true);
};

function renderFiltroTestimonios() {
  // ya estÃ¡ en renderFiltros, pero tambiÃ©n se llama desde cursos listener
}

window.agregarTestimonio = async () => {
  const texto = document.getElementById('nt-texto')?.value.trim();
  if (!texto) { toast('âš ï¸ El texto es obligatorio'); return; }
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
  toast('âœ… Testimonio publicado', true);
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
  const opts = ['<option value="">Sin referencia especÃ­fica</option>'];
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
    '<div style="font-size:11px;color:var(--text3);margin:-2px 0 10px;">PodÃ©s dejarlo vacÃ­o si el testimonio no corresponde a un curso o servicio cargado.</div>';
}

window.editTest = (id) => {
  const t = testimoniosDB[id]; if (!t) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR TESTIMONIO</div>' +
    '<div class="msub" style="margin-bottom:16px;">CorregÃ­ texto, curso, estrellas o imagen antes de publicarlo.</div>' +
    '<label class="flbl">Nombre</label><input class="finput" id="et-name" value="' + escHtml(t.name || '') + '" />' +
    '<label class="flbl">Curso / servicio / referencia</label>' + buildTestReferenceSelectHtml(t.course || '') +
    '<label class="flbl">Instagram (opcional)</label><input class="finput" id="et-ig" value="' + escHtml(t.ig || '') + '" placeholder="@usuario o usuario" />' +
    '<label class="flbl">Texto</label><textarea class="finput" id="et-text" rows="5">' + escHtml(t.text || '') + '</textarea>' +
    '<div class="frow2"><div><label class="flbl">Estrellas</label><select class="finput" id="et-stars">' +
      '<option value="5" ' + ((parseInt(t.stars)||5)===5?'selected':'') + '>â­â­â­â­â­ 5</option>' +
      '<option value="4" ' + ((parseInt(t.stars)||5)===4?'selected':'') + '>â­â­â­â­ 4</option>' +
      '<option value="3" ' + ((parseInt(t.stars)||5)===3?'selected':'') + '>â­â­â­ 3</option>' +
    '</select></div><div><label class="flbl">Estado</label><select class="finput" id="et-pendiente">' +
      '<option value="false" ' + (!t.pendiente?'selected':'') + '>Publicado</option>' +
      '<option value="true" ' + (t.pendiente?'selected':'') + '>Pendiente</option>' +
    '</select></div></div>' +
    '<label class="flbl">URL foto / avatar</label><input class="finput" id="et-avatar" value="' + escHtml(t.avatar || '') + '" placeholder="https://i.imgur.com/..." />' +
    '<button class="btn-main" onclick="window.guardarTestEdit(\'' + id + '\')">ðŸ’¾ Guardar testimonio</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.guardarTestEdit = async (id) => {
  const texto = document.getElementById('et-text')?.value.trim();
  if (!texto) { toast('âš ï¸ El texto es obligatorio'); return; }
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
  toast('âœ… Testimonio actualizado', true);
};

window.aprobarTest = async (id) => {
  await update(ref(db, 'tomauno/testimonios/' + id), {pendiente: false});
  toast('âœ… Testimonio aprobado', true);
};

window.delTest = async (id) => {
  showConfirm('Â¿Eliminar este testimonio?', async () => {
    await remove(ref(db, 'tomauno/testimonios/' + id));
    toast('ðŸ—‘ï¸ Testimonio eliminado', true);
  });
};

// Link pÃºblico para dejar reseÃ±a
window.abrirFormTestimonio = () => {
  let cursosOpts = '<option value="">Sin curso especÃ­fico</option>' +
    Object.entries(cursos).sort((a, b) => (b[1].creado||0)-(a[1].creado||0))
      .map(([k, c]) => '<option value="' + (c.titulo||k) + '">' + (c.titulo||k) + '</option>').join('');
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">DEJÃ TU RESEÃ‘A</div>' +
    '<div class="msub" style="margin-bottom:16px;">Â¡Nos encanta saber tu opiniÃ³n!</div>' +
    '<label class="flbl">Tu nombre</label>' +
    '<input class="finput" id="rv-nombre" placeholder="Tu nombre"/>' +
    '<label class="flbl">Instagram (opcional)</label>' +
    '<input class="finput" id="rv-ig" placeholder="@usuario o usuario"/>' +
    '<label class="flbl">Curso</label>' +
    '<select class="finput" id="rv-curso">' + cursosOpts + '</select>' +
    '<label class="flbl">Tu experiencia *</label>' +
    '<textarea class="finput" id="rv-texto" placeholder="Contanos quÃ© te pareciÃ³..."></textarea>' +
    '<label class="flbl">Estrellas</label>' +
    '<select class="finput" id="rv-stars"><option value="5">â­â­â­â­â­ Excelente</option><option value="4">â­â­â­â­ Muy bueno</option><option value="3">â­â­â­ Bueno</option></select>' +
    '<button class="btn-main" onclick="window.enviarReview()">â­ Enviar reseÃ±a</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
};

window.enviarReview = async () => {
  const texto = document.getElementById('rv-texto')?.value.trim();
  if (!texto) { toast('âš ï¸ Contanos tu experiencia'); return; }
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
    '<div style="font-size:52px;margin-bottom:16px;">ðŸ™</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">Â¡Muchas gracias!</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Tu reseÃ±a fue registrada correctamente y serÃ¡ revisada antes de publicarse.</div>' +
    '<button class="btn-main" onclick="window.closeModal()">Cerrar</button></div>';
};


function renderStatsVistas() {
  const w = document.getElementById('stats-vistas-content');
  if (!w) return;
  const inscPorCurso = {};
  Object.values(inscripciones || {}).forEach(i => { if (i.cursoId) inscPorCurso[i.cursoId] = (inscPorCurso[i.cursoId] || 0) + 1; });
  const evPorEvento = {};
  Object.values(evInscDB || {}).forEach(i => { if (i.evId) evPorEvento[i.evId] = (evPorEvento[i.evId] || 0) + 1; });
  const cursosTop = Object.entries(cursos || {}).map(([id,c]) => ({id, titulo:c.titulo || 'Sin tÃ­tulo', n:inscPorCurso[id] || 0})).sort((a,b)=>b.n-a.n).slice(0,6);
  const eventosTop = Object.entries(eventosDB || {}).map(([id,e]) => ({id, titulo:e.titulo || 'Sin tÃ­tulo', n:evPorEvento[id] || 0})).sort((a,b)=>b.n-a.n).slice(0,6);
  const totalCursos = Object.values(inscPorCurso).reduce((a,b)=>a+b,0);
  const totalEventos = Object.values(evPorEvento).reduce((a,b)=>a+b,0);
  const renderRows = arr => arr.length ? arr.map(x => '<div class="stats-row"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + x.titulo + '</span><strong style="color:#fff;">' + x.n + '</strong></div>').join('') : '<div style="color:var(--text3);font-size:12px;">Sin datos todavÃ­a</div>';
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



// â”€â”€ CHAT DIRECTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let chatsDB = {}, adminStatus = {adminOnline:false, adminLast:0};
let asistenteDB = {modo:'manual', knowledge:{}};
let knownChatIds = null;
let notifiedChatIds = (() => { try { return new Set(JSON.parse(localStorage.getItem('tomauno-chat-notified') || '[]')); } catch(e){ return new Set(); } })();
// IMPORTANTE: el chat del visitante queda por pestaÃ±a, no por navegador completo.
// AsÃ­ un usuario nuevo no hereda mensajes viejos si abre otra pestaÃ±a o navegador.
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
  if (!('Notification' in window)) { toast('âš ï¸ Este navegador no soporta notificaciones'); return false; }
  if (Notification.permission === 'granted') { toast('ðŸ”” Notificaciones ya activas', true); return true; }
  if (Notification.permission === 'denied') { toast('âš ï¸ Las notificaciones estÃ¡n bloqueadas en el navegador'); return false; }
  try{
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') { toast('ðŸ”” Notificaciones activadas', true); return true; }
  }catch(e){}
  toast('âš ï¸ No se activaron las notificaciones');
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


function tomaunoUltimoMensajeUsuarioChat(c){
  try{
    const arr = chatMsgs(c).filter(([,m]) => m && m.from === 'user' && !m.typing && !m.hidden && !m.deleted && !m.deletedForVisitor);
    if(!arr.length) return null;
    const last = arr[arr.length-1][1] || {};
    return {
      text: String(last.text || '').trim(),
      ts: Number(last.createdAt || c?.updatedAt || 0)
    };
  }catch(e){ return null; }
}

function notifyAdminChat(title, body, chatId){
  const t = String(title || '');
  const c = chatId && chatsDB ? chatsDB[chatId] : null;
  const lastUser = c ? tomaunoUltimoMensajeUsuarioChat(c) : null;
  const isHuman = /humana|Javier|LLAMADA/i.test(t + ' ' + String(body || ''));

  // Regla limpia:
  // - Las llamadas humanas sÃ­ notifican.
  // - Los mensajes web solo notifican si el Ãºltimo mensaje real viene del visitante.
  if(!isHuman && (!lastUser || !lastUser.text)) return;

  const cleanBody = isHuman
    ? (body || 'Llamada humana')
    : (chatVisibleName(c, chatId) + ': ' + lastUser.text);

  try{ isHuman && window.tomaunoHumanAlarm ? window.tomaunoHumanAlarm(chatId, cleanBody) : beep(); }catch(e){}
  try{ showNotif(); showNotifBanner(isHuman ? 'ðŸ“£ LLAMADA PARA JAVIER' : 'Nuevo mensaje web', cleanBody || 'Nuevo chat web'); }catch(e){}
  notifyNative((isHuman ? 'ðŸ“£ LLAMADA PARA JAVIER' : 'ðŸ’¬ Nuevo mensaje web'), cleanBody || 'Nuevo mensaje desde la web', chatId ? 'tomauno-chat-' + chatId : 'tomauno-chat');
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
  try{ window.chatsDB = chatsDB; }catch(e){}
  const chatEntries = Object.entries(chatsDB).filter(([,c]) => isValidChat(c));
  const unreadAdmin = chatEntries.filter(([,c]) => !!c.unreadAdmin && c.status !== 'cerrado').length;
  const fab = document.getElementById('chat-fab');
  if (fab) {
    fab.classList.toggle('has-new', isAdminNotifier() && unreadAdmin > 0);
    fab.classList.toggle('auto-on', asistenteModo() === 'automatico');
    fab.title = asistenteModo() === 'automatico' ? 'Asistente automÃ¡tico activo' : (isAdminNotifier() && unreadAdmin > 0 ? ('TenÃ©s ' + unreadAdmin + ' chat' + (unreadAdmin!==1?'s':'') + ' pendiente' + (unreadAdmin!==1?'s':'')) : 'Mensaje directo');
  }

  if (knownChatIds === null) {
    knownChatIds = new Set(chatEntries.map(([id]) => id));
    if(isAdminNotifier()){
      const recientes = chatEntries
        .filter(([id,c]) => !notifiedChatIds.has(id) && c.unreadAdmin && c.status !== 'cerrado')
        .map(([id,c]) => ({id,c,u:tomaunoUltimoMensajeUsuarioChat(c)}))
        .filter(x => x.u && x.u.text && Number(x.u.createdAt || x.c.updatedAt || 0) > Date.now() - 120000)
        .sort((a,b)=>Number(b.u.createdAt||b.c.updatedAt||0)-Number(a.u.createdAt||a.c.updatedAt||0));
      if(recientes.length){
        const top = recientes[0];
        notifyAdminChat('Nuevo chat web', (top.c?.name || 'Sin nombre') + ': ' + top.u.text, top.id);
        recientes.forEach(x => notifiedChatIds.add(x.id));
        try{ localStorage.setItem('tomauno-chat-notified', JSON.stringify([...notifiedChatIds])); }catch(e){}
      }
    }
  } else if (isAdminNotifier()) {
    // Notificar una sola vez por conversaciÃ³n cuando aparece el primer mensaje no leÃ­do para admin.
    // Aunque el chat ya haya sido creado segundos antes al poner el nombre.
    const nuevos = chatEntries
      .filter(([id,c]) => !notifiedChatIds.has(id) && c.unreadAdmin && c.status !== 'cerrado')
      .sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));
    if (nuevos.length) {
      const [newId, newest] = nuevos[0];
      {
        const u = tomaunoUltimoMensajeUsuarioChat(newest);
        if(u && u.text) notifyAdminChat('Nuevo chat web', (newest?.name || 'Sin nombre') + ': ' + u.text, newId);
      }
      // Si el chat estÃ¡ minimizado, abrir automÃ¡ticamente la conversaciÃ³n nueva para el admin.
      const popAuto = document.getElementById('chat-popover');
      if (!popAuto || !popAuto.classList.contains('open')) setTimeout(() => window.abrirChatAdmin && window.abrirChatAdmin(newId), 120);
      nuevos.forEach(([id,c]) => {
        const u = tomaunoUltimoMensajeUsuarioChat(c);
        if(u && u.text) notifiedChatIds.add(id);
      });
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
  // Ignora chats realmente vacÃ­os o creados solo al pedir nombre.
  if (!msgs.length && (!last || last === 'Esperando mensaje')) return false;
  // Si se borrÃ³ parcialmente y quedÃ³ sin nombre, igual lo mostramos si tiene mensajes reales.
  if ((!name || name.toLowerCase() === 'sin nombre' || name === '.') && !msgs.some(([,m]) => m && String(m.text||'').trim())) return false;
  return true;
}
function chatGreeting(){ return isAdminOnline() ? 'ðŸŸ¢ Â¿En quÃ© puedo ayudarte?' : 'âš« Puedo ayudarte con consultas rÃ¡pidas. Si hace falta, Javier continÃºa la conversaciÃ³n personalmente.'; }
function isChatUserOnline(c){ return !!(c && c.userOnline && c.userLastSeen && Date.now() - Number(c.userLastSeen) < 75000); }
function lastSeenText(c){
  if(isChatUserOnline(c)) return 'En linea ahora';
  const t = Number(c?.userLastSeen || 0);
  if(!t) return 'Sin actividad reciente';
  const mins = Math.max(1, Math.round((Date.now() - t)/60000));
  if(mins <= 1) return 'Se fue hace instantes';
  if(mins < 60) return 'Ultima actividad hace ' + mins + ' min';
  const horas = Math.floor(mins / 60);
  const resto = mins % 60;
  if(horas < 24) return 'Ultima actividad hace ' + horas + ' h' + (resto ? ' ' + resto + ' min' : '');
  const dias = Math.floor(horas / 24);
  const horasResto = horas % 24;
  return 'Ultima actividad hace ' + dias + ' dia' + (dias !== 1 ? 's' : '') + (horasResto ? ' ' + horasResto + ' h' : '');
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
function chatHtmlWrap(inner){ return '<button class="chat-max-btn" title="Ampliar chat" onclick="window.toggleChatExpanded()">â›¶</button><button class="chat-popover-close" title="Minimizar chat" onclick="window.cerrarChatPopover()">âˆ’</button><div class="chat-popover-inner">'+inner+'</div>'; }
let chatToolsCollapsed = false;
window.toggleChatExpanded = () => { const p=document.getElementById('chat-popover'); if(p) { p.classList.toggle('expanded'); if(p.classList.contains('expanded')) p.classList.remove('dragged'); } };
function setChatPopover(html){ const p=document.getElementById('chat-popover'); if(!p) return; p.innerHTML=chatHtmlWrap(html); p.classList.add('open'); p.classList.toggle('chat-tools-collapsed', !!chatToolsCollapsed); enableChatWindowControls(); }
window.cerrarChatPopover = () => { const p=document.getElementById('chat-popover'); if(p) p.classList.remove('open'); currentOpenChatId=''; };
window.toggleChatTools = () => { chatToolsCollapsed = !chatToolsCollapsed; const p=document.getElementById('chat-popover'); if(p) p.classList.toggle('chat-tools-collapsed', chatToolsCollapsed); const b=document.getElementById('chat-tools-toggle'); if(b){ b.classList.toggle('on', !chatToolsCollapsed); b.textContent = chatToolsCollapsed ? 'â–´' : 'â–¾'; } };
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
  {label:'ðŸ“ UbicaciÃ³n', text:'ðŸ“ Estamos en Pedro MÃ©ndez 2069, Posadas, Misiones. Te dejo el mapa: https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D\n#ubicacion'},
  {label:'ðŸ“² Instagram', text:'ðŸ“² Nuestros Instagram son:\n@tomaunoestudio\n@tomaunomodels\n@tomaunocapacitaciones'},
  {label:'ðŸ’¬ WhatsApp', text:'ðŸ’¬ TambiÃ©n podÃ©s escribirme directo por WhatsApp: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%20Cursos%20y%20Capacitaciones%2C%20quisiera%20hacer%20una%20consulta.'},
  {label:'ðŸŽ“ Cursos', text:'ðŸŽ“ En la secciÃ³n CURSOS de esta web podÃ©s ver las capacitaciones disponibles. Si querÃ©s, decime cuÃ¡l te interesa y te paso mÃ¡s detalles.\n#cursos'},
  {label:'ðŸ“· Sesiones', text:'ðŸ“· Hacemos sesiones fotogrÃ¡ficas, books, retratos, moda y contenido para redes. Contame quÃ© tipo de sesiÃ³n buscÃ¡s y te oriento.\n#servicios'}
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
  // v33.17: evita doble icono en botones rÃ¡pidos.
  // Si el label ya empieza con emoji, el emoji queda en qr-ico y se quita del texto.
  return String(label || '').replace(/^[\s\uFE0F\u200D]*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}][\uFE0F\u200D]*\s*/u, '').trim() || String(label || '').trim();
}
function quickRepliesHtml(){
  const list = chatQuickList();
  return '<div class="chat-quick-label">Respuestas rÃ¡pidas:</div><div class="chat-quick-wrap">'+list.map((q,i)=>'<button class="chat-quick" title="'+escAttr(q.label)+'" aria-label="'+escAttr(q.label)+'" onclick="window.usarRespuestaRapida('+i+')"><span class="qr-ico">'+escHtml(quickReplyIcon(q.label))+'</span><span class="qr-text">'+escHtml(quickReplyLabelText(q.label))+'</span></button>').join('')+'</div>';
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
  // Si el chat estÃ¡ abierto y el usuario toca nuevamente el botÃ³n flotante, se minimiza.
  if (popToggle && popToggle.classList.contains('open')) {
    window.cerrarChatPopover && window.cerrarChatPopover();
    return;
  }
  // Si este navegador quedÃ³ habilitado como administrador, el botÃ³n de chat SIEMPRE abre la bandeja admin.
  // Antes usaba solo adminOk/admin-section y al salir del panel te trataba como visitante aunque el indicador dijera ADM activo.
  if (isAdminNotifier()) {
    // v33.15: el botÃ³n del operador abre la bandeja por defecto.
    // AsÃ­ siempre se ven los indicadores de actividad antes de elegir una conversaciÃ³n.
    return abrirPanelChatsAdmin();
  }
  document.getElementById('chat-fab')?.classList.remove('has-new');
  if(currentCtrlMInvite && Number(currentCtrlMInvite.expiresAt || 0) > Date.now()) return window.abrirCtrlMInvite();
  if (currentVisitorChatId && chatsDB[currentVisitorChatId] && chatsDB[currentVisitorChatId].status !== 'cerrado') return abrirChatVisitante(currentVisitorChatId);
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">' +
    '<div class="chat-bubble admin"><div>Soy el asistente de Tomauno ðŸ˜Š<br/><b>Â¿CÃ³mo es tu nombre?</b></div><div class="chat-meta">Ahora</div></div>' +
    '</div>' +
    '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">âžœ</button></div></div>'
  );
  setTimeout(()=>{
    const inp = document.getElementById('chat-name');
    if(inp){ try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } }
  }, 80);
};

window.iniciarChatConNombre = async () => {
  const rawName = (document.getElementById('chat-name')?.value || '').trim();
  const name = limpiarNombreChat(rawName);
  if(!name || /^(hola|buenas|ok|dale|a)$/i.test(name)){ toast('âš ï¸ EscribÃ­ tu nombre para iniciar'); return; }
  const now = Date.now();
  const chatRef = await push(ref(db,'tomauno/chats'), {name, wp:'', status:'abierto', createdAt:now, updatedAt:now, lastMsg:rawName, unreadAdmin:true, unreadVisitor:false, userOnline:true, userLastSeen:now});
  currentVisitorChatId = chatRef.key;
  try{
    sessionStorage.setItem('tomauno-chat-id', currentVisitorChatId);
    sessionStorage.setItem('tomauno-chat-name', name);
  }catch(e){}
  // v19: guardar el nombre como primer mensaje real, para que el admin reciba aviso desde el inicio.
  try{ await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {from:'user', text:rawName, time:chatTime(), createdAt:now}); }catch(e){}
  try{ await push(ref(db,'tomauno/chats/'+currentVisitorChatId+'/messages'), {from:'admin', text:'Hola '+name+' ðŸ‘‹ Â¿En quÃ© puedo ayudarte?', time:chatTime(), createdAt:Date.now(), auto:true}); }catch(e){}
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
  return !!(last && /nombre|como\s+te\s+llamas|cÃ³mo\s+te\s+llamÃ¡s|como\s+es\s+tu\s+nombre|cÃ³mo\s+es\s+tu\s+nombre/i.test(String(last[1].text||'')));
}
function isJustNameReply(text, chat){
  const n = extraerNombreAI(text);
  if(!n) return '';
  if(lastAdminAskedName(chat)) return n;
  const raw = String(text||'').trim();
  if(/^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw)) return n;
  if(!tieneNombreRealChat(chat) && /^[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}(\s+[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}){0,2}$/.test(raw)) return n;
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
    return pre + 'Â§Â§COPY'+idx+'Â§Â§';
  });
  let safe = escHtml(withMarkers);
  // Negrita simple estilo Markdown: **texto**
  safe = safe.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Cursiva simple: _texto_ o *texto*
  safe = safe.replace(/(^|\s)_([^_]+)_(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');
  safe = safe.replace(/(^|\s)\*([^*]+)\*(?=\s|$|[.,;:!?])/g, '$1<em>$2</em>');
  safe = safe.replace(/Â§Â§COPY(\d+)Â§Â§/g, function(m, n){ return chatCopyTokenHtml(copyTokens[Number(n)] || ''); });
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
    const extra = isExternalOnlyLink(safeClean) ? '' : '<button class="chat-open-inline" onclick="event.preventDefault();event.stopPropagation();window.previsualizarLinkChat(\'' + safeClean + '\')">ver aquÃ­</button>';
    return '<a class="chat-link" href="'+safeClean+'" target="_blank" rel="noopener noreferrer">'+label+'</a>'+extra+tail;
  });
  // Instagram cliqueable, evitando que el punto final quede pegado al usuario.
  safe = safe.replace(/(^|\s)@([a-zA-Z0-9._]{2,30})/g, function(m, pre, handle){
    const clean = String(handle).replace(/[.]+$/,'');
    const tail = handle.slice(clean.length);
    if(!clean || clean.length < 2) return m;
    return pre + '<a class="chat-link ig" href="https://instagram.com/'+clean+'" target="_blank" rel="noopener noreferrer">@'+clean+'</a>' + tail;
  });
  // TelÃ©fonos argentinos simples a WhatsApp
  safe = safe.replace(/(^|\s)(\+?54\s?9?\s?)?(\d{3,4}[\s-]?\d{6,8})(?=\s|$|[.,;!?)])/g, function(m, pre, pref, num){
    const clean = String(num).replace(/\D/g,'');
    if(clean.length < 8) return m;
    return pre + '<a class="chat-link" href="https://wa.me/549'+clean+'" target="_blank" rel="noopener noreferrer">'+num+'</a>';
  });
  return safe.replace(/\n/g,'<br>');
}

const CTRL_M_INVITE_DEFAULT = 'Hola, soy Javier de Tomauno. Si necesitas ayuda con algun curso o servicio, aqui estoy para responderte.';
let currentCtrlMInvite = null;

function ctrlMInviteStyle(){
  if(document.getElementById('ctrl-m-invite-style')) return;
  const st = document.createElement('style');
  st.id = 'ctrl-m-invite-style';
  st.textContent = [
    '.ctrl-m-invite{position:fixed;right:22px;bottom:112px;z-index:99998;width:min(330px,calc(100vw - 28px));background:rgba(5,5,5,.94);border:1px solid rgba(232,0,10,.72);border-radius:14px;box-shadow:0 18px 40px rgba(0,0,0,.58);padding:13px;color:#fff;font-family:inherit;cursor:pointer;backdrop-filter:blur(8px);}',
    '.ctrl-m-invite strong{display:block;color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;}',
    '.ctrl-m-invite p{margin:0;color:rgba(255,255,255,.86);font-size:13px;line-height:1.35;}',
    '.ctrl-m-invite-actions{display:flex;gap:8px;margin-top:12px;}',
    '.ctrl-m-invite-actions button{border:0;border-radius:999px;padding:9px 12px;font-weight:900;cursor:pointer;}',
    '.ctrl-m-invite-reply{background:#e8000a;color:#fff;flex:1;}',
    '.ctrl-m-invite-close{background:#2a2a2a;color:#fff;width:42px;}',
    '#chat-popover.open .ctrl-m-invite-panel{display:flex;flex-direction:column;gap:10px;}',
    '#chat-popover.open .ctrl-m-invite-panel .chat-msgs{min-height:260px;}',
    '#ctrl-m-visitor-message{min-height:58px!important;max-height:90px!important;background:#050505!important;color:#fff!important;border-color:rgba(255,255,255,.18)!important;resize:vertical!important;}'
  ].join('');
  document.head.appendChild(st);
}

function ctrlMVisitorBeep(){
  try{
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return;
    const ctx = new AC();
    const now = ctx.currentTime;
    [660, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = now + idx * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }catch(e){}
}

function closeCtrlMInviteBox(){
  const el = document.getElementById('ctrl-m-invite-box');
  if(el) el.remove();
}

function renderCtrlMInviteBox(invite){
  if(isAdminNotifier()) return;
  ctrlMInviteStyle();
  currentCtrlMInvite = invite;
  closeCtrlMInviteBox();
  const box = document.createElement('div');
  box.id = 'ctrl-m-invite-box';
  box.className = 'ctrl-m-invite';
  box.onclick = () => window.abrirCtrlMInvite();
  box.innerHTML =
    '<strong>Javier de Tomauno</strong>' +
    '<p>'+escHtml(invite.message || CTRL_M_INVITE_DEFAULT)+'</p>' +
    '<div class="ctrl-m-invite-actions">' +
      '<button class="ctrl-m-invite-reply" onclick="event.stopPropagation();window.abrirCtrlMInvite()">Responder</button>' +
    '</div>';
  document.body.appendChild(box);
  ctrlMVisitorBeep();
}

window.descartarCtrlMInvite = async () => {
  const invite = currentCtrlMInvite;
  closeCtrlMInviteBox();
  if(invite?.id){
    try{ sessionStorage.setItem('tomauno-ctrl-m-invite-seen', invite.id); }catch(e){}
  }
  try{ await remove(ref(db,'tomauno/ctrlMInvites/'+PRESENCE_ID)); }catch(e){}
};

function initCtrlMInviteListener(){
  try{
    onValue(ref(db,'tomauno/ctrlMInvites/'+PRESENCE_ID), snap => {
      if(isAdminNotifier()) return closeCtrlMInviteBox();
      if(!snap.exists()) return;
      const invite = snap.val() || {};
      if(!invite.active || Number(invite.expiresAt || 0) < Date.now()){
        remove(ref(db,'tomauno/ctrlMInvites/'+PRESENCE_ID)).catch(()=>{});
        return closeCtrlMInviteBox();
      }
      try{ if(sessionStorage.getItem('tomauno-ctrl-m-invite-seen') === invite.id) return; }catch(e){}
      renderCtrlMInviteBox(invite);
    }, () => {});
  }catch(e){}
}
initCtrlMInviteListener();

window.abrirCtrlMInvite = () => {
  const invite = currentCtrlMInvite;
  if(!invite || Number(invite.expiresAt || 0) < Date.now()) return window.abrirChatTomauno();
  closeCtrlMInviteBox();
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">JAVIER TOMAUNO</div><div class="chat-subline">Respuesta directa desde la web</div></div></div>' +
    '<div class="chat-panel ctrl-m-invite-panel"><div class="chat-msgs" id="chat-msgs">' +
      '<div class="chat-bubble admin"><div>'+chatLinkify(invite.message || CTRL_M_INVITE_DEFAULT)+'</div><div class="chat-meta">Ahora</div></div>' +
    '</div>' +
    '<div class="chat-row"><input class="finput" id="chat-ctrl-m-text" placeholder="Responder a Javier..." onkeydown="if(event.key===\'Enter\')window.responderCtrlMInvite()"/><button class="chat-send" onclick="window.responderCtrlMInvite()">âžœ</button></div></div>'
  );
  setTimeout(()=>document.getElementById('chat-ctrl-m-text')?.focus(),80);
};

window.responderCtrlMInvite = async () => {
  const invite = currentCtrlMInvite;
  const inp = document.getElementById('chat-ctrl-m-text');
  const text = String(inp?.value || '').trim();
  if(!invite || !text) return;
  if(inp) inp.value = '';
  const now = Date.now();
  let chatId = '';
  try{ chatId = currentVisitorChatId || sessionStorage.getItem('tomauno-chat-id') || ''; }catch(e){ chatId = currentVisitorChatId || ''; }
  if(chatId && chatsDB[chatId] && chatsDB[chatId].status !== 'cerrado'){
    currentVisitorChatId = chatId;
    await update(ref(db,'tomauno/chats/'+chatId), {
      status:'abierto',
      updatedAt:now,
      lastMsg:text,
      unreadAdmin:true,
      unreadVisitor:false,
      userOnline:true,
      userLastSeen:now,
      humanMode:true,
      manualUntil:now + 3600000,
      javierOnline:true,
      javierOnlineAt:now,
      ctrlMInvite:true
    });
  }else{
    const chatRef = await push(ref(db,'tomauno/chats'), {
      name:'Visitante web',
      wp:'',
      status:'abierto',
      createdAt:now,
      updatedAt:now,
      lastMsg:text,
      unreadAdmin:true,
      unreadVisitor:false,
      userOnline:true,
      userLastSeen:now,
      humanMode:true,
      manualUntil:now + 3600000,
      javierOnline:true,
      javierOnlineAt:now,
      ctrlMInvite:true
    });
    currentVisitorChatId = chatRef.key;
    chatId = currentVisitorChatId;
  }
  try{
    sessionStorage.setItem('tomauno-chat-id', currentVisitorChatId);
    sessionStorage.setItem('tomauno-chat-name', 'Visitante web');
    sessionStorage.setItem('tomauno-ctrl-m-invite-seen', invite.id);
  }catch(e){}
  await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {
    from:'admin',
    text:invite.message || CTRL_M_INVITE_DEFAULT,
    time:chatTime(),
    createdAt:Number(invite.createdAt || now),
    humanInvite:true
  });
  await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'user', text, time:chatTime(), createdAt:Date.now()});
  try{ await remove(ref(db,'tomauno/ctrlMInvites/'+PRESENCE_ID)); }catch(e){}
  abrirChatVisitante(currentVisitorChatId, true);
};

async function ctrlMActiveVisitors(){
  try{
    const snap = await get(ref(db,'tomauno/presence'));
    const all = snap.exists() ? (snap.val() || {}) : {};
    const now = Date.now();
    return Object.entries(all).filter(([id,v]) =>
      id !== PRESENCE_ID &&
      v &&
      v.online &&
      Number(v.ts || 0) &&
      now - Number(v.ts || 0) < 90000
    );
  }catch(e){
    return [];
  }
}

window.abrirMensajeCtrlMVisitantes = async () => {
  if(!isAdminNotifier()) return;
  const visitors = await ctrlMActiveVisitors();
  if(!visitors.length){ toast('No hay visitantes activos para enviar mensaje'); return; }
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">MENSAJE A VISITANTES</div>' +
    '<div class="msub" style="margin-bottom:12px;">Se enviara solo a los '+visitors.length+' visitante'+(visitors.length!==1?'s':'')+' activo'+(visitors.length!==1?'s':'')+' de este momento. No queda automatico.</div>' +
    '<textarea class="finput" id="ctrl-m-visitor-message" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();window.enviarMensajeCtrlMVisitantes();}" style="min-height:58px;max-height:90px;background:#050505;color:#fff;">'+escHtml(CTRL_M_INVITE_DEFAULT)+'</textarea>' +
    '<button class="btn-main" onclick="window.enviarMensajeCtrlMVisitantes()">Enviar ahora</button>' +
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  setTimeout(()=>document.getElementById('ctrl-m-visitor-message')?.focus(),80);
};

window.enviarMensajeCtrlMVisitantes = async () => {
  if(window._ctrlMSending) return;
  window._ctrlMSending = true;
  try{
    const visitors = await ctrlMActiveVisitors();
    const message = String(document.getElementById('ctrl-m-visitor-message')?.value || '').trim();
    if(!message){ toast('Escribi el mensaje'); return; }
    if(!visitors.length){ closeModal(); toast('No hay visitantes activos'); return; }
    const now = Date.now();
    const inviteId = 'ctrlm_' + now + '_' + Math.random().toString(36).slice(2,7);
    const updates = {};
    visitors.forEach(([id]) => {
      updates[id] = {id:inviteId, message, active:true, createdAt:now, expiresAt:now + 5 * 60 * 1000};
    });
    await update(ref(db,'tomauno/ctrlMInvites'), updates);
    closeModal();
    toast('Mensaje enviado a '+visitors.length+' visitante'+(visitors.length!==1?'s':''), true);
  }catch(e){
    toast('No pude enviar el mensaje');
  }finally{
    window._ctrlMSending = false;
  }
};

document.addEventListener('keydown', ev => {
  if((ev.ctrlKey || ev.metaKey) && String(ev.key || '').toLowerCase() === 'm'){
    if(!isAdminNotifier()) return;
    ev.preventDefault();
    window.abrirMensajeCtrlMVisitantes();
  }
});

function chatActionButtonsForMessage(text){
  const t = normAI(text || '');
  const btns = parseChatActions(text || '');
  if(t.includes('cursos activos') || t.includes('seccion cursos') || t.includes('ver cursos')) btns.push({label:'ðŸŽ“ Ver cursos', sec:'sec-cursos'});
  if(t.includes('eventos activos') || t.includes('seccion eventos') || t.includes('ver eventos')) btns.push({label:'ðŸŽª Ver eventos', sec:'sec-eventos'});
  if(t.includes('servicios disponibles') || t.includes('seccion servicios') || t.includes('ver servicios')) btns.push({label:'ðŸ“· Ver servicios', sec:'sec-servicios'});
  if(t.includes('direccion del estudio') || t.includes('seccion ubicacion') || t.includes('pedro mendez')) btns.push({label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'});
  if(t.includes('google maps') || t.includes('maps.app.goo.gl')) btns.push({label:'ðŸ—ºï¸ Abrir mapa', url:'https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D'});
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
  return chatMsgs(chat).filter(([mid,m]) => !(m && (m.hidden || m.deleted || m.deletedForVisitor))).map(([mid,m]) => {
    const editBtn = adminView && m.from === 'admin' && !m.humanWait && !m.humanAttend ? '<button class="chat-edit-mini" title="Editar respuesta" onclick="event.stopPropagation();window.editarMensajeChat(\''+chatId+'\',\''+mid+'\')">âœŽ</button>' : '';
    const deleteBtn = adminView && (m.from === 'admin' || m.from === 'system') && !m.typing ? '<button class="chat-delete-mini" title="Borrar para el visitante" onclick="event.stopPropagation();window.borrarMensajeChatParaVisitante(\''+chatId+'\',\''+mid+'\')">ðŸ—‘ï¸</button>' : '';
    const cls = m.typing ? 'typing' : (m.humanWait ? 'admin tu-human-wait' : (m.humanAttend ? 'admin tu-human-attend' : (m.from==='admin'?'admin':m.from==='system'?'system':'user')));
    const actions = (!m.typing && !m.humanWait && !m.humanAttend && (m.from==='admin' || m.from==='system')) ? chatActionButtonsForMessage(m.text || '') : '';
    const attended = !!(chat && (chat.callAnsweredAt || (!chat.humanRequested && m.humanWait && Number(chat.callUntil||0) === 0)));
    const waitStart = m.humanWait ? Number(chat?.humanWaitStartedAt || m.createdAt || 0) : 0;
    const waitCountdown = (m.humanWait && waitStart && !attended) ? '<div class="chat-human-countdown" data-human-wait-start="'+waitStart+'"><span class="chat-human-countdown-num">60</span>s para intentar conectar con Javier</div>' : '';
    const attendBtn = adminView && m.humanWait && !attended ? '<button class="chat-attend-call" onclick="event.stopPropagation();window.atenderLlamadaJavier(\''+chatId+'\')">ðŸ“ž ATENDIENDO</button>' : '';
    return '<div class="chat-bubble '+cls+'" data-message-id="'+escAttr(mid)+'" data-msg-id="'+escAttr(mid)+'"><div>'+chatLinkify(m.text||'')+editBtn+deleteBtn+'</div>'+waitCountdown+attendBtn+actions+(m.from==='system'?'':'<div class="chat-meta">'+escHtml(m.time||'')+'</div>')+'</div>';
  }).join('');
}
function scrollChatSmart(box){
  if(!box) return;
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
    '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">'+escHtml(chatVisibleName(chat,id))+' Â· '+(isAdminOnline()?'ðŸŸ¢ Admin en lÃ­nea':'âš« Admin fuera de lÃ­nea')+'</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">' + (msgs || '<div class="chat-bubble admin">Hola '+escHtml(chat.name||'')+' ðŸ‘‹ Â¿En quÃ© puedo ayudarte?</div>') +
    '' +
    '</div>' +
    '<div class="chat-row"><input class="finput" id="chat-text" placeholder="EscribÃ­ tu mensaje..." value="'+escAttr(inputVal)+'" onkeydown="if(event.key===\'Enter\')window.enviarChatVisitante(\''+id+'\')"/><button class="chat-send" onclick="window.enviarChatVisitante(\''+id+'\')">âžœ</button></div>' +
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
  // Repara metadata si el chat fue borrado parcialmente desde Firebase mientras el visitante conservaba el id en su pestaÃ±a.
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
  // Si solo respondiÃ³ su nombre porque se lo pedimos, no disparar una respuesta temÃ¡tica equivocada.
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
function chatBaseVisibleName(c, id){
  const n = String((c && c.name) || '').trim().replace(/\s+\(\d+\)\s*$/,'');
  if(n && !isGenericChatName(n)) return n;
  return chatAnonName(id, c);
}
function chatDuplicateIndex(c, id){
  const base = chatBaseVisibleName(c, id).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
  if(!base || typeof chatsDB === 'undefined' || !chatsDB) return 0;
  const same = Object.entries(chatsDB)
    .filter(([,x]) => x && x.status !== 'cerrado' && chatBaseVisibleName(x, '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim() === base)
    .sort((a,b) => {
      const ta = Number(a[1].createdAt || a[1].firstSeenAt || a[1].updatedAt || 0);
      const tb = Number(b[1].createdAt || b[1].firstSeenAt || b[1].updatedAt || 0);
      return (ta - tb) || String(a[0]).localeCompare(String(b[0]));
    });
  if(same.length <= 1) return 0;
  const idx = same.findIndex(([xid]) => xid === id);
  return idx > 0 ? idx + 1 : 0;
}
function chatVisibleName(c, id){
  const base = chatBaseVisibleName(c, id);
  const dup = chatDuplicateIndex(c, id);
  return base + (dup ? ' (' + dup + ')' : '');
}
function chatLastActivityLabel(c){
  const t = Number(c?.updatedAt || c?.createdAt || 0);
  if(!t) return '';
  try{ return new Date(t).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; }
}
function chatNeedsReply(c){
  if(!c) return false;
  return !!c.unreadAdmin;
}
function chatIsCallingHuman(c){
  return !!(c && c.humanRequested && c.callUntil && Number(c.callUntil) > Date.now() && !c.callAnsweredAt);
}
function chatIsPendingHuman(c){
  return !!(c && !chatIsCallingHuman(c) && (c.pendingHuman || c.waitingWhatsapp || c.waitingHumanContact || c.awaitingHumanContact || c.pendingHumanContact || (c.humanFallbackSent && !c.humanContactReceived)));
}
function chatPriorityRank(c){
  if(chatIsCallingHuman(c)) return 4;
  if(c && c.unreadAdmin) return 3;
  if(c && isChatUserOnline(c)) return 2;
  if(chatIsPendingHuman(c)) return 1;
  return 0;
}
function sortChatsForInbox(entries){
  return entries.sort((a,b) => {
    const ra = chatPriorityRank(a[1]), rb = chatPriorityRank(b[1]);
    if(ra !== rb) return rb - ra;
    return Number(b[1].updatedAt || 0) - Number(a[1].updatedAt || 0);
  });
}
function chatHumanIcon(c, id){
  if(chatIsCallingHuman(c)) return 'ðŸ“£ ';
  if(chatIsPendingHuman(c)) return '<span role="button" tabindex="0" class="tu-f8-icon tu-f8-star" title="Marcar pendiente como atendido" onclick="event.preventDefault();event.stopPropagation();window.marcarChatAtendido(\''+escAttr(id||'')+'\')">â­</span> ';
  return '';
}
function chatHumanClass(c){
  return chatIsCallingHuman(c) ? 'calling' : (chatIsPendingHuman(c) ? 'priority' : '');
}
function chatHumanPreviewPrefix(c){
  if(chatIsCallingHuman(c)) return 'Llamada activa Â· ';
  if(chatIsPendingHuman(c)) return 'Consulta pendiente Â· ';
  return c && (c.humanRequested || c.prioridad || c.priority) ? 'AtenciÃ³n Javier Â· ' : '';
}
function chatStatusLabel(c){
  if(!c) return 'abierto';
  if(c.unreadAdmin) return 'Esperando';
  if(c.humanRequested && !c.readByAdminAt) return 'Prioridad';
  if(isChatUserOnline(c)) return 'Online';
  return c.status === 'cerrado' ? 'Cerrado' : 'Al dÃ­a';
}
window.editarNombreChat = (id) => {
  const c = chatsDB[id]; if(!c) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR NOMBRE</div>'+
    '<div class="msub" style="margin-bottom:12px;">AcomodÃ¡ el nombre para ordenar mejor la bandeja.</div>'+
    '<input class="finput" id="chat-edit-name" value="'+escAttr((c.name && !/^consulta web$/i.test(c.name)) ? c.name : '')+'" placeholder="Nombre del contacto" onkeydown="if(event.key===\'Enter\')document.getElementById(\'chat-name-save\').click()"/>'+
    '<button class="btn-main" id="chat-name-save">ðŸ’¾ Guardar nombre</button>'+
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  setTimeout(()=>document.getElementById('chat-edit-name')?.focus(),80);
  document.getElementById('chat-name-save').onclick = async () => {
    const name = limpiarNombreChat(document.getElementById('chat-edit-name')?.value.trim() || '');
    if(!name){ toast('EscribÃ­ un nombre vÃ¡lido'); return; }
    await update(ref(db,'tomauno/chats/'+id), {name, updatedAt:Date.now()});
    closeModal(); abrirChatAdmin(id, true); toast('âœ… Nombre actualizado', true);
  };
};

function abrirPanelChatsAdmin(){
  currentOpenChatId = '';
  let lista = sortChatsForInbox(Object.entries(chatsDB).filter(([,c]) => isValidChat(c)));
  if (chatListFilter === 'abiertos') lista = lista.filter(([,c]) => c.status !== 'cerrado');
  if (chatListFilter === 'cerrados') lista = lista.filter(([,c]) => c.status === 'cerrado');
  const validChats = Object.values(chatsDB).filter(c => isValidChat(c));
  const total = validChats.length;
  const abiertosCount = validChats.filter(c=>c.status !== 'cerrado').length;
  const cerradosCount = validChats.filter(c=>c.status === 'cerrado').length;
  const itemHtml = ([id,c]) => {
    const calling = chatIsCallingHuman(c);
    const pending = chatIsPendingHuman(c);
    const classes = ['chat-list-item', c.unreadAdmin ? 'unread' : '', chatHumanClass(c)].filter(Boolean).join(' ');
    const statusText = calling ? 'llamada' : pending ? 'pendiente' : (c.unreadAdmin ? 'Nuevo' : (c.status || 'abierto'));
    const statusClass = calling ? 'call' : pending ? 'priority' : (c.unreadAdmin ? 'new' : c.status === 'abierto' ? 'on' : '');
    const preview = chatHumanPreviewPrefix(c) + (c.lastMsg || '');
    return '<div class="'+classes+'" data-chat-id="'+escAttr(id)+'" onclick="window.abrirChatAdmin(\''+id+'\')"><div style="flex:1;min-width:0;"><div style="font-weight:800;font-size:14px;">'+chatHumanIcon(c,id)+(c.updatedAt && c.createdAt && (c.updatedAt-c.createdAt)>60000?'ðŸ” ':'')+escHtml(chatVisibleName(c,id))+'</div><div style="font-size:11px;color:var(--text3);margin-top:2px;max-width:245px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+escHtml(preview)+'</div>'+(c.wp?'<div style="font-size:11px;color:#25d366;margin-top:2px;">WP: '+escHtml(c.wp)+'</div>':'')+'</div><span class="chat-status '+statusClass+'">'+escHtml(statusText)+'</span><button class="chat-trash" title="Eliminar chat" onclick="event.stopPropagation();window.eliminarChatDefinitivo(\''+id+'\')">ðŸ—‘ï¸</button></div>';
  };
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">ðŸ“¥</div><div><div class="chat-title">BANDEJA DE CHATS</div><div class="chat-subline">'+total+' conversaciÃ³n'+(total!==1?'es':'')+' desde la web</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Activar/desactivar automÃ¡tico" onclick="window.toggleModoAsistenteChat()">ðŸ¤–</button><button class="chat-icon-btn" title="Activar notificaciones" onclick="window.pedirPermisoNotificaciones()">ðŸ””</button></div></div>' +
    '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px;">' +
    '<button class="chat-filter '+(chatListFilter==='abiertos'?'on':'')+'" onclick="window.setChatListFilter(\'abiertos\')">Abiertos '+abiertosCount+'</button>' +
    '<button class="chat-filter '+(chatListFilter==='cerrados'?'on':'')+'" onclick="window.setChatListFilter(\'cerrados\')">Cerrados '+cerradosCount+'</button>' +
    '<button class="chat-filter '+(chatListFilter==='todos'?'on':'')+'" onclick="window.setChatListFilter(\'todos\')">Todos '+total+'</button>' +
    '<button class="chat-filter" onclick="window.verResumenConsultasChat()">ðŸ“‹ Resumen</button>' +
    '<button class="chat-clean-btn" onclick="window.limpiarChatsDefinitivo()">ðŸ§¹ Limpiar chats</button>' +
    '</div>' +
    '<div class="chat-inbox-list">'+(lista.length ? lista.map(itemHtml).join('') : '<div style="color:var(--text3);font-size:13px;padding:20px;text-align:center;">Sin chats en este filtro</div>')+'</div>'
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
    '<div class="chat-head"><div class="chat-avatar">ðŸ“‹</div><div><div class="chat-title">RESUMEN DE CONSULTAS</div><div class="chat-subline">Nombre, WhatsApp, tema y consulta principal</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Volver" onclick="abrirPanelChatsAdmin()">â†</button></div></div>' +
    resumenConsultasChatHtml() +
    '<div style="display:flex;gap:8px;margin-top:12px;"><button class="btn-out" onclick="abrirPanelChatsAdmin()" style="flex:1;">â† Bandeja</button></div>'
  );
};

function adminChatTabsHtml(activeId){
  const abiertos = sortChatsForInbox(Object.entries(chatsDB)
    .filter(([,c]) => isValidChat(c) && c.status !== 'cerrado'));
  if (!abiertos.length) return '';
  return '<div class="chat-tabs chat-inbox-side">' + abiertos.slice(0,12).map(([id,c]) => {
    const status = chatStatusLabel(c);
    const time = chatLastActivityLabel(c);
    const preview = String(chatHumanPreviewPrefix(c) + (c.lastMsg || '')).trim();
    const cls = [
      'chat-tab',
      id===activeId ? 'active' : '',
      c.unreadAdmin ? 'unread' : '',
      chatHumanClass(c),
      isChatUserOnline(c) ? 'online' : '',
      chatNeedsReply(c) ? 'waiting' : 'answered'
    ].filter(Boolean).join(' ');
    return '<button class="'+cls+'" data-chat-id="'+escAttr(id)+'" onclick="window.abrirChatAdmin(\''+id+'\')">'
      + '<span class="chat-tab-light" title="'+escAttr(status)+'"></span>'
      + '<span class="chat-tab-body"><span class="chat-tab-name">'+chatHumanIcon(c,id)+escHtml(chatVisibleName(c,id))+'</span>'
      + '<span class="chat-tab-preview">'+escHtml(preview || status)+'</span>'
      + '<span class="chat-tab-foot">'+escHtml(status)+(time?' Â· '+escHtml(time):'')+'</span></span>'
      + '<span class="chat-tab-close" title="Cerrar" onclick="event.stopPropagation();window.cerrarConversacionChat(\''+id+'\')">Ã—</span>'
      + '</button>';
  }).join('') + '</div>';
}

window.eliminarChatDefinitivo = (id) => {
  const c = chatsDB[id] || {};
  showConfirm('Â¿Eliminar definitivamente el chat de ' + chatVisibleName(c,id) + '? Esto borra todo el historial de Firebase.', async () => {
    await remove(ref(db,'tomauno/chats/'+id));
    try{ notifiedChatIds.delete(id); localStorage.setItem('tomauno-chat-notified', JSON.stringify([...notifiedChatIds])); }catch(e){}
    toast('ðŸ—‘ï¸ Chat eliminado');
    abrirPanelChatsAdmin();
  });
};


window.limpiarChatsDefinitivo = () => {
  const validChats = Object.entries(chatsDB).filter(([,c]) => isValidChat(c));
  if (!validChats.length) { toast('No hay chats para limpiar'); return; }
  showConfirm('Â¿Eliminar definitivamente TODOS los chats visibles de Firebase? Esta acciÃ³n no se puede deshacer.', async () => {
    await remove(ref(db,'tomauno/chats'));
    try{ notifiedChatIds = new Set(); localStorage.setItem('tomauno-chat-notified', '[]'); }catch(e){}
    currentOpenChatId = '';
    toast('ðŸ§¹ Chats eliminados');
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
    '<div class="chat-head"><div class="chat-avatar">ðŸ‘¤</div><div><div class="chat-title"><span class="chat-online-dot '+(isChatUserOnline(chat)?'on':'')+'"></span>'+escHtml(chatVisibleName(chat))+'</div><div class="chat-subline">'+(chat.wp?'WhatsApp: '+escHtml(chat.wp)+' Â· ':'')+lastSeenText(chat)+'</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">'+msgs+'</div>' +
    '<div class="chat-row"><input class="finput" id="chat-admin-text" placeholder="Responder..." value="'+escAttr(inputVal)+'" onkeydown="if(event.key===\'Enter\')window.enviarChatAdmin(\''+id+'\')"/><button class="chat-send" onclick="window.enviarChatAdmin(\''+id+'\')">âžœ</button></div>' +
    '<div class="chat-admin-tools"><button class="chat-filter auto '+(asistenteModo()==='automatico'?'on':'')+'" title="Cambiar AUTO/HUM" onclick="window.toggleModoAsistenteChat()">'+(asistenteModo()==='automatico'?'ðŸ‘¤ HUM':'ðŸ¤– AUTO')+'</button><button class="chat-filter" title="Ayuda / Machete" onclick="window.mostrarAyudaAsistente()">/?</button><button class="chat-filter" title="Respuestas del cerebro" onclick="window.mostrarSelectorCerebroChat(\''+id+'\')">//</button><button class="chat-filter" title="Acciones rÃ¡pidas" onclick="window.mostrarAccionesChatAdmin(\''+id+'\')">âš¡</button><button id="chat-tools-toggle" class="chat-filter chat-tools-toggle '+(!chatToolsCollapsed?'on':'')+'" title="Mostrar/ocultar botones" onclick="window.toggleChatTools()">'+(chatToolsCollapsed?'â–´':'â–¾')+'</button></div>' +
    '<div class="chat-tools-block">' + quickRepliesHtml() +
    '<div class="chat-admin-actions"><button class="btn-out" title="Bandeja" onclick="abrirPanelChatsAdmin()"><span class="ico">â†</span></button><button class="btn-out" title="Editar nombre" onclick="window.editarNombreChat(\''+id+'\')"><span class="ico">âœï¸</span></button><button class="btn-out" title="Copiar conversaciÃ³n" onclick="window.copiarHistorialChat(\''+id+'\')"><span class="ico">ðŸ“‹</span></button><button class="btn-out" title="Exportar TXT" onclick="window.exportarHistorialChat(\''+id+'\')"><span class="ico">â¬‡ï¸</span></button><button class="btn-out danger" title="Cerrar chat" onclick="window.cerrarConversacionChat(\''+id+'\')"><span class="ico">âœ•</span></button><button class="btn-out danger" title="Borrar chat" onclick="window.eliminarChatDefinitivo(\''+id+'\')"><span class="ico">ðŸ—‘ï¸</span></button>' + (chat.wp?'<a class="btn-out" title="WhatsApp" style="text-align:center;text-decoration:none;color:#25d366;border-color:rgba(37,211,102,.35);" target="_blank" rel="noopener noreferrer" href="https://wa.me/549'+String(chat.wp||'').replace(/\D/g,'')+'"><span class="ico">ðŸ’¬</span></a>':'') + '</div></div></div>'
  );
  update(ref(db,'tomauno/chats/'+id), {unreadAdmin:false, unread:false, hasNew:false, hasNewAdmin:false, waitingHuman:false, priority:false, prioridad:false, readByAdminAt:Date.now(), adminReadAt:Date.now(), lastReadAdminAt:Date.now()}).catch(()=>{});
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
          ? 'Perfecto ðŸ˜Š Te abro el formulario para **' + (match.obj.titulo || 'esta actividad') + '**. #inscripcion:' + match.type + ':' + match.id + '#'
          : 'Te muestro la informaciÃ³n completa de **' + (match.obj.titulo || 'esta actividad') + '**. #info:' + match.type + ':' + match.id + '#';
      }else{
        toast('No encontrÃ© esa actividad. ProbÃ¡ /info fotografÃ­a o usÃ¡ âš¡ Acciones.', true);
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
  try{ await navigator.clipboard.writeText(lines.filter(Boolean).join('\n')); toast('ðŸ“‹ Historial copiado', true); }
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
  toast('â¬‡ï¸ Chat exportado en TXT', true);
};
window.previsualizarLinkChat = (url) => {
  const clean = String(url||'').trim();
  if(!/^https?:\/\//i.test(clean)){ toast('Link invÃ¡lido'); return; }
  if(/(wa\.me|api\.whatsapp\.com|whatsapp\.com|drive\.google\.com|docs\.google\.com|sheets\.google\.com|forms\.gle|instagram\.com|google\.com\/maps|maps\.app\.goo\.gl)/i.test(clean)){
    window.open(clean, '_blank', 'noopener,noreferrer');
    return;
  }
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">VISTA DEL LINK</div>'+
    '<div class="web-preview-note">Algunas webs bloquean verse dentro de otra pÃ¡gina. Si no carga, usÃ¡ â€œAbrir en pestaÃ±aâ€.</div>'+
    '<iframe class="web-preview-frame" src="'+escAttr(clean)+'" loading="lazy"></iframe>'+
    '<a class="btn-main" href="'+escAttr(clean)+'" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">Abrir en pestaÃ±a</a>'+
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button>';
  openModal();
};

window.editarMensajeChat = (chatId, msgId) => {
  const msg = chatsDB?.[chatId]?.messages?.[msgId];
  if(!msg || msg.from !== 'admin') return;
  const actual = msg.text || '';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR MENSAJE</div>'+
    '<div class="msub" style="margin-bottom:12px;">CorregÃ­ el texto de tu respuesta.</div>'+
    '<textarea class="finput" id="edit-chat-msg" style="min-height:120px;">'+escHtml(actual)+'</textarea>'+
    '<button class="btn-main" id="edit-chat-save">ðŸ’¾ Guardar mensaje</button>'+
    '<button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  setTimeout(()=>document.getElementById('edit-chat-msg')?.focus(),80);
  document.getElementById('edit-chat-save').onclick = async () => {
    const nuevo = document.getElementById('edit-chat-msg')?.value.trim();
    if(!nuevo){ toast('El mensaje no puede quedar vacÃ­o'); return; }
    await update(ref(db,'tomauno/chats/'+chatId+'/messages/'+msgId), {text:nuevo, editedAt:Date.now()});
    await update(ref(db,'tomauno/chats/'+chatId), {lastMsg:nuevo, updatedAt:Date.now()});
    closeModal(); abrirChatAdmin(chatId, true); toast('âœ… Mensaje actualizado');
  };
};

function escAttr(v){ return String(v ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }


// â”€â”€ ASISTENTE AUTOMÃTICO / CEREBRO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      ? '<div style="color:var(--text3);font-size:13px;">No encontrÃ© resultados para esa bÃºsqueda.</div>'
      : '<div style="color:var(--text3);font-size:13px;">TodavÃ­a no cargaste informaciÃ³n extra. El asistente puede usar ubicaciÃ³n, WhatsApp, Instagram, cursos, eventos y servicios cargados.</div>';
    renderQuickRepliesAdmin();
    return;
  }
  list.innerHTML = entries.map(([id,k]) =>
    '<div class="ai-item">' +
    '<div style="flex:1;min-width:0;"><div class="ai-item-title">'+escHtml(k.titulo||'Sin tÃ­tulo')+'</div>'+
    '<div style="margin-bottom:6px;">'+(k.command?'<span class="ai-pill">'+escHtml(k.command)+'</span>':'')+String(k.keys||'').split(',').filter(Boolean).map(x=>'<span class="ai-pill">'+escHtml(x.trim())+'</span>').join('')+'</div>'+
    '<div class="ai-item-answer">'+escHtml(k.respuesta||'')+'</div></div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">'+
    '<button class="bsm bl" onclick="window.editarInfoAsistente(\''+id+'\')">âœï¸ Editar</button>'+
    '<button class="bsm '+(k.activo===false?'gr':'bl')+'" onclick="window.toggleInfoAsistente(\''+id+'\','+(k.activo===false?'true':'false')+')">'+(k.activo===false?'Activar':'Pausar')+'</button>'+
    '<button class="bsm re" onclick="window.eliminarInfoAsistente(\''+id+'\')">ðŸ—‘ï¸</button></div></div>'
  ).join('');
  renderQuickRepliesAdmin();
}
window.buscarCerebroAdmin = () => renderAsistenteAdmin();
function renderQuickRepliesAdmin(){
  const box = document.getElementById('ai-quick-list');
  if(!box) return;
  const entries = Object.entries(asistenteDB?.quickReplies || {}).sort((a,b)=>(a[1].orden||0)-(b[1].orden||0));
  if(!entries.length){ box.innerHTML = '<div style="color:var(--text3);font-size:13px;">Si no cargÃ¡s botones, se usan los botones rÃ¡pidos predeterminados.</div>'; return; }
  box.innerHTML = entries.map(([id,q]) => '<div class="admin-ci"><div class="admin-ci-info"><div class="admin-ci-tit">'+escHtml(q.label||'BotÃ³n')+'</div><div class="admin-ci-sub" style="max-width:620px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+escHtml(q.text||'')+'</div></div><button class="bsm re" onclick="window.eliminarRespuestaRapidaAsistente(\''+id+'\')">ðŸ—‘ï¸</button></div>').join('');
}
window.guardarModoAsistente = async () => {
  const modo = document.getElementById('ai-mode')?.value || 'manual';
  await update(ref(db,'tomauno/asistente'), {modo});
  toast(modo === 'automatico' ? 'ðŸ¤– Modo automÃ¡tico activado' : 'ðŸ‘¤ Modo manual activado', true);
};
window.toggleModoAsistenteChat = async () => {
  const chatId = currentOpenChatId;
  const actual = asistenteModo();
  const nuevo = actual === 'automatico' ? 'manual' : 'automatico';

  if(chatId) window.detenerLlamadaJavier && window.detenerLlamadaJavier(chatId);

  await update(ref(db,'tomauno/asistente'), {modo:nuevo});
  asistenteDB = Object.assign({}, asistenteDB || {}, {modo:nuevo});

  const activarHUM = nuevo === 'manual';

  if(chatId){
    await update(ref(db,'tomauno/chats/'+chatId), {
      javierOnline:activarHUM,
      javierOnlineAt:activarHUM ? Date.now() : 0,
      humanMode:activarHUM,
      manualUntil:activarHUM ? Date.now()+3600000 : 0,
      humanRequested:false,
      waitingHuman:false,
      priority:false,
      callUntil:0,
      callAnsweredAt:Date.now(),
      updatedAt:Date.now()
    }).catch(()=>{});
  }

  toast(activarHUM ? 'ðŸ‘¤ Modo HUM activado' : 'ðŸ¤– Modo AUTO activado', true);

  const fab=document.getElementById('chat-fab');
  if(fab) fab.classList.toggle('auto-on', nuevo === 'automatico');

  if (isAdminNotifier() && chatId) setTimeout(()=>abrirChatAdmin(chatId, true), 80);
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
  if(!titulo || !respuesta){ toast('âš ï¸ CompletÃ¡ tÃ­tulo y respuesta'); return; }
  const dup = asistenteCommandDuplicado(command);
  if(dup){ toast('âš ï¸ Ese comando rÃ¡pido ya estÃ¡ en uso: ' + command); return; }
  await push(ref(db,'tomauno/asistente/knowledge'), {titulo, keys:keys||'', command:command||'', respuesta, activo:true, creado:Date.now()});
  ['ai-title','ai-command','ai-keys','ai-answer'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  toast('âœ… InformaciÃ³n agregada al asistente', true);
};
window.editarInfoAsistente = (id) => {
  const k = asistenteDB?.knowledge?.[id]; if(!k) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">EDITAR INFO DEL ASISTENTE</div>'+
    '<label class="flbl">TÃ­tulo / tema</label><input class="finput" id="eai-title" value="'+escAttr(k.titulo||'')+'"/>'+
    '<label class="flbl">Comando rÃ¡pido opcional</label><input class="finput" id="eai-command" value="'+escAttr(k.command||'')+'" placeholder="Ej: /pack15, /alias, /equipos"/>'+
    '<label class="flbl">Palabras clave</label><input class="finput" id="eai-keys" value="'+escAttr(k.keys||'')+'"/>'+
    '<label class="flbl">Respuesta</label><textarea class="finput" id="eai-answer" style="min-height:150px;">'+escHtml(k.respuesta||'')+'</textarea>'+
    '<button class="btn-main" id="eai-save">ðŸ’¾ Guardar</button><button class="btn-out" onclick="window.closeModal()">Cancelar</button>';
  openModal();
  document.getElementById('eai-save').onclick = async () => {
    const newCmd = document.getElementById('eai-command')?.value.trim()||'';
    const dup = asistenteCommandDuplicado(newCmd, id);
    if(dup){ toast('âš ï¸ Ese comando rÃ¡pido ya estÃ¡ en uso: ' + newCmd); return; }
    await update(ref(db,'tomauno/asistente/knowledge/'+id), {
      titulo:document.getElementById('eai-title')?.value.trim()||'',
      keys:document.getElementById('eai-keys')?.value.trim()||'',
      command:newCmd,
      respuesta:document.getElementById('eai-answer')?.value.trim()||'',
      actualizado:Date.now()
    });
    closeModal(); toast('âœ… InformaciÃ³n actualizada', true);
  };
};
window.toggleInfoAsistente = async (id, activo) => { await update(ref(db,'tomauno/asistente/knowledge/'+id), {activo}); };
window.eliminarInfoAsistente = (id) => {
  showConfirm('Â¿Eliminar esta informaciÃ³n del cerebro del asistente?', async()=>{
    await remove(ref(db,'tomauno/asistente/knowledge/'+id));
    toast('ðŸ—‘ï¸ InformaciÃ³n eliminada', true);
  });
};


window.agregarRespuestaRapidaAsistente = async () => {
  const label = document.getElementById('aiqr-label')?.value.trim();
  const text = document.getElementById('aiqr-text')?.value.trim();
  if(!label || !text){ toast('âš ï¸ CompletÃ¡ botÃ³n y respuesta'); return; }
  await push(ref(db,'tomauno/asistente/quickReplies'), {label, text, activo:true, orden:Date.now(), creado:Date.now()});
  ['aiqr-label','aiqr-text'].forEach(id=>{const el=document.getElementById(id); if(el) el.value='';});
  toast('âœ… BotÃ³n rÃ¡pido agregado', true);
};
window.eliminarRespuestaRapidaAsistente = (id) => {
  showConfirm('Â¿Eliminar este botÃ³n rÃ¡pido?', async()=>{
    await remove(ref(db,'tomauno/asistente/quickReplies/'+id));
    toast('ðŸ—‘ï¸ BotÃ³n rÃ¡pido eliminado', true);
  });
};


// â”€â”€ AYUDA / COMANDOS / ACCIONES DEL ASISTENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function aiMacheteHtml(){
  return '<div class="mtitle">AYUDA RÃPIDA DEL ASISTENTE</div>'+
    '<div class="msub" style="margin-bottom:14px;">Machete para usar el Cerebro y el chat admin.</div>'+
    '<div style="font-size:13px;color:var(--text2);line-height:1.75;background:#0d0d0d;border:1px solid var(--border);border-radius:14px;padding:14px;">'+
    '<b>Variables</b><br>{{nombre}} = nombre del contacto del chat.<br><br>'+
    '<b>Acciones dentro de una respuesta</b><br>Ahora podÃ©s usar una sola almohadilla: #cursos Â· #servicios Â· #eventos Â· #testimonios Â· #estudio Â· #ubicacion Â· #preguntas Â· #contacto.<br>TambiÃ©n acepta la forma anterior con cierre: #cursos#.<br>Ej: â€œTe muestro el estudio #estudioâ€.<br><br>'+
    '<b>Comandos en el chat admin</b><br>/? = ver esta ayuda<br>// = abrir lista de respuestas del Cerebro<br>/acciones = abrir acciones rÃ¡pidas: Info / Inscribir / Ir a secciÃ³n<br>/alias, /pack15, /equipos, etc. = si los configuraste en una ficha del Cerebro.<br><br>'+
    '<b>Formato</b><br>**negrita** Â· _cursiva_ Â· links y @instagram se vuelven cliqueables.<br>!texto! = crea un bloque con botÃ³n Copiar. Ej: Alias: !tomauno.mp!<br><br>'+
    '<b>Consejo</b><br>Para respuestas largas cargÃ¡ una ficha por tema: Pack 15 aÃ±os, Bodas, Alquiler de estudio, Alias de pago, Equipos.</div>'+
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
    cursos:{label:'ðŸŽ“ Ver cursos', sec:'sec-cursos'}, curso:{label:'ðŸŽ“ Ver cursos', sec:'sec-cursos'},
    servicios:{label:'ðŸ“· Ver servicios', sec:'sec-servicios'}, servicio:{label:'ðŸ“· Ver servicios', sec:'sec-servicios'},
    eventos:{label:'ðŸŽª Ver eventos', sec:'sec-eventos'}, evento:{label:'ðŸŽª Ver eventos', sec:'sec-eventos'},
    testimonios:{label:'â­ Ver testimonios', sec:'sec-testimonios'}, testimonio:{label:'â­ Ver testimonios', sec:'sec-testimonios'}, resenas:{label:'â­ Ver testimonios', sec:'sec-testimonios'}, reseÃ±as:{label:'â­ Ver testimonios', sec:'sec-testimonios'},
    estudio:{label:'ðŸ¢ Ver estudio', sec:'sec-galeria'}, elestudio:{label:'ðŸ¢ Ver estudio', sec:'sec-galeria'},
    ubicacion:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'}, ubicaciondelestudio:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'}, mapa:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'}, maps:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'},
    preguntas:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}, pregunta:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}, frecuentes:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}, faq:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}
  };
  if(key === 'contacto' || key === 'whatsapp') return {label:'ðŸ’¬ WhatsApp Javier', url:'https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%2C%20quisiera%20hacer%20una%20consulta.'};
  return map[key] || null;
}
const CHAT_SECTION_TAG_RE = /#\s*(el\s*estudio|estudio|cursos?|servicios?|eventos?|testimonios?|resenas|reseÃ±as|ubicacion|ubicaciÃ³n|mapa|maps|preguntas\s+frecuentes|preguntas|frecuentes|faq|contacto|whatsapp)\s*#?/gi;
function cleanChatDisplayText(text){
  return String(text||'')
    .replace(/#\s*(info|inscripcion|inscripciÃ³n):(curso|servicio|evento):([^#\n]+)#?/gi,'')
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
  raw.replace(/#\s*(info|inscripcion|inscripciÃ³n):(curso|servicio|evento):([^#\n]+)#?/gi, (m, kind, type, id) => {
    const k = normAI(kind).startsWith('ins') ? 'inscripcion' : 'info';
    const label = (k==='inscripcion' ? 'âœï¸ Inscribirme' : 'â„¹ï¸ Ver info');
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
      '<div class="admin-ci-info"><div class="admin-ci-tit">'+escHtml(k.titulo||'Sin tÃ­tulo')+'</div><div class="admin-ci-sub">'+escHtml((k.command||'') + (k.keys?(' Â· '+k.keys):''))+'</div></div>'+
      '<button class="bsm bl" onclick="window.enviarFichaCerebroChat(\''+chatId+'\',\''+id+'\')">Enviar</button></div>';
  }).join('') : '<div style="color:var(--text3);font-size:13px;">No hay fichas cargadas.</div>';
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle">RESPUESTAS DEL CEREBRO</div><div class="msub">ElegÃ­ una respuesta para enviarla al chat.</div>'+
    '<div class="ai-selector-search"><input class="finput" id="ai-selector-search" placeholder="Buscar por tÃ­tulo, comando o palabra clave..." oninput="window.filtrarSelectorCerebro()" autocomplete="off"/></div>'+
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
    return '<div class="admin-ci"><div class="admin-ci-info"><div class="admin-ci-tit">'+escHtml(titulo)+'</div><div class="admin-ci-sub">'+(x.fecha?escHtml(fFecha(x.fecha)):'')+(x.costo?' Â· '+escHtml(moneyAI(x.costo)):'')+'</div></div><div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="bsm bl" onclick="window.enviarAccionChat(\''+chatId+'\',\'info\',\''+kind+'\',\''+id+'\')">Info</button><button class="bsm gr" onclick="window.enviarAccionChat(\''+chatId+'\',\'inscripcion\',\''+kind+'\',\''+id+'\')">Inscribir</button></div></div>';
  }).join('');
}
window.mostrarAccionesChatAdmin = (chatId) => {
  document.getElementById('mcontent').innerHTML = '<div class="mtitle">ACCIONES RÃPIDAS</div><div class="msub">AbrÃ­ info o formulario en la web del visitante sin recordar tÃ­tulos exactos.</div>'+
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
    ? 'Perfecto ðŸ˜Š Te abro el formulario para que completes los datos de **'+nombre+'**. #' + fn + ':' + type + ':' + id + '#'
    : 'Te muestro la informaciÃ³n completa de **'+nombre+'**. #' + fn + ':' + type + ':' + id + '#';
  closeModal();
  window.enviarChatAdmin(chatId, txt);
};

const FAQ_AI = [
  {q:'experiencia previa nivel principiante empezar de cero necesito experiencia', a:'No necesitÃ¡s experiencia previa. Nuestros cursos estÃ¡n pensados para distintos niveles y cada actividad indica su nivel recomendado en la descripciÃ³n.'},
  {q:'confirmar lugar inscripcion reservar cupo como confirmo mi lugar', a:'Para confirmar tu lugar, completÃ¡s el formulario de inscripciÃ³n y luego coordinamos por WhatsApp la disponibilidad y el pago correspondiente.'},
  {q:'medios de pago formas de pago transferencia mercado pago efectivo pagar', a:'Aceptamos transferencia bancaria, Mercado Pago y efectivo. SegÃºn el curso o servicio, el detalle de pago se coordina por WhatsApp luego de la pre-inscripciÃ³n.'},
  {q:'no puedo asistir falto cancelar reprogramar devolucion aviso', a:'Si no podÃ©s asistir, avisÃ¡nos con anticipaciÃ³n. Buscamos la mejor soluciÃ³n y, segÃºn disponibilidad, el pago puede acreditarse para futuras actividades.'},
  {q:'certificado certificados emiten diploma constancia participacion', a:'SÃ­, los cursos y workshops incluyen certificado digital de participaciÃ³n emitido por Tomauno Estudio.'},
  {q:'menor edad menor de edad tutor responsable inscribir menor', a:'SÃ­, se puede inscribir a un menor de edad. En el formulario se solicitan los datos de contacto del tutor o responsable.'}
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
  return /(tienen|tenes|tenÃ©s|hay|alguno|alguna|algun|algÃºn|disponible|disponibles|activos|activas|ofrecen|ofreces|mostrame|mostrar|lista|listado|cuales|cuÃ¡les)/.test(q);
}
function isPriceOrSpecificAI(q){
  return /(cuanto|cuÃ¡nto|sale|precio|costo|valor|horario|hora|fecha|cuando|cuÃ¡ndo|profesor|organizador|disertante|contacto|whatsapp|inscrib|anotar|registrar|reservar)/.test(q);
}
function hasCategoryAI(q, cat){
  if(cat==='curso') return /(curso|cursos|capacit|taller|workshop|clase|clases|aprender)/.test(q);
  if(cat==='servicio') return /(servicio|servicios|sesion|sesiones|book|portfolio|beauty|belleza|foto|fotos|video|produccion|producciÃ³n|alquiler)/.test(q);
  if(cat==='evento') return /(evento|eventos|agenda|ciudad|show|charla)/.test(q);
  return false;
}

function entityWordsAI(t){
  // No eliminamos tÃ©rminos de dominio como fotografia/modelo/beauty porque son claves para filtrar cursos y servicios.
  const stop = ['con','del','los','las','para','curso','cursos','evento','eventos','servicio','servicios','tomauno','estudio','alguno','alguna','algun','tienen','tenes','hay','solo','info','informacion','quiero','saber','sobre','cuanto','sale','precio','costo','valor','horario','hora','disponible','disponibles','activo','activos'];
  return normAI(t).split(/\s+/).filter(w => w.length > 2 && !stop.includes(w));
}
function termHitAI(hay, w){
  if(!w || w.length < 3) return false;
  if(hay.includes(w)) return true;
  // equivalencias simples para consultas reales: modelo/modelaje, foto/fotografÃ­a, beauty/belleza
  const aliases = {
    modelo:['modelo','modelos','modelaje'], modelos:['modelo','modelos','modelaje'], modelaje:['modelo','modelos','modelaje'],
    foto:['foto','fotos','fotografia','fotografias','fotografico','fotografica'], fotos:['foto','fotos','fotografia','fotografias','fotografico','fotografica'], fotografia:['foto','fotos','fotografia','fotografias','fotografico','fotografica'],
    beauty:['beauty','belleza','makeup','maquillaje'], belleza:['beauty','belleza','makeup','maquillaje']
  };
  return (aliases[w] || []).some(a => hay.includes(a));
}

function importantTermsAI(q){
  // Palabras realmente Ãºtiles para cruzar contra tÃ­tulos cargados.
  const raw = normAI(q).split(/\s+/).map(w=>w.replace(/[^a-z0-9Ã±]/g,'')).filter(Boolean);
  const stop = new Set(['con','del','los','las','para','curso','cursos','evento','eventos','servicio','servicios','tomauno','estudio','quiero','saber','tenes','tenÃ©s','tienen','hay','alguno','alguna','algun','algÃºn','solo','disponible','disponibles','activo','activos','cuanto','cuÃ¡nto','sale','precio','costo','valor','horario','hora','info','informacion','informaciÃ³n','mostrar','mostrame','lista','listado','de','la','el','un','una','unos','unas','que','quÃ©']);
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
  // Prioridades comunes: cuando el usuario dice curso/modelo/fotografÃ­a/beauty, pesa mÃ¡s el tÃ­tulo exacto que textos largos.
  if(/fotograf|foto/.test(q)){
    if(/fotografia|fotograf[iÃ­]a/.test(titleHay)) score += 5;
    else if(/foto|fotos/.test(titleHay)) score += 2;
  }
  if(/modelo|modelaje/.test(q) && /modelo|modelaje/.test(titleHay)) score += 5;
  if(/beauty|belleza|maquillaje/.test(q) && /beauty|belleza|maquillaje/.test(titleHay)) score += 5;
  if(/curso|capacit|taller|clase/.test(q) && /curso|capacit|taller|clase/.test(titleHay)) score += 2;
  if(!score) return 0;
  // PequeÃ±a normalizaciÃ³n: mantiene comparables tÃ­tulos cortos/largos.
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
    (c.fecha ? 'ðŸ“… ' + fFecha(c.fecha) + '\n' : '') +
    (c.hora ? 'â° ' + c.hora + '\n' : '') +
    (c.lugar ? 'ðŸ“ ' + c.lugar + '\n' : '') +
    (prof ? 'ðŸ‘¤ Profesor/organizador: ' + prof + '\n' : '') +
    (c.wp ? 'ðŸ’¬ Contacto: https://wa.me/549' + String(c.wp).replace(/\D/g,'') + '\n' : '') +
    (c.ig ? 'ðŸ“¸ Instagram: @' + c.ig + '\n' : '') +
    'ðŸ’° ' + moneyAI(c.costo) + '\n' +
    (c.extraLink ? 'ðŸ”— MÃ¡s info: ' + c.extraLink + '\n' : '') +
    (vencido ? '\nâš ï¸ TenÃ© en cuenta que este curso puede haber comenzado o estar fuera de inscripciÃ³n. Consultanos para prÃ³ximas fechas.\n' : '') +
    'PodÃ©s tocar el botÃ³n **Ver cursos** para ir directo a la secciÃ³n Cursos.';
}
function detalleServicioAI(s){
  return '**' + (s.titulo || 'Servicio') + '**\n' +
    (s.desc ? s.desc + '\n' : '') +
    (s.precio ? 'ðŸ’° Desde $ ' + Number(s.precio).toLocaleString('es-AR') + '\n' : '') +
    (s.dir ? 'ðŸ“ ' + s.dir + '\n' : '') +
    (s.wp ? 'ðŸ’¬ Contacto: https://wa.me/549' + String(s.wp).replace(/\D/g,'') + '\n' : '') +
    (s.ig ? 'ðŸ“¸ Instagram: @' + s.ig + '\n' : '') +
    (s.extraLink ? 'ðŸ”— MÃ¡s info: ' + s.extraLink + '\n' : '') +
    '\nPodÃ©s tocar el botÃ³n **Ver servicios** para ir directo a la secciÃ³n Servicios.';
}
function detalleEventoAI(e){
  return '**' + (e.titulo || 'Evento') + '**\n' +
    (e.fecha ? 'ðŸ“… ' + fFecha(e.fecha) + '\n' : '') +
    (e.hora ? 'â° ' + e.hora + '\n' : '') +
    (e.lugar ? 'ðŸ“ ' + e.lugar + '\n' : '') +
    (e.nombreOrg ? 'ðŸ‘¤ Organiza: ' + e.nombreOrg + '\n' : '') +
    (e.wpOrg ? 'ðŸ’¬ Contacto: https://wa.me/549' + String(e.wpOrg).replace(/\D/g,'') + '\n' : '') +
    (e.ig ? 'ðŸ“¸ Instagram: @' + e.ig + '\n' : '') +
    'ðŸ’° ' + moneyAI(e.costo) + '\n' +
    (e.extraLink ? 'ðŸ”— MÃ¡s info: ' + e.extraLink + '\n' : '') +
    '\nPodÃ©s tocar el botÃ³n **Ver eventos** para ir directo a la secciÃ³n Eventos.';
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
      // Coincidencias de dos tÃ©rminos importantes en el tÃ­tulo tienen prioridad mÃ¡xima.
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
  if(!lista.length) return 'Por el momento no encontrÃ© cursos activos relacionados con esa consulta. PodÃ©s escribirnos por WhatsApp para consultar prÃ³ximas fechas.';
  const titulo = (terms.length && lista.length < allActiveCount) ? 'ðŸ“š **Cursos encontrados**' : 'ðŸ“š **Cursos activos**';
  return titulo + '\n\n' + lista.slice(0,8).map((c,i)=>
    (i+1)+'. **'+(c.titulo||'Curso')+'**\n' +
    (c.fecha?'ðŸ“… '+fFecha(c.fecha)+'\n':'') +
    (c.hora?'â° '+c.hora+'\n':'') +
    'ðŸ’° '+moneyAI(c.costo)
  ).join('\n\n') + '\n\nPodÃ©s tocar el botÃ³n **Ver cursos** para ir directo a la secciÃ³n e inscribirte.';
}
function listaEventosAI(){
  const lista = Object.values(eventosDB||{}).filter(e=>e.estado==='activo' && !e.oculto).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!lista.length) return 'Por el momento no tengo eventos activos publicados en la web.';
  return 'ðŸŽª **Eventos activos**\n\n' + lista.slice(0,8).map((e,i)=>(i+1)+'. **'+(e.titulo||'Evento')+'**'+(e.fecha?'\nðŸ“… '+fFecha(e.fecha):'')+(e.hora?'\nâ° '+e.hora:'')+'\nðŸ’° '+moneyAI(e.costo)).join('\n\n') + '\n\nPodÃ©s tocar el botÃ³n **Ver eventos** para ir a la secciÃ³n.';
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
  if(!lista.length) return 'No encontrÃ© servicios activos relacionados con esa consulta. TambiÃ©n ofrecemos sesiones fotogrÃ¡ficas, modelaje, capacitaciones y producciÃ³n. Decime quÃ© servicio te interesa y te oriento.';
  const titulo = (terms.length && lista.length < allCount) ? 'ðŸ“· **Servicios encontrados**' : 'ðŸ“· **Servicios disponibles**';
  return titulo + '\n\n' + lista.slice(0,8).map((s,i)=>(i+1)+'. **'+(s.titulo||'Servicio')+'**'+(s.precio?'\nðŸ’° Desde $ '+Number(s.precio).toLocaleString('es-AR'):'')).join('\n\n') + '\n\nPodÃ©s tocar el botÃ³n **Ver servicios** para ir a la secciÃ³n.';
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
    // Si el usuario combina 2 o mÃ¡s palabras importantes, priorizamos la ficha que contenga esa combinaciÃ³n.
    // Ejemplo: "whatsapp organizador" debe pesar mÃ¡s que solo "whatsapp".
    if(pairHits >= 2) score += 4 + pairHits;
    // Consultas del tipo "desde quÃ© edad", "edad mÃ­nima", "cuÃ¡nto sale", etc. priorizan el cerebro si hay coincidencia.
    if(/edad|desde que edad|edad minima|menor|menores|precio|costo|valor|cuanto|alias|pago|fotolibro|album/.test(q) && score > 0) score += 2;
    if(score > 0) matches.push({id,k,score});
  });
  return matches.sort((a,b)=>b.score-a.score);
}
function suggestedTopicsAI(matches){
  return 'EncontrÃ© varias opciones relacionadas. Â¿CuÃ¡l te interesa?\n\n' + matches.slice(0,4).map((m,i)=>(i+1)+'. '+(m.k.titulo||'Tema')).join('\n') + '\n\nEscribÃ­ el nÃºmero o el nombre del tema y te paso la informaciÃ³n.';
}
function isThanksOrByeAI(q){
  return /^(gracias|muchas gracias|ok gracias|dale gracias|perfecto gracias|listo gracias|genial gracias|buenisimo gracias|buenÃ­simo gracias|chau|adios|adiÃ³s|nos vemos|hasta luego)[.!\s]*$/.test(q);
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

  if(isThanksOrByeAI(q)) return 'Â¡Gracias a vos! ðŸ˜Š\nQuedo a disposiciÃ³n si necesitÃ¡s algo mÃ¡s.';

  // 1) Intenciones institucionales fuertes: NO deben caer en cursos por coincidencias sueltas.
  if(/(ubicacion|ubicaciÃ³n|direccion|direcciÃ³n|donde|dÃ³nde|mapa|maps|google maps|lugar|queda|como llegar|cÃ³mo llegar)/.test(q)){
    go('sec-ubicacion');
    return 'ðŸ“ **DirecciÃ³n del estudio**\nPedro MÃ©ndez 2069, Posadas, Misiones.\n\nðŸ—ºï¸ Google Maps: https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu&g_ep=EgoyMDI2MDUxMy4wIKXMDSoASAFQAw%3D%3D\n\nTambiÃ©n podÃ©s tocar **Ver ubicaciÃ³n** para ir a la secciÃ³n UbicaciÃ³n.';
  }
  if(/(horario|horarios|atencion|atenciÃ³n|abren|abre|cerrado|cerrados|dias|dÃ­as)/.test(q) && /(estudio|tomauno|atienden|atencion|atenciÃ³n|abren|abre|cerrado|cerrados)/.test(q)){
    const b = topBrainAnswer(['horario|horarios|atencion|atenciÃ³n|dias|dÃ­as'], 6);
    if(b) return b;
    return 'ðŸ•’ **Horarios del estudio**\nLos horarios se coordinan segÃºn sesiones, cursos y reservas.\n\nPara confirmar disponibilidad escribinos por WhatsApp: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%2C%20quiero%20consultar%20horarios.';
  }
  if(/(whatsapp|telefono|telÃ©fono|contacto|celular|numero|nÃºmero|comunicarme|comunicar|comunicacion|comunicaciÃ³n|contactarme)/.test(q) && !/(organizador|organiza|profesor|docente|disertante)/.test(q)){
    return 'ðŸ’¬ **Contacto Tomauno**\nWhatsApp: 3764354522\nLink directo: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%20Cursos%20y%20Capacitaciones%2C%20quisiera%20hacer%20una%20consulta.';
  }
  if(/(instagram|ig|redes)/.test(q)) return 'ðŸ“¸ **Instagram Tomauno**\n@tomaunomodels\n@tomaunoestudio\n@tomaunocapacitaciones';
  if(/(info|informacion|informaciÃ³n|sobre|que es|quÃ© es|conocer).{0,35}(academia|tomauno)|\bacademia tomauno\b|\bacademia de tomauno\b/.test(q) && !/(profesor|profesora|profe|docente|quien dicta|quiÃ©n dicta|materias)/.test(q)){
    const b = topBrainAnswer(['academia|institucional|tomauno|estudio'], 6);
    if(b) return b;
    return 'ðŸ›ï¸ **Tomauno** es un espacio de formaciÃ³n y producciÃ³n visual en Posadas, Misiones. Desde el estudio se coordinan capacitaciones, actividades, servicios fotogrÃ¡ficos y propuestas vinculadas a imagen, fotografÃ­a y desarrollo artÃ­stico.\n\nSi querÃ©s, puedo contarte sobre cursos activos, servicios, eventos o pasarte el contacto directo.';
  }
  if(/(javier|mottola|dueÃ±o|dueno|fundador|quien es javier|quiÃ©n es javier|quien es el dueÃ±o|quiÃ©n es el dueÃ±o)/.test(q)){
    const b = topBrainAnswer(['javier|mottola|dueÃ±o|dueno|fundador|quien soy'], 6);
    if(b) return b;
    return 'ðŸ‘¤ **Javier MÃ³ttola** es parte de Tomauno y estÃ¡ a cargo de la coordinaciÃ³n de consultas, cursos, servicios y actividades del estudio.\n\nSi querÃ©s hablar directo con Ã©l: https://wa.me/5493764354522';
  }
  if(/(profes|profesor|profesores|docente|docentes|quienes dan|quiÃ©nes dan|quien dicta|quiÃ©n dicta|academia de modelos|academia modelaje|materias de modelaje|materias modelo)/.test(q)){
    const b = topBrainAnswer(['profes|profesores|docentes|docente|academia|modelaje|materias'], 6);
    if(b) return b;
    const cSpec = findCursoAI(q);
    if(cSpec && cSpec.sc >= .8){
      const c = cSpec.c;
      const prof = c.disertante || c.profesor || c.organizador || c.docente || c.nombreOrg || '';
      const wp = c.wp || c.wpOrg || c.contacto || '';
      return '**' + (c.titulo || 'Curso') + '**\n' +
        (prof ? 'ðŸ‘¤ Profesor/organizador: ' + prof + '\n' : '') +
        (wp ? 'ðŸ’¬ WhatsApp de contacto: https://wa.me/549' + String(wp).replace(/\D/g,'') + '\n' : '') +
        (!prof && !wp ? 'No tengo cargado un profesor u organizador especÃ­fico para ese curso.' : '');
    }
    return 'ðŸ‘¥ Sobre profesores o materias de la academia, puedo pasarte la informaciÃ³n cargada o derivarte con Javier para confirmarlo en detalle.';
  }
  if(/(desde que edad|desde quÃ© edad|edad minima|edad mÃ­nima|menores|menor de edad|pueden inscribirse|puedo inscribirme con)/.test(q)){
    const b = topBrainAnswer(['edad|edad minima|edad mÃ­nima|menores|inscripcion menores|inscripciÃ³n menores'], 5);
    if(b) return b;
    const faqAns = faqMatchAI(q);
    if(faqAns) return 'â“ **Pregunta frecuente**\n' + faqAns;
  }

  // 2) Listas claras. Si el usuario pide cursos/servicios/eventos en general, no buscar un tÃ­tulo al azar.
  if(/(curso|cursos|capacitaciones|capacitacion|capacitaciÃ³n|taller|talleres|workshop|workshops)/.test(q) && /(info|informacion|informaciÃ³n|disponible|disponibles|activo|activos|tienen|tenes|tenÃ©s|hay|lista|listado|cuales|cuÃ¡les|ver|mostrar)/.test(q) && importantTermsAI(q).length === 0){
    go('sec-cursos');
    return listaCursosAI('');
  }
  if(/(servicio|servicios|sesiones|sesion|sesiÃ³n|book|produccion|producciÃ³n)/.test(q) && /(info|informacion|informaciÃ³n|disponible|disponibles|tienen|tenes|tenÃ©s|hay|lista|listado|cuales|cuÃ¡les|ver|mostrar)/.test(q) && importantTermsAI(q).length === 0){
    go('sec-servicios');
    return listaServiciosAI('');
  }
  if(/(evento|eventos|agenda|actividades)/.test(q) && /(info|informacion|informaciÃ³n|disponible|disponibles|activo|activos|tienen|tenes|tenÃ©s|hay|lista|listado|cuales|cuÃ¡les|ver|mostrar)/.test(q)){
    go('sec-eventos');
    return listaEventosAI();
  }

  // 3) Preguntas por pagos generales.
  if(/(abonar|pagar|pago|seÃ±a|senia|reservar cupo|transferencia|mercado pago|alias)/.test(q) && !/(precio|costo|valor|cuanto|cuÃ¡nto|sale)/.test(q)){
    const b = topBrainAnswer(['pago|pagos|alias|transferencia|mercado pago|seÃ±a|senia'], 6);
    if(b) return b;
    return 'ðŸ’³ **Pagos e inscripciÃ³n**\nPara confirmar un lugar normalmente coordinamos el pago por WhatsApp.\n\nSi querÃ©s, decime el curso, servicio o evento que te interesa y te paso el detalle correcto.\n\nTambiÃ©n podÃ©s escribirnos directo: https://wa.me/5493764354522?text=Hola%20vengo%20de%20la%20web%20Tomauno%2C%20quiero%20consultar%20por%20un%20pago.';
  }

  // 4) Entidades especÃ­ficas publicadas: primero tÃ­tulos de web, despuÃ©s cerebro.
  const asksSpecific = isPriceOrSpecificAI(q) || /(horario|hora|fecha|profesor|organizador|quien|quiÃ©n|inscrib|anotar|registrar|formulario|precio|costo|valor|cuanto|cuÃ¡nto|sale|info|informacion|informaciÃ³n)/.test(q);
  if(/(servicio|servicios|sesion|sesiones|sesiÃ³n|beauty|book|foto|fotografia|fotografÃ­a|retrato|boda|15|quince|casamiento|filmacion|filmaciÃ³n|video)/.test(q)){
    const sSpec = findServicioAI(q);
    const cSpec = findCursoAI(q);
    // Si dice explÃ­citamente sesiÃ³n/servicio/beauty/book, priorizamos servicios.
    if(sSpec && (/servicio|sesion|sesiones|sesiÃ³n|beauty|book|boda|casamiento|quince|15/.test(q) || !cSpec || sSpec.sc >= cSpec.sc)){
      go('sec-servicios');
      return detalleServicioAI(sSpec.s);
    }
  }
  if(/(curso|cursos|capacitacion|capacitaciÃ³n|capacitaciones|taller|workshop|clase|fotografia|fotografÃ­a|modelo|modelaje)/.test(q)){
    const cSpec = findCursoAI(q);
    if(cSpec && (asksSpecific || importantTermsAI(q).length > 0)){
      go('sec-cursos');
      return detalleCursoAI(cSpec.c);
    }
    if(hasCategoryAI(q,'curso') || /fotografia|fotografÃ­a|modelo|modelaje/.test(q)){
      go('sec-cursos');
      return listaCursosAI(q);
    }
  }
  if(/(evento|eventos|organizador|organiza|decoracion|decoraciÃ³n|danzaterapia|danza|taller|charla|show)/.test(q)){
    const eSpec = findEventoAI(q);
    // Si el texto coincide claramente con un tÃ­tulo de evento cargado, responder ese evento aunque no haya pedido â€œmÃ¡s infoâ€.
    if(eSpec && (asksSpecific || eSpec.sc >= .55 || importantTermsAI(q).length >= 2)){
      go('sec-eventos');
      return detalleEventoAI(eSpec.e);
    }
    if(hasCategoryAI(q,'evento')){ go('sec-eventos'); return listaEventosAI(); }
  }

  // 5) FAQ antes del cerebro largo.
  const faqAns = faqMatchAI(q);
  if(faqAns) return 'â“ **Pregunta frecuente**\n' + faqAns;

  // 6) Cerebro como fuente secundaria para info extra, paquetes, bodas, 15 aÃ±os, alquiler, etc.
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
  if(/(precio|costo|valor|cuanto|cuÃ¡nto|cuota)/.test(q)) return 'Los precios dependen del curso, evento o servicio. Si me decÃ­s exactamente cuÃ¡l te interesa, te paso el detalle.';
  return 'Gracias por escribirnos. Puedo ayudarte con **cursos**, **eventos**, **servicios**, **ubicaciÃ³n**, **WhatsApp**, **Instagram**, preguntas frecuentes y agenda activa. Si tu consulta es mÃ¡s especÃ­fica, Javier puede responderte personalmente.';
}

function quiereHablarConJavierAI(text){
  const q = normAI(text);
  return /(javier|humano|persona|alguien|asesor|atencion personalizada|atenciÃ³n personalizada|me responda|responder personalmente|hablar con|contactarme|contacte|llame|llamar)/.test(q) && /(javier|humano|persona|alguien|asesor|responda|responder|hablar|contact|llam)/.test(q);
}
function esAfirmacionAI(text){
  const q = normAI(text).replace(/[\.!,;:]+/g,'').trim();
  return /^(si|sÃ­|s|dale|ok|okay|bueno|perfecto|claro|por favor|quiero|quiero que si|si por favor|sÃ­ por favor|que me responda|que javier me responda)$/.test(q);
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
  const m = raw.match(/^(?:hola\s+)?(?:soy|me llamo|mi nombre es|nombre es|soy\s+yo\s+)?\s*([a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+(?:\s+[a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+){0,3})$/i);
  if(!m) return '';
  let n = limpiarNombreChat(m[1]);
  if(!n || n.length < 2) return '';
  if(/^(si|sÃ­|ok|dale|bueno|perfecto|claro|gracias|quiero|consulta|web|whatsapp|telefono|javier)$/i.test(n)) return '';
  return n;
}
function chatEsperandoDatosHUMs(chat){
  if(!chat) return false;
  if(chat.humanRequested && (!tieneNombreRealChat(chat) || !tieneWhatsAppChat(chat) || !chat.temaPrincipal)) return true;
  const last = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
  return !!(last && /(dejame|dejam[eÃ©]|whatsapp|nombre|tema|consulta).*Javier|Para que pueda contactarte|Sobre qu[eÃ©] tema/i.test(String(last.text||'')));
}
async function manejarDatosHUMsPendientes(chatId, chat, userText){
  const updates = {updatedAt:Date.now(), humanRequested:true, prioridad:true, unreadAdmin:true};
  const wp = extraerWhatsappAI(userText);
  const name = extraerNombreAI(userText);
  if(wp && !tieneWhatsAppChat(chat)) updates.wp = wp;
  if(name && !tieneNombreRealChat(chat)) updates.name = name;
  const merged = Object.assign({}, chat, updates);
  let tema = temaDesdeHistorialAI(merged, userText) || merged.temaPrincipal || '';
  // Si el mensaje no es solo nombre/telÃ©fono, puede ser tema de consulta.
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
    txt += '\n\nMientras tanto, el Asistente Tomauno puede adelantarte informaciÃ³n si querÃ©s.';
    return txt;
  }
  return 'Perfecto ðŸ˜Š Le dejo tu consulta marcada a Javier con tus datos.\n\nTema detectado: **'+tema+'**.\n\nSi querÃ©s escribirle ahora, tambiÃ©n podÃ©s hacerlo por WhatsApp: https://wa.me/5493764354522?text=Hola%20Javier%2C%20vengo%20de%20la%20web%20Tomauno%20y%20quiero%20continuar%20mi%20consulta.';
}
function temaDesdeHistorialAI(chat, actual=''){
  const partes = [actual || '', chat?.temaPrincipal || '', chat?.lastMsg || ''];
  try{ chatMsgs(chat).slice(-6).forEach(([,m]) => { if(m && m.text) partes.push(m.text); }); }catch(e){}
  const q = normAI(partes.join(' '));
  if(/modelo|modelaje|booker|casting|portfolio|book/.test(q)) return 'modelaje / books / portfolio';
  if(/boda|casamiento|15|quince|fiesta|cumple/.test(q)) return 'eventos sociales / 15 aÃ±os / bodas';
  if(/curso|capacit|taller|workshop|clase|fotografia|fotografÃ­a/.test(q)) return 'cursos o capacitaciones';
  if(/alquiler|estudio|equipos|fondo|luces/.test(q)) return 'alquiler del estudio';
  if(/sesion|sesiÃ³n|foto|retrato|beauty|maternidad/.test(q)) return 'sesiones fotogrÃ¡ficas';
  return '';
}
function respuestaAtencionHumanaAI(chat, userText){
  const tema = temaDesdeHistorialAI(chat, userText) || chat?.temaPrincipal || '';
  const faltaNombre = !tieneNombreRealChat(chat);
  const faltaWp = !tieneWhatsAppChat(chat);
  let txt = 'Perfecto ðŸ™‚ Puedo dejarle tu consulta marcada a Javier para que pueda responderte personalmente cuando estÃ© disponible.';
  if(tema) txt += '\n\nTema detectado: **' + tema + '**.';
  if(faltaNombre || faltaWp || !tema){
    const faltan = [];
    if(faltaNombre) faltan.push('tu **nombre**');
    if(faltaWp) faltan.push('tu **WhatsApp**');
    if(!tema) faltan.push('el **tema puntual** de tu consulta');
    txt += '\n\nPara que Javier pueda responderte mejor, dejame ' + faltan.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
    txt += '\n\nMientras tanto, si querÃ©s, el **Asistente Tomauno** tambiÃ©n puede adelantarte informaciÃ³n sobre cursos, servicios, modelaje, eventos o alquiler del estudio.';
  }else{
    txt += '\n\nYa tengo tus datos de contacto. TambiÃ©n podÃ©s escribirle directo por WhatsApp: https://wa.me/5493764354522?text=Hola%20Javier%2C%20vengo%20de%20la%20web%20Tomauno%20y%20quiero%20continuar%20mi%20consulta.';
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

    // Usamos el chat mÃ¡s actualizado de Firebase, no solo el snapshot local.
    let chat = chatsDB?.[chatId] || {};
    try{
      const chatSnap = await get(ref(db,'tomauno/chats/'+chatId));
      if(chatSnap.exists()) chat = chatSnap.val();
    }catch(e){}

    const q = normAI(userText);
    if(!q) return;

    // Si el usuario ya pidiÃ³ atenciÃ³n humana y estÃ¡ dejando nombre/WhatsApp/tema,
    // no lo tratamos como una pregunta normal del asistente.
    if(chatEsperandoDatosHUMs(chat)){
      const respPend = await manejarDatosHUMsPendientes(chatId, chat, userText);
      if(respPend){
        const typingRefP = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno estÃ¡ escribiendo', time:chatTime(), createdAt:Date.now(), typing:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Datos para Javier', status:'abierto'});
        await new Promise(r=>setTimeout(r, 650));
        try{ await remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+typingRefP.key)); }catch(e){}
        await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'admin', text:respPend, time:chatTime(), createdAt:Date.now(), auto:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:cleanChatDisplayText(respPend), status:'abierto-auto', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, lastAutoUserText:userText, lastAutoAt:Date.now()});
        return;
      }
    }

    // Si el usuario pide atenciÃ³n humana o responde afirmativamente al pedido anterior,
    // no explicamos quiÃ©n es Javier: marcamos prioridad y pedimos datos si faltan.
    const lastAutoMsgForHuman = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto && /Javier|personalmente|opciones relacionadas/i.test(String(m.text||'')));
    if(quiereHablarConJavierAI(userText) || (lastAutoMsgForHuman && esAfirmacionAI(userText))){
      const respHum = respuestaAtencionHumanaAI(chat, userText);
      const typingRefH = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno estÃ¡ escribiendo', time:chatTime(), createdAt:Date.now(), typing:true});
      await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'AtenciÃ³n humana solicitada', status:'abierto'});
      await new Promise(r=>setTimeout(r, 750));
      try{ await remove(ref(db,'tomauno/chats/'+chatId+'/messages/'+typingRefH.key)); }catch(e){}
      await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'admin', text:respHum, time:chatTime(), createdAt:Date.now(), auto:true});
      await update(ref(db,'tomauno/chats/'+chatId), {
        updatedAt:Date.now(),
        lastMsg:'â­ AtenciÃ³n humana solicitada',
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
      respuesta = 'Creo que mi respuesta anterior no fue lo suficientemente precisa. Â¿QuerÃ©s que te muestre opciones relacionadas o preferÃ­s que Javier te responda personalmente?';
      pendingTopics = pendingTopics && pendingTopics.length ? pendingTopics : [];
    }

    const typingRef = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno estÃ¡ escribiendo', time:chatTime(), createdAt:Date.now(), typing:true});
    await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Tomauno estÃ¡ escribiendo...', status:'abierto'});
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
    console.error('Asistente automÃ¡tico:', e);
  }
}
function detectarTemaConsulta(text){
  const q = normAI(text);
  if(/ubicacion|direccion|mapa|donde/.test(q)) return 'UbicaciÃ³n';
  if(/curso|capacit|workshop|taller/.test(q)) return 'Cursos';
  if(/evento|agenda/.test(q)) return 'Eventos';
  if(/precio|costo|valor|cuanto|pago/.test(q)) return 'Precios';
  if(/foto|sesion|book|video|boda|quince|15|fiesta|servicio/.test(q)) return 'Servicios';
  return String(text||'').slice(0,60);
}

// â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  t.textContent = msg + '  âœ•';
  t.classList.add('show');
  if (autohide) setTimeout(() => t.classList.remove('show'), 3000);
};
// Alias para no romper cÃ³digo que llame toast sin window
const toast = window.toast;

function showNotif() {
  const d = document.getElementById('notif-dot');
  if (d) { d.style.display = 'inline-block'; setTimeout(() => d.style.display = 'none', 10000); }
}

function showNotifBanner(titulo, detalle, icono='ðŸ”´', onClick=null) {
  let stack = document.getElementById('notif-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'notif-stack';
    stack.style.cssText = 'position:fixed;top:72px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:340px;max-height:calc(100vh - 95px);overflow-y:auto;overscroll-behavior:contain;padding-right:4px;';
    document.body.appendChild(stack);
  }
  const banner = document.createElement('div');
  banner.className = 'notif-banner-item';
  banner.id = 'notif-banner';
  banner.style.cssText = 'position:relative;background:#111;border:1.5px solid var(--red);border-radius:14px;padding:14px 44px 14px 18px;box-shadow:0 8px 30px rgba(0,0,0,.6);cursor:pointer;';
  banner.innerHTML =
    '<button class="notif-close-x" title="Cerrar notificaciÃ³n" style="position:absolute;top:7px;right:8px;width:24px;height:24px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:17px;font-weight:900;cursor:pointer;line-height:22px;">Ã—</button>' +
    '<div style="font-size:10px;color:var(--red);font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">' + icono + ' ' + escHtml(titulo || 'NotificaciÃ³n') + '</div>' +
    '<div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:3px;line-height:1.35;">' + escHtml(detalle || '') + '</div>' +
    '<div style="font-size:10px;color:var(--text3);margin-top:6px;">' + new Date().toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'}) + ' Â· Clic para abrir</div>';
  banner.onclick = () => { if (typeof onClick === 'function') onClick(); };
  banner.querySelector('.notif-close-x').onclick = ev => {
    ev.preventDefault(); ev.stopPropagation();
    banner.remove();
  };
  stack.prepend(banner);
  Array.from(stack.children).slice(8).forEach(n => n.remove());
}

function showConfirm(msg, onOk) {
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:8px 0;">' +
    '<div style="font-size:36px;margin-bottom:14px;">âš ï¸</div>' +
    '<div class="mtitle" style="font-size:22px;margin-bottom:12px;">Confirmar acciÃ³n</div>' +
    '<div style="font-size:14px;color:var(--text2);margin-bottom:24px;line-height:1.5;">' + msg + '</div>' +
    '<div style="display:flex;gap:10px;">' +
    '<button class="btn-out" onclick="window.closeModal()" style="flex:1;">Cancelar</button>' +
    '<button class="btn-main" id="confirm-ok-btn" style="flex:1;background:#c00;">SÃ­, eliminar</button>' +
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

// â”€â”€ DRAG & DROP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ CONTADOR VISITAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ WA ENCODE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function waEncode(text) {
  return Array.from(text).map(c => {
    const code = c.codePointAt(0);
    if (code > 127) return c;
    if (/[a-zA-Z0-9 \-_.,!?:\/\n@()]/.test(c)) return c;
    return encodeURIComponent(c);
  }).join('').replace(/\n/g, '%0A').replace(/ /g, '%20');
}

// â”€â”€ BEEP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


// â”€â”€ EVENTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
onValue(ref(db, 'tomauno/eventos'), s => {
  const oldEventosCount = prevEventosCount;
  eventosDB = s.exists() ? s.val() : {};
  const totalEventos = Object.keys(eventosDB).length;
  if (totalEventos > oldEventosCount && oldEventosCount > 0) {
    const newest = Object.entries(eventosDB).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0))[0];
    if (newest && isAdminNotifier()) {
      beep();
      showNotif();
      showNotifBanner('Nuevo evento registrado', newest[1].titulo || 'Evento sin tÃ­tulo', 'ðŸŽª', () => window.irAAdminTab('eventos-adm'));
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
    beep(); showNotif(); showNotifBanner('Nueva inscripciÃ³n a evento', (newest?.nombre || 'Alumno') + ' Â· ' + (newest?.evTitulo || 'Evento'), 'ðŸŽŸï¸', () => window.irAPlanillaEvento(newest?.evId));
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
             : '<div class="cimg-placeholder"><span class="icon">ðŸŽª</span><span class="brand">TOMA<em>UNO</em></span></div>') +
      '<span class="cbadge ' + (full?'full':'open') + '">' + (full?'Sin cupos':'Activo') + '</span>' +
      (e.cupos > 0 ? '<span class="ccupos-badge">ðŸ‘¥ ' + insc + '/' + e.cupos + '</span>' : '') +
      '</div>' +
      '<div class="cbody">' +
      '<div class="ctitle">' + (e.titulo||'Sin titulo') + '</div>' +
      '<div class="cdesc">' + (e.desc||'').substring(0,80) + '</div>' +
      '<div class="cmeta">' +
      (e.fecha ? '<span class="chip">ðŸ“… ' + fFecha(e.fecha) + '</span>' : '') +
      (e.hora  ? '<span class="chip">â° ' + e.hora + '</span>' : '') +
      (e.lugar ? '<span class="chip">ðŸ“ ' + e.lugar.split(',')[0] + '</span>' : '') +
      '</div>' +
      '<div class="cfoot">' +
      '<div class="cprice' + (!e.costo?' free':'') + '">' + (e.costo ? '$ '+Number(e.costo).toLocaleString('es-AR') : 'GRATIS') + '</div>' +
      '<div class="cfoot-btns">' +
      '<button class="cbtn-info" onclick="event.stopPropagation();window.abrirDetalleEvento(\'' + k + '\')">Mas info</button>' +
      '<button class="cbtn" ' + (full?'disabled':'') + ' onclick="event.stopPropagation();' + (e.tipo==='sesiones' ? 'window.abrirTurnosEvento(\'' + k + '\')' : 'window.abrirInscEvento(\'' + k + '\')') + '">' + (full?'Sin cupos':(e.tipo==='sesiones'?'ðŸ“… Turnos':'Inscribirme')) + '</button>' +
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
      '<div class="admin-ci-sub">' + (e.fecha?fFecha(e.fecha):'Sin fecha') + ' Â· ' + n + ' inscriptos' + (e.nombreOrg?' Â· Org: <strong>'+e.nombreOrg+'</strong> ('+e.dniOrg+')':'') + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">' +
      (e.estado==='pendiente' ? '<button class="bsm gr" onclick="window.activarEvento(\'' + k + '\')">Activar</button>' : '') +
      (e.estado==='activo'    ? '<button class="bsm bl" onclick="window.finalizarEvento(\'' + k + '\')">Finalizar</button>' : '') +
      '<button class="bsm gr" onclick="window.editarEvento(\'' + k + '\')">Editar</button>' +
      (e.wpOrg ? '<a class="bsm wa" rel="noopener noreferrer" target="_blank" style="text-decoration:none;" href="https://wa.me/549' + String(e.wpOrg).replace(/[^0-9]/g,'') + '?text=' + waEncode('Hola! Te escribo desde Tomauno por tu evento: ' + (e.titulo||'')) + '">WA Org</a>' : '') +
      '<button class="bsm bl" onclick="window.exportarExcelEvento(\'' + k + '\')">Excel</button>' +
      '<button class="bsm bl" onclick="window.exportarPDFEvento(\'' + k + '\')">PDF</button>' +
      '<button class="bsm wa" onclick="window.verPlanillaEventoAdmin(\'' + k + '\')">ðŸ“‹ Planilla vivo</button>' +
      '<button class="bsm bl" onclick="window.copiarLinkEvento(\'' + k + '\')">ðŸ”— Link</button>' +
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
    '<div class="msub">' + n + ' inscriptos' + (e.cupos>0?' Â· '+(e.cupos-n)+' cupos restantes':'') + '</div>' +
    '<div class="cmeta" style="margin-bottom:16px;">' +
    (e.fecha?'<span class="chip">ðŸ“… '+fFecha(e.fecha)+'</span>':'') +
    (e.hora ?'<span class="chip">â° '+e.hora+'</span>':'') +
    (e.lugar?'<span class="chip">ðŸ“ '+e.lugar+'</span>':'') +
    (e.costo?'<span class="chip accent">ðŸ’° $ '+Number(e.costo).toLocaleString('es-AR')+'</span>':'<span class="chip" style="color:#00d25a;">GRATIS</span>') +
    '</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.7;white-space:pre-line;margin-bottom:16px;">' + (e.desc||'') + '</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-bottom:14px;padding:6px 12px;background:rgba(255,255,255,.03);border-radius:8px;display:inline-block;">Plataforma Tomauno</div>' +
    (e.ig?'<br><a rel="noopener noreferrer" href="https://instagram.com/'+e.ig+'" target="_blank" class="det-link ig" style="margin-top:8px;display:inline-flex;">ðŸ“¸ @'+e.ig+'</a>':'') +
    (!full?'<button class="btn-main" style="margin-top:14px;" onclick="' + (e.tipo==='sesiones' ? 'window.abrirTurnosEvento(\'' + id + '\')' : 'window.abrirInscEvento(\'' + id + '\')') + '">' + (e.tipo==='sesiones'?'ðŸ“… Elegir turno':'Inscribirme') + '</button>':'') +
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

window.copiarLinkEvento = window.compartirEvento;
window.compartirServicio = (id) => {
  const url = window.location.origin + window.location.pathname + '#servicio-' + id;
  navigator.clipboard.writeText(url).then(() => toast('Link copiado'));
};
window.copiarLinkServicio = window.compartirServicio;

function abrirLinkDirectoTomauno(){
  const hash = String(location.hash || '');
  if(hash.indexOf('#evento-') === 0){
    const id = hash.replace('#evento-', '');
    setTimeout(() => {
      if(eventosDB && eventosDB[id] && window.abrirDetalleEvento) window.abrirDetalleEvento(id);
      else document.getElementById('sec-eventos')?.scrollIntoView({behavior:'smooth', block:'start'});
    }, 450);
  }
  if(hash.indexOf('#servicio-') === 0){
    const id = hash.replace('#servicio-', '');
    setTimeout(() => {
      if(serviciosDB && serviciosDB[id] && window.abrirServicioDB) window.abrirServicioDB(id);
      else document.getElementById('sec-servicios')?.scrollIntoView({behavior:'smooth', block:'start'});
    }, 450);
  }
}
window.addEventListener('hashchange', abrirLinkDirectoTomauno);
window.addEventListener('load', abrirLinkDirectoTomauno);
setTimeout(abrirLinkDirectoTomauno, 900);


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
  let html = '<div class="mtitle">ELEGÃ TU TURNO</div>' +
    '<div class="msub">' + (e.titulo || '') + (e.fecha ? ' Â· ' + fFecha(e.fecha) : '') + ' Â· <span style="color:#4caf7d;">' + libres + ' disponibles</span></div>' +
    '<div class="slots-grid">';
  slots.forEach(s => {
    const q = ocup.find(i => i.turno === s);
    html += '<div class="slot ' + (q ? 'ocupado' : 'libre') + '" data-id="' + id + '" data-slot="' + s + '" ' + (q ? '' : 'onclick="window.selTurnoEvento(this)"') + '>' +
      '<div class="slot-t">' + s + '</div><div class="slot-n">' + (q ? (q.nombre || '').split(' ')[0] : 'âœ“ Libre') + '</div></div>';
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
    '<div class="msub">' + (e.titulo||'') + (e.fecha?' Â· '+fFecha(e.fecha):'') + (turnoElegido ? ' Â· <strong style="color:var(--red);">' + turnoElegido + '</strong>' : '') + '</div>' +
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
    const pagos = [{label:'InscripciÃ³n', estado:'pendiente', monto: e.montoInscripcion || e.costo || ''}];
    for (let i=0; i<Number(e.meses); i++) {
      const d = new Date(n.getFullYear(), n.getMonth()+i, 1);
      pagos.push({label:mm[d.getMonth()] + ' ' + d.getFullYear(), estado:'pendiente', monto:e.montoCuota || ''});
    }
    return pagos;
  }
  return [{label:'Pago Ãºnico', estado:'pendiente', monto:(e && e.costo) ? e.costo : ''}];
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
  const waText = 'ðŸŽª *NUEVA INSCRIPCIÃ“N A EVENTO*\n\nðŸ“Œ *Evento:* '+(e?e.titulo:'')+'\nðŸ‘¤ *Nombre:* '+nom+'\nðŸªª *DNI:* '+dni+'\nðŸ“± *WhatsApp:* '+wp+(ig?'\nðŸ“¸ *Instagram:* @'+ig:'')+(localidad?'\nðŸ“ *Localidad:* '+localidad:'');
  window._pendingWaUrl = 'https://api.whatsapp.com/send?phone=' + waTo + '&text=' + waEncode(waText);
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:12px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">âœ…</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">INSCRIPCION REGISTRADA</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:20px;">Al presionar Aceptar se envian tus datos por WhatsApp.</div>' +
    '<button class="btn-main" id="wa-ev-btn">Aceptar - Enviar a WhatsApp</button>' +
    '</div>';
  document.getElementById('wa-ev-btn').onclick = () => { window.open(window._pendingWaUrl,'_blank'); closeModal(); toast('Inscripcion confirmada!'); };
};

window.abrirFormEvento = () => {
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:4px;">REGISTRAR MI EVENTO</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:18px;line-height:1.6;">CompletÃ¡ los datos. Tu evento quedarÃ¡ pendiente de aprobaciÃ³n. Nos contactaremos para coordinar el flyer.</div>' +
    '<label class="flbl">Nombre del organizador *</label>' +
    '<input class="finput" id="nev-org-nombre" placeholder="Tu nombre y apellido"/>' +
    '<label class="flbl">DNI del organizador * (serÃ¡ tu clave de acceso)</label>' +
    '<input class="finput" id="nev-org-dni" placeholder="Tu DNI" type="number"/>' +
    '<label class="flbl">WhatsApp del organizador *</label>' +
    '<input class="finput" id="nev-org-wp" placeholder="3764123456" type="tel"/>' +
    '<label class="flbl">Instagram del evento (sin @)</label>' +
    '<input class="finput" id="nev-ig" placeholder="mi_evento_ig"/>' +
    '<label class="flbl">Link grupo WhatsApp del evento (opcional)</label>' +
    '<input class="finput" id="nev-grupo-wa" placeholder="https://chat.whatsapp.com/..."/>' +
    '<div style="height:1px;background:var(--border);margin:14px 0;"></div>' +
    '<label class="flbl">TÃ­tulo del evento *</label>' +
    '<input class="finput" id="nev-titulo" placeholder="Ej: Taller de FotografÃ­a"/>' +
    '<label class="flbl">Modalidad</label>' +
    '<select class="finput" id="nev-tipo" onchange="document.getElementById(\'nev-turnos-config\').style.display=this.value===\'sesiones\'?\'block\':\'none\'"><option value="evento">InscripciÃ³n normal</option><option value="sesiones">Con turnos / horarios</option></select>' +
    '<div id="nev-turnos-config" style="display:none;background:#1a0000;border:1px solid #3a0000;border-radius:var(--radius-sm);padding:14px;margin-bottom:8px;"><div style="font-size:12px;color:var(--red);font-weight:800;margin-bottom:10px;">ðŸ“… ConfiguraciÃ³n de turnos</div><div class="frow2"><div class="fgroup"><label class="flbl">Hora inicio</label><input class="finput" id="nev-h-ini" type="time" value="09:00" style="color-scheme:dark"/></div><div class="fgroup"><label class="flbl">Hora fin</label><input class="finput" id="nev-h-fin" type="time" value="22:00" style="color-scheme:dark"/></div></div><div class="frow2"><div class="fgroup"><label class="flbl">DuraciÃ³n por turno</label><input class="finput" id="nev-dur" type="number" value="30"/></div><div class="fgroup"><label class="flbl">Descansos</label><input class="finput" id="nev-descansos" placeholder="13:00-14:00, 17:30-18:00"/></div></div></div>' +
    '<label class="flbl">DescripciÃ³n</label>' +
    '<textarea class="finput" id="nev-desc" placeholder="De quÃ© se trata tu evento..."></textarea>' +
    '<div class="frow2"><div class="fgroup"><label class="flbl">Texto link extra</label><input class="finput" id="nev-extra-text" placeholder="Ej: Ver bases / programa"/></div><div class="fgroup"><label class="flbl">URL link extra</label><input class="finput" id="nev-extra-url" placeholder="https://..."/></div></div>' +
    '<div class="frow2">' +
    '<div class="fgroup"><label class="flbl">Fecha</label><input class="finput" id="nev-fecha" type="date" style="color-scheme:dark"/></div>' +
    '<div class="fgroup"><label class="flbl">Hora</label><input class="finput" id="nev-hora" placeholder="18:00 a 21:00"/></div>' +
    '</div>' +
    '<label class="flbl">Lugar</label>' +
    '<input class="finput" id="nev-lugar" placeholder="Nombre del lugar, direcciÃ³n"/>' +
    '<div class="frow2">' +
    '<div class="fgroup"><label class="flbl">Costo / pago Ãºnico ($)</label><input class="finput" id="nev-costo" type="number" placeholder="0"/></div>' +
    '<div class="fgroup"><label class="flbl">Cupos (0=ilimitado)</label><input class="finput" id="nev-cupos" type="number" placeholder="0"/></div>' +
    '</div>' +
    '<label class="flbl">Tipo de pago</label>' +
    '<select class="finput" id="nev-pago-tipo" onchange="document.getElementById(\'nev-cuotas-wrap\').style.display=this.value===\'cuotas\'?\'block\':\'none\'"><option value="unico">Pago Ãºnico</option><option value="cuotas">InscripciÃ³n + cuotas</option></select>' +
    '<div id="nev-cuotas-wrap" style="display:none;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;"><div class="frow2"><div class="fgroup"><label class="flbl">Monto inscripciÃ³n ($)</label><input class="finput" id="nev-monto-insc" type="number" placeholder="0"/></div><div class="fgroup"><label class="flbl">Monto cuota mensual ($)</label><input class="finput" id="nev-monto-cuota" type="number" placeholder="0"/></div></div><div class="fgroup"><label class="flbl">DuraciÃ³n en meses</label><input class="finput" id="nev-meses" type="number" min="1" max="12" placeholder="3"/></div></div>' +
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
  if (!orgNombre||!orgDni||!orgWp) { toast('CompletÃ¡ tus datos de organizador'); return; }
  if (!titulo) { toast('El tÃ­tulo del evento es obligatorio'); return; }
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
    'ðŸŽª *EVENTO REGISTRADO EN LA WEB*',
    '',
    'ðŸ“Œ *Evento:* ' + (nuevoEventoData.titulo || '-'),
    'ðŸ‘¤ *Organizador:* ' + (nuevoEventoData.nombreOrg || '-'),
    'ðŸªª *DNI acceso:* ' + (nuevoEventoData.dniOrg || '-'),
    'ðŸ“± *WhatsApp:* ' + (nuevoEventoData.wpOrg || '-'),
    nuevoEventoData.ig ? 'ðŸ“¸ *Instagram:* @' + nuevoEventoData.ig : '',
    nuevoEventoData.fecha ? 'ðŸ“… *Fecha:* ' + fFecha(nuevoEventoData.fecha) : '',
    nuevoEventoData.hora ? 'â° *Hora:* ' + nuevoEventoData.hora : '',
    nuevoEventoData.lugar ? 'ðŸ“ *Lugar:* ' + nuevoEventoData.lugar : '',
    'ðŸ§© *Modalidad:* ' + (nuevoEventoData.tipo === 'sesiones' ? 'Con turnos / horarios' : 'InscripciÃ³n normal'),
    'ðŸ’° *Pago:* ' + (nuevoEventoData.pagoTipo === 'cuotas' ? ('InscripciÃ³n $ ' + Number(nuevoEventoData.montoInscripcion||0).toLocaleString('es-AR') + ' + ' + (nuevoEventoData.meses||0) + ' cuota(s) de $ ' + Number(nuevoEventoData.montoCuota||0).toLocaleString('es-AR')) : (nuevoEventoData.costo ? '$ ' + Number(nuevoEventoData.costo).toLocaleString('es-AR') : 'Gratis / sin costo cargado')),
    'ðŸ‘¥ *Cupos:* ' + (nuevoEventoData.cupos ? nuevoEventoData.cupos : 'Ilimitados / sin cupo cargado'),
    nuevoEventoData.grupoWA ? 'ðŸ’¬ *Grupo WA:* ' + nuevoEventoData.grupoWA : '',
    '',
    'ðŸ–¼ï¸ *AcciÃ³n pendiente:* pedir el flyer al organizador por WhatsApp, subirlo a Imgur y pegar el link desde *Editar evento*.',
    'âœ… *Estado actual:* Pendiente de aprobaciÃ³n'
  ].filter(Boolean).join('\n');
  window._pendingEventoAdminWa = 'https://api.whatsapp.com/send?phone=5493764354522&text=' + waEncode(avisoEvento);
  setTimeout(() => { try { window.open(window._pendingEventoAdminWa, '_blank'); } catch(e) {} }, 200);
  document.getElementById('mcontent').innerHTML =
    '<div style="text-align:center;padding:20px 0;">' +
    '<div style="font-size:52px;margin-bottom:16px;">ðŸ™</div>' +
    '<div class="mtitle" style="margin-bottom:8px;">SOLICITUD ENVIADA</div>' +
    '<div style="font-size:14px;color:var(--text2);line-height:1.6;margin-bottom:8px;">Recibimos tu solicitud. Nos contactaremos pronto.</div>' +
    '<div style="font-size:12px;color:var(--text3);margin-bottom:20px;">Tu clave de acceso es tu DNI: <strong style="color:#fff;">' + orgDni + '</strong></div>' +
    '<button class="btn-out" onclick="window.closeModal()">Cerrar</button></div>';
};

window.accederOrganizador = () => {
  const dni = document.getElementById('org-dni-input')?.value.trim();
  if (!dni) { toast('IngresÃ¡ tu DNI'); return; }
  const misEventos = Object.entries(eventosDB).filter(([,e]) => String(e.dniOrg) === String(dni));
  if (!misEventos.length) { toast('No se encontraron eventos con ese DNI'); return; }
  const wrap = document.getElementById('org-panel-wrap'); if (!wrap) return;
  const inscPorEv = {};
  Object.values(evInscDB).forEach(i => { if(i.evId) inscPorEv[i.evId] = (inscPorEv[i.evId]||0)+1; });
  let html = '<div class="org-panel">' +
    '<div class="org-panel-header">' +
    '<div class="org-panel-title">Mis Eventos</div>' +
    '<button class="bsm re" onclick="document.getElementById(\'org-panel-wrap\').innerHTML=\'\'">Cerrar sesiÃ³n</button>' +
    '</div>';
  misEventos.forEach(([k,e]) => {
    const misInsc = Object.entries(evInscDB).filter(([,i]) => i.evId===k);
    html += '<div style="background:var(--gray2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:18px;margin-bottom:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">' +
      '<div><div style="font-size:16px;font-weight:800;">' + (e.titulo||'') + '</div>' +
      '<div style="font-size:12px;color:var(--text3);">' + (e.fecha?fFecha(e.fecha):'Sin fecha') + ' Â· ' + misInsc.length + ' inscriptos Â· ðŸ’° $ ' + totalPagosEvento(misInsc, e).toLocaleString('es-AR') + '</div></div>' +
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
      html += '<div style="color:var(--text3);font-size:13px;padding:8px 0;">Sin inscriptos aÃºn</div>';
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
  const cols = ['Nombre','DNI','WhatsApp','Instagram','Email','Localidad','Edad','Turno','Fecha','Pago','Monto'];
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
    rows.push([i.nombre,i.dni,i.wp,i.ig||'',i.email||'',i.localidad||'',i.edad||'',i.turno||'',i.fecha,est,monto].map(q).join(sep));
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
    return '<tr><td>'+(i.nombre||'')+'</td><td>'+(i.dni||'')+'</td><td>'+(i.wp||'')+'</td><td>'+(i.ig||'')+'</td><td>'+(i.email||'')+'</td><td>'+(i.localidad||'')+'</td><td>'+(i.turno||'')+'</td><td>'+est+'</td><td>$ '+Number(monto).toLocaleString('es-AR')+'</td></tr>';
  }).join('');
  const win = window.open('','_blank');
  if (win) {
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inscriptos</title><link rel="stylesheet" href="css/04-style-04.css"/></head><body><div style="background:#111;color:#fff;padding:16px 18px;border-radius:10px;margin-bottom:14px;"><h1 style="margin:0;font-size:22px;">TOMA<span style="color:#e8000a;">UNO</span></h1><div style="font-size:13px;margin-top:5px;">Planilla de evento: <strong>'+(e?e.titulo:'Evento')+'</strong>'+(e&&e.fecha?' Â· '+e.fecha:'')+'</div></div><p><strong>'+lista.length+'</strong> inscriptos Â· Generado: '+new Date().toLocaleDateString('es-AR')+'</p><table><thead><tr><th>Nombre</th><th>DNI</th><th>WP</th><th>Pago</th><th>Monto</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>');
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
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Inscriptos</title><link rel="stylesheet" href="css/05-style-05.css"/></head><body><div style="background:#111;color:#fff;padding:16px 18px;border-radius:10px;margin-bottom:14px;"><h1 style="margin:0;font-size:22px;">TOMA<span style="color:#e8000a;">UNO</span></h1><div style="font-size:13px;margin-top:5px;">Planilla de evento: <strong>'+(e?e.titulo:'Evento')+'</strong>'+(e&&e.fecha?' Â· '+e.fecha:'')+'</div></div><p><strong>'+lista.length+'</strong> inscriptos Â· Generado: '+new Date().toLocaleDateString('es-AR')+'</p><table><thead><tr><th>Nombre</th><th>DNI</th><th>WP</th><th>IG</th><th>Email</th><th>Localidad</th><th>Turno</th><th>Pago</th><th>Monto</th></tr></thead><tbody>'+rows+'</tbody></table></body></html>');
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
  toast('âœ… Cambios de pagos guardados', true);
  setTimeout(()=>{ if(evId && window.verPlanillaEventoAdmin) window.verPlanillaEventoAdmin(evId); }, 250);
};

window.editarInscEvento = (inscId) => {
  const i = evInscDB[inscId]; if(!i) return;
  document.getElementById('mcontent').innerHTML =
    '<div class="mtitle" style="margin-bottom:14px;">EDITAR INSCRIPTO</div>' +
    '<div class="frow2"><div><label class="flbl">Nombre</label><input class="finput" id="eei-nombre" value="'+escAttr(i.nombre||'')+'"/></div><div><label class="flbl">DNI</label><input class="finput" id="eei-dni" value="'+escAttr(i.dni||'')+'"/></div></div>' +
    '<div class="frow2"><div><label class="flbl">WhatsApp</label><input class="finput" id="eei-wp" value="'+escAttr(i.wp||'')+'"/></div><div><label class="flbl">Instagram</label><input class="finput" id="eei-ig" value="'+escAttr(i.ig||'')+'"/></div></div>' +
    '<div class="frow2"><div><label class="flbl">Email</label><input class="finput" id="eei-email" value="'+escAttr(i.email||'')+'"/></div><div><label class="flbl">Localidad</label><input class="finput" id="eei-localidad" value="'+escAttr(i.localidad||'')+'"/></div></div>' +
    '<div class="frow2"><div><label class="flbl">Edad</label><input class="finput" id="eei-edad" value="'+escAttr(i.edad||'')+'"/></div><div><label class="flbl">Turno</label><input class="finput" id="eei-turno" value="'+escAttr(i.turno||'')+'"/></div></div>' +
    '<button class="btn-main" onclick="window.guardarInscEventoEdit(\''+inscId+'\')">Guardar cambios</button>' +
    '<button class="btn-out" onclick="window.verPlanillaEventoAdmin(\''+(i.evId||'')+'\')" style="margin-top:8px;">Cancelar</button>';
};
window.guardarInscEventoEdit = async (inscId) => {
  const prev = evInscDB[inscId] || {};
  const data = {
    nombre:document.getElementById('eei-nombre')?.value || '',
    dni:document.getElementById('eei-dni')?.value || '',
    wp:document.getElementById('eei-wp')?.value || '',
    ig:document.getElementById('eei-ig')?.value || '',
    email:document.getElementById('eei-email')?.value || '',
    localidad:document.getElementById('eei-localidad')?.value || '',
    edad:document.getElementById('eei-edad')?.value || '',
    turno:document.getElementById('eei-turno')?.value || ''
  };
  await update(ref(db,'tomauno/evRegs/'+inscId), data);
  toast('Inscripto actualizado', true);
  setTimeout(()=>window.verPlanillaEventoAdmin(prev.evId),180);
};
window.eliminarInscEvento = (inscId) => {
  const evId = evInscDB[inscId]?.evId || '';
  showConfirm('Â¿Eliminar este inscripto del evento?', async () => {
    await remove(ref(db,'tomauno/evRegs/'+inscId));
    toast('Inscripto eliminado', true);
    setTimeout(()=>window.verPlanillaEventoAdmin(evId),180);
  });
};

window.verPlanillaEventoAdmin = (id) => {
  const e = eventosDB[id];
  const lista = Object.entries(evInscDB).filter(([,i])=>i.evId===id).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0));
  const total = totalPagosEvento(lista, e);
  const pagados = lista.filter(([,i]) => pagoEventoInfo(i,e).estado === 'pagado').length;
  const parciales = lista.filter(([,i]) => pagoEventoInfo(i,e).estado === 'parcial').length;
  const pendientes = lista.filter(([,i]) => pagoEventoInfo(i,e).estado === 'pendiente').length;
  let html = '<div class="mtitle" style="margin-bottom:6px;">ðŸ“‹ PLANILLA EVENTO</div>' +
    '<div class="msub" style="margin-bottom:14px;">' + (e?e.titulo:'Evento') + '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--text2);">' +
    '<span>ðŸ‘¥ <strong>' + lista.length + '</strong> inscriptos</span>' +
    '<span>âœ… <strong style="color:#4caf7d;">' + pagados + '</strong> pagados</span>' +
    '<span>âš¡ <strong style="color:#f5c842;">' + parciales + '</strong> parciales</span>' +
    '<span>â³ <strong style="color:#e05252;">' + pendientes + '</strong> pendientes</span>' +
    '<span>ðŸ’° Total cobrado: <strong style="color:#4caf7d;">$ ' + total.toLocaleString('es-AR') + '</strong></span>' +
    '</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">' +
    '<button class="bsm bl" onclick="window.exportarExcelEvento(\'' + id + '\')">ðŸ“Š Excel</button>' +
    '<button class="bsm bl" onclick="window.exportarPDFEvento(\'' + id + '\')">ðŸ“„ PDF</button>' +
    (e&&e.grupoWA ? '<a rel="noopener noreferrer" target="_blank" href="' + e.grupoWA + '" class="bsm wa" style="text-decoration:none;">ðŸ’¬ Grupo WA</a>' : '') +
    '<button class="bsm gr" onclick="window.guardarPagosEvento(\'' + id + '\')">ðŸ’¾ Guardar cambios</button>' +
    '</div>';
  if (!lista.length) {
    html += '<div style="color:var(--text3);padding:18px 0;">Sin inscriptos aÃºn</div>';
  } else {
    html += '<div style="overflow-x:hidden;"><table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;">' +
      '<thead><tr><th style="padding:7px;text-align:left;color:var(--text3);width:20%;">Nombre</th><th style="padding:7px;text-align:left;color:var(--text3);width:10%;">DNI</th><th style="padding:7px;text-align:left;color:var(--text3);width:14%;">WP</th><th style="padding:7px;text-align:left;color:var(--text3);width:14%;">IG</th><th style="padding:7px;text-align:left;color:var(--text3);width:13%;">Turno</th><th style="padding:7px;text-align:left;color:var(--text3);width:13%;">Pago</th><th style="padding:7px;text-align:left;color:var(--text3);width:10%;">Monto</th><th style="padding:7px;text-align:left;color:var(--text3);width:6%;"></th></tr></thead><tbody>';
    lista.forEach(([ik,i]) => {
      const p = pagoEventoInfo(i,e);
      const clr = p.estado==='pagado'?'#4caf7d':p.estado==='parcial'?'#f5c842':'#e05252';
      const montoActual = (i.pagos&&i.pagos[0]&&i.pagos[0].monto) ? i.pagos[0].monto : (p.estado==='pagado'&&e&&e.costo?e.costo:'');
      html += '<tr style="border-bottom:1px solid #181818;"><td style="padding:7px;">'+(i.nombre||'')+'</td>' +
        '<td style="padding:7px;">'+(i.dni||'')+'</td>' +
        '<td style="padding:7px;"><a rel="noopener noreferrer" href="https://wa.me/549'+(i.wp||'').replace(/[^0-9]/g,'')+'" target="_blank" style="color:#25d366;">'+(i.wp||'')+'</a></td>' +
        '<td style="padding:7px;">'+(i.ig?'<a rel="noopener noreferrer" href="https://instagram.com/'+i.ig.replace('@','')+'" target="_blank" class="ig-link">@'+i.ig.replace('@','')+'</a>':'-')+(i.email?'<div style="color:var(--text3);font-size:10px;">'+escHtml(i.email)+'</div>':'')+(i.localidad?'<div style="color:var(--text3);font-size:10px;">'+escHtml(i.localidad)+'</div>':'')+'</td>' +
        '<td style="padding:7px;">'+escHtml(i.turno||'-')+'</td>' +
        '<td style="padding:7px;"><select style="background:transparent;border:none;color:'+clr+';font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font);outline:none;" onchange="window.updPagoOrg(\'' + ik + '\',this.value)"><option value="pendiente" '+(p.estado==='pendiente'?'selected':'')+' style="background:#111;">Pendiente</option><option value="parcial" '+(p.estado==='parcial'?'selected':'')+' style="background:#111;">Parcial</option><option value="pagado" '+(p.estado==='pagado'?'selected':'')+' style="background:#111;">Pagado</option></select></td>' +
        '<td style="padding:7px;"><input type="number" value="'+montoActual+'" placeholder="0" onchange="window.updMontoPagoEvento(\'' + ik + '\',this.value)" style="width:80px;background:#0d0d0d;border:1px solid var(--border);color:#fff;border-radius:8px;padding:6px;font-family:var(--font);"/></td>' +
        '<td style="padding:7px;display:flex;gap:5px;"><button class="bsm bl" title="Editar" onclick="window.editarInscEvento(\''+ik+'\')">âœŽ</button><button class="bsm re" title="Eliminar" onclick="window.eliminarInscEvento(\''+ik+'\')">Ã—</button></td></tr>';
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
    html += '<div style="color:var(--text3);">Sin inscriptos aÃºn</div>';
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
    '<label class="flbl">TÃ­tulo</label><input class="finput" id="ee-titulo" value="' + (e.titulo||'').replace(/"/g,'&quot;') + '"/>' +
    '<label class="flbl">DescripciÃ³n</label><textarea class="finput" id="ee-desc" rows="3">' + (e.desc||'') + '</textarea>' +
    '<div class="frow2"><div><label class="flbl">Fecha</label><input class="finput" id="ee-fecha" type="date" value="' + (e.fecha||'') + '" style="color-scheme:dark"/></div>' +
    '<div><label class="flbl">Hora</label><input class="finput" id="ee-hora" value="' + (e.hora||'') + '"/></div></div>' +
    '<label class="flbl">Lugar</label><input class="finput" id="ee-lugar" value="' + (e.lugar||'').replace(/"/g,'&quot;') + '"/>' +
    '<div class="frow2"><div><label class="flbl">Costo / pago Ãºnico</label><input class="finput" id="ee-costo" type="number" value="' + (e.costo||0) + '"/></div>' +
    '<div><label class="flbl">Cupos</label><input class="finput" id="ee-cupos" type="number" value="' + (e.cupos||0) + '"/></div></div>' +
    '<label class="flbl">Tipo de pago</label><select class="finput" id="ee-pago-tipo" onchange="document.getElementById(\'ee-cuotas-wrap\').style.display=this.value===\'cuotas\'?\'block\':\'none\'"><option value="unico" '+((e.pagoTipo||'unico')==='unico'?'selected':'')+'>Pago Ãºnico</option><option value="cuotas" '+(e.pagoTipo==='cuotas'?'selected':'')+'>InscripciÃ³n + cuotas</option></select>' +
    '<div id="ee-cuotas-wrap" style="display:'+(e.pagoTipo==='cuotas'?'block':'none')+';background:#0d0d0d;border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:8px;"><div class="frow2"><div><label class="flbl">Monto inscripciÃ³n</label><input class="finput" id="ee-monto-insc" type="number" value="'+(e.montoInscripcion||0)+'"/></div><div><label class="flbl">Monto cuota</label><input class="finput" id="ee-monto-cuota" type="number" value="'+(e.montoCuota||0)+'"/></div></div><label class="flbl">DuraciÃ³n en meses</label><input class="finput" id="ee-meses" type="number" value="'+(e.meses||0)+'"/></div>' +
    '<label class="flbl">Modalidad</label><select class="finput" id="ee-tipo"><option value="evento" '+((e.tipo||'evento')==='evento'?'selected':'')+'>InscripciÃ³n normal</option><option value="sesiones" '+(e.tipo==='sesiones'?'selected':'')+'>Con turnos / horarios</option></select>' +
    '<div class="frow2"><div><label class="flbl">Hora inicio turnos</label><input class="finput" id="ee-hini" type="time" value="' + (e.horaInicio||'09:00') + '" style="color-scheme:dark"/></div><div><label class="flbl">Hora fin turnos</label><input class="finput" id="ee-hfin" type="time" value="' + (e.horaFin||'22:00') + '" style="color-scheme:dark"/></div></div>' +
    '<div class="frow2"><div><label class="flbl">DuraciÃ³n turno</label><input class="finput" id="ee-dur" type="number" value="' + (e.duracion||30) + '"/></div><div><label class="flbl">Descansos</label><input class="finput" id="ee-descansos" value="' + (e.descansos||'').replace(/"/g,'&quot;') + '"/></div></div>' +
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



// â”€â”€ GALERÃA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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


// â”€â”€ AGENDA AUTOMÃTICA PARA REDES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getAgendaItems() {
  const cursosItems = Object.entries(cursos || {})
    .filter(([, c]) => !c.oculto && !c.finalizado)
    .map(([id, c]) => ({
      uid: 'curso_' + id,
      id,
      tipo: c.tipo === 'sesiones' ? 'TURNOS' : 'CURSO',
      icon: c.tipo === 'sesiones' ? 'ðŸ“…' : (c.icon || 'ðŸŽ“'),
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
      icon: 'ðŸŽª',
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
      icon: s.icon || 'ðŸ“·',
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
      '<div style="font-size:11px;color:var(--text3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (it.fecha ? fFecha(it.fecha) : 'Sin fecha') + (it.hora ? ' Â· ' + it.hora : '') + ' Â· ' + it.extra + '</div></div>' +
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
  const cta = document.getElementById('ag-cta')?.value.trim() || 'Inscripciones desde la web Â· Link en bio';
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
  ctx.fillText('CURSOS & SERVICIOS', 160, logoY+42);
  ctx.font = '900 ' + (mode === 'post' ? 22 : 28) + 'px Outfit, Arial, sans-serif';
  ctx.fillStyle = '#ff0712';
  ctx.fillText('Tomauno estÃ¡ con vos!!', 160, logoY + (mode === 'post' ? 72 : 82));

  // TÃ­tulo central con mÃ¡s aire.
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
      const meta = [it.fecha ? fFechaCortaAgenda(it.fecha) : '', it.hora || '', it.extra || ''].filter(Boolean).join(' Â· ');
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
  truncateCanvasTextCenter(ctx, '@tomaunomodels Â· 3764354522 Â· Pedro MÃ©ndez 2069', W/2, H-66, W-120);
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
    while (ctx.measureText(last + 'â€¦').width > maxWidth && last.length > 3) last = last.slice(0, -1);
    lines[lines.length - 1] = last + 'â€¦';
  }
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function truncateCanvasText(ctx, text, x, y, maxWidth) {
  let t = String(text || '');
  if (ctx.measureText(t).width <= maxWidth) { ctx.fillText(t, x, y); return; }
  while (ctx.measureText(t + 'â€¦').width > maxWidth && t.length > 3) t = t.slice(0, -1);
  ctx.fillText(t + 'â€¦', x, y);
}

function truncateCanvasTextCenter(ctx, text, x, y, maxWidth) {
  let t = String(text || '');
  if (ctx.measureText(t).width <= maxWidth) { ctx.fillText(t, x, y); return; }
  while (ctx.measureText(t + 'â€¦').width > maxWidth && t.length > 3) t = t.slice(0, -1);
  ctx.fillText(t + 'â€¦', x, y);
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
  if (!selected.length) { toast('âš ï¸ SeleccionÃ¡ al menos una actividad'); return; }
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
  if (!selected.length) { toast('âš ï¸ SeleccionÃ¡ al menos una actividad'); return; }
  const cv = document.createElement('canvas');
  drawAgendaCanvas(cv, mode, false);
  const a = document.createElement('a');
  const fecha = new Date().toISOString().slice(0,10);
  a.download = 'tomauno_agenda_' + mode + '_' + fecha + '.jpg';
  a.href = cv.toDataURL('image/jpeg', .98);
  a.click();
  toast('ðŸ“² Agenda descargada');
};

setTimeout(() => { if (document.getElementById('agenda-preview-canvas')) window.previsualizarAgendaRedes(); }, 1200);

// â”€â”€ CANVAS BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ FLYER PANTALLA COMPLETA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.verFlyerFull = (src) => {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;padding:20px;';
  ov.onclick = () => document.body.removeChild(ov);
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;box-shadow:0 0 60px rgba(0,0,0,.8);';
  const close = document.createElement('button');
  close.textContent = 'âœ•';
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



// â”€â”€ PATCH V33.5: estabilidad chat, nombres, intenciÃ³n por entidades y layout â”€â”€
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
  return;
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
    cursos:{label:'ðŸŽ“ Ver cursos', sec:'sec-cursos'}, curso:{label:'ðŸŽ“ Ver cursos', sec:'sec-cursos'},
    servicios:{label:'ðŸ“· Ver servicios', sec:'sec-servicios'}, servicio:{label:'ðŸ“· Ver servicios', sec:'sec-servicios'},
    eventos:{label:'ðŸŽª Ver eventos', sec:'sec-eventos'}, evento:{label:'ðŸŽª Ver eventos', sec:'sec-eventos'},
    testimonios:{label:'â­ Ver testimonios', sec:'sec-testimonios'}, testimonio:{label:'â­ Ver testimonios', sec:'sec-testimonios'}, resenas:{label:'â­ Ver testimonios', sec:'sec-testimonios'}, resena:{label:'â­ Ver testimonios', sec:'sec-testimonios'},
    estudio:{label:'ðŸ¢ Ver estudio', sec:'sec-galeria'}, elestudio:{label:'ðŸ¢ Ver estudio', sec:'sec-galeria'},
    ubicacion:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'}, mapa:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'}, maps:{label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'},
    preguntas:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}, preguntasfrecuentes:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}, frecuentes:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}, faq:{label:'â“ Ver preguntas frecuentes', sec:'sec-faq'}
  };
  if(key === 'contacto' || key === 'whatsapp') return {label:'ðŸ’¬ WhatsApp Javier', url:chatWhatsappUrl(chatsDB[currentOpenChatId]||{})};
  return map[key] || null;
};

extraerNombreAI = function(text){
  let raw = String(text||'').trim();
  if(!raw || extraerWhatsappAI(raw)) return '';
  raw = raw.replace(/[.!?]+$/g,'').trim();
  let m = raw.match(/^(?:hola\s+)?(?:soy|me llamo|mi nombre es|nombre es)\s+([a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+(?:\s+[a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+){0,3})$/i);
  if(!m && /^[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}(\s+[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}){0,2}$/.test(raw)) m = [raw, raw];
  if(!m) return '';
  let n = limpiarNombreChat(m[1]);
  if(!n || n.length < 2) return '';
  if(/^(si|sÃ­|ok|dale|bueno|perfecto|claro|gracias|quiero|consulta|web|whatsapp|telefono|javier|hola|buenas)$/i.test(n)) return '';
  return n.charAt(0).toUpperCase()+n.slice(1);
};
lastAdminAskedName = function(chat){
  const last = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin');
  return !!(last && /(nombre|como\s+te\s+llamas|cÃ³mo\s+te\s+llamÃ¡s|como\s+es\s+tu\s+nombre|cÃ³mo\s+es\s+tu\s+nombre|dejame\s+tu\s+nombre|deja\s+tu\s+nombre|dejÃ¡\s+tu\s+nombre)/i.test(String(last[1].text||'')));
};
isJustNameReply = function(text, chat){
  const n = extraerNombreAI(text);
  if(!n) return '';
  const raw = String(text||'').trim();
  if(lastAdminAskedName(chat)) return n;
  if(/^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw)) return n;
  if(!tieneNombreRealChat(chat) && /^[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}(\s+[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}){0,2}$/.test(raw)) return n;
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
  Object.entries(cursos||{}).forEach(([id,c])=>{ if(!c.oculto && !c.finalizado) items.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.disertante,c.profesor,c.organizador,c.docente,c.wp].join(' ')}); });
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
    if(/evento|eventos|charla|show|organizador|decoracion|decoraciÃ³n|danzaterapia/.test(nq) && it.type==='evento') sc += 4;
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
  if(match.type==='evento') txt += 'ðŸŽª Evento publicado\n';
  if(prof) txt += 'ðŸ‘¤ Profesor/organizador: ' + prof + '\n';
  if(wp) txt += 'ðŸ’¬ WhatsApp de contacto: https://wa.me/549' + String(wp).replace(/\D/g,'') + '\n';
  if(ig) txt += 'ðŸ“² Instagram: @' + ig + '\n';
  if(!prof && !wp && !ig) txt += 'No tengo cargado un profesor, organizador o contacto especÃ­fico para esta actividad. Puedo dejar tu consulta marcada para Javier.';
  return txt;
}
const __buscarRespuestaAsistente_v335 = buscarRespuestaAsistente;
buscarRespuestaAsistente = function(text){
  const q = normAI(text || '');
  window._lastAiSuggestions = [];
  window._lastAiSection = '';
  if(!q) return '';
  if(/(profesor|profesora|profesores|docente|docentes|disertante|organizador|organiza|quien da|quiÃ©n da|quien dicta|quiÃ©n dicta)/.test(q)){
    const m = bestPublishedTitleMatchAI(q);
    if(m){
      if(m.type==='curso') window._lastAiSection='sec-cursos';
      if(m.type==='servicio') window._lastAiSection='sec-servicios';
      if(m.type==='evento') window._lastAiSection='sec-eventos';
      return contactoEntidadAI(m);
    }
  }
  const explicit = bestPublishedTitleMatchAI(q);
  if(explicit && /(decoracion|decoraciÃ³n|danzaterapia|manualidades|beauty|modelo|modelaje|fotografia|fotografÃ­a|polaroid|reconecta|portfolio|book)/.test(q)){
    if(explicit.type==='curso'){ window._lastAiSection='sec-cursos'; return detalleCursoAI(explicit.obj); }
    if(explicit.type==='servicio'){ window._lastAiSection='sec-servicios'; return detalleServicioAI(explicit.obj); }
    if(explicit.type==='evento'){ window._lastAiSection='sec-eventos'; return detalleEventoAI(explicit.obj); }
  }
  return __buscarRespuestaAsistente_v335(text);
};


// â”€â”€ PATCH V33.6: bÃºsqueda eventos, comandos info, layout chat y acciones â”€â”€
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

// Filtrado acento-insensible tambiÃ©n para eventos visibles cuando se busca desde Cursos.
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

// Devuelve detalle con acciÃ³n de Info/InscripciÃ³n cuando la entidad publicada estÃ¡ identificada.
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
  if(/(comunicarme|comunicar|comunicacion|comunicaciÃ³n|contactarme|contacto|whatsapp|telefono|telÃ©fono|celular|numero|nÃºmero)/.test(q) && !/(organizador|organiza|profesor|docente|disertante)/.test(q)){
    return 'ðŸ’¬ **Contacto Tomauno**\nWhatsApp: 3764354522\nLink directo: ' + chatWhatsappUrl(chatsDB[currentOpenChatId] || {});
  }
  // Profesor/organizador de una actividad publicada.
  if(/(profesor|profesora|profesores|docente|docentes|disertante|organizador|organiza|quien da|quiÃ©n da|quien dicta|quiÃ©n dicta)/.test(q)){
    const m = bestPublishedTitleMatchAI(q);
    if(m){
      if(m.type==='curso') window._lastAiSection='sec-cursos';
      if(m.type==='servicio') window._lastAiSection='sec-servicios';
      if(m.type==='evento') window._lastAiSection='sec-eventos';
      return contactoEntidadAI(m);
    }
  }
  // Si hay una entidad publicada clara, responder esa y agregar botÃ³n Info.
  const terms = importantTermsAI(q);
  const m = bestPublishedTitleMatchAI(q);
  if(m && terms.length && (m.titleHits >= 1 || m.sc >= 8)){
    if(/(curso|cursos|capacit|taller|workshop|clase|seminario|charla)/.test(q) && m.type==='curso'){ window._lastAiSection='sec-cursos'; return detalleEntidadConAccionAI(m); }
    if(/(servicio|servicios|sesion|sesiones|book|portfolio|beauty|alquiler|foto|fotos)/.test(q) && m.type==='servicio'){ window._lastAiSection='sec-servicios'; return detalleEntidadConAccionAI(m); }
    if(/(evento|eventos|taller|seminario|workshop|charla|decoracion|decoraciÃ³n|danzaterapia|manualidades)/.test(q) && m.type==='evento'){ window._lastAiSection='sec-eventos'; return detalleEntidadConAccionAI(m); }
    if(isPriceOrSpecificAI(q) || /info|informacion|informaciÃ³n|datos|detalle|detalles/.test(q)){
      window._lastAiSection = m.type==='curso'?'sec-cursos':m.type==='servicio'?'sec-servicios':'sec-eventos';
      return detalleEntidadConAccionAI(m);
    }
  }
  return __buscarRespuestaAsistente_v336(text);
};


// â”€â”€ PATCH V33.7: estabilidad asistente, bÃºsquedas generales y UI chat â”€â”€
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
  const generic = new Set(['estan','estÃ¡n','esta','estÃ¡','este','estos','estas','teniendo','tengo','tiene','tener','tenemos','dame','decime','contame','informacion','informaciÃ³n','info','quiero','saber','sobre','puedo','puedes','pueden','tus','sus','mis','mas','mÃ¡s','disponible','disponibles','activo','activos','tienen','tenes','tenÃ©s','hay','alguno','alguna','algun','algÃºn','cuales','cuÃ¡les','lista','listado','mostrar','mostrame','ver']);
  return importantTermsAI(q).filter(w => !generic.has(w));
}
function isGeneralCourseQueryAI(q){
  return /(curso|cursos|capacitacion|capacitaciÃ³n|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && /(info|informacion|informaciÃ³n|disponible|disponibles|activo|activos|tienen|tenes|tenÃ©s|hay|lista|listado|cuales|cuÃ¡les|ver|mostrar|mostrame|estÃ¡n|estan|teniendo)/.test(q) && meaningfulTermsAI(q).length === 0;
}
function isGeneralServiceQueryAI(q){
  return /(servicio|servicios|sesion|sesiÃ³n|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && /(info|informacion|informaciÃ³n|disponible|disponibles|tienen|tenes|tenÃ©s|hay|lista|listado|cuales|cuÃ¡les|ver|mostrar|mostrame|estÃ¡n|estan|teniendo)/.test(q) && meaningfulTermsAI(q).length === 0;
}
function isGeneralEventQueryAI(q){
  return /(evento|eventos|agenda|actividad|actividades)/.test(q) && /(info|informacion|informaciÃ³n|disponible|disponibles|activo|activos|tienen|tenes|tenÃ©s|hay|lista|listado|cuales|cuÃ¡les|ver|mostrar|mostrame|estÃ¡n|estan|teniendo)/.test(q) && meaningfulTermsAI(q).length === 0;
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

  // Listas generales: jamÃ¡s elegir una actividad al azar si el usuario pidiÃ³ â€œlos cursos/servicios/eventosâ€.
  if(isGeneralCourseQueryAI(q)){ window._lastAiSection = 'sec-cursos'; return listaCursosAI(''); }
  if(isGeneralServiceQueryAI(q)){ window._lastAiSection = 'sec-servicios'; return listaServiciosAI(''); }
  if(isGeneralEventQueryAI(q)){ window._lastAiSection = 'sec-eventos'; return listaEventosAI(); }

  // Contacto del dueÃ±o/Javier: si pide contacto, pasar contacto; no biografÃ­a.
  if(/(contactar|contactarme|comunicarme|comunicar|whatsapp|telefono|telÃ©fono|numero|nÃºmero)/.test(q) && /(javier|dueÃ±o|dueno|mottola|tomauno|ustedes)/.test(q)){
    return 'ðŸ’¬ **Contacto directo**\nPodÃ©s escribirle a Javier por WhatsApp: ' + chatWhatsappUrl(chatsDB[currentOpenChatId] || {}) + '\n\nSi querÃ©s, tambiÃ©n puedo dejar tu consulta marcada para que Javier la revise al volver.';
  }

  // Si el usuario dice sÃ­ despuÃ©s de una pregunta ambigua, evitar asumir atenciÃ³n humana como Ãºnica salida.
  const chat = chatsDB[currentOpenChatId] || {};
  const lastAuto = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
  if(/^(si|sÃ­|dale|ok|bueno|perfecto)$/i.test(String(text||'').trim()) && lastAuto && /opciones relacionadas/i.test(String(lastAuto[1].text||''))){
    const pend = Array.isArray(chat.pendingTopics) ? chat.pendingTopics : [];
    if(pend.length){
      window._lastAiSuggestions = pend;
      return 'Perfecto. Estas son las opciones que encontrÃ©:\n\n' + pend.slice(0,4).map((t,i)=>(i+1)+'. '+(t.titulo||'Tema')).join('\n') + '\n\nEscribÃ­ el nÃºmero o el nombre del tema.';
    }
    return 'Perfecto. Decime si preferÃ­s consultar por **cursos**, **servicios**, **eventos**, **ubicaciÃ³n** o **WhatsApp** y te oriento.';
  }

  return __buscarRespuestaAsistente_v337(text);
};

// Mejora de filtros: bÃºsqueda acento-insensible y sin â€œarrastrarâ€ todos los eventos si no coinciden.
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



// â”€â”€ PATCH V33.8: operador limpio, nombres seguros y layout chat estable â”€â”€
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
  // Si preguntamos nombre, aceptar respuestas como: â€œMartin, quiero saber...â€ o â€œme llamo Sofia y necesito...â€
  if(lastAdminAskedName(chat)){
    raw = raw.replace(/^(hola|buenas|buen dia|buenas tardes|buenas noches)[,\s]+/i,'').trim();
    raw = raw.replace(/^(soy|me llamo|mi nombre es|nombre es)\s+/i,'').trim();
    raw = raw.split(/[,.;:!Â¿?]|\s+(?:y|pero|quiero|quisiera|necesito|me gustaria|me gustarÃ­a|consulta|consulto|pregunto)\b/i)[0].trim();
    const m = raw.match(/^([a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+(?:\s+[a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+){0,2})/i);
    if(m){
      const n = limpiarNombreChat(m[1]);
      if(n && n.length >= 2 && !/^(si|sÃ­|ok|dale|bueno|perfecto|claro|gracias|quiero|consulta|web|whatsapp|telefono|javier|hola|buenas)$/i.test(n)){
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
  if(!tieneNombreRealChat(chat) && /^[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}(\s+[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]{2,}){0,2}$/.test(raw)) return n;
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
  // Evita que el listener limpie la ventana si Firebase todavÃ­a no devolviÃ³ el chat o si fue cerrado/borrado.
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
    '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Panel de atenciÃ³n desde la web</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Activar/desactivar automÃ¡tico" onclick="window.toggleModoAsistenteChat()">ðŸ¤–</button><button class="chat-icon-btn" title="Activar notificaciones" onclick="window.pedirPermisoNotificaciones()">ðŸ””</button></div></div>'+
    '<div class="chat-empty-state"><div><strong>Esperando consultas</strong><div>TenÃ©s '+abiertos+' conversaciÃ³n'+(abiertos!==1?'es':'')+' abierta'+(abiertos!==1?'s':'')+(nuevos?(' Â· '+nuevos+' nueva'+(nuevos!==1?'s':'')):'')+'.</div><div style="margin-top:8px;font-size:12px;">AbrÃ­ la bandeja cuando quieras revisar o responder.</div></div></div>'+
    '<div class="chat-home-actions"><button class="btn-main" onclick="abrirPanelChatsAdmin()">ðŸ“¥ Ver bandeja</button><button class="btn-out" onclick="window.verResumenConsultasChat()">ðŸ“‹ Resumen</button><button class="btn-out" onclick="window.cerrarTodosChatsAbiertos()">ðŸ“­ Vaciar abiertos</button><button class="btn-out" onclick="window.cerrarChatPopover()">Minimizar</button></div>'
  );
};

window.abrirChatTomauno = function(){
  unlockAudio();
  const popToggle = document.getElementById('chat-popover');

  if (isAdminNotifier()) {
    const abiertos = Object.entries(chatsDB || {})
      .filter(([,c]) => isValidChat(c) && c.status !== 'cerrado')
      .sort((a,b)=>sortChatsForInbox([a,b])[0]===a?-1:1);

    const unread = abiertos.find(([,c]) => c && c.unreadAdmin);
    const preferred = unread ? unread[0] : (currentOpenChatId && chatsDB[currentOpenChatId] && chatsDB[currentOpenChatId].status !== 'cerrado' ? currentOpenChatId : (abiertos[0] && abiertos[0][0]));

    if(preferred) return abrirChatAdmin(preferred, true);
    return abrirPanelChatsAdmin();
  }

  if (popToggle && popToggle.classList.contains('open')) { window.cerrarChatPopover && window.cerrarChatPopover(); return; }
  document.getElementById('chat-fab')?.classList.remove('has-new');
  if(currentCtrlMInvite && Number(currentCtrlMInvite.expiresAt || 0) > Date.now()) return window.abrirCtrlMInvite();
  if (currentVisitorChatId && chatsDB[currentVisitorChatId] && chatsDB[currentVisitorChatId].status !== 'cerrado') return abrirChatVisitante(currentVisitorChatId);
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>' +
    '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">' +
    '<div class="chat-bubble admin"><div>Soy el asistente de Tomauno ðŸ˜Š<br/><b>Â¿CÃ³mo es tu nombre?</b></div><div class="chat-meta">Ahora</div></div>' +
    '</div>' +
    '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">âžœ</button></div></div>'
  );
  setTimeout(()=>{
    const inp = document.getElementById('chat-name');
    if(inp){ try{ inp.focus({preventScroll:true}); }catch(e){ inp.focus(); } }
  }, 80);
};

window.cerrarConversacionChat = async function(id){
  await update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()});
  toast('ðŸ“­ ConversaciÃ³n cerrada');

  const abiertos = Object.entries(chatsDB || {})
    .filter(([cid,c]) => cid !== id && isValidChat(c) && c.status !== 'cerrado')
    .sort((a,b)=>(b[1].updatedAt||0)-(a[1].updatedAt||0));

  if(currentOpenChatId && currentOpenChatId !== id && chatsDB[currentOpenChatId] && chatsDB[currentOpenChatId].status !== 'cerrado'){
    abrirChatAdmin(currentOpenChatId, true);
  }else if(abiertos.length){
    currentOpenChatId = abiertos[0][0];
    abrirChatAdmin(currentOpenChatId, true);
  }else{
    currentOpenChatId = '';
    abrirPanelChatsAdmin();
  }
};

window.cerrarTodosChatsAbiertos = function(){
  const abiertos = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c) && c.status !== 'cerrado');
  if(!abiertos.length){ toast('No hay chats abiertos'); return; }
  showConfirm('Â¿Cerrar todas las conversaciones abiertas? No se borran: quedan en Cerrados/Todos.', async ()=>{
    await Promise.all(abiertos.map(([id])=>update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()})));
    toast('ðŸ“­ Bandeja abierta vacÃ­a');
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
    btn.textContent='ðŸ“­ Vaciar abiertos';
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



// â”€â”€ PATCH V33.9: cierre de detalles chat/asistente y operaciÃ³n estable â”€â”€
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

// El basurero de la bandeja elimina directo, sin confirmaciÃ³n.
window.eliminarChatDefinitivo = async function(id){
  await remove(ref(db,'tomauno/chats/'+id));
  try{ notifiedChatIds.delete(id); localStorage.setItem('tomauno-chat-notified', JSON.stringify([...notifiedChatIds])); }catch(e){}
  if(currentOpenChatId === id) currentOpenChatId = '';
  toast('ðŸ—‘ï¸ Chat eliminado');
  abrirPanelChatsAdmin();
};

// Al cerrar todos, solo archiva/cierra. No borra historial.
window.cerrarTodosChatsAbiertos = function(){
  const abiertos = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c) && c.status !== 'cerrado');
  if(!abiertos.length){ toast('No hay chats abiertos'); return; }
  showConfirm('Â¿Vaciar la bandeja de abiertos? No se borran mensajes: quedan en Cerrados/Todos.', async ()=>{
    await Promise.all(abiertos.map(([id])=>update(ref(db,'tomauno/chats/'+id), {status:'cerrado', unreadAdmin:false, updatedAt:Date.now()})));
    toast('ðŸ“­ Bandeja abierta vacÃ­a');
    abrirChatAdminHome();
  });
};

// New course: insertar profesor/disertante en alta.
(function injectProfesorCursoField(){
  const hora = document.getElementById('nc-hora');
  if(hora && !document.getElementById('nc-profesor')){
    const wrap = document.createElement('div');
    wrap.className = 'fgroup';
    wrap.innerHTML = '<label class="flbl">Profesor / disertante / responsable</label><input class="finput" id="nc-profesor" placeholder="Ej: Javier Mottola"/><label class="flbl" style="margin-top:8px;">Campo especial del formulario</label><input class="finput" id="nc-campo-especial-label" placeholder="Nombre del campo adicional"/><div style="font-size:10px;color:var(--text3);margin-top:-4px;">Si queda vacio, no aparece en el formulario publico.</div><label class="flbl" style="margin-top:8px;">Opciones / servicios seleccionables</label><textarea class="finput" id="nc-opciones-texto" rows="4" placeholder="Mini sesion, 14000&#10;1 impresion, 6000&#10;Video backstage, 18000"></textarea><div style="font-size:10px;color:var(--text3);margin-top:-4px;">Un item por linea. Tambien acepta: nombre, precio; nombre, precio</div>';
    const row = hora.closest('.frow2');
    if(row) row.insertAdjacentElement('afterend', wrap);
  }
})();

// Reemplazo controlado para guardar curso nuevo con profesor.
window.agregarCurso = async function(){
  const titulo = document.getElementById('nc-titulo')?.value.trim();
  if (!titulo) { toast('âš ï¸ El tÃ­tulo es obligatorio'); return; }
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
    icon: document.getElementById('nc-icon')?.value.trim() || 'ðŸ“·',
    img: document.getElementById('nc-img')?.value.trim() || '',
    extraText: document.getElementById('nc-extra-text')?.value.trim() || '',
    extraUrl: document.getElementById('nc-extra-url')?.value.trim() || '',
    horaInicio: document.getElementById('nc-h-ini')?.value || '09:00',
    horaFin: document.getElementById('nc-h-fin')?.value || '22:00',
    descansos: document.getElementById('nc-descansos')?.value.trim() || '',
    duracion: parseInt(document.getElementById('nc-dur')?.value) || 30,
    grupoWA: document.getElementById('nc-grupo-wa')?.value.trim() || '',
    campoEspecialLabel: document.getElementById('nc-campo-especial-label')?.value.trim() || '',
    opcionesTexto: document.getElementById('nc-opciones-texto')?.value.trim() || '',
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
  ['nc-titulo','nc-desc','nc-costo','nc-cupos','nc-fecha','nc-hora','nc-profesor','nc-campo-especial-label','nc-opciones-texto','nc-lugar','nc-ig','nc-wp','nc-img','nc-extra-text','nc-extra-url','nc-meses','nc-grupo-wa','nc-icon','nc-descansos'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  toast('âœ… Curso publicado');
  setAtab('cursos');
};

const __editCurso_v339 = window.editCurso;
window.editCurso = function(id){
  __editCurso_v339(id);
  setTimeout(()=>{
    const desc = document.getElementById('ec-desc');
    const c = cursos[id] || {};
    if(desc && !document.getElementById('ec-profesor')){
      desc.insertAdjacentHTML('afterend','<label class="flbl">Profesor / disertante / responsable</label><input class="finput" id="ec-profesor" value="'+escAttr(c.profesor || c.disertante || c.organizador || c.docente || '')+'" placeholder="Ej: Javier Mottola"/><label class="flbl" style="margin-top:8px;">Opciones / servicios seleccionables</label><textarea class="finput" id="ec-opciones-texto" rows="4" placeholder="Nombre, precio">'+escHtml(c.opcionesTexto || c.serviciosTexto || '')+'</textarea><div style="font-size:10px;color:var(--text3);margin-top:-4px;">Un item por linea. Tambien acepta: nombre, precio; nombre, precio</div>');
    }
  },30);
};
const __guardarEdit_v339 = window.guardarEdit;
window.guardarEdit = async function(id){
  const prof = document.getElementById('ec-profesor')?.value.trim() || '';
  const campoEspecialLabel = document.getElementById('ec-campo-especial-label')?.value.trim() || '';
  const opcionesTexto = document.getElementById('ec-opciones-texto')?.value.trim() || '';
  await __guardarEdit_v339(id);
  await update(ref(db,'tomauno/cursos/'+id), {profesor:prof, disertante:prof, campoEspecialLabel, opcionesTexto});
};

function isAckAI(q){ return /^(si|sÃ­|dale|ok|oki|bueno|perfecto|genial|gracias|muchas gracias|de acuerdo|listo)$/i.test(String(q||'').trim()); }
function hasGeneralListWords(q){ return /(tienen|tenes|tenÃ©s|hay|activos|activas|disponibles|ofrecen|cuales|cuÃ¡les|lista|listado|mostrar|mostrame|saber todos|todos los que)/.test(q); }
function queryTermsForEntity(q){
  const generic = new Set(['quiero','saber','sobre','tienen','tenes','hay','activos','activas','disponibles','info','informacion','todos','todas','cuales','cuÃ¡les','lista','listado','me','interesa','gustaria','gustarÃ­a','ver','mostrar','mostrame','curso','cursos','taller','talleres','workshop','seminario','clase','servicio','servicios','evento','eventos','tener','estan','estÃ¡n','teniendo']);
  return importantTermsAI(q).filter(w => !generic.has(w));
}
function listaEventosAI_v339(){
  const list = Object.values(eventosDB || {}).filter(e => e.estado === 'activo' && !e.oculto).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!list.length) return 'Por ahora no hay eventos activos publicados. #eventos';
  return 'ðŸŽª **Eventos activos**\n\n' + list.slice(0,8).map((e,i)=> (i+1)+'. **'+(e.titulo||'Evento')+'**' + (e.fecha?'\nðŸ“… '+fFecha(e.fecha):'') + (e.costo?'\nðŸ’° '+moneyAI(e.costo):'')).join('\n\n') + '\n\n#eventos';
}
function listaServiciosAI_v339(){
  const list = Object.values(serviciosDB || {}).filter(s => !s.oculto).sort((a,b)=>String(a.titulo||'').localeCompare(String(b.titulo||'')));
  if(!list.length) return 'ðŸ“· Hacemos sesiones fotogrÃ¡ficas, books, retratos, moda y contenido para redes. Contame quÃ© tipo de sesiÃ³n buscÃ¡s y te oriento. #servicios';
  return 'ðŸ“· **Servicios activos**\n\n' + list.slice(0,8).map((s,i)=> (i+1)+'. **'+(s.titulo||'Servicio')+'**' + (s.costo?'\nðŸ’° '+moneyAI(s.costo):'') + (s.ig?'\nðŸ“² @'+String(s.ig).replace('@',''):'')).join('\n\n') + '\n\n#servicios';
}
function listaCursosAI_v339(){
  const list = Object.values(cursos || {}).filter(c => !c.oculto && !c.finalizado).sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||''));
  if(!list.length) return 'Por ahora no hay cursos activos publicados. #cursos';
  return 'ðŸŽ“ **Cursos activos**\n\n' + list.slice(0,8).map((c,i)=> (i+1)+'. **'+(c.titulo||'Curso')+'**' + (c.fecha?'\nðŸ“… '+fFecha(c.fecha):'') + (c.hora?'\nâ° '+c.hora:'') + (c.costo?'\nðŸ’° '+moneyAI(c.costo):'')).join('\n\n') + '\n\n#cursos';
}
function bestEntityAcrossPublishedAI(q){
  const terms = queryTermsForEntity(q);
  if(!terms.length) return null;
  const items = [];
  Object.entries(cursos||{}).forEach(([id,c])=>{ if(!c.oculto && !c.finalizado) items.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.profesor,c.disertante,c.organizador,c.docente,c.wp].join(' ')}); });
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
    if(/evento|eventos|decoracion|decoraciÃ³n|danzaterapia|manualidades/.test(q) && it.type==='evento') score += 3;
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
    return 'Perfecto ðŸ˜Š Queda marcada tu consulta para que Javier la revise. Si querÃ©s agregar algo mÃ¡s, escribilo por acÃ¡.';
  }

  // Contacto general o con Javier/dueÃ±o: pasar WhatsApp, no pedir mÃ¡s vueltas.
  if(/(comunicarme|comunicar|contactarme|contactar|contacto|whatsapp|telefono|telÃ©fono|celular|numero|nÃºmero|dueÃ±o|dueno|javier|mottola|ustedes)/.test(q) && !/(organizador|profesor|docente|disertante)/.test(q)){
    return 'ðŸ’¬ **Contacto directo de Tomauno**\nPodÃ©s escribirle a Javier por WhatsApp: ' + chatWhatsappUrl(chat) + '\n\nSi querÃ©s, tambiÃ©n puedo dejar tu consulta marcada para que la revise personalmente.';
  }

  if(/(direccion|direcciÃ³n|ubicacion|ubicaciÃ³n|donde queda|dÃ³nde queda|maps|mapa|llegar)/.test(q)){
    window._lastAiSection = 'sec-ubicacion';
    return 'ðŸ“ **DirecciÃ³n del estudio**\nPedro MÃ©ndez 2069, Posadas, Misiones.\n\nðŸ—ºï¸ Google Maps: Abrir Google Maps\n#ubicacion';
  }

  // Listas generales claras.
  if(/(curso|cursos|capacitacion|capacitaciÃ³n|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && (hasGeneralListWords(q) || queryTermsForEntity(q).length === 0)){
    window._lastAiSection = 'sec-cursos';
    return listaCursosAI_v339();
  }
  if(/(servicio|servicios|sesion|sesiÃ³n|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && (hasGeneralListWords(q) || queryTermsForEntity(q).length === 0)){
    window._lastAiSection = 'sec-servicios';
    return listaServiciosAI_v339();
  }
  if(/(evento|eventos|agenda|actividad|actividades)/.test(q) && (hasGeneralListWords(q) || queryTermsForEntity(q).length === 0)){
    window._lastAiSection = 'sec-eventos';
    return listaEventosAI_v339();
  }

  // Profesor / organizador / contacto de actividad publicada.
  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|organizador|organiza|quien da|quiÃ©n da|quien dicta|quiÃ©n dicta)/.test(q)){
    const ent = bestEntityAcrossPublishedAI(q) || bestPublishedTitleMatchAI(q);
    if(ent){
      window._lastAiSection = ent.type==='curso' ? 'sec-cursos' : ent.type==='servicio' ? 'sec-servicios' : 'sec-eventos';
      return contactoEntidadAI(ent);
    }
    return 'Para decirte quiÃ©n es el profesor u organizador necesito saber de quÃ© curso, taller, servicio o evento me hablÃ¡s. Â¿CuÃ¡l te interesa?';
  }

  // Entidad puntual por tÃ­tulo/tema.
  const ent = bestEntityAcrossPublishedAI(q) || bestPublishedTitleMatchAI(q);
  if(ent && queryTermsForEntity(q).length){
    window._lastAiSection = ent.type==='curso' ? 'sec-cursos' : ent.type==='servicio' ? 'sec-servicios' : 'sec-eventos';
    return detailEntityAI_v339(ent);
  }

  // Si dice â€œtodos los que tienen activosâ€ sin categorÃ­a, intentar inferir por contexto.
  if(/(todos|todas|activos|activas|disponibles|tienen|teniendo)/.test(q)){
    const cat = chatInferCategoryFromHistory(chat);
    if(cat === 'servicios'){ window._lastAiSection='sec-servicios'; return listaServiciosAI_v339(); }
    if(cat === 'eventos'){ window._lastAiSection='sec-eventos'; return listaEventosAI_v339(); }
    if(cat === 'cursos'){ window._lastAiSection='sec-cursos'; return listaCursosAI_v339(); }
  }

  return __buscarRespuestaAsistente_v339_base(text);
};

// Evitar que la bÃºsqueda interna confunda acentos y mover al bloque correcto.
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

// Abrir automÃ¡ticamente la conversaciÃ³n nueva si el admin estÃ¡ en el home del chat.
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

// MenÃº admin: si hay chats cerrados pero nada abierto, mostrar home vacÃ­o limpio.
window.abrirChatAdminHome = function(){
  currentOpenChatId = '';
  const valid = Object.entries(chatsDB || {}).filter(([,c])=>isValidChat(c));
  const abiertos = valid.filter(([,c])=>c.status !== 'cerrado').length;
  const nuevos = valid.filter(([,c])=>c.unreadAdmin).length;
  setChatPopover(
    '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Panel de atenciÃ³n desde la web</div></div><div class="chat-head-actions"><button class="chat-icon-btn" title="Activar/desactivar automÃ¡tico" onclick="window.toggleModoAsistenteChat()">ðŸ¤–</button><button class="chat-icon-btn" title="Activar notificaciones" onclick="window.pedirPermisoNotificaciones()">ðŸ””</button></div></div>'+ 
    '<div class="chat-empty-state"><div><strong>'+(abiertos?'Esperando consultas':'Bandeja limpia')+'</strong><div>'+(abiertos?'TenÃ©s '+abiertos+' conversaciÃ³n'+(abiertos!==1?'es':'')+' abierta'+(abiertos!==1?'s':'')+(nuevos?(' Â· '+nuevos+' nueva'+(nuevos!==1?'s':'')):'')+'.':'No hay conversaciones abiertas ahora mismo.')+'</div><div style="margin-top:8px;font-size:12px;">'+(abiertos?'AbrÃ­ la bandeja cuando quieras revisar o responder.':'Cuando alguien escriba desde la web aparecerÃ¡ acÃ¡.')+'</div></div></div>'+ 
    '<div class="chat-home-actions"><button class="btn-main" onclick="abrirPanelChatsAdmin()">ðŸ“¥ Ver bandeja</button><button class="btn-out" onclick="window.verResumenConsultasChat()">ðŸ“‹ Resumen</button><button class="btn-out" onclick="window.cerrarTodosChatsAbiertos()">ðŸ“­ Vaciar abiertos</button><button class="btn-out" onclick="window.cerrarChatPopover()">Minimizar</button></div>'
  );
};

// Normalizar botÃ³n de acciÃ³n de ubicaciÃ³n para no repetir â€œtocÃ¡â€.
const __chatActionButtonsForMessage_v339 = chatActionButtonsForMessage;
chatActionButtonsForMessage = function(text){
  return __chatActionButtonsForMessage_v339(String(text||'').replace(/TambiÃ©n podÃ©s tocar[^\n]+/gi,''));
};



// â”€â”€ PATCH V33.10: cierre fino de chat/asistente sin tocar Firebase â”€â”€
(function(){
  const css = document.createElement('style');
  css.textContent = `
    /* Botonera siempre visible y Ã¡rea de lectura mÃ¡s grande */
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

// Generalidad estricta: si preguntan â€œquÃ© cursos/servicios/eventos tienenâ€, listar todo y no elegir al azar.
function generalTermsV3310(q){
  const drop = new Set(['quiero','saber','sobre','tienen','tenes','tenÃ©s','hay','activos','activas','disponibles','info','informacion','informaciÃ³n','todos','todas','cuales','cuÃ¡les','lista','listado','mostrar','mostrame','ver','me','interesa','gustaria','gustarÃ­a','estan','estÃ¡n','teniendo','ofrecen','ofreces','estudio','tomauno','curso','cursos','capacitacion','capacitaciÃ³n','capacitaciones','taller','talleres','workshop','seminario','clase','clases','servicio','servicios','sesion','sesiÃ³n','sesiones','evento','eventos','agenda','actividad','actividades']);
  return importantTermsAI(q).filter(w=>!drop.has(w));
}
function isGeneralCourseQueryAI_v3310(q){ return /(curso|cursos|capacitacion|capacitaciÃ³n|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && /(que|quÃ©|cuales|cuÃ¡les|tienen|tenes|tenÃ©s|hay|disponibles|activos|info|informacion|informaciÃ³n|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(q) && generalTermsV3310(q).length===0; }
function isGeneralServiceQueryAI_v3310(q){ return /(servicio|servicios|sesion|sesiÃ³n|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && /(que|quÃ©|cuales|cuÃ¡les|tienen|tenes|tenÃ©s|hay|disponibles|activos|info|informacion|informaciÃ³n|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(q) && generalTermsV3310(q).length===0; }
function isGeneralEventQueryAI_v3310(q){ return /(evento|eventos|agenda|actividad|actividades)/.test(q) && /(que|quÃ©|cuales|cuÃ¡les|tienen|tenes|tenÃ©s|hay|disponibles|activos|info|informacion|informaciÃ³n|lista|listado|todos|teniendo|ofrecen|mostrame|mostrar|ver)/.test(q) && generalTermsV3310(q).length===0; }

// Botones de acciÃ³n: soportar #info/#inscripciÃ³n siempre, aunque el usuario cierre y vuelva a tocar.
chatActionButtonsForMessage = function(text){
  const t = normAI(text || '');
  const btns = parseChatActions(text || []);
  if(t.includes('cursos activos') || t.includes('seccion cursos') || t.includes('ver cursos')) btns.push({label:'ðŸŽ“ Ver cursos', sec:'sec-cursos'});
  if(t.includes('eventos activos') || t.includes('seccion eventos') || t.includes('ver eventos')) btns.push({label:'ðŸŽª Ver eventos', sec:'sec-eventos'});
  if(t.includes('servicios activos') || t.includes('servicios disponibles') || t.includes('seccion servicios') || t.includes('ver servicios')) btns.push({label:'ðŸ“· Ver servicios', sec:'sec-servicios'});
  if(t.includes('direccion del estudio') || t.includes('pedro mendez')) btns.push({label:'ðŸ“ Ver ubicaciÃ³n', sec:'sec-ubicacion'});
  const seen = new Set();
  const clean = btns.filter(b=>{ const k = b.url || (b.fn+':'+b.type+':'+b.id) || b.sec || b.label; if(seen.has(k)) return false; seen.add(k); return true; });
  if(!clean.length) return '';
  return '<div class="chat-action-row">' + clean.map(b => {
    if(b.url) return '<button class="chat-action-btn" onclick="window.open(\''+b.url+'\',\'_blank\')">'+b.label+'</button>';
    if(b.fn) return '<button class="chat-action-btn" onclick="window.executeChatAction(\''+b.fn+'\',\''+b.type+'\',\''+String(b.id).replace(/'/g,'\\\'')+'\')">'+b.label+'</button>';
    return '<button class="chat-action-btn" onclick="window.chatGoToSection(\''+b.sec+'\')">'+b.label+'</button>';
  }).join('') + '</div>';
};

// Demorar acciones automÃ¡ticas para que el usuario lea primero el mensaje.
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

// Limpiar frases innecesarias en respuestas con ubicaciÃ³n/acciones.
const __cleanChatDisplayText_v3310 = cleanChatDisplayText;
cleanChatDisplayText = function(text){
  return __cleanChatDisplayText_v3310(String(text||'').replace(/TambiÃ©n podÃ©s tocar[^\n]+\n?/gi,''));
};

// Ejecutar info/inscripciÃ³n siempre que se toque el botÃ³n.
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
      meta.insertAdjacentHTML('beforeend','<span class="chip prof-chip">ðŸ‘¤ '+escHtml(prof)+'</span>');
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
    if(meta && !meta.querySelector('.prof-chip')) meta.insertAdjacentHTML('beforeend','<span class="chip prof-chip">ðŸ‘¤ '+escHtml(prof)+'</span>');
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

  if(/(contactar|contactarme|comunicarme|comunicar|whatsapp|telefono|telÃ©fono|numero|nÃºmero)/.test(q) && /(javier|dueÃ±o|dueno|mottola|tomauno|ustedes)/.test(q)){
    return 'ðŸ’¬ **Contacto directo de Javier / Tomauno**\nPodÃ©s escribir por WhatsApp: ' + chatWhatsappUrl(chatsDB[currentOpenChatId] || {}) + '\n\nSi querÃ©s, dejame tambiÃ©n el motivo de tu consulta y queda marcado para responderte mejor.';
  }

  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|responsable|organizador|organiza|quien da|quiÃ©n da|quien dicta|quiÃ©n dicta)/.test(q)){
    const m = bestPublishedTitleMatchAI(q) || bestEntityAcrossPublishedAI?.(q);
    if(m){ window._lastAiSection = m.type==='curso'?'sec-cursos':m.type==='servicio'?'sec-servicios':'sec-eventos'; return contactoEntidadAI(m); }
    return 'Para decirte quiÃ©n es el profesor, disertante u organizador necesito saber de quÃ© curso, taller, servicio o evento me hablÃ¡s. Â¿CuÃ¡l te interesa?';
  }

  return __buscarRespuestaAsistente_v3310(text);
};

// Filtros de bÃºsqueda acento-insensibles y con mensajes claros.
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


// â”€â”€ PATCH V33.11: layout chat + prioridad de cursos/profesores sin mezclar servicios â”€â”€
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
  if(allow.has('curso')) Object.entries(cursos || {}).forEach(([id,c])=>{ if(!c.oculto && !c.finalizado) arr.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.ig,c.profesor,c.disertante,c.organizador,c.docente,c.responsable,c.wp].join(' ')}); });
  if(allow.has('servicio')) Object.entries(serviciosDB || {}).forEach(([id,s])=>{ if(!s.oculto) arr.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.ig,s.wp,s.dir,s.responsable].join(' ')}); });
  if(allow.has('evento')) Object.entries(eventosDB || {}).forEach(([id,e])=>{ if(e.estado==='activo' && !e.oculto) arr.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.nombreOrg,e.organizador,e.ig,e.lugar,e.wpOrg].join(' ')}); });
  return arr;
}
function aiTermsV3311(q){
  const stop = new Set(['quiero','quisiera','saber','sobre','tienen','tenes','tenÃ©s','hay','activos','activas','disponibles','info','informacion','informaciÃ³n','todos','todas','cuales','cuÃ¡les','lista','listado','mostrar','mostrame','ver','me','interesa','gustaria','gustarÃ­a','estan','estÃ¡n','teniendo','ofrecen','ofreces','estudio','tomauno','curso','cursos','capacitacion','capacitaciÃ³n','capacitaciones','taller','talleres','workshop','seminario','clase','clases','servicio','servicios','sesion','sesiÃ³n','sesiones','evento','eventos','agenda','actividad','actividades','profesor','profesora','profesores','profe','profes','docente','docentes','disertante','disertantes','organizador','organiza','quien','quiÃ©n','dicta','da','del','de','la','el','los','las','un','una','alguno','alguna','para','con','como','cÃ³mo']);
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

  // General: nunca elegir una actividad al azar si pidiÃ³ lista.
  if(/(curso|cursos|capacitacion|capacitaciÃ³n|capacitaciones|taller|talleres|workshop|seminario|clase|clases)/.test(q) && (hasGeneralListWords(q) || aiTermsV3311(q).length === 0)){
    window._lastAiSection = 'sec-cursos';
    return (typeof listaCursosAI_v339 === 'function' ? listaCursosAI_v339() : listaCursosAI(''));
  }
  if(/(servicio|servicios|sesion|sesiÃ³n|sesiones|book|books|portfolio|trabajos|propuestas)/.test(q) && (hasGeneralListWords(q) || aiTermsV3311(q).length === 0)){
    window._lastAiSection = 'sec-servicios';
    return (typeof listaServiciosAI_v339 === 'function' ? listaServiciosAI_v339() : listaServiciosAI(''));
  }
  if(/(evento|eventos|agenda|actividad|actividades)/.test(q) && (hasGeneralListWords(q) || aiTermsV3311(q).length === 0)){
    window._lastAiSection = 'sec-eventos';
    return (typeof listaEventosAI_v339 === 'function' ? listaEventosAI_v339() : listaEventosAI());
  }

  // Profesor/disertante/organizador: buscar por nombre o por tÃ­tulo en datos publicados.
  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|responsable|organizador|organiza|quien da|quiÃ©n da|quien dicta|quiÃ©n dicta)/.test(q)){
    const byPerson = aiProfessorMatchV3311(q);
    const byTitle = aiBestV3311(q, ['curso','servicio','evento']);
    const m = byPerson || byTitle;
    if(m){
      window._lastAiSection = m.type === 'curso' ? 'sec-cursos' : m.type === 'servicio' ? 'sec-servicios' : 'sec-eventos';
      return contactoEntidadAI(m);
    }
    return 'Para decirte quiÃ©n es el profesor, disertante u organizador necesito saber de quÃ© curso, taller, servicio o evento me hablÃ¡s. Â¿CuÃ¡l te interesa?';
  }

  // EspecÃ­fico por tipo: si dijo curso, sÃ³lo mirar cursos; si dijo servicio, sÃ³lo servicios; si dijo evento/taller de ciudad, eventos.
  if(/(curso|cursos|capacitacion|capacitaciÃ³n|capacitaciones|clase|clases)/.test(q)){
    const m = aiBestV3311(q, ['curso']);
    if(m){ window._lastAiSection='sec-cursos'; return aiDetailV3311(m); }
  }
  if(/(servicio|servicios|sesion|sesiÃ³n|sesiones|book|books|portfolio|alquiler|trabajos|propuestas)/.test(q)){
    const m = aiBestV3311(q, ['servicio']);
    if(m){ window._lastAiSection='sec-servicios'; return aiDetailV3311(m); }
  }
  if(/(evento|eventos|danzaterapia|decoracion|decoraciÃ³n|manualidades)/.test(q)){
    const m = aiBestV3311(q, ['evento']);
    if(m){ window._lastAiSection='sec-eventos'; return aiDetailV3311(m); }
  }

  return __buscarRespuestaAsistente_v3311(text);
};

// Comandos rÃ¡pidos recordatorio: /info fotografÃ­a, /info modelaje, /info decoraciÃ³n, /inscribir fotografÃ­a.



// â”€â”€ PATCH V33.12: cierre de ajustes chat/asistente/bÃºsquedas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
(function(){
  const css = document.createElement('style');
  css.textContent = `
    /* Scrollbars discretas y rojas */
    .chat-tabs,.chat-admin-actions,.chat-tools-block,.chat-msgs{scrollbar-width:thin;scrollbar-color:#e8000a #101010;}
    .chat-tabs::-webkit-scrollbar,.chat-admin-actions::-webkit-scrollbar{height:5px!important;}
    .chat-msgs::-webkit-scrollbar,.chat-tools-block::-webkit-scrollbar{width:6px!important;}
    .chat-tabs::-webkit-scrollbar-track,.chat-admin-actions::-webkit-scrollbar-track,.chat-msgs::-webkit-scrollbar-track,.chat-tools-block::-webkit-scrollbar-track{background:#111;border-radius:20px;}
    .chat-tabs::-webkit-scrollbar-thumb,.chat-admin-actions::-webkit-scrollbar-thumb,.chat-msgs::-webkit-scrollbar-thumb,.chat-tools-block::-webkit-scrollbar-thumb{background:#e8000a;border-radius:20px;}
    /* Tabs mÃ¡s claras y sin encimarse */
    .chat-tabs{max-width:calc(100% - 92px);padding-bottom:6px;margin-bottom:8px;}
    .chat-tab{height:30px;max-width:178px;}
    .chat-tab.active{box-shadow:0 0 0 1px rgba(232,0,10,.45) inset;}
    .chat-tab.unread{border-color:#e8000a!important;background:rgba(232,0,10,.13)!important;animation:tabPulse 1.2s infinite;}
    @keyframes tabPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,0,10,.0)}50%{box-shadow:0 0 0 4px rgba(232,0,10,.12)}}
    /* Chat expandido: mÃ¡s Ã¡rea Ãºtil, menos hueco abajo */
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

function aiTokensExactV3312(s){ return normAI(s).replace(/[^a-z0-9Ã± ]/g,' ').split(/\s+/).filter(Boolean); }
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
  if(allow.has('curso')) Object.entries(cursos||{}).forEach(([id,c])=>{ if(!c.oculto && !c.finalizado) arr.push({type:'curso',id,obj:c,title:c.titulo||'',extra:[c.desc,c.ig,c.profesor,c.disertante,c.organizador,c.docente,c.responsable,c.wp].join(' ')}); });
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

  if(/(contactar|contactarme|comunicarme|comunicar|whatsapp|telefono|numero|hablar)/.test(q) && /(javier|dueno|dueÃ±o|mottola|tomauno|ustedes|contacto)/.test(q)){
    return 'ðŸ’¬ **Contacto directo de Javier / Tomauno**\nPodÃ©s escribir por WhatsApp: https://wa.me/5493764354522?text=Hola%20Javier%2C%20vengo%20de%20la%20web%20Tomauno%20y%20quiero%20continuar%20mi%20consulta.';
  }
  if(/(direccion|ubicacion|ubicaciÃ³n|donde queda|mapa|maps)/.test(q)){
    window._lastAiSection='sec-ubicacion';
    return 'ðŸ“ **DirecciÃ³n del estudio**\nPedro MÃ©ndez 2069, Posadas, Misiones.\n\nðŸ—ºï¸ Google Maps: https://www.google.com/maps/place/Estudio+Fotogr%C3%A1fico+Tomauno/@-27.3764851,-55.8976743,17z/data=!3m1!4b1!4m6!3m5!1s0x9457be494f85260f:0x9b7c2b5fd920df9f!8m2!3d-27.3764851!4d-55.8976743!16s%2Fg%2F11cmdn9j9z?entry=ttu\n#ubicacion';
  }
  if(aiIsGeneralListV3312(q,'curso')){ window._lastAiSection='sec-cursos'; return (typeof listaCursosAI_v339==='function'?listaCursosAI_v339():listaCursosAI('')); }
  if(aiIsGeneralListV3312(q,'servicio')){ window._lastAiSection='sec-servicios'; return (typeof listaServiciosAI_v339==='function'?listaServiciosAI_v339():listaServiciosAI('')); }
  if(aiIsGeneralListV3312(q,'evento')){ window._lastAiSection='sec-eventos'; return (typeof listaEventosAI_v339==='function'?listaEventosAI_v339():listaEventosAI()); }

  if(/(profesor|profesora|profesores|profe|profes|docente|docentes|disertante|disertantes|responsable|organizador|organiza|quien da|quien dicta)/.test(q)){
    const brain=aiKnowledgeStrongV3312(q,'profes');
    if(brain) return applyAIVariables(brain.k.respuesta||'', chatsDB[currentOpenChatId]||{});
    const ent=aiBestV3312(q,['curso','servicio','evento']);
    if(ent){ window._lastAiSection=ent.type==='curso'?'sec-cursos':ent.type==='servicio'?'sec-servicios':'sec-eventos'; return contactoEntidadAI(ent); }
    return 'Para decirte quiÃ©n es el profesor, disertante u organizador necesito saber de quÃ© curso, taller, servicio o evento me hablÃ¡s. Â¿CuÃ¡l te interesa?';
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

// Evitar que â€œquiero contactarme con el dueÃ±oâ€ active la ruta de pedir datos: primero contestamos contacto directo.
const __quiereHablarConJavierAI_v3312 = quiereHablarConJavierAI;
quiereHablarConJavierAI = function(text){
  const q=normAI(text||'');
  if(/(contactar|contactarme|comunicarme|whatsapp|telefono|numero)/.test(q) && /(javier|dueno|dueÃ±o|mottola|tomauno|ustedes)/.test(q)) return false;
  return __quiereHablarConJavierAI_v3312(text);
};

// Botones de acciÃ³n: deduplicar por secciÃ³n/tipo, y Info siempre operativo.
chatActionButtonsForMessage = function(text){
  const t=normAI(text||'');
  let btns=parseChatActions(text||[]);
  if((t.includes('cursos activos')||t.includes('seccion cursos')||t.includes('ver cursos')) && !btns.some(b=>b.sec==='sec-cursos')) btns.push({label:'ðŸŽ“ Ver cursos',sec:'sec-cursos'});
  if((t.includes('eventos activos')||t.includes('seccion eventos')||t.includes('ver eventos')) && !btns.some(b=>b.sec==='sec-eventos')) btns.push({label:'ðŸŽª Ver eventos',sec:'sec-eventos'});
  if((t.includes('servicios activos')||t.includes('servicios disponibles')||t.includes('seccion servicios')||t.includes('ver servicios')) && !btns.some(b=>b.sec==='sec-servicios')) btns.push({label:'ðŸ“· Ver servicios',sec:'sec-servicios'});
  if((t.includes('direccion del estudio')||t.includes('pedro mendez')) && !btns.some(b=>b.sec==='sec-ubicacion')) btns.push({label:'ðŸ“ Ver ubicaciÃ³n',sec:'sec-ubicacion'});
  const seen=new Set();
  btns=btns.filter(b=>{const k=b.url || (b.fn+':'+b.type+':'+b.id) || b.sec || b.label; if(seen.has(k)) return false; seen.add(k); return true;});
  if(!btns.length) return '';
  return '<div class="chat-action-row">'+btns.map(b=>{
    if(b.url) return '<button class="chat-action-btn" onclick="window.open(\''+b.url+'\',\'_blank\')">'+b.label+'</button>';
    if(b.fn) return '<button class="chat-action-btn" onclick="window.executeChatAction(\''+b.fn+'\',\''+b.type+'\',\''+String(b.id).replace(/'/g,"\\'")+'\')">'+b.label+'</button>';
    return '<button class="chat-action-btn" onclick="window.chatGoToSection(\''+b.sec+'\')">'+b.label+'</button>';
  }).join('')+'</div>';
};

// Ejecutar Info/InscripciÃ³n con pequeÃ±a demora para que el usuario vea el mensaje primero.
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

// BÃºsqueda pÃºblica: si hay coincidencia en TÃTULO, mostrar solo tÃ­tulos. Evita que â€œfotografÃ­aâ€ traiga modelaje por descripciÃ³n/flyer.
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

// Deep link: /#chat, /#consulta o /#asistente abre el chat automÃ¡ticamente.
(function(){
  function openHashChat(){ const h=String(location.hash||'').toLowerCase(); if(h==='#chat'||h==='#consulta'||h==='#asistente') setTimeout(()=>document.getElementById('chat-fab')?.click(),900); }
  window.addEventListener('hashchange', openHashChat); window.addEventListener('load', openHashChat); setTimeout(openHashChat,1200);
})();



/* =====================================================================
   v33.18 â€” JS mÃ­nimo: Resumen WhatsApp visible, logout ADM real,
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
      return 'â€¢ ' + who + ': ' + String(m.text||'').replace(/\s+/g,' ').trim();
    }).filter(Boolean);
    const firstUser = chatMsgs(c).find(([,m]) => m.from === 'user')?.[1]?.text || '';
    const tema = c.temaPrincipal || detectarTemaConsulta(firstUser || c.lastMsg || '');
    const resumen = [
      'ðŸ“Œ *Consulta web Tomauno*',
      '',
      fmtLine('ðŸ‘¤ *Nombre:* ', chatVisibleName(c,id)),
      fmtLine('ðŸ“± *WhatsApp:* ', c.wp || '-'),
      fmtLine('ðŸ•’ *Ãšltima actividad:* ', chatFullDate(c.updatedAt || c.createdAt)),
      fmtLine('ðŸ“ *Estado:* ', c.status || 'abierto'),
      fmtLine('ðŸŽ¯ *InterÃ©s detectado:* ', tema || '-'),
      fmtLine('ðŸ’¬ *Ãšltimo mensaje:* ', c.lastMsg || '-'),
      '',
      'ðŸ§¾ *Resumen de conversaciÃ³n:*',
      msgs.join('\n') || 'Sin mensajes registrados.'
    ].filter(x => x !== '').join('\n');
    copiarTextoChat(resumen);
    toast('ðŸ“‹ Resumen copiado para WhatsApp', true);
    const wp = String(c.wp||'').replace(/\D/g,'');
    if(wp){
      showConfirm('Resumen copiado. Â¿Abrir WhatsApp del contacto para pegarlo?', () => {
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
    btn.innerHTML = '<span class="ico">ðŸ§¾</span>';
    btn.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); window.generarResumenWhatsAppChat(id); };
    const copyBtn = actions.querySelector('[title="Copiar conversaciÃ³n"]');
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
    toast('ðŸ”’ SesiÃ³n admin cerrada', true);
  };
  function bindAdmLogout(){
    const el = document.getElementById('admin-live-indicator');
    if(!el || el.dataset.logoutBound) return;
    el.dataset.logoutBound = '1';
    el.title = 'Cerrar sesiÃ³n admin';
    el.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      showConfirm('Â¿Cerrar sesiÃ³n admin y volver a pedir PIN?', () => window.logoutAdminRealTomauno());
    }, true);
  }
  bindAdmLogout();
  setInterval(bindAdmLogout, 2000);

  const commandMap = {
    '#ubicacion':'ðŸ“ *DirecciÃ³n del estudio*\nPedro MÃ©ndez 2069, Posadas, Misiones.\n\nðŸ—ºï¸ Google Maps: Abrir Google Maps #ubicacion#',
    '#cursos':'ðŸŽ“ En la secciÃ³n CURSOS podÃ©s ver las capacitaciones disponibles. #cursos#',
    '#servicios':'ðŸ“· En la secciÃ³n SERVICIOS podÃ©s ver sesiones, books, retratos y producciÃ³n. #servicios#',
    '#instagram':'ðŸ“± Nuestros Instagram son:\n@tomaunoestudio\n@tomaunomodels\n@tomaunocapacitaciones',
    '#whatsapp':'ðŸ’¬ TambiÃ©n podÃ©s escribir directo por WhatsApp: Abrir WhatsApp'
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
   v33.19 â€” UX conversacional: confirm compacto, notificaciones por actividad,
   nombre automÃ¡tico, resumen breve y lÃ³gica humana menos invasiva.
   ===================================================================== */
(function(){
  // 1) Confirmaciones mÃ¡s chicas y con botones claros: NO / SÃ.
  showConfirm = function(msg, onOk){
    const box = document.getElementById('mcontent');
    if(!box) return;
    box.innerHTML =
      '<div style="text-align:center;padding:2px 0 4px;max-width:360px;margin:0 auto;">' +
      '<div style="font-size:24px;margin-bottom:8px;">âš ï¸</div>' +
      '<div class="mtitle" style="font-size:20px;margin-bottom:8px;line-height:1;">Confirmar</div>' +
      '<div style="font-size:13px;color:var(--text2);margin-bottom:16px;line-height:1.45;">' + escHtml(String(msg||'')) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      '<button class="btn-out" onclick="window.closeModal()" style="margin:0;padding:11px 12px;">No</button>' +
      '<button class="btn-main" id="confirm-ok-btn" style="margin:0;padding:11px 12px;">SÃ­</button>' +
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

    // final6h: desactivado. No notificar por cada mensaje del usuario; solo chat nuevo o llamada humana.
    try{
      const pop = document.getElementById('chat-popover');
      /* final6h: no autoabrir por mensaje nuevo */
    }catch(e){}
  });

  // 3) DetecciÃ³n de nombre mÃ¡s amplia + respuesta breve de confirmaciÃ³n.
  function capName(n){
    return String(n||'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean).map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()).join(' ');
  }
  function detectNameV3319(text){
    const raw = String(text||'').trim().replace(/[.!?]+$/,'');
    if(!raw || extraerWhatsappAI(raw)) return '';
    const m = raw.match(/^(?:hola[,\s]*)?(?:mi\s+nombre\s+es|me\s+llamo|soy|me\s+dicen|nombre\s+es)\s+([a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+(?:\s+[a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+){0,3})$/i);
    if(!m) return '';
    const n = capName(limpiarNombreChat(m[1]));
    if(!n || n.length < 2) return '';
    if(/^(Si|SÃ­|Ok|Dale|Bueno|Perfecto|Claro|Gracias|Quiero|Consulta|Web|Whatsapp|Telefono|Javier)$/i.test(n)) return '';
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
          await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'admin', text:'Genial, '+detected+' ðŸ˜Š Ya agendÃ© tu nombre.', time:chatTime(), createdAt:Date.now(), auto:true});
          await update(ref(db,'tomauno/chats/'+id), {lastMsg:'Nombre agendado: '+detected, unreadVisitor:true, updatedAt:Date.now()});
        }
      }catch(e){}
    }
    return res;
  };

  // 4) Si el usuario pidiÃ³ Javier, pero luego pregunta por servicios/cursos/etc., no insistir con datos.
  const __manejarDatosHUMsPendientes_v3319 = manejarDatosHUMsPendientes;
  manejarDatosHUMsPendientes = async function(chatId, chat, userText){
    const q = normAI(userText||'');
    if(/\b(no|no gracias|despues|mÃ¡s tarde|mas tarde)\b/.test(q)){
      await update(ref(db,'tomauno/chats/'+chatId), {humanRequested:false, prioridad:false, updatedAt:Date.now()});
      return 'Perfecto, seguimos por acÃ¡ ðŸ˜Š Decime si querÃ©s ver cursos, servicios, ubicaciÃ³n o contacto.';
    }
    if(/(mostra|mostrar|ver|quiero|pasame|pasar|info|informacion).*(servicio|sesion|sesiones|book|foto|fotos)/.test(q) || /\bservicios\b/.test(q)){
      return 'Claro ðŸ˜Š Te dejo la secciÃ³n de servicios para que veas las opciones disponibles. #servicios#';
    }
    if(/(mostra|mostrar|ver|quiero|pasame|pasar|info|informacion).*(curso|cursos|capacitacion|capacitaciones|workshop|taller)/.test(q) || /\bcursos\b/.test(q)){
      return 'Claro ðŸ˜Š Te dejo la secciÃ³n de cursos disponibles. #cursos#';
    }
    if(/(ubicacion|ubicaciÃ³n|direccion|direcciÃ³n|donde queda|mapa)/.test(q)){
      return 'ðŸ“ Estamos en Pedro MÃ©ndez 2069, Posadas, Misiones. #ubicacion#';
    }
    return __manejarDatosHUMsPendientes_v3319.apply(this, arguments);
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
    if(firstUser) resumenConversacion.push('â€¢ Consulta inicial: ' + firstUser.replace(/\s+/g,' ').slice(0,180));
    if(lastUser && lastUser !== firstUser) resumenConversacion.push('â€¢ Ãšltimo mensaje del usuario: ' + lastUser.replace(/\s+/g,' ').slice(0,180));
    if(c.humanRequested) resumenConversacion.push('â€¢ Estado: requiere respuesta personal de Javier.');
    if(!resumenConversacion.length) resumenConversacion.push('â€¢ Sin mensajes relevantes todavÃ­a.');
    const resumen = [
      'ðŸ“Œ *Consulta web Tomauno*','',
      'ðŸ‘¤ *Nombre:* ' + chatVisibleName(c,id),
      'ðŸ“± *WhatsApp:* ' + (c.wp || '-'),
      'ðŸ•’ *Ãšltima actividad:* ' + (chatFullDate(c.updatedAt || c.createdAt) || '-'),
      'ðŸŽ¯ *InterÃ©s detectado:* ' + (tema || '-'),
      'ðŸ’¬ *Resumen:*',
      resumenConversacion.join('\n')
    ].join('\n');
    copiarTextoChat(resumen);
    toast('ðŸ“‹ Resumen breve copiado', true);
    const wp = String(c.wp||'').replace(/\D/g,'');
    if(wp){
      showConfirm('Resumen copiado. Â¿Abrir WhatsApp del contacto?', () => window.open('https://wa.me/549'+wp+'?text='+encodeURIComponent(resumen), '_blank'));
    }
  };

  // 6) Asegurar que el botÃ³n Resumen exista aunque el chat se re-renderice.
  function ensureResumenBtnV3319(){
    const id = currentOpenChatId || '';
    const actions = document.querySelector('#chat-popover.open .chat-admin-actions');
    if(!actions || !id || actions.querySelector('[data-action="resumen-wa"]')) return;
    const btn = document.createElement('button');
    btn.className = 'btn-out'; btn.type = 'button'; btn.title = 'Resumen para WhatsApp'; btn.dataset.action = 'resumen-wa';
    btn.innerHTML = '<span class="ico">ðŸ§¾</span>';
    btn.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); window.generarResumenWhatsAppChat(id); };
    actions.insertBefore(btn, actions.children[2] || actions.firstChild);
  }
  setInterval(ensureResumenBtnV3319, 1200);
  setTimeout(ensureResumenBtnV3319, 200);
})();



/* =====================================================================
   v33.20 â€” Ajuste fino conversaciÃ³n + notificaciones + resumen Ãºtil.
   - No toca Firebase/imports.
   - Corrige atenciÃ³n humana invasiva, saludos, nombre inmediato,
     resumen WA, notificaciones por ventana de atenciÃ³n y toolbar fullscreen.
   ===================================================================== */
(function(){
  const TEN_MIN = 10 * 60 * 1000;
  const nowTs = () => Date.now();

  function qnorm(t){ try{return normAI(t||'');}catch(e){return String(t||'').toLowerCase();} }
  function isSimpleGreetingV3320(text){
    const q = qnorm(text).replace(/[!.Â¡Â¿?]+/g,'').trim();
    return /^(hola|buen dia|buen dÃ­a|buenas|buenas tardes|buenas noches|hey|holaa|hola buenas|hola buen dia|hola buen dÃ­a)$/.test(q);
  }
  function saludoRespuestaV3320(text, chat){
    const q = qnorm(text);
    let saludo = 'Hola';
    if(/buenas noches/.test(q)) saludo = 'Buenas noches';
    else if(/buenas tardes/.test(q)) saludo = 'Buenas tardes';
    else if(/buen dia|buen dÃ­a/.test(q)) saludo = 'Buen dÃ­a';
    const n = chat && tieneNombreRealChat(chat) ? chatVisibleName(chat, currentOpenChatId || '') : '';
    return saludo + (n ? ', ' + n : '') + ' ðŸ˜Š Â¿En quÃ© puedo ayudarte?';
  }
  function wantsOwnerHumanV3320(text){
    const q = qnorm(text);
    return /(hablar|comunicarme|contactarme|contactar|escribir|consultar).{0,35}(javier|dueÃ±o|dueno|encargado|responsable de tomauno|humano|persona)/.test(q) ||
           /(javier|dueÃ±o|dueno|encargado).{0,35}(hablar|contact|comunicar|responder)/.test(q);
  }
  function wantsSpecificTeacherContactV3320(text){
    const q = qnorm(text);
    return /(contact|hablar|comunicar|escribir|whatsapp|telefono|telÃ©fono|numero|nÃºmero).{0,45}(profesor|profesora|profe|docente|disertante|organizador|responsable)/.test(q) ||
           /(profesor|profesora|profe|docente|disertante|organizador|responsable).{0,45}(contact|whatsapp|telefono|telÃ©fono|numero|nÃºmero|hablar|comunicar)/.test(q);
  }
  function cleanInvasiveHumanTextV3320(resp, userText){
    if(wantsOwnerHumanV3320(userText)) return resp;
    let r = String(resp||'');
    // Si alguna respuesta vieja insiste en marcar para Javier sin que lo pidan,
    // no la mostramos: la reemplazamos por una guÃ­a neutral.
    if(/(voy dejando|dejo tu consulta|consulta marcada|marcada para Javier|Javier pueda responderte|dejame tu WhatsApp)/i.test(r)){
      return 'Puedo ayudarte con cursos, servicios, eventos, ubicaciÃ³n, Instagram y WhatsApp ðŸ˜Š\n\nDecime quÃ© querÃ©s ver y te paso la informaciÃ³n mÃ¡s directa.';
    }
    return r;
  }

  // Contacto humano SOLO por intenciÃ³n explÃ­cita de hablar con Javier/dueÃ±o/encargado.
  quiereHablarConJavierAI = function(text){ return wantsOwnerHumanV3320(text); };

  const __respuestaAtencionHumana_v3320 = respuestaAtencionHumanaAI;
  respuestaAtencionHumanaAI = function(chat, userText){
    if(!wantsOwnerHumanV3320(userText)) return cleanInvasiveHumanTextV3320(__respuestaAtencionHumana_v3320(chat,userText), userText);
    const tema = temaDesdeHistorialAI(chat, userText) || chat?.temaPrincipal || detectarTemaConsulta(userText) || '';
    const faltaNombre = !tieneNombreRealChat(chat);
    const faltaWp = !tieneWhatsAppChat(chat);
    let txt = 'Claro ðŸ˜Š Â¿QuerÃ©s que deje tu consulta marcada para que Javier te responda personalmente?';
    if(tema) txt += '\n\nTema detectado: **' + tema + '**.';
    const faltan = [];
    if(faltaNombre) faltan.push('tu nombre');
    if(faltaWp) faltan.push('tu WhatsApp');
    if(faltan.length) txt += '\n\nSi respondÃ©s **SÃ­**, tambiÃ©n dejame ' + faltan.join(' y ') + ' para que pueda ubicar tu consulta.';
    txt += '\n\nPodÃ©s responder: **SÃ­** o **No**.';
    return txt;
  };

  // Reemplazo controlado del automÃ¡tico: evita â€œJavierâ€ salvo pedido explÃ­cito,
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
          respuesta = 'Claro ðŸ˜Š Â¿De quÃ© curso, taller, evento o servicio querÃ©s el contacto?\n\nAsÃ­ te paso el dato correcto y no te mareo con informaciÃ³n que no corresponde.';
        }
      } else if(wantsOwnerHumanV3320(userText)){
        respuesta = respuestaAtencionHumanaAI(chat, userText);
        await update(ref(db,'tomauno/chats/'+chatId), {
          updatedAt:nowTs(), status:'abierto-auto', humanRequested:true, prioridad:true,
          temaPrincipal: temaDesdeHistorialAI(chat, userText) || detectarTemaConsulta(userText)
        });
      } else {
        const lastAuto = chatMsgs(chat).slice().reverse().find(([,m]) => m && m.from === 'admin' && m.auto);
        // Si la Ãºltima pregunta del asistente fue â€œSÃ­/Noâ€ para Javier y dice No, cancelamos.
        if(lastAuto && /consulta marcada para que Javier|responder: \*\*SÃ­\*\* o \*\*No\*\*/i.test(String(lastAuto[1].text||'')) && /^(no|no gracias|por ahora no)$/i.test(q)){
          await update(ref(db,'tomauno/chats/'+chatId), {humanRequested:false, prioridad:false, updatedAt:nowTs()});
          respuesta = 'Perfecto ðŸ˜Š Seguimos por acÃ¡. Decime si querÃ©s ver cursos, servicios, ubicaciÃ³n o contacto.';
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
        respuesta = 'Claro ðŸ˜Š Te lo vuelvo a orientar mejor. Â¿QuerÃ©s que te muestre cursos, servicios, ubicaciÃ³n o contacto? TambiÃ©n podÃ©s contarme puntualmente quÃ© necesitÃ¡s y te ayudo.';
      }
      if(qnorm(chat.lastAutoUserText || '') === q && (nowTs() - Number(chat.lastAutoAt || 0)) < 10000) return;

      const typingRef = await push(ref(db,'tomauno/chats/'+chatId+'/messages'), {from:'system', text:'Tomauno estÃ¡ escribiendo', time:chatTime(), createdAt:nowTs(), typing:true});
      await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:nowTs(), lastMsg:'Tomauno estÃ¡ escribiendo...', status:'abierto'});
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
    }catch(e){ console.error('Asistente automÃ¡tico v33.20:', e); }
  };

  // Nombre instantÃ¡neo: si dice â€œme llamo / mi nombre es / soyâ€, cambia local + Firebase + tÃ­tulo inmediatamente.
  function capNameV3320(n){ return String(n||'').trim().replace(/\s+/g,' ').split(' ').filter(Boolean).map(p=>p.charAt(0).toUpperCase()+p.slice(1).toLowerCase()).join(' '); }
  function detectNameAnyV3320(text){
    const raw = String(text||'').trim().replace(/[.!?]+$/,'');
    if(!raw || extraerWhatsappAI(raw)) return '';
    const m = raw.match(/^(?:hola[,\s]*)?(?:mi\s+nombre\s+es|me\s+llamo|soy|me\s+dicen|nombre\s+es)\s+([a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+(?:\s+[a-zÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+){0,3})(?=\s*(?:,|\.|y\b|$))/i);
    if(!m) return '';
    const n = capNameV3320(limpiarNombreChat(m[1]));
    if(!n || n.length < 2 || /^(Si|SÃ­|Ok|Dale|Bueno|Perfecto|Claro|Gracias|Quiero|Consulta|Web|Whatsapp|Telefono|Javier)$/i.test(n)) return '';
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

    // ActualizaciÃ³n local inmediata para que el tÃ­tulo no espere a cerrar/reabrir.
    try{
      chatsDB[id] = Object.assign({}, existingChat, {name: finalName, updatedAt:nowTs(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:nowTs()});
      if(currentOpenChatId === id){
        const t = document.querySelector('#chat-popover .chat-title');
        if(t) t.textContent = finalName.toUpperCase();
        const sub = document.querySelector('#chat-popover .chat-subline');
        if(sub) sub.innerHTML = 'WhatsApp: '+(chatsDB[id].wp || 'â€”')+' Â· En lÃ­nea ahora';
      }
    }catch(e){}

    await update(ref(db,'tomauno/chats/'+id), {name: finalName, status:'abierto', updatedAt:nowTs(), lastMsg:text, unreadAdmin:true, userOnline:true, userLastSeen:nowTs()});
    await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'user', text, time:chatTime(), createdAt:nowTs()});
    try{ if(detectedName) sessionStorage.setItem('tomauno-chat-name', detectedName); }catch(e){}

    let queryForBot = text;
    if(detectedName){
      await push(ref(db,'tomauno/chats/'+id+'/messages'), {from:'admin', text:'Genial, '+detectedName+' ðŸ˜Š Ya agendÃ© tu nombre.', time:chatTime(), createdAt:nowTs(), auto:true});
      await update(ref(db,'tomauno/chats/'+id), {name:detectedName, lastMsg:'Nombre agendado: '+detectedName, unreadVisitor:true, updatedAt:nowTs()});
      queryForBot = stripNameFromMessageForAI(text, detectedName);
      if(!queryForBot || esSoloRespuestaNombre(text, existingChat)) return;
    }
    responderAutomaticoChat(id, queryForBot);
  };

  // Notificaciones: no avisar cada mensaje del chat activo; sÃ­ avisar otro chat o mismo chat tras 10 min.
  const __notifyAdminChat_v3320 = notifyAdminChat;
  const lastNotifyByChat = {};
  notifyAdminChat = function(title, body, chatId){
    const humanNotice = /humana|Javier|llamada|atenci/i.test(String(title||'') + ' ' + String(body||''));
    const pop = document.getElementById('chat-popover');
    const isOpen = !!(pop && pop.classList.contains('open'));
    const sameActive = isOpen && chatId && currentOpenChatId === chatId;
    const last = Number(lastNotifyByChat[chatId || '_global'] || 0);
    const quiet = !humanNotice && (sameActive || (chatId && (nowTs() - last < TEN_MIN)));
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
    // Si el mensaje viene de otro chat, avisar aunque estÃ©s en una conversaciÃ³n.
    if(closed || currentOpenChatId !== top.id || (nowTs()-Number(lastNotifyByChat[top.id]||0) > TEN_MIN)){
      {
        const u = tomaunoUltimoMensajeUsuarioChat(top.c);
        if(u && u.text) notifyAdminChat('Nuevo mensaje web', chatVisibleName(top.c,top.id)+': '+u.text, top.id);
      }
    }
  });

  // Resumen Ãºtil: tema + 3 primeros y 3 Ãºltimos mensajes del usuario.
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
    if(first.length){ lines.push('â€¢ Primeros mensajes:'); first.forEach(x=>lines.push('  - '+x.slice(0,190))); }
    if(last.length){ lines.push('â€¢ Ãšltimos mensajes:'); last.forEach(x=>lines.push('  - '+x.slice(0,190))); }
    if(c.humanRequested) lines.push('â€¢ Estado: requiere respuesta personal.');
    if(!lines.length) lines.push('â€¢ Sin mensajes relevantes todavÃ­a.');
    const resumen = [
      'ðŸ“Œ *Consulta web Tomauno*','',
      'ðŸ‘¤ *Nombre:* ' + chatVisibleName(c,id),
      'ðŸ“± *WhatsApp:* ' + (c.wp || '-'),
      'ðŸ•’ *Ãšltima actividad:* ' + (chatFullDate(c.updatedAt || c.createdAt) || '-'),
      'ðŸŽ¯ *Tema detectado:* ' + (tema || '-'),
      'ðŸ’¬ *Resumen:*', lines.join('\n')
    ].join('\n');
    copiarTextoChat(resumen);
    toast('ðŸ§¾ Resumen copiado para WhatsApp', true);
    const wp = String(c.wp||'').replace(/\D/g,'');
    if(wp){ showConfirm('Resumen copiado. Â¿Abrir WhatsApp del contacto?', () => window.open('https://wa.me/549'+wp+'?text='+encodeURIComponent(resumen), '_blank')); }
  };

  // BotÃ³n resumen con icono distinto y siempre visible.
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
    btn.innerHTML = '<span class="ico">ðŸ§¾</span>';
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


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PATCH V35 â€” chat estable mobile + bandeja limpia
   - No mueve la web automÃ¡ticamente en celular mientras el chat estÃ¡ abierto.
   - Corrige X de cierre visible y elimina doble punto rojo.
   - Deja botones de acciones limpios, visibles y desplegables.
   - Reduce refrescos/saltos del chat al escribir.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
(function(){
  const V35 = 'v35-chat-estable-mobile';
  window.TOMAUNO_PATCH_VERSION = V35;

  const isMobile35 = () => !!(window.matchMedia && window.matchMedia('(max-width:700px)').matches);
  const chatOpen35 = () => !!document.querySelector('#chat-popover.open');
  const root35 = document.documentElement;

  const css35 = document.createElement('style');
  css35.textContent = `
    :root{--chat-vvh:100dvh;}

    /* X de cierre: cÃ­rculo + letra siempre visible */
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

    /* Mobile: chat fijo, sin temblor ni scroll de pÃ¡gina */
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

  // En celular no se mueve la web automÃ¡ticamente mientras el chat estÃ¡ abierto.
  // Solo dejamos navegar cuando el usuario toca explÃ­citamente un botÃ³n de acciÃ³n.
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
      b.textContent = collapsed ? 'â–´' : 'â–¾';
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

  // Evita que al enfocar el input el navegador intente centrar toda la pÃ¡gina.
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


/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PATCH V36 â€” bandeja en vivo + herramientas sin scroll + chat sin saltos
   - Los usuarios nuevos/nombres editados se refrescan en la bandeja sin cerrar/abrir.
   - Luces: verde online, gris offline, titilando solo si hay mensajes no leÃ­dos.
   - En pantalla completa las acciones se integran en la primera lÃ­nea y no quedan tapadas.
   - En mobile no se fuerza autoscroll mientras el usuario escribe o lee.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
(function(){
  window.TOMAUNO_PATCH_VERSION = 'v36-bandeja-viva-chat-fijo';
  const isMobile36 = () => !!(window.matchMedia && window.matchMedia('(max-width:700px)').matches);
  const isChatOpen36 = () => !!document.querySelector('#chat-popover.open');
  const isAdminChatOpen36 = () => isChatOpen36() && !!document.querySelector('.chat-inbox-side,.chat-list-item,#chat-admin-text');

  const css36 = document.createElement('style');
  css36.textContent = `
    /* Bandeja: una sola luz, semÃ¡ntica clara */
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

    /* Pantalla completa: mÃ¡s alto para mensajes, herramientas dentro del layout */
    html body .chat-popover.open.expanded .chat-panel{display:grid!important;grid-template-rows:minmax(0,1fr) auto auto!important;gap:8px!important;}
    html body .chat-popover.open.expanded .chat-msgs{grid-row:1!important;min-height:0!important;overflow-y:auto!important;scroll-behavior:auto!important;}
    html body .chat-popover.open.expanded .chat-row{grid-row:2!important;}
    html body .chat-popover.open.expanded .chat-admin-tools{grid-row:3!important;}

    /* En mobile, cero temblor: el chat ocupa el viewport real y no mueve la pÃ¡gina */
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
    // Si estamos dentro de una conversaciÃ³n, refrescamos solo la bandeja lateral para no mover mensajes ni input.
    const side = pop.querySelector('.chat-inbox-side');
    if(side && typeof adminChatTabsHtml === 'function'){
      const html = adminChatTabsHtml(currentOpenChatId || '');
      if(html && side.outerHTML !== html) side.outerHTML = html;
      mergeAdminTools36();
      return;
    }
    // Si estÃ¡ abierta la pantalla de listado de chats, se regenera para que entren usuarios nuevos/nombres cambiados.
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

  // DespuÃ©s de cualquier render de chat admin, fusiona herramientas y refresca sidebar sin tocar mensajes.
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

  // Toggle real: mantiene visibles los botones de control y esconde solo rÃ¡pidas/acciones.
  const __toggleChatTools36 = window.toggleChatTools;
  window.toggleChatTools = function(){
    const pop = document.getElementById('chat-popover');
    if(pop){
      chatToolsCollapsed = !pop.classList.contains('chat-tools-collapsed');
      pop.classList.toggle('chat-tools-collapsed', chatToolsCollapsed);
      try{ localStorage.setItem('tomauno-chat-tools-collapsed', chatToolsCollapsed ? '1':'0'); }catch(e){}
      const b = document.getElementById('chat-tools-toggle');
      if(b){ b.textContent = chatToolsCollapsed ? 'â–´':'â–¾'; b.title = chatToolsCollapsed ? 'Mostrar botones':'Ocultar botones'; }
      mergeAdminTools36();
      return;
    }
    if(typeof __toggleChatTools36 === 'function') return __toggleChatTools36.apply(this, arguments);
  };

  // Scroll estable: si el usuario escribe o estÃ¡ leyendo arriba, no lo arrastramos al final.
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
   v52 â€” AtenciÃ³n humana con espera real + acceso rÃ¡pido admin logueado.
   Parche dentro del mÃ³dulo para poder usar Firebase sin tocar imports.
   ===================================================================== */
(function(){
  const HUMAN_FALLBACK_MS = 60000;
  const humanTimers52 = Object.create(null);

  function humanWanted52(text){
    const q = (typeof normAI === 'function' ? normAI(text||'') : String(text||'').toLowerCase());
    return /(hablar|comunicarme|contactarme|contactar|escribir|consultar|atender|atencion|atenciÃ³n).{0,45}(javier|dueÃ±o|dueno|encargado|responsable|humano|persona)/.test(q) ||
           /(javier|dueÃ±o|dueno|encargado|responsable).{0,45}(hablar|contact|comunicar|responder|atender)/.test(q);
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
    return (n ? 'Gracias, '+n+'.\n' : '') + 'AguardÃ¡ un momento por favor, voy a intentar avisarle a Javier para que te responda por acÃ¡ ðŸ˜Š';
  }
  function humanAskNameText52(){
    return 'SÃ­, con gusto ðŸ˜Š\nPuedo intentar avisarle a Javier para que te responda por acÃ¡.\n\nÂ¿CÃ³mo es tu nombre?';
  }
  function humanFallbackText52(){
    const url = 'https://wa.me/5493764354522?text=' + encodeURIComponent('Hola Javier, vengo de la web Tomauno y quiero continuar mi consulta.');
    return 'En este momento Javier puede estar ocupado.\n\nTe dejo el WhatsApp directo para que puedas escribirle: ' + url + '\n\nðŸ“± Dejame tu nÃºmero de WhatsApp y el mensaje para Javier. Muy pronto se comunicarÃ¡ con vos.';
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
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(c,chatId)||'Visitante')+': sigue esperando a Javier despuÃ©s de 60 segundos'); }catch(e){}
        try{ notifyAdminChat && notifyAdminChat('AtenciÃ³n humana pendiente', (chatVisibleName(c,chatId)||'Visitante')+': sigue esperando a Javier', chatId); }catch(e){}
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
        try{ notifyAdminChat('AtenciÃ³n humana solicitada', chatVisibleName(chat,chatId)+': quiere hablar con Javier', chatId); }catch(e){}
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

      // Si ya se derivÃ³ a Javier y el usuario acepta dejar una consulta,
      // no buscamos en Cerebro: pedimos consulta + WhatsApp.
      if(chat && chat.humanRequested && chat.humanFallbackSent && !chat.awaitingHumanName){
        const hasPhone = /(?:\+?54)?\s*(?:9\s*)?(?:\d[\s\-\.]*){8,}/.test(String(userText||''));
        const thanksText = hasPhone
          ? 'Gracias ðŸ˜Š Ya quedÃ³ registrada tu consulta para Javier. Apenas pueda la revisa y te responde.'
          : 'Gracias ðŸ˜Š Ya dejÃ© registrada tu consulta para Javier. Si querÃ©s, pasame tambiÃ©n tu WhatsApp para que pueda responderte mÃ¡s fÃ¡cil.';
        await pushBot52(chatId, thanksText, {humanCollectAck:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'â­ Consulta para Javier recibida', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, awaitingHumanContact:!hasPhone});
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': dejÃ³ una consulta para Javier'); }catch(e){}
        return;
      }
      if(chat && chat.humanRequested && !chat.awaitingHumanName){
        const qLeave = (typeof normAI === 'function' ? normAI(userText||'') : String(userText||'').toLowerCase());
        const wantsLeave = /(quiero|quisiera|puedo|voy a|dejo|dejar|mandar|enviar|hacer|hacerles|hacerte).{0,40}(consulta|mensaje|pregunta|dato|datos)/.test(qLeave) || /(dejar|dejo).{0,30}(consulta|mensaje)/.test(qLeave);
        if(wantsLeave){
          const askText = 'Perfecto ðŸ˜Š\nContame cuÃ¡l es tu consulta y pasame tu WhatsApp para que Javier pueda responderte apenas la revise.';
          await pushBot52(chatId, askText, {humanCollect:true});
          await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Consulta pendiente para Javier', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, awaitingHumanContact:true});
          try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': quiere dejar una consulta'); }catch(e){}
          return;
        }
      }

      // Si estÃ¡bamos esperando la consulta/datos para Javier, no disparamos respuestas de Cerebro.
      if(chat && chat.humanRequested && chat.awaitingHumanContact){
        const hasPhone = /(?:\+?54)?\s*(?:9\s*)?(?:\d[\s\-\.]*){8,}/.test(String(userText||''));
        const thanksText = hasPhone
          ? 'Gracias ðŸ˜Š Ya quedÃ³ registrada tu consulta para Javier. Apenas pueda la revisa y te responde.'
          : 'Gracias ðŸ˜Š Ya dejÃ© registrada tu consulta. Si querÃ©s, pasame tambiÃ©n tu WhatsApp para que Javier pueda responderte mÃ¡s fÃ¡cil.';
        await pushBot52(chatId, thanksText, {humanCollectAck:true});
        await update(ref(db,'tomauno/chats/'+chatId), {updatedAt:Date.now(), lastMsg:'Consulta para Javier recibida', unreadVisitor:true, unreadAdmin:true, humanRequested:true, prioridad:true, awaitingHumanContact:!hasPhone});
        try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, (chatVisibleName(chat,chatId)||'Visitante')+': dejÃ³ una consulta para Javier'); }catch(e){}
        return;
      }

      // Si ya pidiÃ³ Javier y faltaba nombre, una respuesta tipo â€œSofÃ­aâ€ inicia la espera.
      if(chat && chat.humanRequested && chat.awaitingHumanName){
        const possible = (typeof extraerNombreAI === 'function' ? extraerNombreAI(userText) : '') || (typeof isJustNameReply === 'function' ? isJustNameReply(userText, chat) : '');
        const n = typeof limpiarNombreChat === 'function' ? limpiarNombreChat(possible) : String(possible||'').trim();
        if(n && n.length >= 2){
          const started = Date.now();
          const newChat = Object.assign({}, chat, {name:n});
          await update(ref(db,'tomauno/chats/'+chatId), {name:n, awaitingHumanName:false, humanWaitStartedAt:started, humanFallbackSent:false, humanRequested:true, prioridad:true, unreadAdmin:true, updatedAt:started});
          await pushBot52(chatId, humanWaitText52(newChat,chatId), {humanWait:true});
          try{ notifyAdminChat('AtenciÃ³n humana solicitada', n+': espera a Javier', chatId); }catch(e){}
          try{ window.tomaunoHumanAlarm && window.tomaunoHumanAlarm(chatId, n+': espera a Javier'); }catch(e){}
          scheduleFallback52(chatId, started);
          return;
        }
      }
    }catch(e){ console.warn('AtenciÃ³n humana v52 previa:', e); }
    return responderPrev52.apply(this, arguments);
  };

  // Acceso rÃ¡pido al panel admin: solo si ya estÃ¡ logueado/recordado.
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
    toast('Primero ingresÃ¡ con PIN');
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
   v89 â€” Seguridad chat visitante + mobile sin temblores.
   - Usuario comÃºn nunca ve bandeja/tabs admin.
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
      document.querySelectorAll('#tomauno-version-tag,.tomauno-version-tag').forEach(tag=>tag.remove());
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
    return '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>'+
      '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">'+
      '<div class="chat-bubble admin"><div>Soy el asistente de Tomauno ðŸ˜Š<br/><b>Â¿CÃ³mo es tu nombre?</b></div><div class="chat-meta">Ahora</div></div>'+
      '</div><div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">âžœ</button></div></div>';
  }
  function visitorChatHtml89(id){
    try{
      const chat = chatsDB[id] || {};
      const inputVal = document.getElementById('chat-text')?.value || '';
      const msgs = renderMsgs(chat, false, id);
      return '<div class="chat-head"><div class="chat-avatar">ðŸ’¬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">'+escHtml(chatVisibleName(chat,id))+' Â· '+(isAdminOnline()?'ðŸŸ¢ Admin en lÃ­nea':'âš« Admin fuera de lÃ­nea')+'</div></div></div>'+
        '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs">'+(msgs || '<div class="chat-bubble admin">Hola '+escHtml(chat.name||'')+' ðŸ‘‹ Â¿En quÃ© puedo ayudarte?</div>')+
        ''+
        '</div><div class="chat-row"><input class="finput" id="chat-text" placeholder="EscribÃ­ tu mensaje..." value="'+escAttr(inputVal)+'" onkeydown="if(event.key===\'Enter\')window.enviarChatVisitante(\''+id+'\')"/><button class="chat-send" onclick="window.enviarChatVisitante(\''+id+'\')">âžœ</button></div></div>';
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
    btn.textContent = human ? 'ðŸ‘¤ HUM' : 'ðŸ¤– AUTO';
    btn.title = human ? 'Este chat estÃ¡ en atenciÃ³n humana. Clic para volver a automÃ¡tico.' : 'Este chat estÃ¡ en automÃ¡tico. Clic para tomarlo manualmente.';
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
    if(/[?Â¿!Â¡@#:/\\0-9]/.test(raw)) return false;
    if(/\b(info|curso|cursos|precio|precios|manualidades|quiero|consulta|consultar|hola|buenas|turno|inscribir|inscripcion|whatsapp|telefono|donde|ubicacion|servicio|servicios)\b/i.test(raw)) return false;
    return /^[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+(?:\s+[A-Za-zÃÃ‰ÃÃ“ÃšÃ‘ÃœÃ¡Ã©Ã­Ã³ÃºÃ±Ã¼]+){0,2}$/.test(raw);
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
    if(!raw || /[?Ã‚Â¿!Ã‚Â¡@#:/\\0-9]/.test(raw)) return '';
    if(/\b(info|curso|cursos|precio|precios|manualidades|quiero|consulta|consultar|contacto|javier|servicio|servicios|ubicacion|telefono|whatsapp|donde|cuando|cuanto|pasas|tenes|hola|buenas)\b/i.test(raw)) return '';
    const explicit = /^(soy|me llamo|mi nombre es|nombre es)\s+/i.test(raw);
    const asked = lastAdminAskedName(chat);
    if(!explicit && !asked) return '';
    const n = isJustNameReply(text, chat);
    return looksLikeRealNameFinal(n) ? limpiarNombreChat(n) : '';
  }
  function activityItemsFinal(){
    const arr = [];
    try{ Object.entries(cursos || {}).forEach(([id,c]) => { if(!c.oculto && !c.finalizado) arr.push({type:'curso', id, obj:c, title:c.titulo||'', extra:[c.desc,c.profesor,c.disertante,c.organizador,c.docente,c.responsable,c.nombreOrg,c.ig,c.wp].join(' ')}); }); }catch(e){}
    try{ Object.entries(eventosDB || {}).forEach(([id,e]) => { if(e.estado === 'activo' && !e.oculto) arr.push({type:'evento', id, obj:e, title:e.titulo||'', extra:[e.desc,e.nombreOrg,e.organizador,e.ig,e.wpOrg,e.lugar].join(' ')}); }); }catch(e){}
    try{ Object.entries(serviciosDB || {}).forEach(([id,s]) => { if(!s.oculto) arr.push({type:'servicio', id, obj:s, title:s.titulo||'', extra:[s.desc,s.profesor,s.disertante,s.organizador,s.responsable,s.ig,s.wp].join(' ')}); }); }catch(e){}
    return arr;
  }
  function bestActivityByTitleFinal(text){
    const q = normAI(text || '');
    const stop = new Set(['quien','quiÃ©n','es','el','la','los','las','del','de','curso','taller','evento','servicio','profesor','profesora','profe','docente','disertante','organizador','organiza','responsable','dueÃ±o','dueno','academia','tomauno','nivel','principiante']);
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
        (who ? 'ðŸ‘¤ Profesor/organizador: ' + who + '\n' : '') +
        (wp ? 'ðŸ’¬ Contacto: https://wa.me/549' + String(wp).replace(/\D/g,'') : '');
    }
    return 'Para **' + (item.title || 'esa actividad') + '** no tengo cargado todavÃ­a el profesor u organizador. Puedo dejar tu consulta marcada para Javier.';
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
      html body #chat-popover.open .chat-inbox-list{
        max-height:calc(100vh - 190px)!important;
        overflow-y:auto!important;
        overscroll-behavior:contain!important;
        padding-right:4px!important;
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
    if(sub) sub.textContent = human ? 'Javier estÃ¡ respondiendo' : 'Asistente Tomauno';
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
      text:'Hola ðŸ˜Š\nÂ¿CÃ³mo es tu nombre?',
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
      text:'Hola '+name+' ðŸ˜Š Â¿En quÃ© puedo ayudarte?',
      time:chatTime(),
      createdAt:Date.now(),
      auto:true
    });
    abrirChatVisitante(currentVisitorChatId, true);
    [40, 160, 420].forEach(ms => setTimeout(() => {
      const txt = document.getElementById('chat-text');
      const nam = document.getElementById('chat-name');
      if(txt){
        txt.value = '';
        try{ txt.focus({preventScroll:true}); txt.setSelectionRange(0,0); }catch(e){ try{ txt.focus(); }catch(_e){} }
      }
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
      x.textContent = 'Ã—';
      x.title = 'Cerrar notificaciÃ³n';
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
    const c = chatId && chatsDB ? chatsDB[chatId] : null;
    const lastUser = c ? tomaunoUltimoMensajeUsuarioChat(c) : null;
    const isHumanNotice = /humana|Javier|LLAMADA/i.test(String(title||'') + ' ' + String(body||''));
    if(!isHumanNotice && (!lastUser || !lastUser.text)) return;
    if(!isHumanNotice && c) body = chatVisibleName(c, chatId) + ': ' + lastUser.text;

    if(!adminActiveFinal()) return;
    if(!isHumanNotice && adminViewingChatFinal(chatId)) return;
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
    try{ notifyAdminChat('AtenciÃ³n humana solicitada', body || 'Hay una persona esperando a Javier', chatId); }catch(e){}
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
        pendingHuman:false,
        waitingWhatsapp:false,
        waitingHumanContact:false,
        pendingHumanContact:false,
        unreadAdmin:false
      }).catch(()=>{});
      await update(ref(db,'tomauno/asistente'), {modo:'automatico'}).catch(()=>{});
      try{ Object.assign(chatsDB[chatId] || {}, {humanMode:false, manualUntil:0, waitingHuman:false, humanRequested:false, unreadAdmin:false}); }catch(e){}
      toast('ðŸ¤– Este chat vuelve a automÃ¡tico', true);
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
      toast('ðŸ‘¤ Este chat queda en humano', true);
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
    if(/(quien|quiÃ©n|profesor|profesora|profe|docente|disertante|organizador|organiza|responsable).{0,80}(curso|taller|evento|servicio|fotograf|danzaterapia|danza)|((curso|taller|evento|servicio|fotograf|danzaterapia|danza).{0,80}(quien|quiÃ©n|profesor|profesora|profe|docente|disertante|organizador|organiza|responsable))/.test(q)){
      const item = bestActivityByTitleFinal(text);
      if(item) return activityProfessorAnswerFinal(item);
    }
    if(/(quien|quiÃ©n).{0,30}(dueno|dueÃ±o|javier|fundador|director)|((dueno|dueÃ±o|javier|fundador|director).{0,30}(tomauno|academia|estudio))/.test(q)){
      try{
        const matches = knowledgeMatchesAI(q);
        const good = matches.find(m => /javier|dueÃ±|duen|fundador|director|tomauno/i.test([m.k.titulo||'',m.k.keys||'',m.k.command||''].join(' ')));
        if(good && good.k && good.k.respuesta) return good.k.respuesta;
      }catch(e){}
      return 'Tomauno estÃ¡ dirigido por Javier. Si querÃ©s, tambiÃ©n puedo pasarte su contacto directo.';
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


// â”€â”€ TOMAUNO v24 HOTFIX FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Objetivo: primer envÃ­o estable, maximizar sin temblores, limpiar duplicados
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

  // Captura clicks de botones de maximizar si existen con clases/tÃ­tulos comunes.
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

  // Si el usuario estÃ¡ escribiendo, nadie debe forzar scroll arriba/abajo.
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


// â”€â”€ TOMAUNO v25 HOTFIX FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Sonido primer mensaje, estados visuales, typing visible, fullscreen admin centrado,
// y botones rÃ¡pidos visitante. No reemplaza funciones core: actÃºa como capa segura.
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

        // Evita sonar por historial viejo al abrir la pÃ¡gina.
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

  // Sonido fuerte cuando el usuario pidiÃ³ humano.
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

  // Al abrir un chat admin se marca leÃ­do y apaga amarillo.
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

  // Si Javier responde manualmente, deja de ser rojo HUM pendiente.
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
            pendingHuman:false,
            waitingWhatsapp:false,
            waitingHumanContact:false,
            pendingHumanContact:false,
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
    // Estado visual resuelto desde abrirPanelChatsAdmin/adminChatTabsHtml.
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

      // Solo bajamos si el admin estÃ¡ en el fondo o casi en el fondo.
      const nearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 180;
      if(nearBottom) box.scrollTop = box.scrollHeight;
    });
  }

  // Botones rÃ¡pidos en visitante.
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
        quickButton('UbicaciÃ³n','UbicaciÃ³n') +
        quickButton('Quiero hablar con Javier','HUM');

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


// â”€â”€ TOMAUNO v26 HOTFIX FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ajustes: scroll visitante al recibir respuesta, chat mÃ¡s alto, botones compactos,
// bÃºsqueda profesor en cursos/eventos/servicios, sonido desbloqueable y mÃ¡s confiable.
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

  // â”€â”€ 1) SCROLL VISITANTE CUANDO RESPONDE ADM / IA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let lastVisitorScrollKey = '';
  function scrollVisitorBottom(force){
    safe(function(){
      if(isAdmin()) return;
      const box = msgBox();
      if(!box) return;
      const active = document.activeElement;
      const writing = active && (active.id === 'chat-text' || active.id === 'chat-name');
      // Si estÃ¡ escribiendo, solo bajamos si force=true o si ya estaba cerca del fondo.
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

  // Al tocar botones rÃ¡pidos, bajar tambiÃ©n.
  document.addEventListener('click', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.tu-quick-btn')){
      setTimeout(function(){ scrollVisitorBottom(true); }, 120);
      setTimeout(function(){ scrollVisitorBottom(true); }, 700);
    }
  }, true);

  // â”€â”€ 2) BOTONES VISITANTE MÃS COMPACTOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function compactQuickButtons(){
    safe(function(){
      if(isAdmin()) return;
      const wrap = document.querySelector('#chat-popover.open .tu-quick-actions');
      if(!wrap) return;
      const map = [
        ['Cursos activos', 'ðŸŽ“', 'Cursos'],
        ['Eventos activos', 'ðŸ“…', 'Eventos'],
        ['Servicios disponibles', 'ðŸ› ï¸', 'Servicios'],
        ['UbicaciÃ³n', 'ðŸ“', ''],
        ['Quiero hablar con Javier', 'ðŸ‘¤', '']
      ];
      wrap.innerHTML = map.map(function(x){
        return '<button type="button" class="tu-quick-btn tu-quick-compact" title="'+x[2]+'" data-tu-msg="'+x[0]+'"><span>'+x[1]+'</span>'+(x[2] ? '<em>'+x[2]+'</em>' : '')+'</button>';
      }).join('');
    });
  }

  // â”€â”€ 3) CHAT PC MÃS ALTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ 4) BUSCAR PROFESOR / ORGANIZADOR EN EVENTOS Y SERVICIOS SIN DECIR "CURSO" â”€â”€
  function normalize(s){
    try{ if(typeof normAI === 'function') return normAI(s); }catch(e){}
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9Ã±\s]/g,' ')
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
        if(!c || c.oculto || c.finalizado) return;
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
      if(/profesor|profesora|profe|docente|disertante|organizador|quien|quiÃ©n/.test(nq)) score += 6;
      if(/evento|casting|beauty|ciudad/.test(nq) && it.type === 'evento') score += 6;
      if(/servicio|book|portfolio|sesion|sesiones/.test(nq) && it.type === 'servicio') score += 5;
      if(!best || score > best.sc) best = Object.assign({}, it, {sc:score, titleHits:hits, extraHits:0});
    });

    return best && best.sc >= 10 ? best : null;
  };

  // Override puntual: si pregunta "quiÃ©n/profe/docente/organizador" intenta match global primero.
  const oldBuscarRespuestaAsistenteV26 = (typeof buscarRespuestaAsistente === 'function') ? buscarRespuestaAsistente : null;
  buscarRespuestaAsistente = function(text){
    const q = normalize(text);
    if(/(quien|quiÃ©n|profe|profesor|profesora|docente|disertante|organizador|organiza|quien da|quien dicta)/.test(q)){
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

  // â”€â”€ 5) SONIDO: DESBLOQUEO + FALLBACK MÃS FUERTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    safe(function(){ document.querySelectorAll('.tu-sound-unlock,.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-v34-sound-unlock').forEach(n=>n.remove()); });
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

  // Refuerzo: cuando entra notificaciÃ³n propia, sonar tambiÃ©n por funciÃ³n vieja.
  const oldNotifyV26 = window.notifyAdminChat;
  if(typeof oldNotifyV26 === 'function' && !oldNotifyV26.__tuV26Sound){
    const wrappedNotify = function(title, body, chatId){
      const r = oldNotifyV26.apply(this, arguments);
      safe(function(){
        if(isAdmin()) tuBeepV26(/humano|atencion|atenciÃ³n/i.test(String(title||'') + ' ' + String(body||'')) ? 'human' : 'normal');
      });
      return r;
    };
    wrappedNotify.__tuV26Sound = 1;
    window.notifyAdminChat = wrappedNotify;
    try{ notifyAdminChat = wrappedNotify; }catch(e){}
  }

  // Refuerzo por Firebase: suena ante Ãºltimo mensaje real de usuario reciente.
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


// â”€â”€ TOMAUNO v27 MOBILE UX + SCROLL FINAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// MÃ³vil: chat tipo app fullscreen, input siempre visible, quick actions compactas/ocultables,
// scroll al fondo para respuestas y typing, admin fullscreen centrado.
(function(){
  'use strict';

  function safe(fn){ try{return fn();}catch(e){ try{console.warn('tomauno v27:', e);}catch(_){} } }

  function isMobile(){
    return window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
  }

  function isAdmin(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok') === '1' ||
             localStorage.getItem('tomauno-admin-notify') === '1' ||
             !!document.querySelector('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools');
    }) || false;
  }

  function pop(){ return document.getElementById('chat-popover'); }
  function box(){ return document.querySelector('#chat-popover.open .chat-msgs'); }

  function forceBottom(extra){
    safe(function(){
      const b = box();
      if(!b) return;
      requestAnimationFrame(function(){
        b.scrollTop = b.scrollHeight + (extra || 220);
        setTimeout(function(){ b.scrollTop = b.scrollHeight + (extra || 220); }, 80);
        setTimeout(function(){ b.scrollTop = b.scrollHeight + (extra || 220); }, 260);
      });
    });
  }

  // 1) En mÃ³vil, al abrir chat visitante queda fullscreen y no como popup flotante.
  function applyMobileMode(){
    safe(function(){
      const p = pop();
      if(!p) return;
      const visitor = !isAdmin() && p.classList.contains('open');
      document.body.classList.toggle('tu-mobile-chat-open', visitor && isMobile());
      document.documentElement.classList.toggle('tu-mobile-chat-open', visitor && isMobile());
      if(visitor && isMobile()){
        p.classList.add('tu-mobile-fullscreen');
        p.classList.remove('expanded');
        forceBottom(260);
      }else{
        p.classList.remove('tu-mobile-fullscreen');
      }
    });
  }

  // 2) Si aparece respuesta nueva o cambia el Ãºltimo mensaje, bajar.
  let lastKey = '';
  function watchMessages(){
    safe(function(){
      const p = pop();
      if(!p || !p.classList.contains('open')) return;
      const bubbles = Array.from(p.querySelectorAll('.chat-bubble'));
      if(!bubbles.length) return;
      const last = bubbles[bubbles.length - 1];
      const key = (last.className || '') + '|' + (last.textContent || '').slice(-220);
      if(key !== lastKey){
        lastKey = key;
        // En visitante siempre baja; en admin solo si estÃ¡ cerca del fondo.
        if(!isAdmin()) forceBottom(280);
        else{
          const b = box();
          if(b && (b.scrollHeight - b.scrollTop - b.clientHeight) < 230) forceBottom(240);
        }
      }
    });
  }

  // 3) Mientras escribe en admin: que no quede tapado por Ãºltimo mensaje.
  function keepTypingVisible(){
    safe(function(){
      const p = pop();
      const b = box();
      if(!p || !b) return;

      const typing = p.querySelector('.tu-live-typing,.chat-typing-live,.typing-live,.chat-bubble.typing,[data-typing-live]');
      if(!typing) return;

      const rect = typing.getBoundingClientRect();
      const boxRect = b.getBoundingClientRect();

      // Si estÃ¡ muy abajo/tapado por input, baja 2-3 renglones.
      if(rect.bottom > boxRect.bottom - 90){
        b.scrollTop += 140;
      }else if((b.scrollHeight - b.scrollTop - b.clientHeight) < 260){
        b.scrollTop = b.scrollHeight + 220;
      }
    });
  }

  // 4) Botones rÃ¡pidos en mÃ³vil: primera fila chica. Si estorban, pueden esconderse.
  function tuneQuickActions(){
    safe(function(){
      const p = pop();
      if(!p || !p.classList.contains('open') || isAdmin()) return;
      const qa = p.querySelector('.tu-quick-actions');
      if(!qa) return;

      if(isMobile()){
        qa.classList.add('tu-mobile-quick');
        // Ãconos + texto mÃ­nimo
        const btns = qa.querySelectorAll('.tu-quick-btn');
        const labels = [
          ['ðŸŽ“','Cursos'],
          ['ðŸ“…','Eventos'],
          ['ðŸ› ï¸','Servicios'],
          ['ðŸ“',''],
          ['ðŸ‘¤','']
        ];
        btns.forEach((btn, i) => {
          const x = labels[i];
          if(!x) return;
          btn.innerHTML = '<span>'+x[0]+'</span>' + (x[1] ? '<em>'+x[1]+'</em>' : '');
        });
      }
    });
  }

  // 5) Enter/Enviar mÃ³vil: despuÃ©s del envÃ­o, foco y scroll abajo.
  document.addEventListener('click', function(ev){
    const send = ev.target && ev.target.closest && ev.target.closest('#chat-popover.open .chat-send,#chat-popover.open [data-chat-send]');
    const quick = ev.target && ev.target.closest && ev.target.closest('.tu-quick-btn');
    if(send || quick){
      setTimeout(function(){ forceBottom(320); }, 180);
      setTimeout(function(){ forceBottom(320); }, 720);
    }
  }, true);

  document.addEventListener('keydown', function(ev){
    if(ev.key === 'Enter' && ev.target && ev.target.id === 'chat-text'){
      setTimeout(function(){ forceBottom(320); }, 180);
      setTimeout(function(){ forceBottom(320); }, 720);
    }
  }, true);

  document.addEventListener('focusin', function(ev){
    if(ev.target && (ev.target.id === 'chat-text' || ev.target.id === 'chat-name')){
      setTimeout(function(){ applyMobileMode(); forceBottom(340); }, 250);
      setTimeout(function(){ forceBottom(340); }, 700);
    }
  }, true);

  // 6) Fullscreen admin centrado, tambiÃ©n si la clase es distinta.
  function centerAdminExpanded(){
    safe(function(){
      const p = pop();
      if(!p || !p.classList.contains('open')) return;
      const adminUi = !!p.querySelector('#chat-admin-text,.chat-inbox-side,.chat-admin-tools');
      const expanded = p.classList.contains('expanded') || p.classList.contains('tomauno-expanded') || p.classList.contains('tu-admin-fullscreen');
      if(adminUi && expanded){
        p.classList.add('tu-admin-centered-v27');
      }else{
        p.classList.remove('tu-admin-centered-v27');
      }
    });
  }

  // 7) Sonido: si navegador bloquea, mostrar activador mÃ¡s visible en admin.
  function showSoundHint(){
    safe(function(){ document.querySelectorAll('.tu-sound-unlock,.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-v34-sound-unlock').forEach(n=>n.remove()); });
  }

  function css(){
    if(document.getElementById('tomauno-v27-css')) return;
    const st = document.createElement('style');
    st.id = 'tomauno-v27-css';
    st.textContent = `
      html.tu-mobile-chat-open,
      body.tu-mobile-chat-open{
        overflow:hidden!important;
        height:100%!important;
      }

      @media(max-width:700px){
        html body #chat-popover.open.tu-mobile-fullscreen,
        html body.tomauno-visitor-active #chat-popover.open.tu-mobile-fullscreen,
        html body:not(.tomauno-admin-active) #chat-popover.open.tu-mobile-fullscreen{
          position:fixed!important;
          left:0!important;
          right:0!important;
          top:0!important;
          bottom:0!important;
          width:100vw!important;
          max-width:100vw!important;
          min-width:0!important;
          height:100dvh!important;
          max-height:100dvh!important;
          min-height:100dvh!important;
          transform:none!important;
          border-radius:0!important;
          z-index:99998!important;
          padding:14px 12px calc(var(--tomauno-keyboard,0px) + 10px)!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .chat-popover-inner,
        html body #chat-popover.open.tu-mobile-fullscreen .chat-panel{
          height:100%!important;
          min-height:0!important;
          display:flex!important;
          flex-direction:column!important;
          overflow:hidden!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .chat-head{
          flex:0 0 auto!important;
          min-height:74px!important;
          padding-right:58px!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .chat-msgs{
          flex:1 1 auto!important;
          min-height:0!important;
          max-height:none!important;
          height:auto!important;
          overflow-y:auto!important;
          scroll-behavior:auto!important;
          padding-bottom:36px!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .tu-quick-actions{
          flex:0 0 auto!important;
          display:flex!important;
          flex-wrap:nowrap!important;
          overflow-x:auto!important;
          gap:5px!important;
          padding:4px 0 6px!important;
          scrollbar-width:none!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .tu-quick-actions::-webkit-scrollbar{
          display:none!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .tu-quick-btn{
          height:34px!important;
          min-width:42px!important;
          padding:6px 9px!important;
          flex:0 0 auto!important;
          border-radius:999px!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .tu-quick-btn span{
          font-size:15px!important;
          line-height:1!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .tu-quick-btn em{
          font-size:10px!important;
          font-style:normal!important;
          font-weight:900!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .chat-row{
          flex:0 0 auto!important;
          display:grid!important;
          grid-template-columns:1fr 58px!important;
          gap:8px!important;
          align-items:center!important;
          margin:6px 0 0!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen #chat-text,
        html body #chat-popover.open.tu-mobile-fullscreen #chat-name{
          min-height:56px!important;
          height:56px!important;
          font-size:16px!important;
          padding:0 16px!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .chat-send{
          width:56px!important;
          height:56px!important;
          min-width:56px!important;
          border-radius:50%!important;
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen .chat-fab{
          display:none!important;
        }

        html body #chat-popover.open.tu-mobile-fullscreen + #chat-fab,
        html body.tu-mobile-chat-open #chat-fab{
          display:none!important;
          pointer-events:none!important;
        }
      }

      html body #chat-popover.open.tu-admin-centered-v27,
      html body #chat-popover.open.expanded.tu-admin-centered-v27,
      html body #chat-popover.open.tomauno-expanded.tu-admin-centered-v27{
        position:fixed!important;
        left:50%!important;
        right:auto!important;
        top:50%!important;
        bottom:auto!important;
        transform:translate(-50%,-50%)!important;
        width:min(1140px,calc(100vw - 40px))!important;
        height:min(84vh,800px)!important;
        max-height:min(84vh,800px)!important;
        z-index:99998!important;
      }

      .tu-sound-unlock{
        position:fixed!important;
        right:18px!important;
        bottom:18px!important;
        z-index:100001!important;
        border:1px solid rgba(255,255,255,.18)!important;
        background:rgba(232,0,10,.95)!important;
        color:#fff!important;
        border-radius:999px!important;
        padding:10px 14px!important;
        font-size:12px!important;
        font-weight:900!important;
        box-shadow:0 12px 34px rgba(0,0,0,.35)!important;
      }
    `;
    document.head.appendChild(st);
  }

  css();
  applyMobileMode();
  tuneQuickActions();
  centerAdminExpanded();

  setInterval(applyMobileMode, 600);
  setInterval(watchMessages, 300);
  setInterval(keepTypingVisible, 250);
  setInterval(tuneQuickActions, 1200);
  setInterval(centerAdminExpanded, 500);
  setTimeout(showSoundHint, 2200);
})();


// TOMAUNO LIMPIO FASE 3 â€” CHAT CORE SIN BLOQUES FINAL
(function(){
'use strict';

function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
function chatsSafe(){try{return window.chatsDB||chatsDB||{}}catch(e){return {}}}
function adminIdSafe(){try{return window.currentOpenChatId||currentOpenChatId||''}catch(e){return ''}}
function isAdminView(){return !!q('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools')}
function updateChatSafe(id,data){
  try{
    if(window.chatsDB&&window.chatsDB[id]) Object.assign(window.chatsDB[id],data);
    if(typeof chatsDB!=='undefined'&&chatsDB[id]) Object.assign(chatsDB[id],data);
    if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      return update(ref(db,'tomauno/chats/'+id),data).catch(()=>{});
    }
  }catch(e){}
  return Promise.resolve();
}
function pushMessageSafe(id,msg){
  try{
    if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof push!=='undefined'){
      return push(ref(db,'tomauno/chats/'+id+'/messages'),msg).catch(()=>{});
    }
  }catch(e){}
  return Promise.resolve();
}
function chatTimeSafe(){
  try{return chatTime()}catch(e){return new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}
}
function normClean(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
}
function isHumanRequestClean(text){
  var x=normClean(text);
  return [
    'quiero hablar con javier','pasame con javier','llama a javier','llamar a javier',
    'podes llamar a javier','puedes llamar a javier','quiero hablar con el dueno',
    'quiero hablar con el dueÃ±o','atencion humana','atenciÃ³n humana','humano',
    'whatsapp de javier','cel de javier','telefono de javier','telÃ©fono de javier'
  ].map(normClean).some(function(p){return x.includes(p)});
}

var callTimers = {};
window.detenerLlamadaJavier = function(id){
  if(!id) return;
  if(callTimers[id]){
    clearInterval(callTimers[id]);
    delete callTimers[id];
  }
  updateChatSafe(id,{
    humanRequested:false,
    waitingHuman:false,
    priority:false,
    prioridad:false,
    callUntil:0,
    callAnsweredAt:Date.now(),
    updatedAt:Date.now()
  });
};

function playCallSound(){
  try{
    var AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return;
    var ctx=new AC();
    var t=ctx.currentTime;
    [740,980,740,980].forEach(function(f,i){
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.type='square'; o.frequency.value=f;
      o.connect(g); g.connect(ctx.destination);
      var tt=t+i*.16;
      g.gain.setValueAtTime(0.0001,tt);
      g.gain.exponentialRampToValueAtTime(.16,tt+.025);
      g.gain.exponentialRampToValueAtTime(0.0001,tt+.13);
      o.start(tt); o.stop(tt+.15);
    });
    setTimeout(function(){try{ctx.close()}catch(e){}},900);
  }catch(e){}
}
function iniciarLlamadaJavier(id){
  if(!id || callTimers[id]) return;
  playCallSound();
  callTimers[id]=setInterval(function(){
    var c=chatsSafe()[id]||{};
    if(!(c.humanRequested && c.callUntil && Number(c.callUntil)>Date.now() && !c.callAnsweredAt)){
      window.detenerLlamadaJavier(id);
      return;
    }
    playCallSound();
  },10000);
}

// Interceptar pedido humano antes del cerebro normal.
var oldResponderClean = window.responderAutomaticoChat;
if(typeof oldResponderClean === 'function' && !oldResponderClean.__cleanF3){
  var responderClean = async function(id,text){
    if(false && isHumanRequestClean(text)){
      var t=Date.now();
      await updateChatSafe(id,{
        humanRequested:true,
        waitingHuman:true,
        priority:true,
        prioridad:true,
        unreadAdmin:true,
        callUntil:t+60000,
        callAnsweredAt:0,
        updatedAt:t,
        lastMsg:'ðŸ“£ Llamada a Javier'
      });
      await pushMessageSafe(id,{
        from:'admin',
        auto:true,
        text:'ðŸ“£ Voy a intentar comunicarme con Javier. AguardÃ¡ un momento por favor.',
        time:chatTimeSafe(),
        createdAt:Date.now(),
        systemCall:true
      });
      if(isAdminView()) iniciarLlamadaJavier(id);
      return;
    }
    return oldResponderClean.apply(this,arguments);
  };
  responderClean.__cleanF3=1;
  window.responderAutomaticoChat=responderClean;
  try{responderAutomaticoChat=responderClean}catch(e){}
}

// Si la llamada aparece mientras ADM estÃ¡ abierto, sonar.
var seenCalls = {};
setInterval(function(){
  if(!isAdminView()) return;
  Object.entries(chatsSafe()).forEach(function(pair){
    var id=pair[0], c=pair[1]||{};
    if(c.humanRequested && c.callUntil && Number(c.callUntil)>Date.now() && !c.callAnsweredAt){
      if(!seenCalls[id]){
        seenCalls[id]=1;
        iniciarLlamadaJavier(id);
      }
    }else{
      delete seenCalls[id];
    }
  });
},800);

// Cortar llamada al escribir/responder en ADM.
var oldSendClean = window.enviarChatAdmin;
if(typeof oldSendClean === 'function' && !oldSendClean.__cleanF3){
  var sendClean = async function(){
    var id=adminIdSafe();
    if(id) window.detenerLlamadaJavier(id);
    return oldSendClean.apply(this,arguments);
  };
  sendClean.__cleanF3=1;
  window.enviarChatAdmin=sendClean;
  try{enviarChatAdmin=sendClean}catch(e){}
}
document.addEventListener('input',function(e){
  if(isAdminView() && e.target && e.target.closest && e.target.closest('#chat-popover.open')){
    var id=adminIdSafe();
    if(id) window.detenerLlamadaJavier(id);
  }
},true);

// Basurero real.
window.borrarMensajeChatParaVisitante = async function(chatId,msgId){
  if(!chatId || !msgId) return;
  try{
    if(typeof db !== 'undefined' && typeof ref !== 'undefined' && typeof update !== 'undefined'){
      await update(ref(db,'tomauno/chats/'+chatId+'/messages/'+msgId), {
        hidden:true,
        deletedForVisitor:true,
        deleted:true,
        deletedAt:Date.now()
      });
    }
  }catch(e){ console.warn('No pude marcar mensaje oculto:', e); }
  try{ if(typeof updateChatMessagesOnly === 'function') updateChatMessagesOnly(chatId, true); }catch(e){}
};

// Header visitante consistente.
function fixVisitorHeader(){
  var pop=document.getElementById('chat-popover');
  if(!pop || !pop.classList.contains('open') || isAdminView()) return;
  var id='';
  try{id=window.currentVisitorChatId||currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id')||''}catch(e){}
  var c=chatsSafe()[id]||{};
  var human=!!(c.humanMode || Number(c.manualUntil||0)>Date.now());
  var title=q('#chat-popover.open .chat-title');
  var sub=q('#chat-popover.open .chat-subline');
  if(human){
    if(title) title.textContent='JAVIER ONLINE';
    if(sub) sub.textContent='ðŸŸ¢ Javier estÃ¡ en lÃ­nea';
  }else{
    if(title) title.textContent='ASISTENTE TOMAUNO';
    if(sub) sub.textContent='Asistente Tomauno';
  }
}
setInterval(fixVisitorHeader,700);

})();

// TOMAUNO LIMPIO FASE 8 â€” ðŸ“£ llamadas / â­ pendientes
// Solo estados, notificaciones y llamada. No toca scroll, maximizado, cursos ni duplicados.
(function(){
'use strict';

function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
function chats(){try{return window.chatsDB||chatsDB||{}}catch(e){return {}}}
function admId(){try{return window.currentOpenChatId||currentOpenChatId||''}catch(e){return ''}}
function isAdm(){
  try{
    if(typeof isAdminNotifier==='function' && isAdminNotifier()) return true;
    if(localStorage.getItem('tomauno-admin-notify')==='1') return true;
  }catch(e){}
  return !!q('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools');
}
function cname(id,c){c=c||{};return String(c.name||c.nombre||('Visitante '+String(id||'').slice(-4))).trim()}
function ctime(){try{return typeof chatTimeSafe==='function'?chatTimeSafe():new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}
function upd(id,data){
  try{
    if(window.chatsDB&&window.chatsDB[id]) Object.assign(window.chatsDB[id],data);
    if(typeof chatsDB!=='undefined'&&chatsDB[id]) Object.assign(chatsDB[id],data);
    if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined') return update(ref(db,'tomauno/chats/'+id),data).catch(()=>{});
  }catch(e){}
  return Promise.resolve();
}
async function msg(id,data){
  try{if(id&&typeof push==='function'&&typeof ref==='function'&&typeof db!=='undefined') return await push(ref(db,'tomauno/chats/'+id+'/messages'),data)}catch(e){}
}

function cleanSoundBtns(){
  qa('.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-sound-unlock,.tu-v34-sound-unlock').forEach(n=>n.remove());
  qa('button').forEach(b=>{if(/activar alertas|activar llamada|activar llamadas|activar sonido|desactivar sonido/i.test(b.innerText||'')) b.remove()});
}
setInterval(cleanSoundBtns,800); cleanSoundBtns();

// Bandeja al primer clic
function isInboxBtn(el){
  const t=(el.innerText||el.textContent||el.title||el.getAttribute('aria-label')||'').toLowerCase().trim();
  return t.includes('bandeja')||t==='â†'||t.includes('volver');
}
['pointerdown','click'].forEach(ev=>document.addEventListener(ev,e=>{
  const b=e.target&&e.target.closest&&e.target.closest('button,a');
  if(!b||!isInboxBtn(b))return;
  window.__tomaunoForceInboxOnce=true;
  window.__tomaunoManualInboxUntil=Date.now()+3000;
  if(ev==='click'&&typeof window.abrirPanelChatsAdmin==='function') setTimeout(()=>window.abrirPanelChatsAdmin(true),0);
},true));

// Detector humano estricto
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim()}
window.tuEsPedidoHumano=function(text){
  const raw=String(text||'').trim().toLowerCase(), x=norm(text);
  if(!x)return false;
  if(/^(quien|quiÃ©n|como se llama|cÃ³mo se llama|cual es|cuÃ¡l es)\b/.test(raw))return false;
  if(/\bquien es\b|\bquiÃ©n es\b|\bcomo se llama\b|\bcÃ³mo se llama\b/.test(raw))return false;
  return /\bquiero hablar con\b|\bquiero llamar a\b|\bquiero contactar a\b|\bquiero contactar con\b|\bquiero comunicarme con\b|\bpuedo hablar con\b|\bpodria hablar con\b|\bpodria comunicarme con\b|\bpuedo comunicarme con\b|\bcomunicarme con\b|\bcontactarme con\b|\bcontactar a\b|\bcontactar con\b|\bme pasas con\b|\bme pasas a\b|\bpasame con\b|\bpasame a\b|\bllama a\b|\bllamar a\b|\batencion humana\b|\batencion personalizada\b|\bhablar con una persona\b|\bhablar con alguien\b/.test(x);
};

// Sonido llamada
window.__tuCallTimers=window.__tuCallTimers||{};
function beepCall(){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext, ctx=new Ctx();
    [740,980,740,980].forEach((f,i)=>{
      const o=ctx.createOscillator(), g=ctx.createGain(), t=ctx.currentTime+i*.16;
      o.type='square'; o.frequency.value=f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.18,t+.025); g.gain.exponentialRampToValueAtTime(.0001,t+.13);
      o.start(t); o.stop(t+.15);
    });
  }catch(e){try{if(typeof beep==='function')beep()}catch(_){}}
}
function stopCall(id){
  if(!id)return;
  try{if(window.__tuCallTimers[id]){clearInterval(window.__tuCallTimers[id]);delete window.__tuCallTimers[id]}}catch(e){}
  try{if(typeof stopRing==='function')stopRing(id)}catch(e){}
  try{if(typeof stopHumanRing==='function')stopHumanRing(id)}catch(e){}
}
function startCall(id){
  if(!id||window.__tuCallTimers[id])return;
  if(isAdm())beepCall();
  window.__tuCallTimers[id]=setInterval(()=>{
    const c=chats()[id];
    if(!c||!c.humanRequested||!c.callUntil||c.callAnsweredAt){stopCall(id);return}
    if(isAdm())beepCall();
  },10000);
}

// Solicitud humana = ðŸ“£ activa + â­ pendiente
window.tuSolicitarJavier=async function(id){
  if(!id)return;
  const t=Date.now();
  await upd(id,{humanRequested:true,waitingHuman:true,pendingHuman:true,pendingAt:t,priority:true,prioridad:true,callUntil:t+60000,callAnsweredAt:0,humanWaitStartedAt:t,updatedAt:t,unreadAdmin:true,lastMsg:'ðŸ“£ Llamada humana'});
  await msg(id,{from:'admin',auto:true,humanWait:true,text:'ðŸ“£ Voy a intentar comunicarme con Javier. AguardÃ¡ un momento por favor.',time:ctime(),createdAt:t});
  startCall(id);
  try{ if(typeof window.tomaunoHumanAlarm==='function') window.tomaunoHumanAlarm(id, cname(id,chats()[id]||{})+' estÃ¡ llamando a Javier'); }catch(e){}
  try{ if(typeof notifyAdminChat==='function') notifyAdminChat('ðŸ“£ Llamando a Javier', cname(id,chats()[id]||{})+' pidiÃ³ atenciÃ³n humana', id); }catch(e){}
  if(isAdm()&&typeof showNotifBanner==='function'){
    const c=chats()[id]||{};
    showNotifBanner('ðŸ“£ Llamada humana',cname(id,c)+' necesita atenciÃ³n','ðŸ“£',()=>{if(typeof window.abrirChatAdmin==='function')window.abrirChatAdmin(id,true)});
  }
};
const oldResp=window.responderAutomaticoChat||(typeof responderAutomaticoChat!=='undefined'?responderAutomaticoChat:null);
if(typeof oldResp==='function'&&!oldResp.__fase8){
  const r=async function(id,text){try{if(window.tuEsPedidoHumano(text)){await window.tuSolicitarJavier(id);return null}}catch(e){}return oldResp.apply(this,arguments)};
  r.__fase8=1; window.responderAutomaticoChat=r; try{responderAutomaticoChat=r}catch(e){}
}

// ATENDIENDO = HUM + â­ pendiente
window.atenderLlamadaJavier=async function(id){
  id=id||admId(); if(!id)return;
  stopCall(id);
  await upd(id,{humanRequested:false,waitingHuman:false,pendingHuman:false,pendingAt:0,priority:false,prioridad:false,callUntil:0,callAnsweredAt:Date.now(),humanMode:true,manualUntil:Date.now()+30*60*1000,javierOnline:true,javierOnlineAt:Date.now(),updatedAt:Date.now(),unreadAdmin:false});
  await msg(id,{from:'admin',auto:true,humanAttend:true,text:'ðŸŸ¢ JAVIER ATENDIÃ“ LA LLAMADA.',time:ctime(),createdAt:Date.now()});
  try{if(typeof updateChatMessagesOnly==='function')updateChatMessagesOnly(id,true)}catch(e){}
  try{if(typeof applyChatModeButtonFinal==='function')applyChatModeButtonFinal(id)}catch(e){}
  setTimeout(()=>{try{if(typeof applyChatModeButtonFinal==='function')applyChatModeButtonFinal(id)}catch(e){}},140);
  try{if(typeof toast==='function')toast('ðŸ‘¤ HUM activado Â· llamada atendida')}catch(e){}
};
const oldSend=window.enviarChatAdmin;
if(typeof oldSend==='function'&&!oldSend.__fase8){
  const s=function(){const id=admId(), c=chats()[id]||{}; if(id&&c.humanRequested)window.atenderLlamadaJavier(id); return oldSend.apply(this,arguments)};
  s.__fase8=1; window.enviarChatAdmin=s; try{enviarChatAdmin=s}catch(e){}
}

// â­ resolver
window.marcarChatAtendido=async function(id){
  if(!id)return;
  await upd(id,{pendingHuman:false,pendingAt:0,waitingWhatsapp:false,waitingHumanContact:false,awaitingHumanContact:false,pendingHumanContact:false,humanFallbackSent:false,humanContactReceived:true,priority:false,prioridad:false,resolvedAt:Date.now(),updatedAt:Date.now()});
  try{if(typeof toast==='function')toast('âœ“ Pendiente marcado como atendido')}catch(e){}
  try{ if(typeof abrirPanelChatsAdmin === 'function' && !admId()) abrirPanelChatsAdmin(); }catch(e){}
};
const oldClose=window.cerrarConversacionChat;
if(typeof oldClose==='function'&&!oldClose.__fase8){
  const cfn=function(id){
    const c=chats()[id]||{};
    if(chatIsPendingHuman(c)){try{if(typeof toast==='function')toast('â­ Tiene pendientes. TocÃ¡ la estrella para marcarlo atendido antes de cerrar.')}catch(e){}; return;}
    return oldClose.apply(this,arguments);
  };
  cfn.__fase8=1; window.cerrarConversacionChat=cfn; try{cerrarConversacionChat=cfn}catch(e){}
}

// Ctrl+Espacio
document.addEventListener('keydown',e=>{
  if(!(e.ctrlKey&&e.code==='Space'))return;
  const id=admId(); if(!id)return;
  e.preventDefault(); e.stopPropagation();
  const c=chats()[id]||{}, hum=!!(c.humanMode||Number(c.manualUntil||0)>Date.now());
  if(hum){upd(id,{humanMode:false,manualUntil:0,javierOnline:false,javierOnlineAt:0,updatedAt:Date.now()});try{if(typeof toast==='function')toast('ðŸ¤– AUTO activado')}catch(_){}}
  else{upd(id,{humanMode:true,manualUntil:Date.now()+30*60*1000,javierOnline:true,javierOnlineAt:Date.now(),updatedAt:Date.now()});try{if(typeof toast==='function')toast('ðŸ‘¤ HUM activado')}catch(_){}}
  setTimeout(()=>{try{if(typeof window.abrirChatAdmin==='function')window.abrirChatAdmin(id,true)}catch(e){}},120);
},true);

// Notificaciones: solo ADM, filtrar admin/asistente
const oldBanner=window.showNotifBanner;
if(typeof oldBanner==='function'&&!oldBanner.__fase8){
  const b=function(title,msg,icon,onClick){
    if(!isAdm())return;
    let t=String(title||''), m=String(msg||''), joined=(t+' '+m).toLowerCase();
    if(joined.includes('asistente')||joined.includes('javier responder')||joined.includes('voy a intentar comunicarme')||joined.includes('atendiendo esta consulta')||joined.includes('dejame tu nÃºmero de whatsapp')||joined.includes('dejame tu numero de whatsapp'))return;
    const p=m.split(':').map(x=>x.trim()).filter(Boolean);
    if(p.length===2&&p[0].toLowerCase()===p[1].toLowerCase()){t='Nuevo visitante';m=p[0];icon='ðŸ‘‹'}
    return oldBanner.call(this,t,m,icon,onClick);
  };
  b.__fase8=1; window.showNotifBanner=b; try{showNotifBanner=b}catch(e){}
}

// Foco visitante luego del saludo
let lastCount=0;
setInterval(()=>{
  const pop=q('#chat-popover.open'); if(!pop||q('#chat-admin-text',pop))return;
  const ms=qa('.chat-bubble',pop); if(ms.length===lastCount)return; lastCount=ms.length;
  const txt=(ms[ms.length-1]?.innerText||'').toLowerCase();
  if(txt.includes('en quÃ© puedo ayudarte')||txt.includes('en que puedo ayudarte'))setTimeout(()=>{const inp=q('#chat-text',pop);if(inp)try{inp.focus({preventScroll:true})}catch(e){inp.focus()}},120);
},500);

// Indicadores y orden
function rid(row){let id=row.getAttribute('data-chat-id')||row.dataset.chatId||''; if(id)return id; const m=(row.getAttribute('onclick')||'').match(/abrirChatAdmin\('([^']+)'\)/); return m?m[1]:''}
function markRows(){
  const db=chats();
  qa('.chat-tab,[data-chat-id]').forEach(row=>{
    const id=rid(row); if(!id)return;
    const c=db[id]||{}, calling=!!(c.humanRequested&&c.callUntil&&!c.callAnsweredAt&&Number(c.callUntil)>Date.now()), pending=!!c.pendingHuman&&!calling;
    row.classList.toggle('tu-f8-calling',calling); row.classList.toggle('tu-f8-pending',pending);
    qa('.tu-f7-mega,.tu-f8-icon',row).forEach(x=>x.remove());
    const name=row.querySelector('.chat-tab-name,.chat-name,strong,b')||row;
    if(calling){const s=document.createElement('span');s.className='tu-f8-icon tu-f8-mega';s.textContent='ðŸ“£ ';s.title='Llamada activa';name.prepend(s)}
    else if(pending){const bt=document.createElement('button');bt.type='button';bt.className='tu-f8-icon tu-f8-star';bt.textContent='â­';bt.title='Marcar pendiente como atendido';bt.onclick=ev=>{ev.preventDefault();ev.stopPropagation();window.marcarChatAtendido(id)};name.prepend(bt)}
  });
}
function sortRows(){
  const db=chats();
  qa('.chat-tabs,.chat-inbox-side,.chat-list,.chat-inbox-list').forEach(cont=>{
    const rows=qa('.chat-tab,[data-chat-id]',cont); if(rows.length<2)return;
    rows.map((row,i)=>{const id=rid(row),c=db[id]||{},call=!!(c.humanRequested&&c.callUntil&&!c.callAnsweredAt&&Number(c.callUntil)>Date.now()),pend=!!c.pendingHuman&&!call;return{row,i,score:(call?1e12:0)+(pend?5e11:0)+Number(c.updatedAt||0)}}).sort((a,b)=>b.score-a.score||a.i-b.i).forEach(x=>cont.appendChild(x.row));
  });
}
setInterval(()=>{Object.entries(chats()).forEach(([id,c])=>{c=c||{};if(c.humanRequested&&c.callUntil&&!c.callAnsweredAt&&Number(c.callUntil)>Date.now())startCall(id);else stopCall(id)})},1200);

function css(){
  if(q('#tu-fase8-css'))return;
  const st=document.createElement('style');st.id='tu-fase8-css';
  st.textContent=[
    '.chat-bubble.tu-human-wait{background:#fff!important;color:#111!important;border:1px solid rgba(232,0,10,.25)!important;}',
    '.chat-bubble.tu-human-wait .chat-meta{color:#555!important;}',
    '.chat-human-countdown{margin-top:8px;font-size:12px;font-weight:900;color:#e8000a!important;}',
    '.chat-bubble.tu-human-attend{background:#e9fff1!important;color:#111!important;border:1px solid rgba(0,160,80,.25)!important;}',
    '.chat-attend-call{margin-top:10px;border:0!important;border-radius:999px!important;background:#e8000a!important;color:#fff!important;padding:8px 12px!important;font-weight:900!important;cursor:pointer!important;}',
    '.tu-f8-calling,.chat-tab.calling,.chat-list-item.calling{border-color:#ff2020!important;box-shadow:inset 3px 0 0 #ff2020!important;animation:tuF8Pulse 1.15s infinite!important;}',
    '.tu-f8-pending,.chat-tab.priority,.chat-list-item.priority{border-color:#ffd54a!important;box-shadow:inset 3px 0 0 #ffd54a!important;}',
    '.chat-status.call{background:rgba(232,0,10,.18)!important;color:#ff7a7a!important;border-color:rgba(232,0,10,.5)!important;}',
    '.chat-status.priority{background:rgba(255,213,74,.12)!important;color:#ffe070!important;border-color:rgba(255,213,74,.45)!important;}',
    '.tu-f8-icon{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-right:5px!important;vertical-align:middle!important;}',
    '.tu-f8-star{border:0!important;background:transparent!important;color:#ffd54a!important;padding:0!important;cursor:pointer!important;font-size:14px!important;filter:drop-shadow(0 0 5px rgba(255,213,74,.7))!important;}',
    '.tu-f8-mega{color:#ff3636!important;filter:drop-shadow(0 0 6px rgba(255,30,30,.75))!important;}',
    '@keyframes tuF8Pulse{0%,100%{box-shadow:inset 3px 0 0 #ff2020,0 0 0 rgba(255,32,32,0)}50%{box-shadow:inset 3px 0 0 #ff2020,0 0 14px rgba(255,32,32,.55)}}'
  ].join('\n');
  document.head.appendChild(st);
}
css();

setInterval(()=>qa('.chat-human-countdown').forEach(el=>{const st=Number(el.getAttribute('data-human-wait-start')||0);if(!st)return;const n=el.querySelector('.chat-human-countdown-num');if(n)n.textContent=Math.max(0,60-Math.floor((Date.now()-st)/1000))}),500);
})();


// TOMAUNO LIMPIO FASE 9B â€” NOTIFICACIONES DESDE ORIGEN
// Las notificaciones de chat web ahora salen Ãºnicamente del Ãºltimo mensaje real from:"user".
// No se notifican respuestas del asistente/ADM usando lastMsg.


// TOMAUNO LIMPIO FASE 10 â€” NOMBRES DUPLICADOS VISIBLES
// Base 9B. Solo agrega alias visual: SofÃ­a, SofÃ­a (2), SofÃ­a (3).
// No toca llamadas, notificaciones, sonido, HUM/AUTO ni scroll.
(function(){
'use strict';

function q(s,r){return (r||document).querySelector(s)}
function qa(s,r){return Array.from((r||document).querySelectorAll(s))}
function chats(){try{return window.chatsDB||chatsDB||{}}catch(e){return {}}}

function normName(s){
  return String(s||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function cleanDisplayName(s){
  return String(s||'')
    .replace(/^\s*[ðŸ“£â­]\s*/g,'')
    .replace(/\s+\(\d+\)\s*$/,'')
    .replace(/\s+/g,' ')
    .trim();
}
function rowId(row){
  let id = row.getAttribute('data-chat-id') || row.dataset.chatId || '';
  if(id) return id;
  const on = row.getAttribute('onclick') || '';
  const m = on.match(/abrirChatAdmin\('([^']+)'\)/);
  return m ? m[1] : '';
}
function nameNode(row){
  return row.querySelector('.chat-tab-name,.chat-name,strong,b,.name') || null;
}
function baseNameFor(id,row){
  const db = chats();
  const c = db[id] || {};
  const n = String(c.name || c.nombre || '').trim();
  if(n) return cleanDisplayName(n);

  const node = nameNode(row);
  if(node){
    // Clonar texto visible sin iconos/botones agregados
    let text = '';
    node.childNodes.forEach(ch => {
      if(ch.nodeType === Node.TEXT_NODE) text += ch.textContent || '';
    });
    text = cleanDisplayName(text || node.textContent || '');
    if(text) return text;
  }
  return 'Visitante';
}

function visibleRows(){
  return qa('.chat-tab,[data-chat-id]').filter(row => {
    const id = rowId(row);
    if(!id) return false;
    const style = window.getComputedStyle ? getComputedStyle(row) : null;
    if(style && style.display === 'none') return false;
    if(row.offsetParent === null && !(row.getClientRects && row.getClientRects().length)) return false;
    return true;
  });
}

function applyDuplicateNames(){
  const rows = visibleRows();
  if(!rows.length) return;

  // Agrupar por nombre base solo entre filas visibles.
  const groups = {};
  rows.forEach(row => {
    const id = rowId(row);
    const base = baseNameFor(id,row);
    const key = normName(base);
    if(!key) return;
    (groups[key] ||= []).push({row,id,base});
  });

  Object.values(groups).forEach(group => {
    if(group.length <= 1){
      group.forEach(item => setAlias(item.row,item.base,''));
      return;
    }

    // Orden estable por fecha de creaciÃ³n/updatedAt si existe; si no, orden actual visible.
    const db = chats();
    group.sort((a,b)=>{
      const ca = db[a.id] || {}, cb = db[b.id] || {};
      const ta = Number(ca.createdAt || ca.firstSeenAt || ca.updatedAt || 0);
      const tb = Number(cb.createdAt || cb.firstSeenAt || cb.updatedAt || 0);
      if(ta && tb && ta !== tb) return ta - tb;
      return 0;
    });

    group.forEach((item,idx)=>{
      const suffix = idx === 0 ? '' : ' ('+(idx+1)+')';
      setAlias(item.row,item.base,suffix);
    });
  });
}

function setAlias(row,base,suffix){
  const node = nameNode(row);
  if(!node) return;

  // Guardar nombre base para no acumular (2) (2)
  if(!node.dataset.tuBaseName) node.dataset.tuBaseName = cleanDisplayName(base || node.textContent || '');
  const finalName = (base || node.dataset.tuBaseName || 'Visitante') + (suffix || '');

  // Mantener iconos previos ðŸ“£/â­ si existen y solo reemplazar texto principal.
  let textNode = null;
  node.childNodes.forEach(ch => {
    if(ch.nodeType === Node.TEXT_NODE && String(ch.textContent||'').trim()) {
      if(!textNode) textNode = ch;
    }
  });

  if(textNode){
    if(cleanDisplayName(textNode.textContent) !== finalName){
      textNode.textContent = finalName;
    }
  }else{
    // Si el nodo tiene iconos/botones al inicio, insertar texto despuÃ©s del Ãºltimo icono.
    const txt = document.createTextNode(finalName);
    if(node.firstChild) node.appendChild(txt);
    else node.textContent = finalName;
  }

  node.dataset.tuAliasName = finalName;
}

// Usar MutationObserver para aplicar luego de renders, sin recrear DOM.
let scheduled = false;
function schedule(){
  if(scheduled) return;
  scheduled = true;
  requestAnimationFrame(()=>{
    scheduled = false;
    applyDuplicateNames();
  });
}

const obs = new MutationObserver(schedule);
function bind(){/* duplicados resueltos desde chatVisibleName/render original */}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',bind,{once:true});
else bind();

setInterval(schedule,1500);
})();


// TOMAUNO FASE 12E â€” FLUJO HUMANO MÃNIMO DESDE FASE 10
// No toca bandeja, tÃ­tulos, orden, nombres, scroll ni maximizado.
// Corrige SOLO:
// 1) fallback Ãºnico al vencer llamada;
// 2) primer mensaje post-fallback queda agendado;
// 3) mensajes posteriores vuelven al asistente normal;
// 4) AUTO limpia estado humano real.
(function(){
'use strict';

function q(s,r){return (r||document).querySelector(s)}
function chats(){try{return window.chatsDB||chatsDB||{}}catch(e){return {}}}
function admId(){try{return window.currentOpenChatId||currentOpenChatId||''}catch(e){return ''}}
function ctime(){try{return typeof chatTimeSafe==='function'?chatTimeSafe():new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}

function upd(id,data){
  try{
    if(window.chatsDB&&window.chatsDB[id]) Object.assign(window.chatsDB[id],data);
    if(typeof chatsDB!=='undefined'&&chatsDB[id]) Object.assign(chatsDB[id],data);
    if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined') {
      return update(ref(db,'tomauno/chats/'+id),data).catch(()=>{});
    }
  }catch(e){}
  return Promise.resolve();
}

async function pushMsg(id,data){
  try{
    if(id&&typeof push==='function'&&typeof ref==='function'&&typeof db!=='undefined'){
      return await push(ref(db,'tomauno/chats/'+id+'/messages'),data);
    }
  }catch(e){}
}

function stopAudio(id){
  try{if(typeof stopRing==='function')stopRing(id)}catch(e){}
  try{if(typeof stopHumanRing==='function')stopHumanRing(id)}catch(e){}
  try{
    [window.__tuCallTimers,window.__tomaunoHumanRingTimers,window.__tomaunoRingTimers,window.humanRingTimers,window.ringTimers]
      .filter(Boolean)
      .forEach(b=>{if(b[id]){try{clearInterval(b[id])}catch(e){};try{clearTimeout(b[id])}catch(e){};delete b[id];}});
  }catch(e){}
}

function msgs(c){
  return Object.entries(c&&c.messages||{}).map(([mid,m])=>({mid,...m})).sort((a,b)=>Number(a.createdAt||0)-Number(b.createdAt||0));
}

function hasFallback(c){
  return msgs(c).some(m => m.humanFallback || String(m.text||'').includes('Dejame tu nÃºmero de WhatsApp'));
}

function hasContactReceived(c){
  return !!(c && (c.humanContactReceived || c.humanContactAt || msgs(c).some(m => m.humanContactReceived)));
}

async function finishCallOnce(id,c){
  if(!id || !c) return;
  if(!c.humanRequested || !c.callUntil || c.callAnsweredAt) return;
  if(Date.now() < Number(c.callUntil)) return;

  stopAudio(id);

  // Si algÃºn cÃ³digo base ya generÃ³ fallback, no duplicar. Solo normalizar flags.
  if(c.humanFallbackSent || hasFallback(c)){
    await upd(id,{
      humanRequested:false,
      waitingHuman:false,
      priority:false,
      prioridad:false,
      callUntil:0,
      callAnsweredAt:Date.now(),
      humanFallbackSent:true,
      waitingWhatsapp:true,
      waitingHumanContact:true,
      pendingHuman:true,
      pendingAt:Number(c.pendingAt||Date.now()),
      updatedAt:Date.now()
    });
    return;
  }

  await upd(id,{
    humanRequested:false,
    waitingHuman:false,
    priority:false,
    prioridad:false,
    callUntil:0,
    callAnsweredAt:Date.now(),
    humanFallbackSent:true,
    waitingWhatsapp:true,
    waitingHumanContact:true,
    pendingHuman:true,
    pendingAt:Number(c.pendingAt||Date.now()),
    updatedAt:Date.now(),
    lastMsg:'â­ Consulta pendiente para Javier'
  });

  await pushMsg(id,{
    from:'admin',
    auto:true,
    humanFallback:true,
    text:'En este momento Javier puede estar ocupado.\n\nðŸ“± Dejame tu nÃºmero de WhatsApp y tu consulta para Javier. Muy pronto se comunicarÃ¡ con vos.',
    time:ctime(),
    createdAt:Date.now()
  });

  setTimeout(()=>{try{if(typeof updateChatMessagesOnly==='function')updateChatMessagesOnly(id,!!q('#chat-popover.open #chat-admin-text'))}catch(e){}},140);
}

async function captureContactOnce(id,text){
  const c = chats()[id] || {};
  const waiting = !!(c.waitingWhatsapp || c.waitingHumanContact || c.pendingHumanContact);
  if(!waiting) return false;
  if(hasContactReceived(c)) {
    // Ya se recibiÃ³; limpiar cualquier flag viejo para no capturar de nuevo.
    await upd(id,{waitingWhatsapp:false,waitingHumanContact:false,pendingHumanContact:false,updatedAt:Date.now()});
    return false;
  }

  await upd(id,{
    waitingWhatsapp:false,
    waitingHumanContact:false,
    pendingHumanContact:false,
    humanContactReceived:true,
    humanContactText:String(text||'').trim(),
    humanContactAt:Date.now(),
    pendingHuman:true,
    pendingAt:Number(c.pendingAt||Date.now()),
    updatedAt:Date.now(),
    lastMsg:'âœ… Consulta agendada para Javier'
  });

  await pushMsg(id,{
    from:'admin',
    auto:true,
    humanContactReceived:true,
    text:'âœ… Consulta agendada. Gracias, ya le dejo tu mensaje a Javier para que pueda responderte apenas estÃ© disponible.',
    time:ctime(),
    createdAt:Date.now()
  });

  try{if(typeof updateChatMessagesOnly==='function')updateChatMessagesOnly(id,!!q('#chat-popover.open #chat-admin-text'))}catch(e){}
  return true;
}

const oldResponder = window.responderAutomaticoChat || (typeof responderAutomaticoChat !== 'undefined' ? responderAutomaticoChat : null);
if(typeof oldResponder === 'function' && !oldResponder.__fase12e){
  const responder12e = async function(id,text){
    try{ if(await captureContactOnce(id,text)) return null; }catch(e){}
    return oldResponder.apply(this,arguments);
  };
  responder12e.__fase12e = 1;
  window.responderAutomaticoChat = responder12e;
  try{responderAutomaticoChat = responder12e}catch(e){}
}

function cleanAuto(id){
  if(!id) return;
  return upd(id,{
    humanMode:false,
    manualUntil:0,
    waitingHuman:false,
    humanRequested:false,
    pendingHuman:false,
    waitingWhatsapp:false,
    waitingHumanContact:false,
    pendingHumanContact:false,
    callUntil:0,
    javierOnline:false,
    javierOnlineAt:0,
    updatedAt:Date.now()
  });
}

const oldToggle = window.toggleModoAsistenteChat || (typeof toggleModoAsistenteChat !== 'undefined' ? toggleModoAsistenteChat : null);
if(typeof oldToggle === 'function' && !oldToggle.__fase12e){
  const toggle12e = function(){
    const id = admId();
    if(id && typeof window.tomaunoToggleModoChatActual === 'function'){
      return window.tomaunoToggleModoChatActual(id);
    }
    return oldToggle.apply(this,arguments);
  };
  toggle12e.__fase12e = 1;
  window.toggleModoAsistenteChat = toggle12e;
  try{toggleModoAsistenteChat = toggle12e}catch(e){}
}

// Watcher mÃ­nimo: solo vencimiento de llamada, sin tocar bandeja.
setInterval(()=>{
  Object.entries(chats()).forEach(([id,c])=>finishCallOnce(id,c||{}));
},1000);

})();
