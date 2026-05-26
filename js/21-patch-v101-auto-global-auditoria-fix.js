// Reemplazo seguro de /js/21-patch-v101-auto-global-auditoria-fix.js
// Modular v3 — AUTO global estable + supervisión sin pausa + pausa individual al responder Javier.
(function(){
  'use strict';
  var VERSION='Tomauno modular v3';
  var modoGlobal=null;
  var listenerStarted=false;
  var AUTO_PAUSE_MS=4*60*60*1000; // 4 horas: si Javier interviene, ese chat queda manual un rato.

  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v3 auto:',e);}catch(_){}}}
  function normModo(v){
    v=String(v||'').toLowerCase().trim();
    return (v==='automatico'||v==='auto'||v==='on'||v==='true'||v==='1')?'automatico':'manual';
  }
  function now(){return Date.now();}
  function isAdminActive(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok')==='1' ||
             localStorage.getItem('tomauno-admin-notify')==='1' ||
             !!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');
    }) || false;
  }
  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag');
    if(!tag){
      var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;
      tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);
    }
    tag.textContent=VERSION;
  });}
  function isAutoOn(){
    if(modoGlobal) return modoGlobal==='automatico';
    try{ if(window.asistenteDB && window.asistenteDB.modo) return normModo(window.asistenteDB.modo)==='automatico'; }catch(e){}
    try{ if(typeof window.tomaunoAutoGlobalModo !== 'undefined') return normModo(window.tomaunoAutoGlobalModo)==='automatico'; }catch(e){}
    return false;
  }
  function syncAutoUI(){safe(function(){
    var auto=isAutoOn();
    var admin=isAdminActive();
    var fab=document.getElementById('chat-fab');
    // El visitante no necesita ver el botón verde/rojo de AUTO. Eso confundía.
    if(fab){
      fab.classList.toggle('auto-on', !!(auto && admin));
      fab.title = auto ? 'Asistente automático global activo' : 'Asistente automático global apagado';
    }
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      b.classList.toggle('on',!!auto);
      b.innerHTML = auto ? '🟢 AUTO ON' : '🔴 AUTO OFF';
      b.title = auto ? 'Automático global activo. Clic para apagar.' : 'Automático global apagado. Clic para encender.';
    });
  });}
  function startAutoListener(){safe(function(){
    if(listenerStarted) return;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    listenerStarted=true;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      modoGlobal = snap && snap.exists && snap.exists() ? normModo(snap.val()) : 'manual';
      window.tomaunoAutoGlobalModo=modoGlobal;
      syncAutoUI();
    });
  });}

  // Estado global: Firebase manda. Las pestañas solo leen; solo el botón escribe.
  var oldModo=window.asistenteModo;
  window.asistenteModo=function(){
    if(modoGlobal) return modoGlobal;
    try{ if(window.asistenteDB && window.asistenteDB.modo) return normModo(window.asistenteDB.modo); }catch(e){}
    try{ if(typeof oldModo==='function') return normModo(oldModo()); }catch(e){}
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
      setTimeout(function(){
        try{
          if(typeof isAdminNotifier==='function' && isAdminNotifier()){
            if(window.currentOpenChatId && typeof abrirChatAdmin==='function') abrirChatAdmin(window.currentOpenChatId,true);
            else if(typeof abrirPanelChatsAdmin==='function') abrirPanelChatsAdmin();
          }
        }catch(e){}
      },120);
    }catch(e){
      console.warn('toggle auto modular v3:',e);
      if(typeof oldToggle==='function') return oldToggle.apply(this,arguments);
    }
  };

  function getChat(id){try{return (typeof chatsDB!=='undefined' && chatsDB && id) ? chatsDB[id] : null;}catch(e){return null;}}
  function isChatAutoPaused(chat){
    if(!chat) return false;
    var until=Number(chat.autoPausedUntil||0);
    if(chat.autoPaused && (!until || until>now())) return true;
    return false;
  }
  function lastUserText(chat){
    var txt=''; var ts=0;
    try{
      var msgs=chat && chat.messages ? chat.messages : {};
      Object.keys(msgs).forEach(function(k){
        var m=msgs[k]||{};
        if(m.from==='user' && !m.typing && Number(m.createdAt||0)>=ts){
          ts=Number(m.createdAt||0); txt=String(m.text||'').trim();
        }
      });
    }catch(e){}
    return txt || String((chat&&(chat.lastUserMsg||chat.lastMsg))||'').trim();
  }
  function visibleName(chat,id){
    var s=String((chat&&(chat.name||chat.nombre||chat.whatsappName))||'').trim();
    if(!s || /^(visitante|usuario|sin nombre)$/i.test(s)) return 'Visitante '+String(id||'').slice(-4);
    return s;
  }

  // Si Javier escribe manualmente, solo ese chat queda en modo humano.
  // Mirar/supervisar una conversación NO pausa el automático.
  var oldAdminSend=window.enviarChatAdmin;
  window.enviarChatAdmin=async function(id,presetText){
    var result;
    var willSend=false;
    try{
      var inp=document.getElementById('chat-admin-text');
      var text=String(presetText || (inp&&inp.value) || '').trim();
      willSend=!!text;
    }catch(e){}
    result = oldAdminSend && oldAdminSend.apply ? await oldAdminSend.apply(this,arguments) : undefined;
    if(willSend && id && typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      safe(function(){
        update(ref(db,'tomauno/chats/'+id),{
          autoPaused:true,
          autoPausedAt:now(),
          autoPausedUntil:now()+AUTO_PAUSE_MS,
          autoPausedReason:'manual-admin',
          updatedAt:now()
        });
      });
    }
    return result;
  };

  // Al cerrar la conversación, se libera la pausa individual para futuras consultas.
  var oldCerrar=window.cerrarConversacionChat;
  window.cerrarConversacionChat=async function(id){
    if(id && typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      await update(ref(db,'tomauno/chats/'+id),{
        autoPaused:false,
        autoPausedUntil:0,
        autoPausedReason:null,
        unreadAdmin:false,
        updatedAt:now()
      }).catch(function(){});
    }
    return oldCerrar && oldCerrar.apply ? oldCerrar.apply(this,arguments) : undefined;
  };

  // Bloqueo real del automático solo en chats donde Javier ya intervino.
  var oldResponder=window.responderAutomaticoChat;
  window.responderAutomaticoChat=async function(chatId,userText){
    try{
      if(window.asistenteModo()!=='automatico') return;
      var c=getChat(chatId);
      if(isChatAutoPaused(c)) return;
    }catch(e){}
    return oldResponder && oldResponder.apply ? oldResponder.apply(this,arguments) : undefined;
  };

  // Notificación admin limpia: solo pregunta/mensaje del usuario, nunca la card o respuesta larga del bot.
  var oldNotify=window.notifyAdminChat || (typeof notifyAdminChat!=='undefined' ? notifyAdminChat : null);
  function cleanNotify(title,body,chatId){
    try{
      var c=getChat(chatId);
      var user=lastUserText(c);
      var name=visibleName(c,chatId);
      var cleanBody = user ? (name+': '+user) : String(body||'Nuevo mensaje desde la web');
      cleanBody = cleanBody.replace(/\s+/g,' ').trim().slice(0,150);
      // Si por algún motivo venía una card/curso largo, la reemplazamos por último mensaje real del usuario.
      if(/Curso de|Fotos Polaroid|Ver cursos|Profesor\/organizador|Tomauno - Pedro/i.test(String(body||'')) && user){
        cleanBody = name+': '+user;
      }
      if(typeof oldNotify==='function') return oldNotify.call(this,title||'Nuevo chat web',cleanBody,chatId);
    }catch(e){
      try{ if(typeof oldNotify==='function') return oldNotify.apply(this,arguments); }catch(_){}
    }
  }
  window.notifyAdminChat=cleanNotify;
  try{ notifyAdminChat=cleanNotify; }catch(e){}

  // Refuerzo visitante: si AUTO está ON y no respondió, intenta responder, pero respeta pausa individual.
  var oldVisitSend=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(id){
    var before=Date.now();
    var text='';
    try{ text=String((document.getElementById('chat-text')||{}).value||'').trim(); }catch(e){}
    var res=oldVisitSend && oldVisitSend.apply ? await oldVisitSend.apply(this,arguments) : undefined;
    if(!text) return res;
    setTimeout(async function(){
      try{
        if(window.asistenteModo()!=='automatico') return;
        if(!id || typeof window.responderAutomaticoChat!=='function') return;
        var c=getChat(id);
        if(isChatAutoPaused(c)) return;
        var hasAuto=false;
        if(c && c.messages){
          Object.keys(c.messages).forEach(function(k){var m=c.messages[k]||{}; if(m.from==='admin' && m.auto && Number(m.createdAt||0)>before) hasAuto=true;});
        }
        if(hasAuto) return;
        await window.responderAutomaticoChat(id,text);
      }catch(e){console.warn('refuerzo visitante auto modular v3:',e);}
    },3600);
    return res;
  };

  startAutoListener(); setVersion(); syncAutoUI();
  setTimeout(function(){startAutoListener(); setVersion(); syncAutoUI();},600);
  setInterval(function(){setVersion(); syncAutoUI();},3000);
})();
