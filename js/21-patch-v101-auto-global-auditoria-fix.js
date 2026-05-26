// Extraído de <script id="patch-v101-auto-global-auditoria-fix">
(function(){
  'use strict';
  var VERSION='Tomauno v101';
  var modoGlobal=null;
  var listenerStarted=false;
  function safe(fn){try{return fn();}catch(e){try{console.warn('v101 auto global:',e);}catch(_){}}}
  function normModo(v){
    v=String(v||'').toLowerCase().trim();
    return (v==='automatico'||v==='auto'||v==='on'||v==='true'||v==='1')?'automatico':'manual';
  }
  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag');
    if(!tag){
      var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;
      tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);
    }
    tag.textContent=VERSION;
  });}
  function syncFab(){safe(function(){
    var auto=(modoGlobal==='automatico') || (typeof window.asistenteModo==='function' && window.asistenteModo()==='automatico');
    var fab=document.getElementById('chat-fab');
    if(fab){fab.classList.toggle('auto-on',!!auto); fab.title=auto?'Asistente automático activo':'Mensaje directo';}
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      b.classList.toggle('on',!!auto);
      b.innerHTML='🤖 '+(auto?'ON':'OFF');
      b.title=auto?'Automático global ON':'Automático global OFF';
    });
  });}
  function startAutoListener(){safe(function(){
    if(listenerStarted) return; listenerStarted=true;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      modoGlobal = snap && snap.exists && snap.exists() ? normModo(snap.val()) : null;
      window.tomaunoAutoGlobalModo=modoGlobal;
      syncFab();
    });
  });}

  // Mantener compatibilidad: todo el código viejo que pregunte asistenteModo()
  // recibe primero el estado global si ya fue leído de Firebase.
  var oldModo=window.asistenteModo;
  window.asistenteModo=function(){
    if(modoGlobal) return modoGlobal;
    try{
      if(window.asistenteDB && window.asistenteDB.modo) return normModo(window.asistenteDB.modo);
      if(typeof oldModo==='function') return normModo(oldModo());
    }catch(e){}
    return 'manual';
  };

  // Toggle del admin: escribe SOLO el modo global en Firebase. No depende de sesión ADM.
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
      syncFab();
      if(typeof toast==='function') toast(nuevo==='automatico'?'🤖 AUTO global ON':'👤 AUTO global OFF',true);
      try{
        if(typeof isAdminNotifier==='function' && isAdminNotifier()){
          if(window.currentOpenChatId && typeof abrirChatAdmin==='function') setTimeout(function(){abrirChatAdmin(window.currentOpenChatId,true);},80);
          else if(typeof abrirPanelChatsAdmin==='function') setTimeout(function(){abrirPanelChatsAdmin();},80);
        }
      }catch(e){}
    }catch(e){
      console.warn('toggle auto v101:',e);
      if(typeof oldToggle==='function') return oldToggle.apply(this,arguments);
    }
  };

  // Refuerzo visitante: después de enviar, si AUTO está ON y no apareció respuesta automática
  // en unos segundos, dispara una única segunda llamada. Evita duplicados comparando timestamps.
  var oldSend=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(id){
    var before=Date.now();
    var text='';
    try{ text=String((document.getElementById('chat-text')||{}).value||'').trim(); }catch(e){}
    var res=oldSend && oldSend.apply ? await oldSend.apply(this,arguments) : undefined;
    if(!text) return res;
    setTimeout(async function(){
      try{
        if(window.asistenteModo()!=='automatico') return;
        if(!id || typeof responderAutomaticoChat!=='function') return;
        var c=(typeof chatsDB!=='undefined' && chatsDB && chatsDB[id]) ? chatsDB[id] : null;
        var hasAuto=false;
        if(c && c.messages){
          Object.keys(c.messages).forEach(function(k){var m=c.messages[k]||{}; if(m.from==='admin' && m.auto && Number(m.createdAt||0)>before) hasAuto=true;});
        }
        if(hasAuto) return;
        await responderAutomaticoChat(id,text);
      }catch(e){console.warn('refuerzo visitante auto v101:',e);}
    },3600);
    return res;
  };

  startAutoListener(); setVersion(); syncFab();
  setTimeout(function(){startAutoListener(); setVersion(); syncFab();},600);
  setInterval(function(){setVersion(); syncFab();},3500);
})();
