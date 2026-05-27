// Tomauno modular v14 — estabilización AUTO/ADM + scroll + primer aviso.
// Reemplaza /js/21-patch-v101-auto-global-auditoria-fix.js
// No agrega archivos nuevos.
(function(){
  'use strict';
  var VERSION='Tomauno modular v17';
  var modoGlobal=null;
  var modoCargado=false;
  var listenerStarted=false;
  var pendingApply=false;
  var lastAdminFixAt=0;
  var notifiedChats={};
  var lastToastChatId='';
  var userReadingUntil=0;
  var lastAutoVisual='';

  function safe(fn){try{return fn();}catch(e){try{console.warn('modular v14:',e);}catch(_){}}}
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
           !!document.querySelector('#admin-section:not([style*="display: none"]),#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');
  })||false;}
  function getChats(){return safe(function(){return window.chatsDB||{};})||{};}
  function hasUnread(){return safe(function(){
    var db=getChats();
    return Object.keys(db).some(function(id){var c=db[id]||{};return c.status!=='cerrado' && (c.unreadAdmin||c.humanRequested||c.waitingHuman||c.priority);});
  })||false;}
  function currentChatId(){return safe(function(){return window.currentOpenChatId||window.currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id')||'';})||'';}
  function getInputText(){return safe(function(){
    var el=document.getElementById('chat-text')||document.getElementById('chat-input')||document.querySelector('.chat-row input,.chat-row textarea');
    return String((el&&el.value)||'').trim();
  })||'';}

  function isTypingNow(){return safe(function(){
    var a=document.activeElement;
    return !!(a && (a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.isContentEditable));
  })||false;}
  function setBodyModeClasses(){safe(function(){
    var adm=isAdminActive();
    document.body.classList.toggle('tomauno-admin-active',adm);
    document.body.classList.toggle('tomauno-visitor-active',!adm);
  });}
  function hideVisitorAdminAlerts(){safe(function(){
    if(isAdminActive()) return;
    Array.prototype.forEach.call(document.querySelectorAll('body *'),function(el){
      var txt=(el.innerText||'').trim();
      var cls=(el.className||'')+''; var id=(el.id||'')+'';
      if((/ATENCI[ÓO]N HUMANA|NUEVO CHAT WEB|Nuevo chat web|Nuevo mensaje web/i.test(txt) || /human|admin-alert|notify-admin/i.test(cls+' '+id)) && txt.length<350){
        if(!el.closest('.chat-popover')) el.style.display='none';
      }
    });
  });}
  function setupVisualViewport(){safe(function(){
    if(window.__tomaunoVV16) return; window.__tomaunoVV16=1;
    function upd(){
      var vv=window.visualViewport;
      var k=0;
      if(vv){ k=Math.max(0, window.innerHeight - vv.height - vv.offsetTop); }
      document.documentElement.style.setProperty('--tomauno-keyboard', Math.round(k)+'px');
      document.body.classList.toggle('tomauno-keyboard-open', k>80);
    }
    upd();
    if(window.visualViewport){visualViewport.addEventListener('resize',upd);visualViewport.addEventListener('scroll',upd);}
    window.addEventListener('orientationchange',function(){setTimeout(upd,250);});
  });}

  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag');
    if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;tag=document.createElement('span');tag.id='tomauno-version-tag';tag.className='tomauno-version-tag';f.appendChild(tag);} tag.textContent=VERSION;
  });}
  function ensureCss(){safe(function(){
    if(document.getElementById('tomauno-v14-css')) return;
    var st=document.createElement('style'); st.id='tomauno-v14-css';
    st.textContent = [
      'html body .chat-filter.auto{width:44px!important;min-width:44px!important;max-width:44px!important;height:26px!important;padding:0!important;border-radius:999px!important;font-size:8px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:2px!important;white-space:nowrap!important;overflow:hidden!important;text-transform:uppercase!important;}',
      'html body .chat-filter.auto .ico{display:none!important;}',
      'html body .chat-filter.auto .txt{font-size:8px!important;font-weight:900!important;line-height:1!important;margin:0!important;display:inline!important;}',
      'html body .chat-filter.auto.on{background:rgba(76,175,125,.14)!important;border-color:rgba(76,175,125,.45)!important;color:#7dffa9!important;}',
      'html body .chat-admin-tools{align-items:center!important;gap:5px!important;min-height:32px!important;}',
      'html body .chat-popover.tomauno-chat-visitor{width:min(430px,calc(100vw - 18px))!important;max-height:calc(100dvh - 36px)!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-popover-inner{height:100%!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-panel{height:100%!important;min-height:0!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-msgs{min-height:420px!important;max-height:calc(100dvh - 210px)!important;scroll-behavior:auto!important;padding-bottom:18px!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-row{margin-top:6px!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-title{font-size:23px!important;}',
      'html body .chat-popover.tomauno-chat-visitor .chat-subline{font-size:10.5px!important;}',
      'html body .chat-fab.auto-on:not(.admin-mode){background:radial-gradient(circle at 30% 20%,#ff3a42,var(--red) 55%,#830006)!important;box-shadow:0 18px 50px rgba(232,0,10,.28)!important;}',
      'html body .chat-fab.auto-on:not(.admin-mode)::after{display:none!important;}',
      'html body #admin-live-indicator{transition:none!important;}',
      '@media(max-width:700px){html body .chat-popover.tomauno-chat-visitor{left:8px!important;right:8px!important;width:auto!important;height:calc(100dvh - 96px)!important;max-height:calc(100dvh - 96px)!important;}html body .chat-popover.tomauno-chat-visitor .chat-msgs{max-height:none!important;min-height:0!important;height:auto!important;}html body .chat-popover.tomauno-chat-visitor .chat-row input,html body .chat-popover.tomauno-chat-visitor .chat-row textarea{font-size:16px!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  });}

  function renderAutoUI(){safe(function(){
    setBodyModeClasses();
    var auto=isAutoOn();
    var admin=isAdminActive();
    var state=(admin?'A':'V')+'-'+(auto?'AUTO':'MAN')+'-'+(hasUnread()?'U':'N')+'-'+(modoCargado?'L':'P');
    if(state===lastAutoVisual) return;
    lastAutoVisual=state;

    var fab=document.getElementById('chat-fab');
    if(fab){
      fab.classList.remove('auto-on');
      fab.classList.toggle('admin-mode',admin);
      fab.classList.toggle('has-new', !!(admin && hasUnread()));
      fab.title = admin ? (hasUnread()?'Hay chats sin leer':'Abrir bandeja de chats') : 'Abrir chat';
    }
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      var desired=auto?'AUTO':'MAN';
      if(b.getAttribute('data-v14-state')!==desired || b.textContent.trim()!==desired){
        b.setAttribute('data-v14-state',desired);
        b.setAttribute('data-auto-state',auto?'on':'off');
        b.classList.toggle('on',auto);
        b.innerHTML = '<span class="txt">'+desired+'</span>';
        b.title = auto ? 'Automático global activo. Clic para apagar.' : 'Manual global. Clic para activar automático.';
      }
    });
    var ind=document.getElementById('admin-live-indicator');
    var live=document.getElementById('admin-live-text')||ind;
    if(ind){
      ind.classList.toggle('on',admin);
      ind.classList.remove('off');
      ind.style.display = admin ? 'inline-flex' : '';
    }
    if(live && admin){
      var txt=auto?'ADM · AUTO':'ADM';
      if(live.textContent!==txt) live.textContent=txt;
    }
  });}
  function scheduleAutoUI(){
    if(pendingApply) return;
    pendingApply=true;
    requestAnimationFrame(function(){pendingApply=false;renderAutoUI();markModeClass();});
  }
  function startAutoListener(){safe(function(){
    if(listenerStarted) return;
    if(typeof db==='undefined'||typeof ref==='undefined'||typeof onValue==='undefined') return;
    listenerStarted=true;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      modoGlobal = snap && snap.exists && snap.exists() ? normModo(snap.val()) : 'manual';
      modoCargado=true;
      window.tomaunoAutoGlobalModo=modoGlobal;
      scheduleAutoUI();
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
      modoGlobal=nuevo; modoCargado=true; window.tomaunoAutoGlobalModo=nuevo; scheduleAutoUI();
      if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
        await update(ref(db,'tomauno/asistente'),{modo:nuevo, actualizado:Date.now()});
      }else if(typeof oldToggle==='function'){
        return oldToggle.apply(this,arguments);
      }
      if(typeof toast==='function') toast(nuevo==='automatico'?'AUTO activado':'MANUAL activado',true);
      setTimeout(function(){safe(function(){
        if(isAdminActive()){
          if(window.currentOpenChatId&&typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(window.currentOpenChatId,true);
          else if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin();
        }
      });},120);
    }catch(e){console.warn('toggle auto v14:',e); if(typeof oldToggle==='function') return oldToggle.apply(this,arguments);}
  };

  // Si se entra en ADM con chat visitante abierto, reconstruye toolbar admin sin cerrar/reabrir manualmente.
  function forceAdminChatIfNeeded(){safe(function(){
    if(!isAdminActive()) return;
    var pop=document.getElementById('chat-popover');
    if(!pop || !pop.classList.contains('open')) return;
    var hasAdmin=!!pop.querySelector('.chat-admin-tools,.chat-admin-actions,.chat-inbox-side,.chat-tabs,#chat-admin-text');
    if(hasAdmin) return;
    if(Date.now()-lastAdminFixAt<3500) return;
    lastAdminFixAt=Date.now();
    if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin();
  });}

  function updateChatUnread(chatId,text){safe(function(){
    if(!chatId || !text) return;
    if(typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
      update(ref(db,'tomauno/chats/'+chatId),{unreadAdmin:true,lastMsg:text,updatedAt:Date.now()}).catch(function(){});
    }
  });}
  function notifyFirst(chatId,text){safe(function(){
    if(!chatId || !text) return;
    var key='tomauno-first-notified-'+chatId;
    if(notifiedChats[chatId] || sessionStorage.getItem(key)==='1') return;
    notifiedChats[chatId]=1;
    try{sessionStorage.setItem(key,'1');}catch(e){}
    updateChatUnread(chatId,text);
    // La notificación visible solo se dispara en pestañas ADM. El visitante solo marca el chat en Firebase.
    if(isAdminActive() && typeof window.notifyAdminChat==='function') window.notifyAdminChat('Nuevo mensaje web',text,chatId);
  });}
  function retryFirstNotify(text, tries){
    tries=tries||0;
    setTimeout(function(){safe(function(){
      var id=currentChatId();
      if(id){notifyFirst(id,text);return;}
      if(tries<12) retryFirstNotify(text,tries+1);
    });}, tries?350:120);
  }

  var oldVisitorSend=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(){
    var text=getInputText();
    var before=Date.now();
    var res=oldVisitorSend&&oldVisitorSend.apply?await oldVisitorSend.apply(this,arguments):undefined;
    if(text) retryFirstNotify(text,0);
    // Si AUTO está activo, reforzamos respuesta solo si el motor viejo no respondió.
    if(text){setTimeout(async function(){safe(async function(){
      if(window.asistenteModo()!=='automatico') return;
      var chatId=currentChatId();
      if(!chatId || typeof window.responderAutomaticoChat!=='function') return;
      var c=(window.chatsDB&&window.chatsDB[chatId])?window.chatsDB[chatId]:null, has=false;
      if(c&&c.messages){Object.keys(c.messages).forEach(function(k){var m=c.messages[k]||{}; if(m.from==='admin'&&m.auto&&Number(m.createdAt||0)>before) has=true;});}
      if(!has) await window.responderAutomaticoChat(chatId,text);
      softScrollNewMessage();
    });},3200);}
    setTimeout(softScrollNewMessage,80);
    setTimeout(softScrollNewMessage,450);
    return res;
  };

  var oldInitName=window.iniciarChatConNombre;
  window.iniciarChatConNombre=async function(){
    var raw=safe(function(){return String((document.getElementById('chat-name')||{}).value||'').trim();})||'';
    var res=oldInitName&&oldInitName.apply?await oldInitName.apply(this,arguments):undefined;
    if(raw) retryFirstNotify('Nombre: '+raw,0);
    setTimeout(function(){syncTitleName();softScrollNewMessage();},250);
    return res;
  };

  // Si Javier escribe manualmente, ese chat queda marcado como humano para que AUTO no lo pise.
  var oldAdminSend=window.enviarChatAdmin;
  if(typeof oldAdminSend==='function'){
    window.enviarChatAdmin=async function(){
      var id=window.currentOpenChatId||currentChatId();
      var res=await oldAdminSend.apply(this,arguments);
      safe(function(){
        if(id && typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'){
          update(ref(db,'tomauno/chats/'+id),{humanMode:true,manualUntil:Date.now()+1000*60*60,unreadAdmin:false}).catch(function(){});
        }
      });
      return res;
    };
  }

  // No responder automático si el chat fue tomado manualmente.
  var oldResponder=window.responderAutomaticoChat;
  if(typeof oldResponder==='function'){
    window.responderAutomaticoChat=async function(chatId,text){
      var c=(window.chatsDB&&window.chatsDB[chatId])?window.chatsDB[chatId]:null;
      if(c && (c.humanMode || Number(c.manualUntil||0)>Date.now())) return;
      return oldResponder.apply(this,arguments);
    };
  }


  var adminSeenMsgs={};
  function latestUserText(c){
    var best=null, bt=0;
    if(c&&c.messages){Object.keys(c.messages).forEach(function(k){var m=c.messages[k]||{}; var t=Number(m.createdAt||m.ts||0); if((m.from==='user'||m.role==='user'||m.sender==='user') && t>=bt){bt=t; best=String(m.text||m.msg||m.body||'').trim();}});}
    return best || String((c&&(c.lastUserMsg||c.lastMsg||c.preview))||'').trim();
  }
  function pollAdminUnread(){safe(function(){
    if(!isAdminActive()) return;
    var dbs=getChats();
    Object.keys(dbs).forEach(function(id){
      var c=dbs[id]||{};
      if(c.status==='cerrado') return;
      var txt=latestUserText(c);
      var stamp=String(c.updatedAt||c.lastAt||c.createdAt||'')+'|'+txt;
      if(!txt || adminSeenMsgs[id]===stamp) return;
      if(c.unreadAdmin||c.humanRequested||c.waitingHuman||c.priority){
        adminSeenMsgs[id]=stamp;
        if(typeof window.notifyAdminChat==='function') window.notifyAdminChat(c.humanRequested?'Atención humana':'Nuevo chat web',txt,id);
      }
    });
  });}


  var oldAbrirChatAdmin=window.abrirChatAdmin;
  if(typeof oldAbrirChatAdmin==='function'){
    window.abrirChatAdmin=function(chatId){
      var r=oldAbrirChatAdmin.apply(this,arguments);
      safe(function(){
        if(chatId && typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined') update(ref(db,'tomauno/chats/'+chatId),{unreadAdmin:false}).catch(function(){});
        setTimeout(syncTitleName,80); setTimeout(renderAutoUI,120);
      });
      return r;
    };
  }

  // Toast/admin notification: nunca debe quedar en visitante y click abre chat.
  var oldNotify=window.notifyAdminChat;
  window.notifyAdminChat=function(title,body,chatId){
    if(chatId) lastToastChatId=chatId;
    if(!isAdminActive()) return;
    var clean=String(body||'').replace(/\s+/g,' ').trim();
    if(clean.length>180) clean=clean.slice(0,177)+'...';
    var r; try{r=oldNotify&&oldNotify.apply?oldNotify.call(this,title||'Nuevo chat web',clean,chatId):undefined;}catch(e){}
    setTimeout(hideVisitorAdminAlerts,30);
    setTimeout(function(){safe(function(){
      var toastEl=document.getElementById('toast');
      if(toastEl && lastToastChatId){toastEl.style.cursor='pointer';toastEl.onclick=function(){try{window.abrirChatAdmin&&window.abrirChatAdmin(lastToastChatId);}catch(e){}};}
    });},60);
    return r;
  };
  try{notifyAdminChat=window.notifyAdminChat;}catch(e){}

  function markModeClass(){safe(function(){
    var pop=document.getElementById('chat-popover'); if(!pop) return;
    var adm=isAdminActive() && !!pop.querySelector('.chat-admin-tools,.chat-admin-actions,.chat-inbox-side,.chat-tabs,#chat-admin-text');
    pop.classList.toggle('tomauno-chat-admin',adm);
    pop.classList.toggle('tomauno-chat-visitor',!adm);
    if(!adm){
      var title=pop.querySelector('.chat-title'); if(title && /^(usuario|[a-zñáéíóúü ]{1,25})$/i.test(title.textContent.trim())) title.textContent='CHAT TOMAUNO';
      var sub=pop.querySelector('.chat-subline'); if(sub && /admin|whatsapp|en línea/i.test(sub.textContent||'')) sub.textContent='Consulta directa desde la web';
    }
  });}

  function syncTitleName(){safe(function(){
    var id=currentChatId(); if(!id) return;
    var c=(window.chatsDB&&window.chatsDB[id])?window.chatsDB[id]:null; if(!c||!c.name) return;
    var pop=document.getElementById('chat-popover'); if(!pop) return;
    var adm=isAdminActive() && !!pop.querySelector('.chat-admin-tools,.chat-admin-actions,.chat-inbox-side,.chat-tabs,#chat-admin-text');
    if(adm){var title=pop.querySelector('.chat-title'); if(title) title.textContent=String(c.name).toUpperCase();}
  });}

  function nearBottom(el){return !el || (el.scrollHeight-el.scrollTop-el.clientHeight)<90;}
  function softScrollNewMessage(){safe(function(){
    var box=document.querySelector('#chat-popover.open .chat-msgs'); if(!box) return;
    if(Date.now()<userReadingUntil) return;
    requestAnimationFrame(function(){box.scrollTop=box.scrollHeight;});
  });}
  function installScrollGuard(){safe(function(){
    document.addEventListener('scroll',function(e){
      var el=e.target;
      if(el && el.classList && el.classList.contains('chat-msgs') && !nearBottom(el)) userReadingUntil=Date.now()+8000;
    },true);
    var obs=new MutationObserver(function(muts){
      var relevant=false;
      muts.forEach(function(m){if(m.addedNodes&&m.addedNodes.length){Array.prototype.forEach.call(m.addedNodes,function(n){if(n.nodeType===1 && (n.classList&&n.classList.contains('chat-bubble') || (n.querySelector&&n.querySelector('.chat-bubble')))) relevant=true;});}});
      if(relevant) setTimeout(softScrollNewMessage,80);
    });
    obs.observe(document.documentElement,{childList:true,subtree:true});
  });}

  function shortenWelcome(){safe(function(){
    document.querySelectorAll('.chat-bubble.admin').forEach(function(b){
      var t=b.innerText||'';
      if(/Soy el Asistente de Tomauno/i.test(t) && /Cómo es tu nombre/i.test(t) && !b.getAttribute('data-short-v16')){
        b.setAttribute('data-short-v16','1');
        b.innerHTML='Hola 😊<br><strong>¿Cómo es tu nombre?</strong><div class="chat-meta">Ahora</div>';
      }
    });
  });}



  // v17: al cerrar sesión ADM, cerrar la ventana actual del chat para evitar mezclar UI admin/visitante.
  function closeChatWindowForAdminLogout(){safe(function(){
    var pop=document.getElementById('chat-popover');
    if(pop){
      pop.classList.remove('open','expanded','tomauno-chat-admin');
      pop.classList.add('tomauno-chat-visitor');
      pop.style.display='';
    }
    document.body.classList.remove('chat-open-mobile');
    document.documentElement.classList.remove('chat-open-mobile');
    if(typeof window.currentOpenChatId!=='undefined') window.currentOpenChatId='';
  });}
  var oldCerrarAdmin=window.cerrarAdmin;
  if(typeof oldCerrarAdmin==='function'){
    window.cerrarAdmin=function(){
      closeChatWindowForAdminLogout();
      var r=oldCerrarAdmin.apply(this,arguments);
      setTimeout(function(){closeChatWindowForAdminLogout(); scheduleAutoUI(); markModeClass();},120);
      return r;
    };
    try{cerrarAdmin=window.cerrarAdmin;}catch(e){}
  }

  function run(){ensureCss();setVersion();setupVisualViewport();startAutoListener();scheduleAutoUI();forceAdminChatIfNeeded();markModeClass();syncTitleName();shortenWelcome();hideVisitorAdminAlerts();pollAdminUnread();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){run();installScrollGuard();}); else {run();installScrollGuard();}
  setTimeout(run,300); setTimeout(run,1200); setTimeout(run,2500);
  // intervalo suave solo para corregir renders viejos, sin mutar Firebase ni parpadear visualmente
  setInterval(function(){scheduleAutoUI();markModeClass();syncTitleName();if(!isTypingNow()) shortenWelcome();hideVisitorAdminAlerts();pollAdminUnread();},2200);
  safe(function(){new MutationObserver(function(){setTimeout(function(){scheduleAutoUI();forceAdminChatIfNeeded();markModeClass();syncTitleName();if(!isTypingNow()) shortenWelcome();hideVisitorAdminAlerts();},80);}).observe(document.documentElement,{childList:true,subtree:true});});
})();
