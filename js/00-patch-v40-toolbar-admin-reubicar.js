// Extraído de <script id="patch-v40-toolbar-admin-reubicar">
(function(){
  'use strict';
  function moveActions(){
    document.querySelectorAll('.chat-popover .chat-panel').forEach(function(panel){
      var tools = panel.querySelector('.chat-admin-tools');
      var actions = panel.querySelector('.chat-admin-actions');
      if(!tools || !actions) return;
      if(actions.parentElement !== tools){
        actions.setAttribute('data-v40-moved','1');
        tools.appendChild(actions);
      }
      actions.querySelectorAll('[data-action="resumen-wa"]').forEach(function(btn){
        btn.removeAttribute('style');
        btn.title = btn.title || 'Resumen para WhatsApp';
        Array.from(btn.childNodes).forEach(function(n){
          if(n.nodeType === 3 && n.textContent.trim()) n.textContent = '';
        });
      });
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', moveActions);
  else moveActions();
  var t = null;
  var obs = new MutationObserver(function(){
    clearTimeout(t);
    t = setTimeout(moveActions, 40);
  });
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
