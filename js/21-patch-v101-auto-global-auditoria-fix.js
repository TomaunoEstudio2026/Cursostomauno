// Reemplazo seguro de /js/21-patch-v101-auto-global-auditoria-fix.js
// Modular v4 — AUTO visual estable + notificación limpia + supervisión sin pausa.
(function(){
  'use strict';
  var VERSION='Tomauno modular v4';
  var modoGlobal=null;
  var listenerStarted=false;
  var AUTO_PAUSE_MS=4*60*60*1000;
  var uiTimer=null;

  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v4 auto:',e);}catch(_){}}}
  function normModo(v){v=String(v||'').toLowerCase().trim();return (v==='automatico'||v==='auto'||v==='on'||v==='true'||v==='1')?'automatico':'manual';}
  function now(){return Date.now();}
  function isAdminActive(){return safe(function(){return localStorage.getItem('tomauno-admin-ok')==='1'||localStorage.getItem('tomauno-admin-notify')==='1'||!!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');})||false;}
  function setVersion(){safe(function(){var tag=document.getElementById('tomauno-version-tag');if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;tag=document.createElement('span');tag.id='tomauno-version-tag';tag.className='tomauno-version-tag';f.appendChild(tag);}tag.textContent=VERSION;});}
  function isAutoOn(){if(modoGlobal) return modoGlobal==='automatico';try{if(window.asistenteDB&&window.asistenteDB.modo) return normModo(window.asistenteDB.modo)==='automatico';}catch(e){}try{if(typeof window.tomaunoAutoGlobalModo!=='undefined') return normModo(window.tomaunoAutoGlobalModo)==='automatico';}catch(e){}return false;}

  function hasUnreadAdmin(){return safe(function(){
    if(typeof chatsDB==='undefined'||!chatsDB) return false;
    return Object.keys(chatsDB).some(function(id){var c=chatsDB[id]||{};return !!(c.unreadAdmin||c.waitingHuman||c.priority||c.estado==='abierto-auto');});
  })||false;}

  function syncAutoUI(){safe(function(){
    var auto=isAutoOn();
    var admin=isAdminActive();
    var fab=document.getElementById('chat-fab');
    // El visitante no debe ver el botón verde/rojo por AUTO: eso generaba parpadeo y confusión.
    if(fab){
      fab.classList.remove('auto-on');
      fab.classList.toggle('has-new', !!(admin && hasUnreadAdmin()));
      fab.title = admin ? (hasUnreadAdmin()?'Hay mensajes/chats para revisar':'Abrir chat admin') : 'Abrir chat';
    }
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      b.classList.toggle('on',!!auto);
      b.setAttribute('data-auto-state',auto?'on':'off');
      b.innerHTML = auto ? '<span class="ico">🟢</span> <span class="txt">AUTO</span>' : '<span class="ico">🔴</span> <span class="txt">MANUAL</span>';
      b.title = auto ? 'Automático global activo. Clic para apagar.' : 'Automático global apagado. Clic para encender.';
    });
  });}
  function scheduleUI(){clearTimeout(uiTimer);uiTimer=setTimeout(syncAutoUI,80);}

  function startAutoListener(){safe(function(){
    if(listenerStarted) return;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    listenerStarted=true;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      modoGlobal = snap && snap.exists && snap.exists() ? normModo(snap.val()) : 'manual';
      window.tomaunoAutoGlobalModo=modoGlobal;
      scheduleUI();
    });
  });}

  var oldModo=window.asistenteModo;
  window.asistenteModo=function(){
    if(modoGlobal) return modoGlobal;
    try{if(window.asistenteDB&&window.asistenteDB.modo) return normModo(window.asistenteDB.modo);}catch(e){}
    try{if(typeof oldModo==='function') return normModo(oldModo());}catch(e){}
    return 'manual';
  };

  var oldToggle=window.toggleModoAsistenteChat;
  window.toggleModoAsistenteChat=async function(){
    try{
      var actual=window.asistenteModo()==='automatico'?'automatico':'manual';
      var nuevo=actual==='automatico'?'manual':'automatico';
      if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
        await update(ref(db,'tomauno/asistente'),{modo:nuevo, actualizado:Date.now()});
      }else if(typeof oldToggle==='function'){
        return oldToggle.apply(this,arguments);
      }
      modoGlobal=nuevo; window.tomaunoAutoGlobalModo=nuevo;
      syncAutoUI();
      if(typeof toast==='function') toast(nuevo==='automatico'?'🟢 AUTO global activado':'🔴 AUTO global apagado',true);
      setTimeout(function(){try{if(typeof isAdminNotifier==='function'&&isAdminNotifier()){if(window.currentOpenChatId&&typeof abrirChatAdmin==='function') abrirChatAdmin(window.currentOpenChatId,true);else if(typeof abrirPanelChatsAdmin==='function') abrirPanelChatsAdmin();}}catch(e){}},120);
    }catch(e){console.warn('toggle auto modular v4:',e);if(typeof oldToggle==='function') return oldToggle.apply(this,arguments);}
  };

  function getChat(id){try{return (typeof chatsDB!=='undefined'&&chatsDB&&id)?chatsDB[id]:null;}catch(e){return null;}}
  function isChatAutoPaused(chat){if(!chat) return false;var until=Number(chat.autoPausedUntil||0);return !!(chat.autoPaused&&(!until||until>now()));}
  function lastUserText(chat){var txt='';var ts=0;try{var msgs=chat&&chat.messages?chat.messages:{};Object.keys(msgs).forEach(function(k){var m=msgs[k]||{};if(m.from==='user'&&!m.typing&&Number(m.createdAt||0)>=ts){ts=Number(m.createdAt||0);txt=String(m.text||'').trim();}});}catch(e){}return txt||String((chat&&(chat.lastUserMsg||chat.lastMsg))||'').trim();}
  function visibleName(chat,id){var s=String((chat&&(chat.name||chat.nombre||chat.whatsappName))||'').trim();if(!s||/^(visitante|usuario|sin nombre)$/i.test(s)) return 'Visitante '+String(id||'').slice(-4);return s;}

  var oldAdminSend=window.enviarChatAdmin;
  window.enviarChatAdmin=async function(id,presetText){
    var willSend=false;
    try{var inp=document.getElementById('chat-admin-text');var text=String(presetText||(inp&&inp.value)||'').trim();willSend=!!text;}catch(e){}
    var result=oldAdminSend&&oldAdminSend.apply?await oldAdminSend.apply(this,arguments):undefined;
    if(willSend&&id&&typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      safe(function(){update(ref(db,'tomauno/chats/'+id),{autoPaused:true,autoPausedAt:now(),autoPausedUntil:now()+AUTO_PAUSE_MS,autoPausedReason:'manual-admin',updatedAt:now()});});
    }
    return result;
  };

  var oldCerrar=window.cerrarConversacionChat;
  window.cerrarConversacionChat=async function(id){
    if(id&&typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      await update(ref(db,'tomauno/chats/'+id),{autoPaused:false,autoPausedUntil:0,autoPausedReason:null,unreadAdmin:false,updatedAt:now()}).catch(function(){});
    }
    return oldCerrar&&oldCerrar.apply?oldCerrar.apply(this,arguments):undefined;
  };

  var oldResponder=window.responderAutomaticoChat;
  window.responderAutomaticoChat=async function(chatId,userText){
    try{if(window.asistenteModo()!=='automatico') return;var c=getChat(chatId);if(isChatAutoPaused(c)) return;}catch(e){}
    return oldResponder&&oldResponder.apply?oldResponder.apply(this,arguments):undefined;
  };

  var oldNotify=window.notifyAdminChat||(typeof notifyAdminChat!=='undefined'?notifyAdminChat:null);
  function cleanNotify(title,body,chatId){
    try{
      var c=getChat(chatId), user=lastUserText(c), name=visibleName(c,chatId);
      // Notificar solo mensajes reales del usuario. Nunca cards/respuestas del asistente.
      if(!user && /Curso de|Fotos Polaroid|Ver cursos|Profesor\/organizador|Tomauno - Pedro|Instagram:@|Contacto:|\$\s*\d/i.test(String(body||''))) return;
      var cleanBody=user?(name+': '+user):String(body||'Nuevo mensaje desde la web');
      cleanBody=cleanBody.replace(/\s+/g,' ').trim().slice(0,150);
      if(typeof oldNotify==='function') return oldNotify.call(this,title||'Nuevo chat web',cleanBody,chatId);
    }catch(e){try{if(typeof oldNotify==='function') return oldNotify.apply(this,arguments);}catch(_){}}
  }
  window.notifyAdminChat=cleanNotify; try{notifyAdminChat=cleanNotify;}catch(e){}

  var oldVisitSend=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(id){
    var before=Date.now(), text='';
    try{text=String((document.getElementById('chat-text')||{}).value||'').trim();}catch(e){}
    var res=oldVisitSend&&oldVisitSend.apply?await oldVisitSend.apply(this,arguments):undefined;
    if(!text) return res;
    setTimeout(async function(){
      try{
        if(window.asistenteModo()!=='automatico') return;
        if(!id||typeof window.responderAutomaticoChat!=='function') return;
        var c=getChat(id); if(isChatAutoPaused(c)) return;
        var hasAuto=false;
        if(c&&c.messages){Object.keys(c.messages).forEach(function(k){var m=c.messages[k]||{};if(m.from==='admin'&&m.auto&&Number(m.createdAt||0)>before) hasAuto=true;});}
        if(hasAuto) return;
        await window.responderAutomaticoChat(id,text);
      }catch(e){console.warn('refuerzo visitante auto modular v4:',e);}
    },3600);
    return res;
  };

  // Si otro listener viejo modifica clases del FAB, este refuerzo lo normaliza sin escribir Firebase.
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){startAutoListener();setVersion();syncAutoUI();});
  startAutoListener(); setVersion(); syncAutoUI();
  setTimeout(function(){startAutoListener();setVersion();syncAutoUI();},600);
  setInterval(function(){setVersion();syncAutoUI();},2500);
})();

