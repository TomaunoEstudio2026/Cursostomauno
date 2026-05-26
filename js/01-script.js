// Extraído de <script >
// ── FUNCIONES GLOBALES (fuera del module) ─────────────────────────────────────

function navScroll(id) {
  const el = document.getElementById(id);
  if (!el) return;
  setTimeout(function() { el.scrollIntoView({behavior:'smooth', block:'start'}); }, 50);
}

function toggleMob() {
  var m = document.getElementById('mob-menu');
  if (m) m.classList.toggle('open');
}

function toggleIgDrop() {
  var d = document.getElementById('ig-drop');
  if (d) d.classList.toggle('open');
}
// Cerrar dropdown de IG al hacer clic afuera
document.addEventListener('click', function(e) {
  var d = document.getElementById('ig-drop');
  if (d && !d.contains(e.target)) d.classList.remove('open');
});

// Mejora de performance: lazy loading automático para imágenes agregadas al DOM
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('img:not([loading])').forEach(function(img){ img.setAttribute('loading','lazy'); });
});

function toggleFaq(el) {
  var wasOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function(i) { i.classList.remove('open'); });
  if (!wasOpen) el.classList.add('open');
}

function filterCursos() {
  var q = (document.getElementById('course-search').value || '').toLowerCase().trim();
  var cl = document.getElementById('search-clear');
  var info = document.getElementById('search-info');
  if (cl) cl.style.display = q ? 'block' : 'none';
  var cards = document.querySelectorAll('.ccard');
  var vis = 0;
  cards.forEach(function(card) {
    var txt = (card.dataset.search || '').toLowerCase();
    var match = !q || txt.indexOf(q) >= 0;
    card.style.display = match ? '' : 'none';
    if (match) vis++;
  });
  if (info) info.textContent = q ? (vis + ' resultado' + (vis !== 1 ? 's' : '') + ' para "' + q + '"') : '';
}

function clearSearch() {
  var inp = document.getElementById('course-search');
  if (inp) inp.value = '';
  filterCursos();
}

// Deep link
function checkDeepLink() {
  var hash = window.location.hash;
  if (hash && hash.indexOf('#curso-') === 0) {
    var id = hash.replace('#curso-', '');
    setTimeout(function() {
      if (window.abrirDetalle) window.abrirDetalle(id);
      else window._pendingDeepLink = id;
    }, 1200);
  }
  if (hash === '#review') {
    setTimeout(function() {
      if (window.abrirFormTestimonio) window.abrirFormTestimonio();
    }, 1200);
  }
  if (hash === '#chat' || hash === '#asistente' || hash === '#consulta') {
    setTimeout(function() {
      if (window.abrirChatTomauno) window.abrirChatTomauno();
    }, 1200);
  }
}
window.addEventListener('load', checkDeepLink);

// Teclado: flechas entre secciones
// Botón volver arriba
// Actualizar tab activo segun scroll
window.addEventListener('scroll', function() {
  var secs = [
    {id:'qn-cursos', sec:'sec-cursos'},
    {id:'qn-eventos', sec:'sec-eventos'},
    {id:'qn-servicios', sec:'sec-servicios'},
    {id:'qn-testimonios', sec:'sec-testimonios'},
    {id:'qn-galeria', sec:'sec-galeria'},
    {id:'qn-testimonios', sec:'sec-testimonios'},
    {id:'qn-galeria', sec:'sec-galeria'}
  ];
  var scrollY = window.scrollY + 120;
  var active = 'qn-cursos';
  secs.forEach(function(s) {
    var el = document.getElementById(s.sec);
    if (el && el.offsetTop <= scrollY) active = s.id;
  });
  secs.forEach(function(s) {
    var btn = document.getElementById(s.id);
    if (btn) btn.classList.toggle('qnav-on', s.id === active);
  });
});

window.addEventListener('scroll', function() {
  var btn = document.getElementById('back-top');
  if (btn) btn.classList.toggle('show', window.scrollY > 400);
});

