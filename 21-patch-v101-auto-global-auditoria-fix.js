// Tomauno clean line — patch mínimo.
// Este archivo queda intencionalmente liviano para no pelear con 02-module.js.
(function(){
  'use strict';
  function css(){
    if(document.getElementById('tu-clean-patch-css')) return;
    var st=document.createElement('style');
    st.id='tu-clean-patch-css';
    st.textContent=[
      '#chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      '#chat-popover.open .chat-bubble.admin{position:relative!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true}); else css();
})();
