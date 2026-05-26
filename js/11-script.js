// Extraído de <script >
/* v48 — parche seguro: modo /#chat sin tocar Firebase ni listeners principales */
(function(){
  'use strict';
  var CHAT_HASHES = ['#chat','#consulta','#asistente'];
  var css = document.createElement('style');
  css.id = 'v48-chat-route-safe-style';
  css.textContent = `
    :root{--chat-vh:100dvh;--chat-kb:0px;}
    html.chat-route-v48, body.chat-route-v48{height:100%!important;overflow:hidden!important;background:#000!important;overscroll-behavior:none!important;}
    body.chat-route-v48{position:fixed!important;inset:0!important;width:100%!important;touch-action:manipulation!important;}
    body.chat-route-v48 .nav,
    body.chat-route-v48 .hero,
    body.chat-route-v48 #sec-cursos,
    body.chat-route-v48 #sec-eventos,
    body.chat-route-v48 #sec-servicios,
    body.chat-route-v48 #sec-galeria,
    body.chat-route-v48 #sec-testimonios,
    body.chat-route-v48 #sec-faq,
    body.chat-route-v48 #sec-ubicacion,
    body.chat-route-v48 footer,
    body.chat-route-v48 #back-top,
    body.chat-route-v48 .chat-fab{display:none!important;}
    body.chat-route-v48 #chat-popover,
    body.chat-route-v48 #chat-popover.open,
    body.chat-route-v48 #chat-popover.expanded{
      display:flex!important;position:fixed!important;inset:0!important;width:100vw!important;height:var(--chat-vh)!important;max-height:var(--chat-vh)!important;min-width:0!important;min-height:0!important;transform:none!important;border-radius:0!important;border:0!important;z-index:9999!important;background:#050505!important;box-shadow:none!important;
    }
    body.chat-route-v48 #chat-popover .chat-popover-inner{
      height:var(--chat-vh)!important;max-height:var(--chat-vh)!important;width:100%!important;display:flex!important;flex-direction:column!important;min-height:0!important;padding:10px 10px max(8px,env(safe-area-inset-bottom))!important;gap:8px!important;
    }
    body.chat-route-v48 #chat-popover .chat-head{flex:0 0 auto!important;min-height:46px!important;padding-top:max(6px,env(safe-area-inset-top))!important;}
    body.chat-route-v48 #chat-popover .chat-msgs{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;scroll-behavior:auto!important;}
    body.chat-route-v48 #chat-popover .chat-row{flex:0 0 auto!important;position:relative!important;z-index:2!important;padding-bottom:max(4px,env(safe-area-inset-bottom))!important;background:#050505!important;}
    body.chat-route-v48 #chat-popover textarea,
    body.chat-route-v48 #chat-popover input{font-size:16px!important;}
    body.chat-route-v48 #chat-popover .chat-quick-wrap{flex:0 0 auto!important;max-height:82px!important;overflow:auto!important;}
    body.chat-route-v48.chat-input-focus #chat-popover .chat-quick-wrap{display:none!important;}
    body.chat-route-v48.chat-input-focus #chat-popover .chat-msgs{padding-bottom:4px!important;}
    body.chat-route-v48 #chat-popover .chat-popover-close{top:max(8px,env(safe-area-inset-top))!important;right:10px!important;color:#fff!important;background:#202020!important;}
    body.chat-route-v48 #chat-popover .chat-max-btn{display:none!important;}
    @media(max-width:700px){
      body.chat-route-v48 #chat-popover .chat-popover-inner{padding:8px 8px max(7px,env(safe-area-inset-bottom))!important;}
      body.chat-route-v48 #chat-popover .chat-msgs{padding:10px!important;}
      body.chat-route-v48 #chat-popover .chat-row{gap:6px!important;}
    }
  `;
  document.head.appendChild(css);

  function isChatRoute(){ return CHAT_HASHES.indexOf(String(location.hash||'').toLowerCase()) >= 0; }
  function setVH(){
    var h = (window.visualViewport && window.visualViewport.height) ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--chat-vh', Math.max(320, Math.floor(h)) + 'px');
  }
  function apply(){
    setVH();
    var on = isChatRoute();
    document.documentElement.classList.toggle('chat-route-v48', on);
    document.body.classList.toggle('chat-route-v48', on);
    if(on){
      setTimeout(function(){
        try{
          var p = document.getElementById('chat-popover');
          if((!p || !p.classList.contains('open')) && typeof window.abrirChatTomauno === 'function') window.abrirChatTomauno();
          p = document.getElementById('chat-popover');
          if(p){ p.classList.add('open','expanded'); }
        }catch(e){}
      }, 120);
    }
  }
  window.addEventListener('hashchange', apply, {passive:true});
  window.addEventListener('resize', setVH, {passive:true});
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', setVH, {passive:true});
    window.visualViewport.addEventListener('scroll', setVH, {passive:true});
  }
  document.addEventListener('focusin', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('#chat-popover')){
      document.body.classList.add('chat-input-focus');
      setVH();
    }
  }, true);
  document.addEventListener('focusout', function(ev){
    if(ev.target && ev.target.closest && ev.target.closest('#chat-popover')){
      setTimeout(function(){ document.body.classList.remove('chat-input-focus'); setVH(); }, 180);
    }
  }, true);
  document.addEventListener('DOMContentLoaded', apply);
  setTimeout(apply, 250);
})();