// Modular v5 — onboarding sin borrar, aviso temprano, scroll y AUTO visual compacto.
(function(){
  'use strict';
  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v5:',e);}catch(_){}}}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function shortName(raw){
    var n=String(raw||'').trim().replace(/\s+/g,' ');
    n=n.replace(/^(hola\s+)?(soy|me llamo|mi nombre es|nombre es|buenas\s+soy)\s+/i,'').trim();
    n=n.replace(/[¿?¡!.,;:]+$/g,'').trim();
    if(n.length>42) n=n.slice(0,42).trim();
    return n;
  }
  function isAutoOnV5(){
    try{ if(typeof window.asistenteModo==='function') return String(window.asistenteModo()).toLowerCase()==='automatico'; }catch(e){}
    try{ return String(window.tomaunoAutoGlobalModo||'').toLowerCase()==='automatico'; }catch(e){}
    return false;
  }
  function injectCss(){safe(function(){
    if(document.getElementById('tomauno-modular-v5-css')) return;
    var st=document.createElement('style'); st.id='tomauno-modular-v5-css';
    st.textContent='\n.chat-msgs{padding-bottom:96px!important;scroll-padding-bottom:96px!important;}\n.chat-bubble{scroll-margin-bottom:88px!important;}\n.chat-filter.auto{min-width:84px!important;width:auto!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:10.5px!important;padding:0 9px!important;}\n.chat-filter.auto .txt{display:inline!important;}\n.chat-admin-tools{align-items:center!important;}\n.chat-popover .chat-admin-actions{padding-right:0!important;}\n.chat-popover .chat-admin-actions .btn-out,.chat-popover .chat-admin-actions a.btn-out{flex-shrink:0!important;}\n@media(max-width:700px){.chat-msgs{padding-bottom:110px!important;}.chat-bubble{scroll-margin-bottom:96px!important;}.chat-filter.auto{min-width:74px!important;font-size:10px!important;}}\n';
    document.head.appendChild(st);
  });}
  function syncAutoButtonText(){safe(function(){
    var auto=isAutoOnV5();
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      b.classList.toggle('on',auto);
      b.setAttribute('data-auto-state',auto?'on':'off');
      b.innerHTML=auto?'<span class="ico">🟢</span> <span class="txt">AUTO ON</span>':'<span class="ico">🔴</span> <span class="txt">AUTO OFF</span>';
      b.title=auto?'Automático global activo. Clic para apagar.':'Automático global apagado. Clic para encender.';
    });
  });}
  var oldSyncTimer=null;
  setInterval(syncAutoButtonText,1200);

  // Saludo corto y sin foco automático en el input de nombre.
  var oldAbrir=window.abrirChatTomauno;
  window.abrirChatTomauno=function(){
    try{
      if(typeof window.isAdminNotifier==='function' ? window.isAdminNotifier() : false){ return oldAbrir.apply(this,arguments); }
    }catch(e){}
    try{
      if(typeof unlockAudio==='function') unlockAudio();
      var pop=document.getElementById('chat-popover');
      if(pop&&pop.classList.contains('open')){ if(window.cerrarChatPopover) window.cerrarChatPopover(); return; }
      if(window.currentVisitorChatId&&window.chatsDB&&window.chatsDB[window.currentVisitorChatId]&&window.chatsDB[window.currentVisitorChatId].status!=='cerrado') return window.abrirChatVisitante(window.currentVisitorChatId,true);
      if(typeof setChatPopover==='function'){
        setChatPopover('<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>'+
          '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs"><div class="chat-bubble admin"><div>Hola 😊<br/>¿Cómo es tu nombre?</div><div class="chat-meta">Ahora</div></div></div>'+
          '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">➜</button></div></div>');
      } else return oldAbrir.apply(this,arguments);
    }catch(e){ return oldAbrir&&oldAbrir.apply?oldAbrir.apply(this,arguments):undefined; }
  };

  // Guardar nombre sin limpiar sensación de historial: crear conversación con saludo corto persistido y avisar al admin inmediatamente.
  window.iniciarChatConNombre=async function(){
    try{
      var raw=(document.getElementById('chat-name')||{}).value||'';
      var name=shortName(raw);
      if(!name){ if(typeof toast==='function') toast('⚠️ Escribí tu nombre para iniciar'); return; }
      if(typeof db==='undefined'||typeof ref==='undefined'||typeof push==='undefined') return;
      var t=Date.now();
      var chatRef=await push(ref(db,'tomauno/chats'),{name:name,wp:'',status:'abierto',createdAt:t,updatedAt:t,lastMsg:'Inició chat',unreadAdmin:true,unreadVisitor:false,userOnline:true,userLastSeen:t,nombreConfirmado:true});
      window.currentVisitorChatId=chatRef.key;
      try{sessionStorage.setItem('tomauno-chat-id',chatRef.key);sessionStorage.setItem('tomauno-chat-name',name);sessionStorage.setItem('tomauno-chat-name-confirmed','1');}catch(e){}
      await push(ref(db,'tomauno/chats/'+chatRef.key+'/messages'),{from:'admin',text:'Hola '+name+' 😊\n¿En qué puedo ayudarte?',time:(typeof chatTime==='function'?chatTime():''),createdAt:t+1,auto:true});
      safe(function(){ if(typeof notifyAdminChat==='function') notifyAdminChat('Nuevo chat web',name+' inició una consulta desde la web',chatRef.key); });
      if(typeof window.abrirChatVisitante==='function') window.abrirChatVisitante(chatRef.key,true);
    }catch(e){console.warn('iniciarChatConNombre v5',e);}
  };

  // Reforzar envío visitante: una vez confirmado nombre, no volver a reinterpretar mensajes posteriores como nombre.
  var oldSend=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(id){
    try{sessionStorage.setItem('tomauno-chat-name-confirmed','1');}catch(e){}
    return oldSend&&oldSend.apply?oldSend.apply(this,arguments):undefined;
  };

  // Scroll: al entrar respuesta nueva, mostrar la burbuja nueva completa o su comienzo, pero nunca tapada por el input.
  window.tomaunoScrollChatV5=function(){safe(function(){
    var box=document.getElementById('chat-msgs'); if(!box) return;
    var bubbles=box.querySelectorAll('.chat-bubble'); var last=bubbles[bubbles.length-1]; if(!last) return;
    var longMsg=(last.innerText||'').length>240||last.scrollHeight>170;
    var top=longMsg?Math.max(0,last.offsetTop-12):Math.max(0,box.scrollHeight-box.clientHeight);
    box.scrollTop=top;
  });};
  var mo=null;
  function observeMsgs(){safe(function(){
    var box=document.getElementById('chat-msgs'); if(!box||box.dataset.v5obs) return; box.dataset.v5obs='1';
    var timer=null;
    new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(function(){window.tomaunoScrollChatV5();},80);}).observe(box,{childList:true,subtree:true});
    setTimeout(window.tomaunoScrollChatV5,140);
  });}
  setInterval(function(){injectCss();syncAutoButtonText();observeMsgs();},1000);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){injectCss();syncAutoButtonText();observeMsgs();});
  else {injectCss();syncAutoButtonText();observeMsgs();}
})();

