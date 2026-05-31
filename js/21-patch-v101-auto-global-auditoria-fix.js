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




/* Tomauno fase5 mínimo: ocultar botones activar alertas heredados */
(function(){
  function clean(){
    document.querySelectorAll('.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-sound-unlock,.tu-v34-sound-unlock').forEach(function(n){n.remove();});
    document.querySelectorAll('button').forEach(function(b){
      if(/activar alertas|activar llamada|activar llamadas|activar sonido/i.test(b.innerText||'')) b.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true}); else clean();
  setInterval(clean,1000);
})();
