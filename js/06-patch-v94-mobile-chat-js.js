// Extraído de <script id="patch-v94-mobile-chat-js">
(function(){
  function safe(fn){try{return fn();}catch(e){}}
  function setVersion(){safe(function(){var tag=document.getElementById('tomauno-version-tag'); if(tag) tag.textContent='Tomauno v94';});}
  function vvUpdate(){safe(function(){
    var vv=window.visualViewport;
    var h=vv?vv.height:window.innerHeight;
    var top=vv?vv.offsetTop:0;
    var gap=Math.max(0,(window.innerHeight||h)-h-top);
    document.documentElement.style.setProperty('--tu-vvh',Math.round(h)+'px');
    document.documentElement.style.setProperty('--tu-keyboard-gap',Math.round(gap)+'px');
    document.body.classList.toggle('tu-keyboard-open',gap>80);
  });}
  function bind(){
    if(window.__tuV94MobileBound) return; window.__tuV94MobileBound=true;
    document.addEventListener('focusin',function(ev){var t=ev.target; if(t&&t.closest&&t.closest('#chat-popover')&&/^(INPUT|TEXTAREA)$/i.test(t.tagName||'')){document.body.classList.add('tu-chat-input-focus'); vvUpdate(); setTimeout(vvUpdate,80); setTimeout(vvUpdate,260);}},true);
    document.addEventListener('focusout',function(ev){var t=ev.target; if(t&&t.closest&&t.closest('#chat-popover')){setTimeout(function(){var a=document.activeElement; if(!(a&&a.closest&&a.closest('#chat-popover')&&/^(INPUT|TEXTAREA)$/i.test(a.tagName||''))){document.body.classList.remove('tu-chat-input-focus'); vvUpdate();}},120);}},true);
    if(window.visualViewport){visualViewport.addEventListener('resize',vvUpdate); visualViewport.addEventListener('scroll',vvUpdate);}
    window.addEventListener('resize',vvUpdate,{passive:true});
  }
  function init(){bind(); setVersion(); vvUpdate();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,300); setTimeout(init,1200); setInterval(setVersion,4000);
})();
