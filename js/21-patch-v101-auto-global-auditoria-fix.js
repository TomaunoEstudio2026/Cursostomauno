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
