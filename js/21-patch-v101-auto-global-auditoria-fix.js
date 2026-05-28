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

/* Tomauno v35 admin layout respaldo */
(function(){
  function css(){
    if(document.getElementById('tu-v35-patch-css')) return;
    var st=document.createElement('style');
    st.id='tu-v35-patch-css';
    st.textContent='#chat-popover.open.tu-v35-admin-pop{width:min(1120px,calc(100vw - 32px))!important;height:min(82vh,820px)!important;max-height:min(82vh,820px)!important;}#chat-popover.open .tu-v35-admin{height:100%!important;display:grid!important;grid-template-columns:280px minmax(0,1fr)!important;gap:14px!important;overflow:hidden!important;}';
    document.head.appendChild(st);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',css,{once:true});else css();
})();