var SECTIONS = ['hero','sec-cursos','sec-eventos','sec-servicios','sec-galeria','sec-testimonios','sec-faq','sec-ubicacion'];
var currentSection = 0;
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    currentSection = Math.min(currentSection + 1, SECTIONS.length - 1);
    var el = document.getElementById(SECTIONS[currentSection]);
    if (el) el.scrollIntoView({behavior:'smooth'});
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    currentSection = Math.max(currentSection - 1, 0);
    var el = document.getElementById(SECTIONS[currentSection]);
    if (el) el.scrollIntoView({behavior:'smooth'});
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH V34 — limpieza lógica / chat estable / admin seguro
   Objetivo: cerrar conflictos acumulados sin tocar la base visual ni datos Firebase.
───────────────────────────────────────────────────────────────────────────── */
(function(){
  const V34 = 'v34-limpio-estable';
  const now = () => Date.now();
  const norm34 = (t) => String(t||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[_\-\/]+/g,' ')
    .replace(/[^a-z0-9ñ\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  const hasWord34 = (q, words) => words.some(w => new RegExp('(^|\\s)'+w+'(\\s|$)','i').test(q));
  const css = document.createElement('style');
  css.textContent = `
    html body .chat-popover{overscroll-behavior:contain!important;}
    html body .chat-popover.open .chat-panel{min-height:0!important;}
    html body .chat-popover.open .chat-msgs{overscroll-behavior:contain!important;scroll-behavior:auto!important;}
    html body .chat-popover.open .chat-row,
    html body .chat-popover.open .chat-name-row{position:relative!important;z-index:5!important;flex-shrink:0!important;background:#080808!important;}
    html body .chat-admin-actions{align-items:center!important;}
    html body .chat-admin-actions .btn-out,
    html body .chat-admin-actions a.btn-out{flex:0 0 auto!important;}
    html body.chat-route-only{overflow:hidden!important;background:#000!important;}
    html body.chat-route-only .nav,
    html body.chat-route-only .hero,
    html body.chat-route-only #sec-cursos,
    html body.chat-route-only #sec-eventos,
    html body.chat-route-only #sec-servicios,
    html body.chat-route-only #sec-galeria,
    html body.chat-route-only #sec-testimonios,
    html body.chat-route-only #sec-faq,
    html body.chat-route-only #sec-ubicacion,
    html body.chat-route-only footer,
    html body.chat-route-only #back-top{display:none!important;}
    html body.chat-route-only .chat-fab{display:none!important;}
    html body.chat-route-only .chat-popover,
    html body.chat-route-only .chat-popover.expanded{display:flex!important;position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;min-width:0!important;min-height:0!important;transform:none!important;border-radius:0!important;border:0!important;z-index:999!important;background:#050505!important;}
    html body.chat-route-only .chat-popover-inner{height:100dvh!important;max-height:100dvh!important;padding:12px!important;}
    html body.chat-route-only .chat-head{padding-top:max(6px,env(safe-area-inset-top))!important;}
    html body.chat-route-only .chat-msgs{min-height:0!important;}
    @media(max-width:700px){
      html.chat-open-mobile, body.chat-open-mobile{overflow:hidden!important;position:fixed!important;width:100%!important;height:100%!important;}
      html body .chat-popover.open,
      html body .chat-popover.open.expanded{left:0!important;right:0!important;top:0!important;bottom:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;min-width:0!important;min-height:0!important;transform:none!important;border-radius:0!important;border-left:0!important;border-right:0!important;}
      html body .chat-popover.open .chat-popover-inner{height:100dvh!important;max-height:100dvh!important;padding:10px!important;gap:7px!important;}
      html body .chat-popover.open .chat-head{min-height:42px!important;padding-top:max(4px,env(safe-area-inset-top))!important;}
      html body .chat-popover.open .chat-msgs{min-height:0!important;padding:10px!important;}
      html body .chat-popover.open .chat-row{padding-bottom:max(6px,env(safe-area-inset-bottom))!important;}
      html body .chat-popover.open .chat-quick-wrap{display:none!important;}
      html body .chat-popover.open .chat-admin-actions{max-height:38px!important;overflow-x:auto!important;overflow-y:hidden!important;flex-wrap:nowrap!important;padding:4px 52px 4px 0!important;}
      html body .chat-popover.open .chat-admin-actions .btn-out,
      html body .chat-popover.open .chat-admin-actions a.btn-out{width:34px!important;height:34px!important;min-width:34px!important;}
      html body .chat-popover-close{top:max(8px,env(safe-area-inset-top))!important;right:10px!important;}
      html body .chat-max-btn{display:none!important;}
    }
  `;
  document.head.appendChild(css);

  function chatRouteOn34(){ return ['#chat','#consulta','#asistente'].includes(String(location.hash||'').toLowerCase()); }
  function applyChatRoute34(){
    const on = chatRouteOn34();
    document.body.classList.toggle('chat-route-only', on);
    if(on){
      setTimeout(()=>{
        const p = document.getElementById('chat-popover');
        if(!p || !p.classList.contains('open')) window.abrirChatTomauno && window.abrirChatTomauno();
        document.getElementById('chat-popover')?.classList.add('expanded');
      },120);
    }
  }
  window.addEventListener('hashchange', applyChatRoute34);
  window.addEventListener('load', applyChatRoute34);
  setTimeout(applyChatRoute34, 350);

  const __setChatPopover34 = typeof setChatPopover === 'function' ? setChatPopover : null;
  if(__setChatPopover34){
    setChatPopover = function(html){
      __setChatPopover34(html);
      const mobile = window.matchMedia && window.matchMedia('(max-width:700px)').matches;
      document.documentElement.classList.toggle('chat-open-mobile', mobile);
      document.body.classList.toggle('chat-open-mobile', mobile);
      applyChatRoute34();
    };
  }
  const __cerrarChatPopover34 = window.cerrarChatPopover;
  window.cerrarChatPopover = function(){
    if(chatRouteOn34()) return;
    document.documentElement.classList.remove('chat-open-mobile');
    document.body.classList.remove('chat-open-mobile');
    document.body.classList.remove('chat-route-only');
    return __cerrarChatPopover34 && __cerrarChatPopover34.apply(this, arguments);
  };

  window.cerrarSesionAdminTomauno = async function(){
    try{ localStorage.removeItem('tomauno-admin-notify'); }catch(e){}
    try{ sessionStorage.removeItem('tomauno-admin-ok'); }catch(e){}
    try{ window._adminWasActive = false; }catch(e){}
    try{ adminOk = false; }catch(e){}
    try{ await update(ref(db,'tomauno/status'), {adminOnline:false, adminLast: now()}); }catch(e){}
    try{ toggleAdmin(false); }catch(e){}
    try{ document.getElementById('chat-popover')?.classList.remove('open','expanded'); }catch(e){}
    toast('🔒 Sesión admin cerrada', true);
  };
  const __handleLogoClick34 = window.handleLogoClick;
  window.handleLogoClick = function(e){
    try{
      if(isAdminNotifier && isAdminNotifier()){
        e.preventDefault();
        window.cerrarSesionAdminTomauno();
        return;
      }
    }catch(err){}
    return __handleLogoClick34 && __handleLogoClick34.apply(this, arguments);
  };
  document.addEventListener('click', function(e){
    const adm = e.target && e.target.closest && e.target.closest('#admin-live-indicator');
    if(adm){ e.preventDefault(); e.stopPropagation(); window.cerrarSesionAdminTomauno(); }
  }, true);

  function activeItems34(type){
    if(type === 'curso') return Object.entries(cursos||{}).filter(([,x])=>x && !x.oculto && !x.finalizado).map(([id,x])=>({id,type,obj:x,title:x.titulo||'Curso'}));
    if(type === 'servicio') return Object.entries(serviciosDB||{}).filter(([,x])=>x && !x.oculto).map(([id,x])=>({id,type,obj:x,title:x.titulo||'Servicio'}));
    if(type === 'evento') return Object.entries(eventosDB||{}).filter(([,x])=>x && !x.oculto && (!x.estado || x.estado==='activo')).map(([id,x])=>({id,type,obj:x,title:x.titulo||'Evento'}));
    return [];
  }
  function detail34(m){
    if(!m) return '';
    if(m.type==='curso') return detalleCursoAI(m.obj) + ' #info:curso:' + m.id;
    if(m.type==='servicio') return detalleServicioAI(m.obj) + ' #info:servicio:' + m.id;
    if(m.type==='evento') return detalleEventoAI(m.obj) + ' #info:evento:' + m.id;
    return '';
  }
  function list34(type){
    const items = activeItems34(type);
    const label = type==='curso' ? '🎓 **Cursos activos**' : type==='servicio' ? '📷 **Servicios disponibles**' : '🎪 **Eventos activos**';
    const tag = type==='curso' ? '#cursos' : type==='servicio' ? '#servicios' : '#eventos';
    if(!items.length) return label + '\n\nPor ahora no hay ' + (type==='curso'?'cursos activos':type==='servicio'?'servicios publicados':'eventos activos') + ' cargados. Podés escribir por WhatsApp y te orientamos.';
    return label + '\n\n' + items.slice(0,8).map((m,i)=>{
      const o=m.obj;
      const extra = type==='curso' && o.fecha ? '\n📅 '+fFecha(o.fecha) : type==='servicio' && o.precio ? '\n💰 Desde $ '+Number(o.precio).toLocaleString('es-AR') : type==='evento' && o.fecha ? '\n📅 '+fFecha(o.fecha) : '';
      return (i+1)+'. **'+(m.title)+'**'+extra;
    }).join('\n\n') + '\n\nTocá el botón para ver la sección. ' + tag;
  }
  function terms34(q){ return norm34(q).split(' ').filter(w => w.length > 2 && !/^(curso|cursos|servicio|servicios|evento|eventos|taller|workshop|info|informacion|precio|precios|quiero|sobre|tienen|tenes|tenés|hay|del|para|con|una|uno|los|las)$/.test(w)); }
  function match34(type, q){
    const ts = terms34(q);
    if(!ts.length) return null;
    let best = null;
    activeItems34(type).forEach(m=>{
      const o=m.obj;
      const hay = norm34([o.titulo,o.desc,o.disertante,o.profesor,o.organizador,o.docente,o.nombreOrg,o.ig,o.lugar,o.dir].join(' '));
      let sc = 0;
      ts.forEach(t=>{ if(hay.includes(t)) sc += norm34(o.titulo||'').includes(t) ? 6 : 2; });
      if(sc>0 && (!best || sc>best.sc)) best = Object.assign({sc}, m);
    });
    return best && best.sc >= 2 ? best : null;
  }
  function professorQuery34(q){ return /(^|\s)(profe|profes|profesor|profesora|profesores|profesoras|docente|docentes|disertante|disertantes|organizador|organizadora|organizadores|responsable|responsables)(\s|$)|quien\s+(da|dicta)|quién\s+(da|dicta)/.test(q); }
  function contact34(m){
    const o = m && m.obj || {};
    const prof = o.disertante || o.profesor || o.organizador || o.docente || o.nombreOrg || '';
    const wp = o.wp || o.wpOrg || o.contacto || '';
    const ig = o.ig || '';
    let txt = '**'+(o.titulo || 'Actividad')+'**\n';
    if(prof) txt += '👤 Profesor / responsable: ' + prof + '\n';
    if(wp) txt += '💬 WhatsApp: https://wa.me/549' + String(wp).replace(/\D/g,'') + '\n';
    if(ig) txt += '📲 Instagram: @' + String(ig).replace(/^@/,'') + '\n';
    if(!prof && !wp && !ig) txt += 'No tengo cargado un responsable específico. Puedo dejar tu consulta marcada para Javier.';
    return txt.trim();
  }
  const __buscarRespuestaAsistente34 = typeof buscarRespuestaAsistente === 'function' ? buscarRespuestaAsistente : null;
  buscarRespuestaAsistente = function(text){
    const q = norm34(text);
    window._lastAiSuggestions = [];
    window._lastAiSection = '';
    if(!q) return '';

    const wantsCourse = hasWord34(q, ['curso','cursos','taller','talleres','workshop','workshops','capacitacion','capacitaciones','clase','clases']);
    const wantsService = hasWord34(q, ['servicio','servicios','sesion','sesiones','book','books','portfolio','foto','fotos','fotografias','fotografia','polaroid','beauty']);
    const wantsEvent = hasWord34(q, ['evento','eventos','charla','charlas','show','decoracion','decoración','danzaterapia','organizador','organizadora']);

    if(wantsCourse && !wantsService && !wantsEvent){
      window._lastAiSection = 'sec-cursos';
      if(/(que|qué|cuales|cuáles|tienen|tenes|tenés|hay|lista|listado|ver)/.test(q) && !match34('curso',q)) return list34('curso');
      const m = match34('curso', q);
      if(m) return professorQuery34(q) ? contact34(m) : detail34(m);
      return list34('curso');
    }
    if(wantsService && !wantsCourse && !wantsEvent){
      window._lastAiSection = 'sec-servicios';
      const m = match34('servicio', q);
      if(m) return professorQuery34(q) ? contact34(m) : detail34(m);
      return list34('servicio');
    }
    if(wantsEvent && !wantsCourse && !wantsService){
      window._lastAiSection = 'sec-eventos';
      const m = match34('evento', q);
      if(m) return professorQuery34(q) ? contact34(m) : detail34(m);
      return list34('evento');
    }

    if(/(que|qué|cuales|cuáles).{0,24}(curso|cursos)|^(curso|cursos)$/.test(q)){ window._lastAiSection='sec-cursos'; return list34('curso'); }
    if(/(que|qué|cuales|cuáles).{0,24}(servicio|servicios)|^(servicio|servicios)$/.test(q)){ window._lastAiSection='sec-servicios'; return list34('servicio'); }
    if(/(que|qué|cuales|cuáles).{0,24}(evento|eventos)|^(evento|eventos)$/.test(q)){ window._lastAiSection='sec-eventos'; return list34('evento'); }

    const resp = __buscarRespuestaAsistente34 ? __buscarRespuestaAsistente34(text) : '';
    return resp || 'Gracias por escribirnos. Puedo ayudarte con cursos, eventos, servicios, ubicación, WhatsApp e Instagram. Si tu consulta requiere una respuesta personal, la dejamos marcada para Javier.';
  };

  const __maybeRunVisitorActionTags34 = typeof maybeRunVisitorActionTags === 'function' ? maybeRunVisitorActionTags : null;
  maybeRunVisitorActionTags = function(chatId, chat){
    if(!chatId || chatId !== currentVisitorChatId || (typeof isAdminNotifier === 'function' && isAdminNotifier())) return;
    const msgs = chatMsgs(chat).filter(([,m]) => m && m.from === 'admin' && !m.typing);
    if(!msgs.length) return;
    const [mid,last] = msgs[msgs.length-1];
    const key = 'tomauno-action-done-' + chatId;
    try{ if(sessionStorage.getItem(key) === mid) return; }catch(e){}
    const actions = parseChatActions(last.text || '');
    const auto = actions.find(a => a.sec || a.fn);
    if(!auto){ return __maybeRunVisitorActionTags34 && __maybeRunVisitorActionTags34(chatId, chat); }
    try{ sessionStorage.setItem(key, mid); }catch(e){}
    setTimeout(()=>{
      if(auto.sec) navScroll(auto.sec);
      else if(auto.fn) window.executeChatAction(auto.fn, auto.type, auto.id);
    }, 3000);
  };

  // Texto parcial: liviano, solo presencia de escritura; no guarda borradores permanentes.
  let typingTimer34 = null;
  document.addEventListener('input', function(e){
    const inp = e.target;
    if(!inp || inp.id !== 'chat-text' || !currentVisitorChatId) return;
    clearTimeout(typingTimer34);
    try{ update(ref(db,'tomauno/chats/'+currentVisitorChatId), {typingPreview:String(inp.value||'').slice(0,120), typingAt:now()}); }catch(err){}
    typingTimer34 = setTimeout(()=>{ try{ update(ref(db,'tomauno/chats/'+currentVisitorChatId), {typingPreview:'', typingAt:now()}); }catch(err){} }, 950);
  }, true);

  // Notificaciones: pedir permiso solo si está en estado default.
  window.pedirPermisoNotificaciones = async function(){
    if(!('Notification' in window)){ toast('⚠️ Este navegador no soporta notificaciones'); return false; }
    if(Notification.permission === 'granted'){ toast('🔔 Notificaciones ya activas', true); return true; }
    if(Notification.permission === 'denied'){ toast('⚠️ Las notificaciones están bloqueadas en el navegador'); return false; }
    try{
      const permiso = await Notification.requestPermission();
      if(permiso === 'granted'){ toast('🔔 Notificaciones activadas', true); return true; }
    }catch(e){}
    toast('⚠️ No se activaron las notificaciones');
    return false;
  };

  // Marca visible para auditoría rápida en consola.
  window.TOMAUNO_PATCH_VERSION = V34;
})();
