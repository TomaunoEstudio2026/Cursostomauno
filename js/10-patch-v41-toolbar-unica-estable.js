// Extraído de <script id="patch-v41-toolbar-unica-estable">
(function(){
  window.TOMAUNO_PATCH_VERSION = 'v41-toolbar-sin-parpadeo';

  var rafPending = false;
  function pop(){ return document.getElementById('chat-popover'); }

  function normalizeToolbar41(){
    var p = pop();
    if(!p || !p.classList.contains('open')) return;

    var tools = p.querySelector('.chat-admin-tools');
    if(!tools) return;

    // Buscar respuestas rápidas y acciones estén donde estén, incluso si una versión anterior las dejó en el bloque oculto.
    var qLabel = p.querySelector('.chat-quick-label');
    var qWrap = p.querySelector('.chat-quick-wrap');
    var actions = p.querySelector('.chat-admin-actions');

    // Mover al final de la primera barra. Esto evita que, al cambiar de usuario, queden ocultos o en otra fila fantasma.
    if(qLabel && qLabel.parentElement !== tools) tools.appendChild(qLabel);
    if(qWrap && qWrap.parentElement !== tools) tools.appendChild(qWrap);
    if(actions && actions.parentElement !== tools) tools.appendChild(actions);

    // Si existiera WhatsApp dinámico, queda como una acción más y no desplaza Sesiones.
    if(actions){
      actions.querySelectorAll('.btn-out,a.btn-out').forEach(function(btn){
        btn.removeAttribute('style');
        if(!btn.querySelector('.ico')){
          var t = (btn.textContent || '').trim();
          btn.textContent = '';
          var s = document.createElement('span');
          s.className = 'ico';
          s.textContent = t || '•';
          btn.appendChild(s);
        }
      });
    }

    // El botón de resumen no debe verse como estado activo/verde.
    tools.querySelectorAll('[data-action="resumen-wa"],[title*="Resumen"],[title*="resumen"]').forEach(function(btn){
      btn.classList.remove('on','active','ok','gr','green');
      btn.style.background = '';
      btn.style.boxShadow = '';
    });

    // El bloque viejo queda vacío visualmente: no participa del layout.
    p.querySelectorAll('.chat-tools-block').forEach(function(block){
      block.style.display = 'none';
      block.style.visibility = 'hidden';
    });
  }

  function scheduleNormalize41(){
    if(rafPending) return;
    rafPending = true;
    requestAnimationFrame(function(){
      rafPending = false;
      normalizeToolbar41();
    });
  }

  // Reforzar después de cualquier cambio de usuario/render sin tocar Firebase ni listeners.
  document.addEventListener('click', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('.chat-tab,.chat-list-item,.chat-admin-tools,#chat-tools-toggle')){
      scheduleNormalize41();
      setTimeout(scheduleNormalize41, 60);
      setTimeout(scheduleNormalize41, 180);
    }
  }, true);

  var originalAbrir41 = window.abrirChatAdmin;
  if(typeof originalAbrir41 === 'function'){
    window.abrirChatAdmin = function(){
      var r = originalAbrir41.apply(this, arguments);
      scheduleNormalize41();
      setTimeout(scheduleNormalize41, 40);
      setTimeout(scheduleNormalize41, 140);
      return r;
    };
  }

  var originalPanel41 = window.abrirPanelChatsAdmin;
  if(typeof originalPanel41 === 'function'){
    window.abrirPanelChatsAdmin = function(){
      var r = originalPanel41.apply(this, arguments);
      scheduleNormalize41();
      setTimeout(scheduleNormalize41, 80);
      return r;
    };
  }

  // Observador liviano: solo reacomoda la toolbar, no redibuja el chat.
  var observed = false;
  function attachObserver41(){
    var p = pop();
    if(!p || observed) return;
    observed = true;
    try{
      var mo = new MutationObserver(function(muts){
        for(var i=0;i<muts.length;i++){
          if(muts[i].type === 'childList'){
            scheduleNormalize41();
            break;
          }
        }
      });
      mo.observe(p, {childList:true, subtree:true});
    }catch(e){}
  }

  setInterval(function(){ attachObserver41(); scheduleNormalize41(); }, 900);
  document.addEventListener('DOMContentLoaded', function(){ attachObserver41(); scheduleNormalize41(); });
  setTimeout(function(){ attachObserver41(); scheduleNormalize41(); }, 120);
})();
