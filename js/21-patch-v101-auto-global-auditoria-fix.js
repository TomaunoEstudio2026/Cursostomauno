// Tomauno modular v14 — estabilización AUTO/ADM + scroll + primer aviso.
// Reemplaza /js/21-patch-v101-auto-global-auditoria-fix.js
// No agrega archivos nuevos.
(function(){
  'use strict';
  var VERSION='Tomauno modular v18';
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

  var typingKeep={el:null,value:'',sel:0,at:0};
  function rememberTyping(){safe(function(){
    var a=document.activeElement;
    if(a && a.closest && a.closest('#chat-popover') && (a.tagName==='INPUT'||a.tagName==='TEXTAREA')){
      typingKeep={el:a,value:a.value||'',sel:a.selectionStart||0,at:Date.now()};
    }
  });}
  function restoreTyping(){safe(function(){
    if(!typingKeep.el || Date.now()-typingKeep.at>2500) return;
    var el=typingKeep.el;
    if(!document.body.contains(el)){
      el=document.querySelector('#chat-popover.open .chat-row input,#chat-popover.open .chat-row textarea,#chat-popover.open .chat-row .finput');
    }
    if(!el) return;
    if((el.value||'')!==typingKeep.value) el.value=typingKeep.value;
    el.focus({preventScroll:true});
    try{el.setSelectionRange(typingKeep.sel,typingKeep.sel);}catch(_){ }
  });}
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
      if((/ATENCI[ÓO]N HUMANA|NUEVO CHAT WEB|Nuevo chat web|Nuevo mensaje web|a:\s*quiero hablar/i.test(txt) || /human|admin-alert|notify-admin|toast/i.test(cls+' '+id)) && txt.length<500){
        el.style.display='none';
        el.style.visibility='hidden';
        el.style.pointerEvents='none';
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

  function ensureCssV18(){safe(function(){
    if(document.getElementById('tomauno-v18-css')) return;
    var st=document.createElement('style'); st.id='tomauno-v18-css';
    st.textContent='body.tomauno-visitor-active .chat-popover.open{width:min(410px,calc(100vw - 18px))!important;height:min(78vh,720px)!important;max-height:min(78vh,720px)!important;}body.tomauno-visitor-active .chat-popover.open .chat-panel{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;}body.tomauno-visitor-active .chat-popover.open .chat-msgs{flex:1 1 auto!important;min-height:0!important;max-height:none!important;height:auto!important;padding-bottom:8px!important;}body.tomauno-visitor-active .chat-popover.open .chat-row{flex:0 0 auto!important;margin-top:8px!important;}body.tomauno-visitor-active #toast,body.tomauno-visitor-active [class*=human],body.tomauno-visitor-active [class*=admin-alert]{display:none!important;visibility:hidden!important;pointer-events:none!important;}@media(max-width:700px){body.tomauno-visitor-active .chat-popover.open{left:8px!important;right:8px!important;width:auto!important;bottom:calc(var(--tomauno-keyboard,0px) + 8px)!important;height:calc(100dvh - var(--tomauno-keyboard,0px) - 18px)!important;max-height:calc(100dvh - var(--tomauno-keyboard,0px) - 18px)!important;min-height:260px!important;}body.tomauno-visitor-active .chat-popover.open .chat-row input,body.tomauno-visitor-active .chat-popover.open .chat-row textarea{font-size:16px!important;}}';
    document.head.appendChild(st);
  });}

  function renderAutoUI(){safe(function(){
    rememberTyping();
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
    if(isTypingNow() && isAdminActive()) setTimeout(restoreTyping,30);
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
      if(window.currentOpenChatId && typeof window.tomaunoToggleModoChatActual==='function' && document.querySelector('#chat-popover.open #chat-admin-text')){
        return window.tomaunoToggleModoChatActual(window.currentOpenChatId);
      }
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
    if(document.activeElement && (document.activeElement.id==='chat-name' || document.activeElement.id==='chat-text')) return;
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
    var invalid=/^(hola|buenas|buen dia|buenas tardes|buenas noches|ok|si|sí|no|a|.)$/i.test(raw) || raw.length<2 || raw.length>45;
    if(invalid){
      safe(function(){
        var inp=document.getElementById('chat-name'); if(inp){inp.value=''; inp.placeholder='Tu nombre'; inp.focus({preventScroll:true});}
        var box=document.querySelector('#chat-popover.open .chat-msgs');
        if(box && !box.querySelector('[data-v18-askname]')){var b=document.createElement('div'); b.className='chat-bubble admin'; b.setAttribute('data-v18-askname','1'); b.innerHTML='¿Cómo es tu nombre? 😊<div class="chat-meta">Ahora</div>'; box.appendChild(b); box.scrollTop=box.scrollHeight;}
      });
      retryFirstNotify(raw||'Nuevo chat',0);
      return;
    }
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
        if(chatId && typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined') update(ref(db,'tomauno/chats/'+chatId),{unreadAdmin:false,priority:false,waitingHuman:false,humanRequested:false}).catch(function(){});
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
    if(isTypingNow()) return;
    document.querySelectorAll('.chat-bubble.admin').forEach(function(b){
      var t=b.innerText||'';
      if(/Cómo es tu nombre/i.test(t) && (t.length>45 || /Asistente de Tomauno|Puedo ayudarte|Mientras Javier/i.test(t)) && !b.getAttribute('data-short-v16')){
        b.setAttribute('data-short-v16','1');
        b.innerHTML='Hola 😊<br><strong>¿Cómo es tu nombre?</strong><div class="chat-meta">Ahora</div>';
      }
      if(/Gracias,\s*[^.]+\.\s*Aguard/i.test(t)){
        b.innerHTML=b.innerHTML.replace(/Gracias,\s*[^.]+\.\s*/i,'');
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

  var lastAdminState=isAdminActive();
  function watchAdminTransition(){safe(function(){
    var now=isAdminActive();
    if(lastAdminState && !now) closeChatWindowForAdminLogout();
    lastAdminState=now;
  });}
  function run(){ensureCss();ensureCssV18();setVersion();setupVisualViewport();startAutoListener();scheduleAutoUI();forceAdminChatIfNeeded();watchAdminTransition();markModeClass();syncTitleName();shortenWelcome();hideVisitorAdminAlerts();pollAdminUnread();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){run();installScrollGuard();}); else {run();installScrollGuard();}
  setTimeout(run,300); setTimeout(run,1200); setTimeout(run,2500);
  // intervalo suave solo para corregir renders viejos, sin mutar Firebase ni parpadear visualmente
  setInterval(function(){scheduleAutoUI();markModeClass();syncTitleName();if(!isTypingNow()) shortenWelcome();hideVisitorAdminAlerts();pollAdminUnread();},2200);
  safe(function(){new MutationObserver(function(){setTimeout(function(){scheduleAutoUI();forceAdminChatIfNeeded();markModeClass();syncTitleName();if(!isTypingNow()) shortenWelcome();hideVisitorAdminAlerts();},80);}).observe(document.documentElement,{childList:true,subtree:true});});
})();

/* v19.1 - cierre real visitante: congela foco/scroll mientras escribe. */
(function(){
  'use strict';
  function safe(fn){try{return fn();}catch(e){try{console.warn('visitor lock v19.1:',e);}catch(_){}}}
  function isAdmin(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok')==='1' ||
        localStorage.getItem('tomauno-admin-notify')==='1' ||
        !!document.querySelector('#chat-popover.open #chat-admin-text,#chat-popover.open .chat-inbox-side,#chat-popover.open .chat-admin-tools');
    })||false;
  }
  function autoOn(){
    return safe(function(){
      if(typeof window.asistenteModo==='function') return window.asistenteModo()==='automatico';
      return String(window.tomaunoAutoGlobalModo||'').toLowerCase()==='automatico';
    })||false;
  }
  function input(){
    return safe(function(){
      if(isAdmin()) return null;
      var pop=document.getElementById('chat-popover');
      var el=document.getElementById('chat-name')||
        document.getElementById('chat-text')||
        document.querySelector('#chat-popover.open .chat-name-row input,#chat-popover.open .chat-row input,#chat-popover.open .chat-row textarea');
      return pop&&pop.classList.contains('open')&&el ? el : null;
    })||null;
  }
  function writing(){
    var el=input();
    return !!(el && document.activeElement===el);
  }
  var lock={active:false,value:'',start:0,end:0,top:0,until:0};
  var sendingUntil=0;
  function hardClearInput(id){
    ['chat-text','chat-name'].forEach(function(elId){
      if(id && elId!==id) return;
      var el=document.getElementById(elId);
      if(el) el.value='';
    });
    lock.active=false;
    sendingUntil=Date.now()+900;
  }
  function beepAdmin(){
    safe(function(){
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return;
      var ctx=new AC();
      var now=ctx.currentTime;
      [740,940].forEach(function(freq,i){
        var osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type='sine';
        osc.frequency.setValueAtTime(freq,now+i*.13);
        gain.gain.setValueAtTime(.0001,now+i*.13);
        gain.gain.exponentialRampToValueAtTime(.18,now+i*.13+.02);
        gain.gain.exponentialRampToValueAtTime(.0001,now+i*.13+.12);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now+i*.13); osc.stop(now+i*.13+.14);
      });
      setTimeout(function(){safe(function(){ctx.close();});},600);
    });
  }
  function capture(){
    var el=input();
    if(!el) return;
    var box=document.querySelector('#chat-popover.open .chat-msgs');
    lock.active=true;
    lock.value=el.value||'';
    lock.start=el.selectionStart||0;
    lock.end=el.selectionEnd||lock.start;
    lock.top=box?box.scrollTop:0;
    lock.until=Date.now()+2500;
    if(box) box.setAttribute('data-tu-lock-top',String(lock.top));
  }
  function restore(){
    if(Date.now()<sendingUntil) return;
    if(!lock.active || Date.now()>lock.until) return;
    var el=input();
    if(!el) return;
    if((el.value||'')!==lock.value) el.value=lock.value;
    try{el.focus({preventScroll:true});el.setSelectionRange(lock.start,lock.end);}catch(e){try{el.focus();}catch(_e){}}
    var box=document.querySelector('#chat-popover.open .chat-msgs');
    if(box) box.scrollTop=lock.top;
  }
  function cleanVisitor(){
    safe(function(){
      if(isAdmin()) return;
      if(writing()) return;
      document.querySelectorAll('#chat-popover.open .chat-bubble.system').forEach(function(b){
        if(/Si no respondo pronto|WhatsApp directo/i.test(b.innerText||'')) b.remove();
      });
      var title=document.querySelector('#chat-popover.open .chat-title');
      if(title) title.textContent=autoOn()?'CHAT TOMAUNO':'JAVIER';
      var sub=document.querySelector('#chat-popover.open .chat-subline');
      if(sub) sub.textContent=autoOn()?'Consulta directa desde la web':'Javier esta respondiendo';
    });
  }
  function css(){
    if(document.getElementById('tu-v191-visitor-lock-css')) return;
    var st=document.createElement('style');
    st.id='tu-v191-visitor-lock-css';
    st.textContent=[
      'html body:not(.tomauno-admin-active) #chat-popover.open:not(:has(.chat-inbox-side)),html body.tomauno-visitor-active #chat-popover.open:not(:has(.chat-inbox-side)){width:min(430px,calc(100vw - 22px))!important;max-width:min(430px,calc(100vw - 22px))!important;right:16px!important;bottom:84px!important;height:min(70vh,620px)!important;max-height:min(70vh,620px)!important;}',
      'html body #chat-popover.open.tomauno-chat-visitor,html body #chat-popover.open.tu89-visitor,html body.tomauno-visitor-active #chat-popover.open,html body:not(.tomauno-admin-active) #chat-popover.open:not(:has(.chat-inbox-side)){width:min(430px,calc(100vw - 22px))!important;max-width:min(430px,calc(100vw - 22px))!important;right:16px!important;}',
      'html body #notif-banner{z-index:99999!important;}',
      'html body:not(.tomauno-admin-active) #chat-popover.open .chat-popover-inner,html body.tomauno-visitor-active #chat-popover.open .chat-popover-inner{height:100%!important;overflow:hidden!important;}',
      'html body:not(.tomauno-admin-active) #chat-popover.open .chat-panel,html body.tomauno-visitor-active #chat-popover.open .chat-panel{height:100%!important;min-height:0!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;}',
      'html body:not(.tomauno-admin-active) #chat-popover.open .chat-msgs,html body.tomauno-visitor-active #chat-popover.open .chat-msgs{flex:1 1 auto!important;min-height:0!important;max-height:none!important;scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      'html body:not(.tomauno-admin-active) #chat-popover.open .chat-row,html body.tomauno-visitor-active #chat-popover.open .chat-row{flex:0 0 auto!important;margin-top:8px!important;}',
      'html body.tu-visitor-writing #chat-popover.open,html body.tu-visitor-writing #chat-popover.open *{transition:none!important;animation:none!important;}',
      '@media(max-width:700px){html body:not(.tomauno-admin-active) #chat-popover.open,html body.tomauno-visitor-active #chat-popover.open{left:10px!important;right:10px!important;width:auto!important;height:calc(100dvh - var(--tomauno-keyboard,0px) - 22px)!important;max-height:calc(100dvh - var(--tomauno-keyboard,0px) - 22px)!important;bottom:calc(var(--tomauno-keyboard,0px) + 8px)!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function wrap(name){
    var old=window[name];
    if(typeof old!=='function' || old.__tuVisitorLock) return;
    var wrapped=function(){
      var was=writing();
      if(name==='enviarChatVisitante'){
        sendingUntil=Date.now()+1200;
        lock.active=false;
        var out=old.apply(this,arguments);
        Promise.resolve(out).finally(function(){
          hardClearInput('chat-text');
          setTimeout(function(){hardClearInput('chat-text');},80);
          setTimeout(function(){hardClearInput('chat-text');},260);
        });
        return out;
      }
      if(was && name==='scrollChatSmart') return;
      if(was) capture();
      var out=old.apply(this,arguments);
      if(was){setTimeout(restore,0);setTimeout(restore,30);setTimeout(cleanVisitor,35);}
      else setTimeout(cleanVisitor,30);
      return out;
    };
    wrapped.__tuVisitorLock=1;
    window[name]=wrapped;
    try{ if(name==='updateChatMessagesOnly') updateChatMessagesOnly=wrapped; }catch(e){}
    try{ if(name==='abrirChatVisitante') abrirChatVisitante=wrapped; }catch(e){}
    try{ if(name==='scrollChatSmart') scrollChatSmart=wrapped; }catch(e){}
  }
  function install(){
    css();
    wrap('updateChatMessagesOnly');
    wrap('abrirChatVisitante');
    wrap('scrollChatSmart');
    wrap('enviarChatVisitante');
    document.addEventListener('keydown',function(e){
      if(!e || e.key!=='Enter') return;
      if(e.target && e.target.id==='chat-text'){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        sendingUntil=Date.now()+1200;
        lock.active=false;
        var id=(window.currentOpenChatId||window.currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id')||'');
        var out=window.enviarChatVisitante&&window.enviarChatVisitante(id);
        Promise.resolve(out).finally(function(){
          hardClearInput('chat-text');
          setTimeout(function(){hardClearInput('chat-text');},80);
          setTimeout(function(){hardClearInput('chat-text');},260);
        });
      }else if(e.target && e.target.id==='chat-name'){
        e.preventDefault();
        e.stopPropagation();
        if(e.stopImmediatePropagation) e.stopImmediatePropagation();
        var outName=window.iniciarChatConNombre&&window.iniciarChatConNombre();
        Promise.resolve(outName).finally(function(){
          hardClearInput('chat-name');
        });
      }
    },true);
    document.addEventListener('focusin',function(e){
      if(e.target&&(e.target.id==='chat-text'||e.target.id==='chat-name')){document.body.classList.add('tu-visitor-writing');capture();}
    },true);
    document.addEventListener('input',function(e){
      if(e.target&&(e.target.id==='chat-text'||e.target.id==='chat-name')){capture();restore();}
    },true);
    document.addEventListener('focusout',function(e){
      if(e.target&&(e.target.id==='chat-text'||e.target.id==='chat-name')) setTimeout(function(){document.body.classList.remove('tu-visitor-writing');lock.active=false;cleanVisitor();},800);
    },true);
    document.addEventListener('scroll',function(e){
      if(writing() && e.target && e.target.classList && e.target.classList.contains('chat-msgs')) restore();
    },true);
    document.addEventListener('click',function(e){
      if(e.target && e.target.closest && e.target.closest('#chat-fab,#chat-popover')) setTimeout(cleanVisitor,80);
    },true);
    setInterval(function(){ if(writing()) restore(); },250);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();

  var prevNotify=window.notifyAdminChat;
  if(typeof prevNotify==='function'){
    window.notifyAdminChat=function(){
      beepAdmin();
      return prevNotify.apply(this,arguments);
    };
    try{notifyAdminChat=window.notifyAdminChat;}catch(e){}
  }
})();
