// Tomauno modular v13 — AUTO estable + transición ADM + primer aviso.
// Reemplaza /js/21-patch-v101-auto-global-auditoria-fix.js
(function(){
  'use strict';
  var VERSION='Tomauno modular v13';
  var modoGlobal=null;
  var listenerStarted=false;
  var lastAppliedAuto=null;
  var lastAdminFixAt=0;
  var lastFirstNotifyAt=0;

  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v13:',e);}catch(_){}}}
  function normModo(v){v=String(v||'').toLowerCase().trim();return (v==='automatico'||v==='auto'||v==='on'||v==='true'||v==='1')?'automatico':'manual';}
  function isAutoOn(){
    if(modoGlobal) return modoGlobal==='automatico';
    try{if(window.tomaunoAutoGlobalModo) return normModo(window.tomaunoAutoGlobalModo)==='automatico';}catch(e){}
    try{if(window.asistenteDB&&window.asistenteDB.modo) return normModo(window.asistenteDB.modo)==='automatico';}catch(e){}
    return false;
  }
  function isAdminActive(){return safe(function(){
    return localStorage.getItem('tomauno-admin-ok')==='1' ||
           localStorage.getItem('tomauno-admin-notify')==='1' ||
           !!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');
  })||false;}
  function hasUnread(){return safe(function(){
    var db=window.chatsDB||{};
    return Object.keys(db).some(function(id){var c=db[id]||{};return c.status!=='cerrado' && (c.unreadAdmin||c.humanRequested||c.waitingHuman||c.priority);});
  })||false;}
  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag');
    if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;tag=document.createElement('span');tag.id='tomauno-version-tag';tag.className='tomauno-version-tag';f.appendChild(tag);} tag.textContent=VERSION;
  });}
  function ensureCss(){safe(function(){
    if(document.getElementById('tomauno-v13-css')) return;
    var st=document.createElement('style'); st.id='tomauno-v13-css';
    st.textContent = [
      'html body .chat-filter.auto{width:54px!important;min-width:54px!important;max-width:54px!important;height:29px!important;padding:0 5px!important;border-radius:999px!important;font-size:8px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:3px!important;white-space:nowrap!important;overflow:hidden!important;}',
      'html body .chat-filter.auto .ico{font-size:7px!important;line-height:1!important;margin:0!important;}',
      'html body .chat-filter.auto .txt{font-size:8px!important;font-weight:900!important;line-height:1!important;margin:0!important;display:inline!important;}',
      'html body .chat-admin-tools{align-items:center!important;gap:5px!important;}',
      'html body .chat-popover.tomauno-chat-visitor{width:min(390px,calc(100vw - 20px))!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-msgs{min-height:360px!important;max-height:calc(100dvh - 230px)!important;}',
      '@media(max-width:700px){html body .chat-popover.tomauno-chat-visitor{left:8px!important;right:8px!important;width:auto!important;height:calc(100dvh - 96px)!important;max-height:calc(100dvh - 96px)!important;}html body .chat-popover.tomauno-chat-visitor .chat-msgs{max-height:none!important;min-height:0!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  });}
  function applyAutoUI(force){safe(function(){
    var auto=isAutoOn();
    var admin=isAdminActive();
    var fab=document.getElementById('chat-fab');
    if(fab){
      // En visitantes el botón NO representa AUTO; solo chat normal. En admin muestra pendientes.
      fab.classList.remove('auto-on');
      fab.classList.toggle('has-new', !!(admin && hasUnread()));
      fab.title = admin ? (hasUnread()?'Hay chats sin leer':'Abrir bandeja de chats') : 'Abrir chat';
    }
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      var desired=auto?'AUTO':'MAN';
      if(force || b.getAttribute('data-v13-state')!==desired || b.textContent.trim()!==desired){
        b.setAttribute('data-v13-state',desired);
        b.setAttribute('data-auto-state',auto?'on':'off');
        b.classList.toggle('on',auto);
        b.innerHTML = auto ? '<span class="ico">🟢</span><span class="txt">AUTO</span>' : '<span class="ico">🔴</span><span class="txt">MAN</span>';
        b.title = auto ? 'Automático global activo. Clic para apagar.' : 'Manual global. Clic para activar automático.';
      }
    });
    var live=document.getElementById('admin-live-text')||document.querySelector('#admin-live-indicator');
    if(live && admin){
      var txt=auto?'ADM · AUTO':'ADM';
      if(live.textContent!==txt) live.textContent=txt;
    }
    lastAppliedAuto=auto;
  });}
  function startAutoListener(){safe(function(){
    if(listenerStarted) return;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    listenerStarted=true;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      modoGlobal = snap && snap.exists && snap.exists() ? normModo(snap.val()) : 'manual';
      window.tomaunoAutoGlobalModo=modoGlobal;
      applyAutoUI(true);
    });
  });}

  var oldModo=window.asistenteModo;
  window.asistenteModo=function(){
    if(modoGlobal) return modoGlobal;
    try{if(window.tomaunoAutoGlobalModo) return normModo(window.tomaunoAutoGlobalModo);}catch(e){}
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
      modoGlobal=nuevo; window.tomaunoAutoGlobalModo=nuevo; applyAutoUI(true);
      if(typeof toast==='function') toast(nuevo==='automatico'?'🟢 AUTO activado':'🔴 MANUAL activado',true);
      setTimeout(function(){try{if(isAdminActive()){if(window.currentOpenChatId&&typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(window.currentOpenChatId,true); else if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin();}}catch(e){}},120);
    }catch(e){console.warn('toggle auto v13:',e); if(typeof oldToggle==='function') return oldToggle.apply(this,arguments);}
  };

  // Si el usuario estaba mirando chat visitante y entra a ADM, reconstruir UI admin sin que deba cerrar/reabrir.
  function forceAdminChatIfNeeded(){safe(function(){
    if(!isAdminActive()) return;
    var pop=document.getElementById('chat-popover');
    if(!pop || !pop.classList.contains('open')) return;
    var hasAdmin=!!pop.querySelector('.chat-admin-tools,.chat-admin-actions,.chat-inbox-side,.chat-tabs,#chat-admin-text');
    if(hasAdmin) return;
    if(Date.now()-lastAdminFixAt<2500) return;
    lastAdminFixAt=Date.now();
    if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin();
  });}

  function getInputText(){return safe(function(){
    var el=document.getElementById('chat-text')||document.querySelector('.chat-row input,.chat-row textarea');
    return String((el&&el.value)||'').trim();
  })||'';}
  function firstNotify(chatId,text){safe(function(){
    if(!chatId || !text || Date.now()-lastFirstNotifyAt<800) return;
    lastFirstNotifyAt=Date.now();
    try{sessionStorage.setItem('tomauno-first-notified-'+chatId,'1');}catch(e){}
    if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      update(ref(db,'tomauno/chats/'+chatId),{unreadAdmin:true,lastMsg:text,updatedAt:Date.now()}).catch(function(){});
    }
    if(isAdminActive() && typeof window.notifyAdminChat==='function') window.notifyAdminChat('Nuevo mensaje web',text,chatId);
  });}

  var oldVisitorSend=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(id){
    var text=getInputText();
    var chatId=id||window.currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id')||'';
    var before=Date.now();
    var res=oldVisitorSend&&oldVisitorSend.apply?await oldVisitorSend.apply(this,arguments):undefined;
    if(text && chatId && !sessionStorage.getItem('tomauno-first-notified-'+chatId)) firstNotify(chatId,text);
    // Refuerzo AUTO sin duplicar si ya respondió.
    if(text){setTimeout(async function(){safe(async function(){
      if(window.asistenteModo()!=='automatico') return;
      if(!chatId || typeof window.responderAutomaticoChat!=='function') return;
      var c=(window.chatsDB&&window.chatsDB[chatId])?window.chatsDB[chatId]:null, has=false;
      if(c&&c.messages){Object.keys(c.messages).forEach(function(k){var m=c.messages[k]||{}; if(m.from==='admin'&&m.auto&&Number(m.createdAt||0)>before) has=true;});}
      if(!has) await window.responderAutomaticoChat(chatId,text);
    });},3600);}
    return res;
  };

  var oldInitName=window.iniciarChatConNombre;
  window.iniciarChatConNombre=async function(){
    var raw=safe(function(){return String((document.getElementById('chat-name')||{}).value||'').trim();})||'';
    var res=oldInitName&&oldInitName.apply?await oldInitName.apply(this,arguments):undefined;
    setTimeout(function(){
      var id=window.currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id')||'';
      if(id && raw) firstNotify(id,'Inició chat: '+raw);
    },250);
    return res;
  };

  // Click en toast/notificación visual abre chat reciente si existe.
  var lastNoticeId='';
  var oldNotify=window.notifyAdminChat;
  window.notifyAdminChat=function(title,body,chatId){
    if(chatId) lastNoticeId=chatId;
    var r; try{r=oldNotify&&oldNotify.apply?oldNotify.apply(this,arguments):undefined;}catch(e){}
    setTimeout(function(){safe(function(){
      var toastEl=document.getElementById('toast');
      if(toastEl && lastNoticeId){toastEl.style.cursor='pointer';toastEl.onclick=function(){try{window.abrirChatAdmin&&window.abrirChatAdmin(lastNoticeId);}catch(e){}};}
    });},60);
    return r;
  };
  try{notifyAdminChat=window.notifyAdminChat;}catch(e){}

  function markVisitorClass(){safe(function(){
    var pop=document.getElementById('chat-popover'); if(!pop) return;
    var adm=isAdminActive() && !!pop.querySelector('.chat-admin-tools,.chat-admin-actions,.chat-inbox-side,.chat-tabs,#chat-admin-text');
    pop.classList.toggle('tomauno-chat-admin',adm);
    pop.classList.toggle('tomauno-chat-visitor',!adm);
  });}

  function run(){ensureCss();setVersion();startAutoListener();applyAutoUI(false);forceAdminChatIfNeeded();markVisitorClass();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setTimeout(run,600); setTimeout(run,1500);
  setInterval(run,700);
  safe(function(){new MutationObserver(function(){setTimeout(function(){applyAutoUI(false);forceAdminChatIfNeeded();markVisitorClass();},25);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});});
})();
