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


/* Tomauno v24 patch mínimo: solo estilos/limpieza, sin interceptar envío. */
(function(){
  function safe(fn){try{return fn();}catch(e){}}
  function css(){
    if(document.getElementById('tomauno-v24-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v24-patch-css';
    st.textContent=[
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}',
      'html body .chat-tab-preview:empty{display:none!important;}',
      'html body .tu-live-list-preview{display:none!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  function clean(){
    safe(function(){
      document.querySelectorAll('.tu-live-list-preview').forEach(function(n){n.remove();});
      document.querySelectorAll('.chat-tab-preview').forEach(function(el){
        if(/^Escribiendo\\s*:/i.test(el.textContent||'')) el.textContent='';
      });
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){css();clean();},{once:true});
  else {css();clean();}
  setInterval(clean,700);
})();


/* Tomauno v25 patch mínimo: estados visuales y estabilidad scroll. */
(function(){
  function safe(fn){try{return fn();}catch(e){}}
  function css(){
    if(document.getElementById('tomauno-v25-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v25-patch-css';
    st.textContent=[
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;padding-bottom:22px!important;}',
      'html body .tu-live-list-preview{display:none!important;}',
      'html body .chat-tab-preview:empty{display:none!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno v26 patch mínimo: altura visitante y botones compactos. */
(function(){
  function css(){
    if(document.getElementById('tomauno-v26-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v26-patch-css';
    st.textContent=[
      '@media(min-width:701px){html body.tomauno-visitor-active #chat-popover.open{height:min(72vh,660px)!important;max-height:min(72vh,660px)!important;width:min(360px,calc(100vw - 22px))!important;max-width:min(360px,calc(100vw - 22px))!important;}}',
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;padding-bottom:26px!important;}',
      'html body #chat-popover.open .tu-quick-actions{flex-wrap:nowrap!important;overflow-x:auto!important;scrollbar-width:none!important;}',
      'html body #chat-popover.open .tu-quick-actions::-webkit-scrollbar{display:none!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno v27 patch mínimo: móvil fullscreen y admin centrado. */
(function(){
  function css(){
    if(document.getElementById('tomauno-v27-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v27-patch-css';
    st.textContent=[
      '@media(max-width:700px){html body #chat-popover.open.tu-mobile-fullscreen{position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;z-index:99998!important;}}',
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;padding-bottom:36px!important;}',
      'html body #chat-popover.open.tu-admin-centered-v27{position:fixed!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;transform:translate(-50%,-50%)!important;}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno v28 patch mínimo: humano y móvil fullscreen. */
(function(){
  function css(){
    if(document.getElementById('tomauno-v28-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v28-patch-css';
    st.textContent=[
      'html body #chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;padding-bottom:34px!important;}',
      '@media(max-width:700px){html body #chat-popover.open.tu-mobile-fullscreen{position:fixed!important;left:0!important;right:0!important;top:0!important;bottom:0!important;width:100vw!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important;z-index:99998!important;}}'
    ].join('\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno v28b patch mínimo: badge humano visible y lectura. */
(function(){
  function css(){
    if(document.getElementById('tomauno-v28b-patch-css')) return;
    var st=document.createElement('style');
    st.id='tomauno-v28b-patch-css';
    st.textContent='.tu-state-human .tu-state-badge{background:rgba(232,0,10,.22)!important;border:1px solid rgba(232,0,10,.55)!important;color:#ff5b5b!important;padding:2px 6px!important;border-radius:999px!important;font-size:9px!important;font-weight:900!important;}';
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno v28b final2 CSS respaldo */
(function(){
  function css(){
    if(document.getElementById('tu-final2-patch-css')) return;
    var st=document.createElement('style');
    st.id='tu-final2-patch-css';
    st.textContent='@media(min-width:701px){body:not(.tomauno-admin-active) #chat-popover.open{height:min(80vh,740px)!important;max-height:min(80vh,740px)!important;width:min(420px,calc(100vw - 24px))!important;max-width:min(420px,calc(100vw - 24px))!important}}#chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}';
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno final3 remove alert buttons */
(function(){
  function clean(){
    document.querySelectorAll('.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-sound-unlock,.tu-v34-sound-unlock').forEach(function(n){n.remove();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  setInterval(clean,1000);
})();


/* Tomauno final4: ocultar botones alerta */
(function(){
  function clean(){
    document.querySelectorAll('.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-sound-unlock,.tu-v34-sound-unlock').forEach(function(n){n.remove();});
    document.querySelectorAll('button').forEach(function(b){
      if(/activar alertas|activar llamada|activar llamadas|activar sonido/i.test(b.innerText||'')) b.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  setInterval(clean,1000);
})();


/* Tomauno final5: ocultar botones alerta */
(function(){
  function clean(){
    document.querySelectorAll('.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-sound-unlock,.tu-v34-sound-unlock').forEach(function(n){n.remove();});
    document.querySelectorAll('button').forEach(function(b){
      if(/activar alertas|activar llamada|activar llamadas|activar sonido/i.test(b.innerText||'')) b.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  setInterval(clean,1000);
})();


/* Tomauno final6: ocultar botones alerta */
(function(){
  function clean(){
    document.querySelectorAll('.tu-v28d-sound-unlock,.tu-call-sound-unlock,.tu-sound-unlock,.tu-v34-sound-unlock').forEach(function(n){n.remove();});
    document.querySelectorAll('button').forEach(function(b){
      if(/activar alertas|activar llamada|activar llamadas|activar sonido/i.test(b.innerText||'')) b.remove();
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  setInterval(clean,1000);
})();


/* Tomauno final6b: colores de estado coherentes */
(function(){
  function css(){
    if(document.getElementById('tu-final6b-colores-css')) return;
    var st=document.createElement('style');
    st.id='tu-final6b-colores-css';
    st.textContent=[
      '.chat-list-item.unread,.chat-tab.unread{border-color:#ffd54a!important;box-shadow:inset 3px 0 0 rgba(255,213,74,.95)!important;}',
      '.chat-list-item.priority,.chat-tab.priority{border-color:#ff0612!important;box-shadow:inset 3px 0 0 rgba(232,0,10,.95)!important;}',
      '.chat-tab.unread .chat-tab-light{background:#ffd54a!important;box-shadow:0 0 0 5px rgba(255,213,74,.16),0 0 18px rgba(255,213,74,.65)!important;}',
      '.chat-tab.priority .chat-tab-light{background:#ff0612!important;box-shadow:0 0 0 5px rgba(232,0,10,.16),0 0 18px rgba(232,0,10,.65)!important;}',
      '.chat-tab.online:not(.unread):not(.priority) .chat-tab-light{background:#38d27a!important;box-shadow:0 0 0 4px rgba(56,210,122,.13)!important;}'
    ].join('\\n');
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno final6d CSS llamada */
(function(){
  function css(){
    if(document.getElementById('tu6d-patch-css')) return;
    var st=document.createElement('style');
    st.id='tu6d-patch-css';
    st.textContent='.tu6d-call{background:#fff!important;color:#111!important;border-radius:18px!important;padding:12px 14px!important;font-weight:700!important;line-height:1.45!important}.tu6d-call::first-line{color:#e8000a!important;font-weight:900!important;}';
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno final6e CSS core */
(function(){
  function css(){
    if(document.getElementById('tu6e-patch-css')) return;
    var st=document.createElement('style');
    st.id='tu6e-patch-css';
    st.textContent='@media(max-width:700px){#chat-popover.open .chat-row{display:grid!important;grid-template-columns:minmax(0,1fr) 56px!important;gap:8px!important;align-items:center!important}#chat-popover.open #chat-text{min-width:0!important;width:100%!important;font-size:17px!important}#chat-popover.open .chat-send{grid-column:2!important;width:56px!important;height:56px!important;min-width:56px!important;border-radius:50%!important}#chat-popover.open .chat-bubble{font-size:15.5px!important;line-height:1.45!important}}';
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();


/* Tomauno final6f CSS white bubble */
(function(){
  function css(){
    if(document.getElementById('tu6f-patch-css')) return;
    var st=document.createElement('style');
    st.id='tu6f-patch-css';
    st.textContent='.tu6f-white{background:#fff!important;color:#111!important;border-radius:18px!important;padding:12px 14px!important;font-weight:700!important;line-height:1.45!important}.tu6f-white::first-line{color:#e8000a!important;font-weight:900!important;}#chat-popover.open .chat-msgs{scroll-behavior:auto!important;overscroll-behavior:contain!important;}';
    document.head.appendChild(st);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',css,{once:true});
  else css();
})();
