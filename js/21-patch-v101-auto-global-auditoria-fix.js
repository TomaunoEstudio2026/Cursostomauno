// Tomauno v30 — patch mínimo estable.
// No intercepta envío ni scroll. Solo CSS seguro.
(function(){
  function css(){
    if(document.getElementById('tomauno-v30-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v30-patch-css';
    st.textContent=[
      '#chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      '@media(min-width:701px){body:not(.tomauno-admin-active) #chat-popover.open{height:min(72vh,660px)!important;max-height:min(72vh,660px)!important;width:min(380px,calc(100vw - 24px))!important;}}',
      '@media(max-width:700px){#chat-popover.open{left:8px!important;right:8px!important;width:auto!important;max-width:none!important;bottom:calc(var(--tomauno-keyboard,0px) + 8px)!important;max-height:calc(100dvh - var(--tomauno-keyboard,0px) - 18px)!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true}); else css();
})();
