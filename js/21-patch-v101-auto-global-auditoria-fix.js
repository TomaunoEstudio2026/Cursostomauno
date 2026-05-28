// Tomauno v29 — patch mínimo de estabilización.
// Este archivo NO intercepta Enter, NO fuerza scroll, NO crea llamadas,
// NO agrega sonidos, NO cambia mensajes. Solo corrige estilos seguros.
(function(){
  'use strict';

  function css(){
    if(document.getElementById('tomauno-v29-stable-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v29-stable-css';
    st.textContent=[
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      'html body #chat-popover.open .chat-bubble.admin{position:relative!important;}',
      'html body #chat-popover.open .chat-row input,html body #chat-popover.open .chat-row textarea{font-size:16px!important;}',
      '@media(max-width:700px){html body #chat-popover.open{left:8px!important;right:8px!important;width:auto!important;max-width:none!important;bottom:calc(var(--tomauno-keyboard,0px) + 8px)!important;max-height:calc(100dvh - var(--tomauno-keyboard,0px) - 18px)!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();
