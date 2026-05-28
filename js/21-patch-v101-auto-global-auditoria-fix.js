// Tomauno v23 — parche mínimo y seguro.
// Reemplaza /js/21-patch-v101-auto-global-auditoria-fix.js
// Este archivo ya NO envuelve enviarChatVisitante, scrollChatSmart ni updateChatMessagesOnly.
// La estabilización real queda al final de 02-module.js para evitar doble/triple captura.
(function(){
  'use strict';
  function safe(fn){try{return fn();}catch(e){try{console.warn('v23 patch:',e);}catch(_){}}}
  function css(){safe(function(){
    if(document.getElementById('tomauno-v23-min-css')) return;
    var st=document.createElement('style'); st.id='tomauno-v23-min-css';
    st.textContent=[
      'html body #notif-banner{z-index:99999!important;}',
      'html body .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      'html body .chat-popover.open .chat-row input,html body .chat-popover.open .chat-row textarea{font-size:16px!important;}',
      'html body .chat-action-row{display:flex!important;gap:6px!important;flex-wrap:wrap!important;margin-top:8px!important;}',
      'html body .chat-action-btn{border:1px solid rgba(255,255,255,.16)!important;border-radius:999px!important;background:rgba(255,255,255,.08)!important;color:inherit!important;padding:6px 10px!important;font-size:12px!important;cursor:pointer!important;}'
    ].join('\n');
    document.head.appendChild(st);
  });}
  function viewport(){safe(function(){
    var vv=window.visualViewport; var k=0;
    if(vv) k=Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--tomauno-keyboard', Math.round(k)+'px');
  });}
  function humanText(){safe(function(){
    document.querySelectorAll('.chat-bubble.admin').forEach(function(b){
      var t=b.innerText||'';
      if(/Javier puede estar ocupado|dej[eé] registrada tu consulta|Te dejo el WhatsApp directo|pasame tambi[eé]n tu WhatsApp/i.test(t)){
        b.innerHTML='🟢 Javier responderá personalmente.<br><br>📱 Para dejar tu consulta necesito que me pases tu WhatsApp y el mensaje para Javier.<div class="chat-meta">Ahora</div>';
      }
    });
  });}
  function run(){css(); viewport(); humanText();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  if(window.visualViewport){visualViewport.addEventListener('resize',viewport); visualViewport.addEventListener('scroll',viewport);}
  setInterval(humanText,1200);
})();
