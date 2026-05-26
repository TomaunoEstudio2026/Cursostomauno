// Extraído de <script id="patch-v39-refresh-inteligente">
(function(){
  window.TOMAUNO_PATCH_VERSION = 'v39-refresh-inteligente';

  function isMobile39(){ return window.matchMedia && window.matchMedia('(max-width:700px)').matches; }
  function chatOpen39(){
    var p = document.getElementById('chat-popover');
    return !!(p && p.classList.contains('open'));
  }
  function isChatInput39(el){
    return !!(el && el.matches && el.matches('#chat-text,#chat-admin-text,.chat-row input,.chat-row textarea'));
  }
  function msgBox39(){ return document.getElementById('chat-msgs'); }
  function nearBottom39(box){ return !box || ((box.scrollHeight - box.scrollTop - box.clientHeight) < 95); }

  var userReadingUntil39 = 0;
  var lastMsgCount39 = 0;

  document.addEventListener('scroll', function(ev){
    var box = ev.target;
    if(box && box.id === 'chat-msgs' && !nearBottom39(box)){
      userReadingUntil39 = Date.now() + 7000;
    }
  }, true);

  document.addEventListener('focusin', function(ev){
    if(isChatInput39(ev.target)) userReadingUntil39 = Date.now() + 3000;
  }, true);
  document.addEventListener('keydown', function(ev){
    if(isChatInput39(ev.target)) userReadingUntil39 = Date.now() + 2500;
  }, true);

  /* Scroll inteligente: si el usuario escribe o está leyendo arriba, no lo arrastra. */
  var originalScroll39 = (typeof scrollChatSmart === 'function') ? scrollChatSmart : null;
  window.scrollChatSmart = scrollChatSmart = function(box){
    if(!box) return;
    var active = document.activeElement;
    var typing = isChatInput39(active);
    var reading = Date.now() < userReadingUntil39 && !nearBottom39(box);

    if((isMobile39() && chatOpen39() && typing) || reading) return;

    var bubbles = box.querySelectorAll('.chat-bubble');
    var last = bubbles[bubbles.length - 1];
    if(!last){ box.scrollTop = box.scrollHeight; return; }

    var txt = String(last.innerText || last.textContent || '');
    var longMsg = txt.length > 420 || last.scrollHeight > 220;
    if(longMsg){
      box.scrollTop = Math.max(0, last.offsetTop - 12);
      return;
    }
    box.scrollTop = box.scrollHeight;
  };

  /* Render de mensajes: conserva scroll si no corresponde moverse. */
  var originalUpdate39 = (typeof updateChatMessagesOnly === 'function') ? updateChatMessagesOnly : null;
  if(originalUpdate39){
    window.updateChatMessagesOnly = updateChatMessagesOnly = function(id, adminView){
      var box = msgBox39();
      var oldTop = box ? box.scrollTop : 0;
      var oldCount = box ? box.querySelectorAll('.chat-bubble').length : 0;
      var wasNearBottom = nearBottom39(box);
      var typing = isChatInput39(document.activeElement);
      var reading = box && !wasNearBottom;

      var result = originalUpdate39.apply(this, arguments);

      box = msgBox39();
      if(!box) return result;
      var newCount = box.querySelectorAll('.chat-bubble').length;

      if(typing || reading || Date.now() < userReadingUntil39){
        box.scrollTop = oldTop;
        return result;
      }
      if(newCount !== oldCount || wasNearBottom){
        scrollChatSmart(box);
      }
      lastMsgCount39 = newCount;
      return result;
    };
  }

  /* Cuando el admin entra a un chat, marcar localmente como leído para que deje de titilar sin esperar otro refresh. */
  var originalAbrirAdmin39 = window.abrirChatAdmin;
  if(typeof originalAbrirAdmin39 === 'function'){
    window.abrirChatAdmin = function(id, silent){
      try{
        if(window.chatsDB && chatsDB[id]){
          chatsDB[id].unreadAdmin = false;
          chatsDB[id].humanRequested = !!chatsDB[id].humanRequested;
        }
      }catch(e){}
      var r = originalAbrirAdmin39.apply(this, arguments);
      setTimeout(function(){
        document.querySelectorAll('.chat-tab.active').forEach(function(tab){ tab.classList.remove('unread'); });
        if(typeof window.mergeAdminTools36 === 'function') window.mergeAdminTools36();
      }, 80);
      return r;
    };
  }

  /* Si el usuario está en celular con el chat abierto, los tags automáticos no mueven la página. */
  var originalMaybeTags39 = (typeof maybeRunVisitorActionTags === 'function') ? maybeRunVisitorActionTags : null;
  if(originalMaybeTags39){
    window.maybeRunVisitorActionTags = maybeRunVisitorActionTags = function(chatId, chat){
      if(isMobile39() && chatOpen39()) return;
      return originalMaybeTags39.apply(this, arguments);
    };
  }

  /* Botones de navegación dentro del chat: solo navegan si el usuario toca el botón. */
  var originalNav39 = (typeof navScroll === 'function') ? navScroll : null;
  var explicitNavUntil39 = 0;
  document.addEventListener('pointerdown', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.chat-action-btn,.chat-quick,.det-link')){
      explicitNavUntil39 = Date.now() + 1200;
    }
  }, true);
  if(originalNav39){
    window.navScroll = navScroll = function(id){
      if(isMobile39() && chatOpen39() && Date.now() > explicitNavUntil39) return false;
      return originalNav39.apply(this, arguments);
    };
  }

  /* Cierre visual limpio: evita la X invisible por estilos heredados. */
  function fixCloseButtons39(){
    document.querySelectorAll('.chat-tab-close').forEach(function(btn){
      btn.textContent = '×';
      btn.style.fontSize = '16px';
      btn.style.fontWeight = '900';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
    });
  }
  setInterval(fixCloseButtons39, 1200);
  setTimeout(fixCloseButtons39, 150);
})();