// Modular v6 — AUTO/MANUAL compacto en botonera admin.
(function(){
  'use strict';
  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v6 auto compact:',e);}catch(_){}}}
  function isAutoOn(){
    try{ if(typeof window.asistenteModo==='function') return String(window.asistenteModo()).toLowerCase()==='automatico'; }catch(e){}
    try{ return String(window.tomaunoAutoGlobalModo||'').toLowerCase()==='automatico'; }catch(e){}
    try{ return !!(window.asistenteDB && String(window.asistenteDB.modo||'').toLowerCase()==='automatico'); }catch(e){}
    return false;
  }
  function injectCompactCss(){safe(function(){
    if(document.getElementById('tomauno-modular-v6-auto-compact-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-modular-v6-auto-compact-css';
    st.textContent = '\n'+
      'html body .chat-filter.auto{width:58px!important;min-width:58px!important;max-width:58px!important;height:30px!important;min-height:30px!important;padding:0 5px!important;border-radius:999px!important;font-size:8.5px!important;letter-spacing:.02em!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:clip!important;}\n'+
      'html body .chat-filter.auto .ico{font-size:8px!important;line-height:1!important;margin:0!important;}\n'+
      'html body .chat-filter.auto .txt{font-size:8.5px!important;font-weight:900!important;line-height:1!important;display:inline!important;margin:0!important;}\n'+
      'html body .chat-admin-tools{gap:5px!important;align-items:center!important;}\n'+
      'html body .chat-popover .chat-admin-actions{padding-right:0!important;}\n'+
      '@media(max-width:700px){html body .chat-filter.auto{width:52px!important;min-width:52px!important;max-width:52px!important;height:29px!important;font-size:8px!important;padding:0 4px!important;}html body .chat-filter.auto .txt{font-size:8px!important;}}\n';
    document.head.appendChild(st);
  });}
  function compactAutoButton(){safe(function(){
    var auto=isAutoOn();
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      b.classList.toggle('on',auto);
      b.setAttribute('data-auto-state', auto?'on':'off');
      b.innerHTML = auto ? '<span class="ico">🟢</span><span class="txt">AUTO</span>' : '<span class="ico">🔴</span><span class="txt">MAN</span>';
      b.title = auto ? 'Automático global activo. Clic para pasar a manual.' : 'Manual global. Clic para activar automático.';
    });
  });}
  function run(){injectCompactCss();compactAutoButton();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setInterval(run,700);
})();

// Modular v7 — UX visitante: clase compacta, saludo corto visible y aviso desde primer mensaje.
(function(){
  'use strict';
  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v7 chat ux:',e);}catch(_){}}}
  function adminActive(){return safe(function(){return localStorage.getItem('tomauno-admin-ok')==='1'||!!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');})||false;}
  function markMode(){safe(function(){
    var p=document.getElementById('chat-popover')||document.querySelector('.chat-popover');
    if(!p) return;
    var adm=adminActive();
    p.classList.toggle('tomauno-chat-admin',adm);
    p.classList.toggle('tomauno-chat-visitor',!adm);
    var fab=document.getElementById('chat-fab');
    if(fab && !adm){ fab.classList.remove('auto-on'); }
  });}
  function shortenWelcome(){safe(function(){
    document.querySelectorAll('.chat-bubble.system,.chat-bubble.admin,.chat-bubble').forEach(function(b){
      var t=(b.innerText||'').trim();
      if(t.indexOf('Soy el Asistente de Tomauno')>-1 && t.indexOf('¿Cómo es tu nombre?')>-1){
        b.textContent='Hola 😊 ¿Cómo es tu nombre?';
      }
    });
  });}
  function scrollLast(){safe(function(){
    var box=document.getElementById('chat-msgs'); if(!box) return;
    var last=box.querySelector('.chat-bubble:last-child'); if(!last) return;
    var long=(last.innerText||'').length>240 || last.offsetHeight>150;
    if(long) box.scrollTop=Math.max(0,last.offsetTop-10);
    else box.scrollTop=box.scrollHeight;
  });}
  var oldSend=window.enviarChatVisitante;
  if(oldSend && !oldSend.__v7Wrapped){
    var wrapped=async function(){
      var input=document.getElementById('chat-input')||document.querySelector('.chat-row input,.chat-row textarea');
      var msg=input ? String(input.value||'').trim() : '';
      var chatId=arguments[0] || window.currentVisitorChatId || sessionStorage.getItem('tomauno-chat-id') || '';
      if(msg && chatId && !sessionStorage.getItem('tomauno-first-notified-'+chatId)){
        sessionStorage.setItem('tomauno-first-notified-'+chatId,'1');
        safe(function(){ if(typeof window.notifyAdminChat==='function') window.notifyAdminChat('Nuevo mensaje web', msg, chatId); });
      }
      var r=await oldSend.apply(this,arguments);
      setTimeout(function(){markMode();shortenWelcome();scrollLast();},120);
      return r;
    };
    wrapped.__v7Wrapped=true;
    window.enviarChatVisitante=wrapped;
  }
  function run(){markMode();shortenWelcome();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setInterval(run,900);
  safe(function(){
    new MutationObserver(function(){run(); setTimeout(scrollLast,80);}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  });
})();

// Modular v8 — estabilidad chat visitante/admin: onboarding corto, notificaciones solo admin, scroll sin pelear, encabezado visitante.
(function(){
  'use strict';
  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v8:',e);}catch(_){}}}
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function dbReady(){return typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'&&typeof push!=='undefined';}
  function isAdminReal(){return safe(function(){return localStorage.getItem('tomauno-admin-ok')==='1'||localStorage.getItem('tomauno-admin-notify')==='1'||!!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');})||false;}
  function cleanName(raw){
    var n=String(raw||'').trim().replace(/\s+/g,' ');
    n=n.replace(/^(hola\s+)?(soy|me llamo|mi nombre es|nombre es|buenas\s+soy|hola\s+soy)\s+/i,'').trim();
    n=n.replace(/[¿?¡!.,;:]+$/g,'').trim();
    if(n.length>34) n=n.slice(0,34).trim();
    return n;
  }
  function lastUserText(chat){
    var txt='',ts=0; safe(function(){var msgs=chat&&chat.messages?chat.messages:{};Object.keys(msgs).forEach(function(k){var m=msgs[k]||{};if(m.from==='user'&&!m.typing&&Number(m.createdAt||0)>=ts){ts=Number(m.createdAt||0);txt=String(m.text||'').trim();}});});
    return txt||String((chat&&(chat.lastUserMsg||chat.lastMsg))||'').trim();
  }
  function chatName(chat,id){var n=String((chat&&(chat.name||chat.nombre||chat.whatsappName))||'').trim();return n||('Visitante '+String(id||'').slice(-4));}
  function getChat(id){try{return (typeof chatsDB!=='undefined'&&chatsDB&&id)?chatsDB[id]:null;}catch(e){return null;}}

  // Admin notifications: never render admin alerts inside visitor pages and never show bot/course cards.
  window.notifyAdminChat=function(title,body,chatId){
    safe(function(){
      if(!isAdminReal()) return;
      var c=getChat(chatId);
      var q=lastUserText(c)||String(body||'').trim();
      if(/Curso de|Fotos Polaroid|Ver cursos|Profesor\/organizador|Tomauno - Pedro|Instagram:@|Contacto:|\$\s*\d/i.test(q)) q=String(body||'Nuevo mensaje').trim();
      q=q.replace(/\s+/g,' ').slice(0,150);
      var name=chatName(c,chatId);
      var cleanTitle=title||'Nuevo chat web';
      var cleanBody=(name?name+': ':'')+(q||'Nuevo mensaje desde la web');
      try{ if(typeof beep==='function') beep(); }catch(e){}
      try{ if(typeof showNotif==='function') showNotif(); }catch(e){}
      try{ if(typeof showNotifBanner==='function') showNotifBanner(cleanTitle,cleanBody); }catch(e){}
      try{
        if('Notification' in window && Notification.permission==='granted'){
          var n=new Notification('💬 '+cleanTitle,{body:cleanBody,icon:'https://i.imgur.com/oZnkCPD.png',badge:'https://i.imgur.com/oZnkCPD.png',tag:chatId?'tomauno-chat-'+chatId:'tomauno-chat',renotify:true,requireInteraction:false});
          n.onclick=function(){try{window.focus();}catch(e){} try{ if(chatId&&typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(chatId); else if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin(); }catch(e){} try{n.close();}catch(e){}};
        }
      }catch(e){}
    });
  };
  try{notifyAdminChat=window.notifyAdminChat;}catch(e){}

  function visitorWelcomeHtml(){
    return '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>'+
      '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs"><div class="chat-bubble admin"><div>Hola 😊<br/>¿Cómo es tu nombre?</div><div class="chat-meta">Ahora</div></div></div>'+
      '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" autocomplete="name" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">➜</button></div></div>';
  }

  // Open visitor chat with short welcome. Admin still opens admin flow through old handler.
  var oldOpenVisitorEntry=window.abrirChatTomauno;
  window.abrirChatTomauno=function(){
    try{
      if(isAdminReal() && !(window.currentVisitorChatId && !document.getElementById('admin-section')?.offsetParent)){
        if(typeof window.abrirPanelChatsAdmin==='function') return window.abrirPanelChatsAdmin();
      }
      if(window.currentVisitorChatId&&window.chatsDB&&window.chatsDB[window.currentVisitorChatId]&&window.chatsDB[window.currentVisitorChatId].status!=='cerrado') return window.abrirChatVisitante(window.currentVisitorChatId,true);
      if(typeof setChatPopover==='function') setChatPopover(visitorWelcomeHtml()); else if(oldOpenVisitorEntry) return oldOpenVisitorEntry.apply(this,arguments);
    }catch(e){ if(oldOpenVisitorEntry) return oldOpenVisitorEntry.apply(this,arguments); }
  };

  // Name onboarding: no limpiar historial visualmente con saludo largo; create chat, save name, notify by Firebase state.
  window.iniciarChatConNombre=async function(){
    try{
      var name=cleanName((document.getElementById('chat-name')||{}).value||'');
      if(!name){ if(typeof toast==='function') toast('Escribí tu nombre'); return; }
      if(!dbReady()) return;
      var t=Date.now();
      var chatRef=await push(ref(db,'tomauno/chats'),{name:name,wp:'',status:'abierto',createdAt:t,updatedAt:t,lastMsg:'Inició chat',unreadAdmin:true,unreadVisitor:false,userOnline:true,userLastSeen:t,nombreConfirmado:true});
      window.currentVisitorChatId=chatRef.key;
      try{sessionStorage.setItem('tomauno-chat-id',chatRef.key);sessionStorage.setItem('tomauno-chat-name',name);sessionStorage.setItem('tomauno-chat-name-confirmed','1');}catch(e){}
      await push(ref(db,'tomauno/chats/'+chatRef.key+'/messages'),{from:'admin',text:'Hola '+name+' 😊 ¿En qué puedo ayudarte?',time:(typeof chatTime==='function'?chatTime():''),createdAt:t+1,auto:true});
      await update(ref(db,'tomauno/chats/'+chatRef.key),{updatedAt:t+2,lastMsg:'Nombre agendado: '+name,unreadAdmin:true,nombreConfirmado:true});
      // no show admin toast here if visitor page; admin listener will notify in admin window.
      if(typeof window.abrirChatVisitante==='function') window.abrirChatVisitante(chatRef.key,true);
    }catch(e){console.warn('iniciarChatConNombre v8',e);}
  };

  // Header: visitor sees Tomauno, not own name. Admin can keep contact name.
  function fixVisitorHeader(){safe(function(){
    var p=document.getElementById('chat-popover'); if(!p||!p.classList.contains('open')) return;
    var isVisitor=!isAdminReal() || p.classList.contains('tomauno-chat-visitor');
    if(!isVisitor) return;
    var title=p.querySelector('.chat-title'); if(title) title.textContent='CHAT TOMAUNO';
    var sub=p.querySelector('.chat-subline'); if(sub) sub.textContent='Consulta directa desde la web';
    p.classList.add('tomauno-chat-visitor');
    p.classList.remove('tomauno-chat-admin');
    var fab=document.getElementById('chat-fab'); if(fab) fab.classList.remove('auto-on');
  });}

  // Replace long welcome wherever it appears.
  function shortenWelcome(){safe(function(){
    document.querySelectorAll('.chat-bubble').forEach(function(b){var t=(b.innerText||'').trim();if(t.indexOf('Soy el Asistente de Tomauno')>-1&&t.indexOf('¿Cómo es tu nombre?')>-1){b.innerHTML='<div>Hola 😊<br/>¿Cómo es tu nombre?</div><div class="chat-meta">Ahora</div>';}});
    document.querySelectorAll('.chat-bubble.admin').forEach(function(b){var t=(b.innerText||'').trim();if(/^Gracias,\s*[^.]+\.\s*Aguard[aá]/i.test(t)){b.innerHTML='<div>Aguardá un momento por favor, voy a intentar avisarle a Javier para que te responda por acá 😊</div><div class="chat-meta">'+((typeof chatTime==='function')?chatTime():'')+'</div>';}});
  });}

  // Scroll behavior: don't fight the user if they are reading older messages. New long answer shows start of answer.
  var userReadingUntil=0;
  document.addEventListener('scroll',function(e){var box=e.target;if(box&&box.id==='chat-msgs'){var nearBottom=(box.scrollHeight-box.scrollTop-box.clientHeight)<80;if(!nearBottom) userReadingUntil=Date.now()+7000;}},true);
  window.tomaunoSmartScroll=function(force){safe(function(){
    var box=document.getElementById('chat-msgs'); if(!box) return;
    if(!force && Date.now()<userReadingUntil) return;
    var bubbles=box.querySelectorAll('.chat-bubble'); var last=bubbles[bubbles.length-1]; if(!last) return;
    var longMsg=(last.innerText||'').length>220||last.offsetHeight>150;
    box.scrollTop= longMsg ? Math.max(0,last.offsetTop-10) : Math.max(0,box.scrollHeight-box.clientHeight);
  });};

  // Auto button compact, stable, no long text.
  function compactAuto(){safe(function(){
    var auto=false; try{auto=String(window.asistenteModo&&window.asistenteModo()||window.tomaunoAutoGlobalModo||'').toLowerCase()==='automatico';}catch(e){}
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){b.classList.toggle('on',auto);b.innerHTML=auto?'<span class="ico">🟢</span><span class="txt">AUTO</span>':'<span class="ico">🔴</span><span class="txt">MAN</span>';b.title=auto?'Automático activo. Clic para apagar.':'Manual. Clic para activar automático.';});
  });}

  // Observe DOM without forcing repeated bottom scroll.
  function run(){shortenWelcome();fixVisitorHeader();compactAuto();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  var t=null;
  safe(function(){new MutationObserver(function(){clearTimeout(t);t=setTimeout(function(){run();window.tomaunoSmartScroll(false);},120);}).observe(document.documentElement,{childList:true,subtree:true});});
  setInterval(run,1200);
})();
