// Extraído de <script id="patch-v105-auto-menu-admin-seguro">
(function(){
  'use strict';
  var VERSION='Tomauno v105';
  var seenKey='tomauno-v105-seen-user-msgs';
  var seen={};
  try{ seen=JSON.parse(localStorage.getItem(seenKey)||'{}')||{}; }catch(e){ seen={}; }
  function safe(fn){try{return fn();}catch(e){try{console.warn('v105:',e);}catch(_){}}}
  function norm(s){
    try{ if(typeof window.normAI==='function') return window.normAI(s||''); }catch(e){}
    return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9ñ\s/#_-]+/g,' ').replace(/\s+/g,' ').trim();
  }
  function now(){return Date.now();}
  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag')||document.getElementById('tomauno-version-badge')||document.getElementById('version-badge');
    if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body; tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);}
    tag.textContent=VERSION;
  });}
  function isAdmin(){try{return typeof window.isAdminNotifier==='function' && window.isAdminNotifier();}catch(e){return false;}}
  function autoMode(){
    try{ if(typeof window.asistenteModo==='function') return window.asistenteModo()==='automatico'; }catch(e){}
    try{ return String((window.asistenteDB||{}).modo||'').toLowerCase()==='automatico'; }catch(e){}
    try{ return String(window.tomaunoAutoGlobalModo||'').toLowerCase()==='automatico'; }catch(e){}
    return false;
  }
  // Releer AUTO desde Firebase al cargar y en cada cambio. No depende de ADM.
  function startAutoSync(){safe(function(){
    if(window.__tomaunoV105AutoSync) return; window.__tomaunoV105AutoSync=true;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      var raw=(snap&&snap.exists&&snap.exists())?snap.val():'manual';
      var m=/^(automatico|auto|on|true|1)$/i.test(String(raw||''))?'automatico':'manual';
      window.tomaunoAutoGlobalModo=m;
      try{ window.asistenteDB=Object.assign({},window.asistenteDB||{}, {modo:m}); }catch(e){}
      try{ if(typeof window.syncAdmIndicator==='function') window.syncAdmIndicator(); }catch(e){}
      document.querySelectorAll('.chat-filter.auto').forEach(function(b){b.classList.toggle('on',m==='automatico'); b.innerHTML='🤖 '+(m==='automatico'?'ON':'OFF');});
      var fab=document.getElementById('chat-fab'); if(fab) fab.classList.toggle('auto-on',m==='automatico');
    });
  });}
  // Si está logueado ADM, el botón flotante debe abrir bandeja ADM, no chat visitante.
  function protectAdminChatButton(){safe(function(){
    if(window.__tomaunoV105ChatFabGuard) return; window.__tomaunoV105ChatFabGuard=true;
    document.addEventListener('click',function(ev){
      var btn=ev.target && ev.target.closest ? ev.target.closest('#chat-fab') : null;
      if(!btn || !isAdmin()) return;
      ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin();
    },true);
  });}
  function chatMsgs(c){
    try{ if(typeof window.chatMsgs==='function') return window.chatMsgs(c); }catch(e){}
    var m=(c&&c.messages)||{}; return Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(a,b){return Number((a[1]||{}).createdAt||0)-Number((b[1]||{}).createdAt||0);});
  }
  function lastUserMsg(c){
    var arr=chatMsgs(c).filter(function(x){var m=x[1]||{}; return m.from==='user' && !m.typing;});
    if(!arr.length) return null; return arr[arr.length-1];
  }
  function visibleName(c,id){try{ if(typeof window.chatVisibleName==='function') return window.chatVisibleName(c,id); }catch(e){} return (c&&c.name)||'Visitante';}
  // Admin: avisar desde el primer mensaje de usuario, no recién cuando deja nombre.
  function startFirstMessageAdminNotifier(){safe(function(){
    if(window.__tomaunoV105FirstNotifier) return; window.__tomaunoV105FirstNotifier=true;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    onValue(ref(db,'tomauno/chats'),function(snap){
      if(!isAdmin()) return;
      var data=(snap&&snap.exists&&snap.exists())?snap.val():{};
      Object.keys(data||{}).forEach(function(id){
        var c=data[id]||{}; if(c.status==='cerrado') return;
        var last=lastUserMsg(c); if(!last) return;
        var m=last[1]||{}; var ts=Number(m.createdAt||c.updatedAt||0); if(!ts) return;
        var prev=Number(seen[id]||0); if(ts<=prev) return;
        seen[id]=ts; try{localStorage.setItem(seenKey,JSON.stringify(seen));}catch(e){}
        // Si el mensaje es muy viejo, marcar como visto para no sonar por históricos.
        if(now()-ts>20*60*1000) return;
        var body=visibleName(c,id)+': '+String(m.text||c.lastMsg||'Escribió desde la web').slice(0,110);
        if(typeof window.notifyAdminChat==='function') window.notifyAdminChat('Nuevo mensaje web', body, id);
        else if(typeof window.toast==='function') window.toast('💬 Nuevo mensaje web',true);
      });
    });
  });}
  function brainCommand(cmd){
    var out=''; safe(function(){
      var entries=[];
      if(typeof window.asistenteKnowledgeEntries==='function') entries=window.asistenteKnowledgeEntries();
      else entries=Object.entries((window.asistenteDB&&window.asistenteDB.knowledge)||{}).filter(function(x){return (x[1]||{}).activo!==false;});
      var c=norm(cmd);
      entries.some(function(pair){var k=pair[1]||{}; var keys=[k.command,k.comando,k.alias,k.pregunta,k.frase].map(norm); if(keys.indexOf(c)>=0 && k.respuesta){out=String(k.respuesta); return true;} return false;});
    }); return out;
  }
  function activeCourses(){var arr=[]; safe(function(){Object.values(window.cursosDB||{}).forEach(function(c){if(!c)return; var st=norm(c.estado||c.status||''); if(/finalizado|cerrado|fin/.test(st))return; arr.push(c);});}); return arr;}
  function activeEvents(){var arr=[]; safe(function(){Object.values(window.eventosDB||{}).forEach(function(e){if(!e)return; var st=norm(e.estado||e.status||'activo'); if(/finalizado|cerrado|fin/.test(st))return; arr.push(e);});}); return arr;}
  function mainMenu(){var x=brainCommand('/menu_principal'); if(x)return x; return 'Hola 😊 Soy el Asistente de Tomauno.\n\nPuedo ayudarte con:\n\n1. Cursos y workshops\n2. Servicios fotográficos\n3. Eventos\n4. Alquiler del estudio\n5. Formas de pago\n6. Hablar con Javier\n7. Dejar una consulta\n\nRespondé con el número o escribime qué necesitás.';}
  function courseMenu(){var x=brainCommand('/menu_cursos'); if(x)return x; var c=activeCourses(); if(!c.length)return 'Claro 😊 Decime el nombre del curso que te interesa y te ayudo con la información.'; return 'Claro 😊 Para pasarte el costo correcto, decime a qué curso te referís:\n\n'+c.slice(0,12).map(function(it,i){var p=it.precio||it.valor||it.costo||''; return (i+1)+'. '+(it.titulo||it.nombre||'Curso')+(p?' — '+p:'');}).join('\n')+'\n\nRespondé con el número o el nombre del curso.';}
  function serviceMenu(){var x=brainCommand('/menu_servicios'); if(x)return x; return 'Claro 😊 ¿Sobre qué tipo de servicio querés consultar?\n\n1. Sesión fotográfica / photobook\n2. Book para modelaje, actores, músicos o deportistas\n3. 15 años, bodas o eventos\n4. Fotografía de producto / publicitaria / institucional\n5. Alquiler del estudio fotográfico\n6. Otro servicio\n\nRespondé con el número o contame brevemente qué necesitás.';}
  function eventMenu(){var x=brainCommand('/menu_eventos'); if(x)return x; var ev=activeEvents(); if(!ev.length)return 'Por ahora no veo eventos activos cargados. Si querés, puedo avisarle a Javier para que te confirme la agenda.'; return 'Estos son los eventos/actividades activos 😊\n\n'+ev.slice(0,10).map(function(e,i){return (i+1)+'. '+(e.titulo||e.nombre||'Evento');}).join('\n')+'\n\nRespondé con el número o el nombre.';}
  function guided(text){
    var q=norm(text); if(!q)return '';
    if(q==='/menu_principal'||/^(hola|hola hola|buenas|buen dia|buenas tardes|buenas noches|hey)$/.test(q))return mainMenu();
    if(q==='/menu_cursos'||q==='1')return courseMenu();
    if(q==='/menu_servicios'||q==='2')return serviceMenu();
    if(q==='/menu_eventos'||q==='3')return eventMenu();
    var course=/(curso|cursos|workshop|taller|capacitacion|aprender|estudiar)/.test(q);
    var price=/(precio|precios|costo|costos|valor|cuanto sale|cuanto cuesta|sale|cuesta|pago|pagar)/.test(q);
    var service=/(servicio|servicios|sesion|sesiones|photobook|book|foto producto|producto|publicitaria|institucional|corporativa|alquiler|estudio|quince|15|boda|casamiento|evento social|modelo|modelaje|actor|actriz|musico|deportista|fotos)/.test(q);
    var event=/(evento|eventos|agenda|actividad|actividades)/.test(q);
    if(course && (price||/que cursos|cursos tienen|info de cursos|informacion de cursos|ver cursos/.test(q)))return courseMenu();
    if(service && /que servicios|servicios tienen|quiero una sesion|sesion de fotos|necesito fotos|photobook|alquiler de estudio|presupuesto|book/.test(q))return serviceMenu();
    if(event && /que eventos|eventos tienen|ver eventos|agenda|lista/.test(q))return eventMenu();
    return '';
  }
  async function pushAuto(chatId,text,userText){
    if(!chatId||!text||typeof db==='undefined'||typeof ref==='undefined'||typeof push==='undefined'||typeof update==='undefined')return;
    var chat=(window.chatsDB&&window.chatsDB[chatId])?window.chatsDB[chatId]:{};
    if(norm(chat.lastAutoUserText||'')===norm(userText||'') && now()-Number(chat.lastAutoAt||0)<9000)return;
    await push(ref(db,'tomauno/chats/'+chatId+'/messages'),{from:'admin',text:text,time:(typeof window.chatTime==='function'?window.chatTime():new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})),createdAt:now(),auto:true,guided:true});
    await update(ref(db,'tomauno/chats/'+chatId),{updatedAt:now(),lastMsg:String(text).slice(0,120),status:'abierto-auto',unreadVisitor:true,unreadAdmin:true,lastAutoUserText:userText,lastAutoAt:now()});
  }
  var oldResp=window.responderAutomaticoChat || (typeof responderAutomaticoChat!=='undefined'?responderAutomaticoChat:null);
  async function responderV105(chatId,userText){
    try{ if(autoMode()){ var menu=guided(userText); if(menu){ await pushAuto(chatId,menu,userText); return; } } }catch(e){console.warn('v105 menu:',e);}
    if(typeof oldResp==='function') return oldResp.apply(this,arguments);
  }
  window.responderAutomaticoChat=responderV105; try{ responderAutomaticoChat=responderV105; }catch(e){}
  startAutoSync(); protectAdminChatButton(); startFirstMessageAdminNotifier(); setVersion();
  setTimeout(function(){startAutoSync();protectAdminChatButton();startFirstMessageAdminNotifier();setVersion();},800);
  setInterval(setVersion,5000);
})();
