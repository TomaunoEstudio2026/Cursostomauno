// Extraído de <script id="patch-v71-admin-mute-safe">
(function(){
  var LS_ADMIN = 'tomauno-admin-notify';
  var LS_MUTE = 'tomauno-visit-sound-muted';
  var cleaning = false;

  function adminRemembered(){
    try{ return localStorage.getItem(LS_ADMIN) === '1' || window._adminWasActive === true; }catch(e){ return window._adminWasActive === true; }
  }
  function muted(){ try{ return localStorage.getItem(LS_MUTE) === '1'; }catch(e){ return false; } }
  function setMuted(v){ try{ localStorage.setItem(LS_MUTE, v ? '1' : '0'); }catch(e){} syncMuteButton(true); }
  function say(msg){ try{ if(typeof window.toast === 'function') window.toast(msg, true); }catch(e){} }

  function syncAdmVisual(){
    var logged = adminRemembered();
    var live = document.getElementById('admin-live-indicator');
    if(live){
      live.classList.toggle('v71-off', !logged);
      if(!logged){
        live.className = 'admin-live-indicator v71-off';
        var tx = document.getElementById('admin-live-text');
        if(tx) tx.textContent = '';
      }else{
        live.classList.remove('v71-off');
        live.style.cursor = 'pointer';
        live.title = 'Cerrar sesión admin';
      }
    }
    var b = document.getElementById('visit-sound-toggle');
    if(b) b.classList.toggle('v71-admin-off', !logged);
  }

  function syncMuteButton(showToast){
    var b = document.getElementById('visit-sound-toggle');
    if(!b){ syncAdmVisual(); return; }
    var m = muted();
    b.textContent = m ? '🔕' : '🔔';
    b.classList.toggle('off', m);
    b.setAttribute('aria-label', m ? 'Sonido de visitantes silenciado' : 'Sonido de visitantes activo');
    b.title = m ? 'MUTE: activar sonido de entrada de visitantes' : 'Silenciar solo entrada de visitantes';
    syncAdmVisual();
    if(showToast) say(m ? '🔕 MUTE: sonido de visitantes silenciado' : '🔔 Sonido de visitantes activado');
  }

  function forceLogoutVisual(){
    cleaning = true;
    try{ localStorage.removeItem(LS_ADMIN); }catch(e){}
    try{ window._adminWasActive = false; }catch(e){}
    try{ if(typeof window.toggleAdmin === 'function') window.toggleAdmin(false); }catch(e){}
    try{ if(typeof window.cerrarAdmin === 'function') window.cerrarAdmin(); }catch(e){}
    try{ document.getElementById('chat-popover')?.classList.remove('open','expanded'); }catch(e){}
    setTimeout(function(){ syncAdmVisual(); cleaning = false; }, 40);
    setTimeout(syncAdmVisual, 250);
    setTimeout(syncAdmVisual, 900);
  }

  // Refuerzo seguro del logout existente: primero llama al original, después limpia visual/localStorage.
  var originalLogout = window.logoutAdminRealTomauno;
  if(typeof originalLogout === 'function' && !originalLogout.__v71Wrapped){
    var wrapped = async function(){
      try{ await originalLogout.apply(this, arguments); }catch(e){}
      forceLogoutVisual();
      say('🔒 Sesión admin cerrada');
      return true;
    };
    wrapped.__v71Wrapped = true;
    window.logoutAdminRealTomauno = wrapped;
  }

  // Si algún handler viejo deja el ADM verde, este capture garantiza limpieza después del clic.
  document.addEventListener('click', function(ev){
    var live = ev.target && ev.target.closest && ev.target.closest('#admin-live-indicator');
    var muteBtn = ev.target && ev.target.closest && ev.target.closest('#visit-sound-toggle');

    if(muteBtn){
      // No volvemos a alternar acá: dejamos actuar al handler original y sincronizamos la UI después.
      setTimeout(function(){ syncMuteButton(true); }, 0);
      setTimeout(syncMuteButton, 250);
      return;
    }

    if(live){
      setTimeout(function(){
        if(!adminRemembered() || cleaning) forceLogoutVisual();
        else syncAdmVisual();
      }, 120);
      setTimeout(syncAdmVisual, 700);
    }
  }, true);

  // El atajo puede seguir existiendo, pero si no hay sesión recordada debe pedir PIN, no abrir directo.
  document.addEventListener('keydown', function(ev){
    if(ev.altKey && ev.shiftKey && String(ev.key||'').toLowerCase()==='a'){
      if(!adminRemembered()){
        try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
        try{ if(typeof window.showPin === 'function') window.showPin(); else if(typeof window.handleLogoClick === 'function') window.handleLogoClick({preventDefault:function(){},stopPropagation:function(){},stopImmediatePropagation:function(){}}); }catch(e){}
      }
    }
  }, true);

  function init(){ syncMuteButton(false); syncAdmVisual(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
  setTimeout(init, 400);
  setInterval(function(){ syncMuteButton(false); syncAdmVisual(); }, 2500);
})();
