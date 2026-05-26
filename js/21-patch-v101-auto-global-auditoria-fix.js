// TOMAUNO MODULAR v9 — limpieza real del módulo chat/auto.
// Reemplaza completamente los parches anteriores de este archivo.
// Objetivo: una sola capa de control para onboarding, AUTO visual, notificaciones y scroll.
(function(){
  'use strict';
  var VERSION='Tomauno modular v9';
  var autoModo=null;
  var autoListenStarted=false;
  var userReadingUntil=0;
  var forceScrollUntil=0;
  var lastOpenedVisitorId='';
  var notifiedLocal={};
  var uiTimer=null;
  var original={};

  function safe(fn,fallback){try{return fn();}catch(e){try{console.warn('tomauno modular v9:',e);}catch(_){} return fallback;}}
  function now(){return Date.now();}
  function text(s){return String(s==null?'':s);}
  function esc(s){return text(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function oneLine(s,max){s=text(s).replace(/\s+/g,' ').trim(); return max&&s.length>max?s.slice(0,max-1)+'…':s;}
  function normModo(v){v=text(v).toLowerCase().trim(); return /^(automatico|auto|on|true|1)$/i.test(v)?'automatico':'manual';}
  function autoOn(){
    if(autoModo) return autoModo==='automatico';
    return safe(function(){return normModo(window.asistenteDB&&window.asistenteDB.modo)==='automatico';},false) || safe(function(){return normModo(window.tomaunoAutoGlobalModo)==='automatico';},false);
  }
  function dbOk(){return typeof db!=='undefined'&&typeof ref!=='undefined'&&typeof update!=='undefined'&&typeof push!=='undefined';}
  function adminOk(){
    return safe(function(){
      return localStorage.getItem('tomauno-admin-ok')==='1' || localStorage.getItem('tomauno-admin-notify')==='1' || !!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');
    },false);
  }
  function chatById(id){return safe(function(){return (typeof chatsDB!=='undefined'&&chatsDB&&id)?chatsDB[id]:null;},null);}
  function validName(n){n=oneLine(n,36); return n&&!/^(hola|buenas|consulta|visitante|usuario|sin nombre)$/i.test(n);}
  function cleanName(raw){
    var n=oneLine(raw,60);
    n=n.replace(/^(hola\s+)?(soy|me llamo|mi nombre es|nombre es|buenas\s+soy|hola\s+soy)\s+/i,'').trim();
    n=n.replace(/[¿?¡!.,;:]+$/g,'').trim();
    if(n.length>36) n=n.slice(0,36).trim();
    return n;
  }
  function chatName(c,id){
    var n=oneLine((c&&(c.name||c.nombre||c.whatsappName))||'',36);
    if(validName(n)) return n;
    return id?('Visitante '+String(id).slice(-4)):'Visitante';
  }
  function getLastUserText(c){
    var txt='',ts=0;
    safe(function(){
      var msgs=c&&c.messages?c.messages:{};
      Object.keys(msgs).forEach(function(k){var m=msgs[k]||{}; if(m.from==='user'&&!m.typing&&Number(m.createdAt||0)>=ts){ts=Number(m.createdAt||0); txt=text(m.text).trim();}});
    });
    return txt||text(c&&(c.lastUserMsg||c.lastMsg)).trim();
  }
  function currentVisitorView(chatId){
    var p=document.getElementById('chat-popover');
    return !!(p&&p.classList.contains('open')&&lastOpenedVisitorId&&(!chatId||lastOpenedVisitorId===chatId)&&!p.querySelector('.chat-admin-tools'));
  }

  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag');
    if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body; tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);}
    tag.textContent=VERSION;
  });}

  function startAutoListener(){safe(function(){
    if(autoListenStarted||!dbOk()||typeof onValue==='undefined') return;
    autoListenStarted=true;
    onValue(ref(db,'tomauno/asistente/modo'),function(snap){
      autoModo=snap&&snap.exists&&snap.exists()?normModo(snap.val()):'manual';
      window.tomaunoAutoGlobalModo=autoModo;
      scheduleUI();
    });
  });}

  window.asistenteModo=function(){return autoOn()?'automatico':'manual';};

  window.toggleModoAsistenteChat=async function(){
    try{
      var nuevo=autoOn()?'manual':'automatico';
      if(dbOk()) await update(ref(db,'tomauno/asistente'),{modo:nuevo,actualizado:now()});
      autoModo=nuevo; window.tomaunoAutoGlobalModo=nuevo;
      syncUI(true);
      if(typeof toast==='function') toast(nuevo==='automatico'?'🟢 AUTO activado':'🔴 Modo manual',true);
    }catch(e){console.warn('toggle auto v9',e);}
  };

  function hasUnread(){return safe(function(){
    if(typeof chatsDB==='undefined'||!chatsDB) return false;
    return Object.keys(chatsDB).some(function(id){var c=chatsDB[id]||{}; return c.status!=='cerrado'&&(c.unreadAdmin||c.humanRequested||c.waitingHuman);});
  },false);}

  function syncUI(){safe(function(){
    setVersion();
    var adm=adminOk();
    var fab=document.getElementById('chat-fab');
    if(fab){
      // El visitante nunca debe ver verde/rojo por estado AUTO. Solo aviso de mensajes para admin.
      fab.classList.remove('auto-on');
      fab.classList.toggle('has-new',!!(adm&&hasUnread()));
      fab.title=adm?(hasUnread()?'Tenés mensajes/chats pendientes':'Abrir bandeja de chats'):'Abrir chat';
    }
    document.querySelectorAll('.chat-filter.auto').forEach(function(b){
      var a=autoOn();
      b.classList.toggle('on',a);
      b.setAttribute('data-auto-state',a?'on':'off');
      b.innerHTML=a?'<span class="ico">🟢</span><span class="txt">AUTO</span>':'<span class="ico">🔴</span><span class="txt">MAN</span>';
      b.title=a?'Automático global activo. Clic para pasar a manual.':'Manual global. Clic para activar automático.';
    });
    var p=document.getElementById('chat-popover');
    if(p&&p.classList.contains('open')){
      if(p.querySelector('.chat-admin-tools,.chat-inbox-side,.chat-tabs')){p.classList.add('tomauno-chat-admin');p.classList.remove('tomauno-chat-visitor');}
      else {p.classList.add('tomauno-chat-visitor');p.classList.remove('tomauno-chat-admin');}
    }
  });}
  function scheduleUI(){clearTimeout(uiTimer); uiTimer=setTimeout(syncUI,60);}

  // Notificaciones limpias solo para admin. Nunca muestran cards ni respuestas del bot.
  window.notifyAdminChat=function(title,body,chatId){safe(function(){
    if(!adminOk()) return;
    if(currentVisitorView(chatId)) return;
    var c=chatById(chatId);
    var q=getLastUserText(c)||body||'Nuevo mensaje desde la web';
    if(/Curso de|Fotos Polaroid|Ver cursos|Profesor\/organizador|Tomauno - Pedro|Instagram:@|Contacto:|\$\s*\d/i.test(q)) q=body||'Nuevo mensaje desde la web';
    q=oneLine(q,150);
    var name=chatName(c,chatId);
    var cleanTitle=title||'Nuevo chat web';
    var cleanBody=(name?name+': ':'')+q;
    try{if(typeof beep==='function') beep();}catch(e){}
    try{if(typeof showNotif==='function') showNotif();}catch(e){}
    var open=function(){try{window.focus();}catch(e){} try{if(chatId&&typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(chatId,true); else if(typeof window.abrirPanelChatsAdmin==='function') window.abrirPanelChatsAdmin();}catch(e){}};
    try{if(typeof showNotifBanner==='function') showNotifBanner(cleanTitle,cleanBody,'💬',open);}catch(e){}
    try{
      if('Notification' in window && Notification.permission==='granted'){
        var n=new Notification('💬 '+cleanTitle,{body:cleanBody,icon:'https://i.imgur.com/oZnkCPD.png',badge:'https://i.imgur.com/oZnkCPD.png',tag:chatId?'tomauno-chat-'+chatId:'tomauno-chat',renotify:true,requireInteraction:false});
        n.onclick=function(){open();try{n.close();}catch(e){}};
      }
    }catch(e){}
  });};
  try{notifyAdminChat=window.notifyAdminChat;}catch(e){}

  function visitorWelcome(){
    return '<div class="chat-head"><div class="chat-avatar">💬</div><div><div class="chat-title">CHAT TOMAUNO</div><div class="chat-subline">Consulta directa desde la web</div></div></div>'+ 
      '<div class="chat-panel"><div class="chat-msgs" id="chat-msgs"><div class="chat-bubble admin"><div>Hola 😊<br/>¿Cómo es tu nombre?</div><div class="chat-meta">Ahora</div></div></div>'+ 
      '<div class="chat-name-row"><input class="finput" id="chat-name" placeholder="Tu nombre" autocomplete="name" onkeydown="if(event.key===\'Enter\')window.iniciarChatConNombre()"/><button class="chat-send" onclick="window.iniciarChatConNombre()">➜</button></div></div>';
  }

  window.abrirChatTomauno=function(){
    safe(function(){if(typeof unlockAudio==='function') unlockAudio();});
    var pop=document.getElementById('chat-popover');
    if(pop&&pop.classList.contains('open')){if(window.cerrarChatPopover) window.cerrarChatPopover(); return;}
    if(adminOk()){ if(typeof window.abrirPanelChatsAdmin==='function') return window.abrirPanelChatsAdmin(); }
    var id=safe(function(){return window.currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id')||'';},'');
    if(id&&chatById(id)&&chatById(id).status!=='cerrado'&&typeof window.abrirChatVisitante==='function') return window.abrirChatVisitante(id,true);
    if(typeof setChatPopover==='function') setChatPopover(visitorWelcome());
    setTimeout(function(){var inp=document.getElementById('chat-name'); if(inp) inp.blur(); fixVisitorHeader();},60);
  };

  window.abrirChatAdminHome=function(){ if(typeof window.abrirPanelChatsAdmin==='function') return window.abrirPanelChatsAdmin(); };

  window.iniciarChatConNombre=async function(){
    try{
      var raw=text((document.getElementById('chat-name')||{}).value).trim();
      var name=cleanName(raw);
      if(!validName(name)){ if(typeof toast==='function') toast('Escribí tu nombre'); return; }
      if(!dbOk()) return;
      var t=now();
      var chatRef=await push(ref(db,'tomauno/chats'),{
        name:name,wp:'',status:'abierto',createdAt:t,updatedAt:t,lastMsg:'Inició chat: '+name,unreadAdmin:true,unreadVisitor:false,userOnline:true,userLastSeen:t,nombreConfirmado:true
      });
      var id=chatRef.key; window.currentVisitorChatId=id; lastOpenedVisitorId=id;
      try{sessionStorage.setItem('tomauno-chat-id',id);sessionStorage.setItem('tomauno-chat-name',name);sessionStorage.setItem('tomauno-chat-name-confirmed','1');}catch(e){}
      await push(ref(db,'tomauno/chats/'+id+'/messages'),{from:'user',text:raw||name,time:(typeof chatTime==='function'?chatTime():''),createdAt:t});
      await push(ref(db,'tomauno/chats/'+id+'/messages'),{from:'admin',text:'Hola '+name+' 😊 ¿En qué puedo ayudarte?',time:(typeof chatTime==='function'?chatTime():''),createdAt:t+1,auto:true});
      if(typeof window.abrirChatVisitante==='function') window.abrirChatVisitante(id,true);
      forceScrollUntil=now()+5000;
      setTimeout(function(){smartScroll(true);},120);
    }catch(e){console.warn('iniciarChatConNombre v9',e);}
  };

  // Evitar redetección de nombre después del onboarding.
  try{
    window.lastAdminAskedName=function(chat){return !(chat&&chat.nombreConfirmado);};
    window.isJustNameReply=function(txt,chat){return (chat&&chat.nombreConfirmado)?'':cleanName(txt);};
    lastAdminAskedName=window.lastAdminAskedName;
    isJustNameReply=window.isJustNameReply;
  }catch(e){}

  function fixVisitorHeader(){safe(function(){
    var p=document.getElementById('chat-popover'); if(!p||!p.classList.contains('open')) return;
    if(p.querySelector('.chat-admin-tools,.chat-inbox-side,.chat-tabs')) return;
    p.classList.add('tomauno-chat-visitor'); p.classList.remove('tomauno-chat-admin');
    var t=p.querySelector('.chat-title'); if(t) t.textContent='CHAT TOMAUNO';
    var s=p.querySelector('.chat-subline'); if(s) s.textContent='Consulta directa desde la web';
    var fab=document.getElementById('chat-fab'); if(fab) fab.classList.remove('auto-on');
  });}

  var oldAbrirVisitante=window.abrirChatVisitante;
  if(oldAbrirVisitante){
    window.abrirChatVisitante=function(id,silent){
      lastOpenedVisitorId=id||lastOpenedVisitorId;
      var r=oldAbrirVisitante.apply(this,arguments);
      setTimeout(function(){fixVisitorHeader();shortenTexts();observeMsgs();smartScroll(!!silent||now()<forceScrollUntil);},80);
      return r;
    };
  }

  var oldEnviarVisitante=window.enviarChatVisitante;
  window.enviarChatVisitante=async function(id){
    try{
      id=id||window.currentVisitorChatId||sessionStorage.getItem('tomauno-chat-id');
      var inp=document.getElementById('chat-text');
      var msg=text(inp&&inp.value).trim();
      if(!msg) return;
      if(inp){inp.value=''; inp.focus();}
      if(!dbOk()||!id){ if(oldEnviarVisitante) return oldEnviarVisitante.apply(this,arguments); return; }
      var c=chatById(id)||{};
      var name=validName(c.name)?c.name:(sessionStorage.getItem('tomauno-chat-name')||chatName(c,id));
      var t=now();
      await update(ref(db,'tomauno/chats/'+id),{name:name,status:'abierto',updatedAt:t,lastMsg:msg,unreadAdmin:true,userOnline:true,userLastSeen:t,nombreConfirmado:true});
      await push(ref(db,'tomauno/chats/'+id+'/messages'),{from:'user',text:msg,time:(typeof chatTime==='function'?chatTime():''),createdAt:t});
      forceScrollUntil=now()+5000;
      if(!notifiedLocal[id]){notifiedLocal[id]=true; safe(function(){window.notifyAdminChat('Nuevo mensaje web',msg,id);});}
      setTimeout(function(){safe(function(){if(autoOn()&&typeof window.responderAutomaticoChat==='function') window.responderAutomaticoChat(id,msg);});},450);
      setTimeout(function(){smartScroll(true);},120);
    }catch(e){console.warn('enviarChatVisitante v9',e); if(oldEnviarVisitante) return oldEnviarVisitante.apply(this,arguments);}
  };

  function shortenTexts(){safe(function(){
    document.querySelectorAll('.chat-bubble').forEach(function(b){
      var t=(b.innerText||'').trim();
      if(t.indexOf('Soy el Asistente de Tomauno')>-1&&t.indexOf('¿Cómo es tu nombre?')>-1) b.innerHTML='<div>Hola 😊<br/>¿Cómo es tu nombre?</div><div class="chat-meta">Ahora</div>';
      if(/^Gracias,\s*[^.]+\.\s*Aguard[aá]/i.test(t)) b.innerHTML='<div>Aguardá un momento por favor, voy a intentar avisarle a Javier para que te responda por acá 😊</div><div class="chat-meta">'+(typeof chatTime==='function'?chatTime():'')+'</div>';
    });
  });}

  function smartScroll(force){safe(function(){
    var box=document.getElementById('chat-msgs'); if(!box) return;
    if(!force && now()<userReadingUntil) return;
    var bubbles=box.querySelectorAll('.chat-bubble'); var last=bubbles[bubbles.length-1]; if(!last) return;
    var long=(last.innerText||'').length>220||last.offsetHeight>150;
    box.scrollTop=long?Math.max(0,last.offsetTop-8):Math.max(0,box.scrollHeight-box.clientHeight);
  });}
  try{window.scrollChatSmart=smartScroll; scrollChatSmart=smartScroll;}catch(e){}
  function observeMsgs(){safe(function(){
    var box=document.getElementById('chat-msgs'); if(!box||box.dataset.v9obs) return; box.dataset.v9obs='1';
    box.addEventListener('scroll',function(){var near=(box.scrollHeight-box.scrollTop-box.clientHeight)<90; if(!near) userReadingUntil=now()+9000;},{passive:true});
    var lastCount=box.querySelectorAll('.chat-bubble').length;
    new MutationObserver(function(){
      var cnt=box.querySelectorAll('.chat-bubble').length;
      if(cnt!==lastCount){lastCount=cnt; setTimeout(function(){shortenTexts();fixVisitorHeader();smartScroll(now()<forceScrollUntil);},90);} else {shortenTexts();fixVisitorHeader();}
    }).observe(box,{childList:true,subtree:true,characterData:true});
  });}

  // Click en banners heredados: si tienen chat id, abrir directo.
  document.addEventListener('click',function(ev){safe(function(){
    var el=ev.target&&ev.target.closest&&ev.target.closest('[data-chat-id],[data-tomauno-chat-id],#toast,.toast,.notif-banner,.notification-banner');
    if(!el) return;
    var id=el.getAttribute('data-chat-id')||el.getAttribute('data-tomauno-chat-id')||el.dataset.chatId||'';
    if(id&&adminOk()&&typeof window.abrirChatAdmin==='function'){ev.preventDefault();window.abrirChatAdmin(id,true);}
  });},true);

  function run(){startAutoListener();setVersion();syncUI();shortenTexts();fixVisitorHeader();observeMsgs();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  setInterval(run,1800);
  safe(function(){new MutationObserver(function(){scheduleUI();shortenTexts();fixVisitorHeader();observeMsgs();}).observe(document.documentElement,{childList:true,subtree:true});});
})();
