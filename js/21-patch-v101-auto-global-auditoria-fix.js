// Tomauno 7H limpio fase 1
// Reemplaza el archivo 21 viejo lleno de parches acumulados.
// Este archivo NO intercepta envío, NO reescribe panel, NO modifica scroll, NO toca alarmas.
// Solo deja estilos mínimos seguros.
(function(){
  'use strict';
  function css(){
    if(document.getElementById('tomauno-7h-clean-patch-css')) return;
    var st = document.createElement('style');
    st.id = 'tomauno-7h-clean-patch-css';
    st.textContent = [
      'html body #notif-banner{z-index:99999!important;}',
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      'html body #chat-popover.open .chat-row input,html body #chat-popover.open .chat-row textarea{font-size:16px!important;}',
      'html body #chat-popover.open .chat-action-row{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-top:8px!important;}',
      'html body #chat-popover.open .chat-action-btn{border:1px solid rgba(255,255,255,.16)!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;color:inherit!important;padding:6px 10px!important;font-size:12px!important;cursor:pointer!important;}',
      'html body #chat-popover.open .chat-delete-mini{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:7px!important;width:24px!important;height:24px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(0,0,0,.18)!important;color:#fff!important;cursor:pointer!important;}',
      'html body #chat-popover.open:not(:has(#chat-admin-text)) .chat-delete-mini{display:none!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', css, {once:true});
  else css();
})();
