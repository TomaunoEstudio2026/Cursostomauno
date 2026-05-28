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

/* Tomauno v36 CSS respaldo */
(function(){function css(){if(document.getElementById('tu36-patch-css'))return;var st=document.createElement('style');st.id='tu36-patch-css';st.textContent='@media(min-width:701px){#chat-popover.open.tu36-visitor,body:not(.tomauno-admin-active) #chat-popover.open:not(.tu36-admin-pop){height:min(82vh,760px)!important;max-height:min(82vh,760px)!important;width:min(430px,calc(100vw - 24px))!important;max-width:min(430px,calc(100vw - 24px))!important}}#chat-popover.open.tu36-admin-pop{width:min(1120px,calc(100vw - 32px))!important;height:min(84vh,820px)!important;max-height:min(84vh,820px)!important}';document.head.appendChild(st)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',css,{once:true});else css();})();
