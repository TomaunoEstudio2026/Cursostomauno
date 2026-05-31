// Tomauno limpio fase 3 — 21 patch mínimo
(function(){
  'use strict';
  function css(){
    if(document.getElementById('tomauno-clean-f3-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-clean-f3-css';
    st.textContent=[
      'html body #notif-banner{z-index:99999!important;}',
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      'html body #chat-popover.open .chat-row input,html body #chat-popover.open .chat-row textarea{font-size:16px!important;}',
      'html body #chat-popover.open .chat-delete-mini{display:inline-flex!important;align-items:center!important;justify-content:center!important;margin-left:7px!important;width:24px!important;height:24px!important;border-radius:50%!important;border:1px solid rgba(255,255,255,.22)!important;background:rgba(0,0,0,.18)!important;color:#fff!important;cursor:pointer!important;}',
      'html body #chat-popover.open:not(:has(#chat-admin-text)) .chat-delete-mini{display:none!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();
