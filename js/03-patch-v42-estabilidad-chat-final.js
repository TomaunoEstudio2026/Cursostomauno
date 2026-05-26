// Extraído de <script id="patch-v42-estabilidad-chat-final">
(function(){
  window.TOMAUNO_PATCH_VERSION = 'v42-estabilidad-final-chat';

  var readLocks = Object.create(null);
  var readingUntil = 0;

  function now(){ return Date.now(); }
  function isInput(el){ return !!(el && el.matches && el.matches('#chat-text,#chat-admin-text,.chat-row input,.chat-row textarea')); }
  function box(){ return document.getElementById('chat-msgs'); }
  function nearBottom(el){ return !el || ((el.scrollHeight - el.scrollTop - el.clientHeight) < 90); }
  function activeId(){ return window.currentOpenChatId || ''; }

  function markLocalRead(id){
    if(!id) return;
    readLocks[id] = now() + 12000;
    try{
      if(window.chatsDB && chatsDB[id]){
        chatsDB[id].unreadAdmin = false;
        chatsDB[id].lastAdminReadAt = now();
      }
    }catch(e){}
  }

  function forceReadDom(id){
    if(!id) return;
    try{
      document.querySelectorAll('.chat-tab').forEach(function(tab){
        var oc = String(tab.getAttribute('onclick') || '');
        if(oc.indexOf("abrirChatAdmin('"+id+"')") !== -1 || oc.indexOf('abrirChatAdmin(\"'+id+'\")') !== -1){
          tab.classList.remove('unread','waiting');
          if(tab.classList.contains('priority')) tab.classList.add('priority');
          var foot = tab.querySelector('.chat-tab-foot');
          if(foot) foot.textContent = foot.textContent.replace(/^Esperando/i,'Prioridad');
        }
      });
      document.querySelectorAll('.chat-list-item').forEach(function(item){
        var oc = String(item.getAttribute('onclick') || '');
        if(oc.indexOf("abrirChatAdmin('"+id+"')") !== -1 || oc.indexOf('abrirChatAdmin(\"'+id+'\")') !== -1){
          item.classList.remove('unread');
          var st = item.querySelector('.chat-status');
          if(st && /^nuevo$/i.test(st.textContent.trim())) st.textContent = 'Leído';
        }
      });
    }catch(e){}
  }

  function markFirebaseRead(id){
    try{
      if(!id || typeof update !== 'function' || typeof ref !== 'function' || typeof db === 'undefined') return;
      update(ref(db,'tomauno/chats/'+id), {unreadAdmin:false,lastAdminReadAt:now()}).catch(function(){});
    }catch(e){}
  }

  // Al abrir un chat en admin: limpia no leído antes y después del render.
  var openAdmin = window.abrirChatAdmin;
  if(typeof openAdmin === 'function'){
    window.abrirChatAdmin = function(id, silent){
      markLocalRead(id);
      var r = openAdmin.apply(this, arguments);
      markLocalRead(id);
      markFirebaseRead(id);
      setTimeout(function(){ markLocalRead(id); forceReadDom(id); }, 40);
      setTimeout(function(){ markLocalRead(id); forceReadDom(id); }, 250);
      return r;
    };
  }

  // Si Firebase vuelve a pintar con unread viejo durante unos segundos, lo neutralizamos solo para el chat abierto.
  setInterval(function(){
    var id = activeId();
    if(!id) return;
    if(readLocks[id] && readLocks[id] > now()){
      markLocalRead(id);
      forceReadDom(id);
    }
  }, 700);

  // Scroll realmente inteligente: no toca el scroll si el usuario escribe o está leyendo arriba.
  document.addEventListener('scroll', function(ev){
    if(ev.target && ev.target.id === 'chat-msgs' && !nearBottom(ev.target)) readingUntil = now() + 9000;
  }, true);
  document.addEventListener('wheel', function(ev){ if(ev.target && ev.target.closest && ev.target.closest('#chat-msgs')) readingUntil = now() + 9000; }, true);
  document.addEventListener('touchmove', function(ev){ if(ev.target && ev.target.closest && ev.target.closest('#chat-msgs')) readingUntil = now() + 9000; }, true);
  document.addEventListener('keydown', function(ev){ if(isInput(ev.target)) readingUntil = now() + 4500; }, true);
  document.addEventListener('focusin', function(ev){ if(isInput(ev.target)) readingUntil = now() + 4500; }, true);

  var oldScroll = window.scrollChatSmart;
  if(typeof oldScroll === 'function'){
    window.scrollChatSmart = scrollChatSmart = function(el){
      if(!el) return;
      var typing = isInput(document.activeElement);
      var reading = now() < readingUntil && !nearBottom(el);
      if(typing || reading) return;
      var bubbles = el.querySelectorAll('.chat-bubble');
      var last = bubbles[bubbles.length - 1];
      if(!last){ el.scrollTop = el.scrollHeight; return; }
      var txt = String(last.innerText || last.textContent || '');
      var longMsg = txt.length > 420 || last.scrollHeight > 220;
      if(longMsg){
        el.scrollTop = Math.max(0, last.offsetTop - 12);
      }else{
        el.scrollTop = el.scrollHeight;
      }
    };
  }

  var oldUpdateMsgs = window.updateChatMessagesOnly;
  if(typeof oldUpdateMsgs === 'function'){
    window.updateChatMessagesOnly = updateChatMessagesOnly = function(id, adminView){
      var el = box();
      var oldTop = el ? el.scrollTop : 0;
      var wasNearBottom = nearBottom(el);
      var typing = isInput(document.activeElement);
      var reading = el && !wasNearBottom;
      var r = oldUpdateMsgs.apply(this, arguments);
      el = box();
      if(!el) return r;
      if(typing || reading || now() < readingUntil){
        el.scrollTop = oldTop;
      }else if(wasNearBottom){
        scrollChatSmart(el);
      }
      return r;
    };
  }

  // En mobile no mover la web automáticamente si el chat está abierto; solo navega por toque explícito en botón.
  var explicitNav = 0;
  document.addEventListener('pointerdown', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.chat-action-btn,.chat-quick,.det-link')) explicitNav = now() + 1500;
  }, true);
  var oldNav = window.navScroll;
  if(typeof oldNav === 'function'){
    window.navScroll = navScroll = function(id){
      var pop = document.getElementById('chat-popover');
      var mobile = window.matchMedia && window.matchMedia('(max-width:700px)').matches;
      if(mobile && pop && pop.classList.contains('open') && now() > explicitNav) return false;
      return oldNav.apply(this, arguments);
    };
  }
})();
