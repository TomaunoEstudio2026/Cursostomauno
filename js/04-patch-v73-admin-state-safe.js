// Extraído de <script id="patch-v73-admin-state-safe">
(function(){
  var VERSION = 'v77';
  var LS_ADMIN = 'tomauno-admin-notify';
  var LS_MUTE = 'tomauno-visit-sound-muted';

  function hasAdminSession(){
    try{ return localStorage.getItem(LS_ADMIN) === '1'; }catch(e){ return false; }
  }
  function isMuted(){
    try{ return localStorage.getItem(LS_MUTE) === '1'; }catch(e){ return false; }
  }
  function toastMsg(msg){
    try{ if(typeof window.toast === 'function') window.toast(msg, true); }catch(e){}
  }
  function addVersion(){
    try{
      var f = document.querySelector('footer .fcred') || document.querySelector('footer');
      if(!f) return;
      var tag = document.getElementById('tomauno-version-tag');
      if(!tag){ tag = document.createElement('span'); tag.id = 'tomauno-version-tag'; tag.className = 'tomauno-version-tag'; f.appendChild(tag); }
      tag.textContent = 'Tomauno ' + VERSION;
    }catch(e){}
  }
  function syncAdminVisual(){
    var logged = hasAdminSession();
    try{ document.body.classList.toggle('tu-admin-logged-out', !logged); }catch(e){}
    var live = document.getElementById('admin-live-indicator');
    if(live){
      if(!logged){
        live.className = 'admin-live-indicator';
        live.style.display = 'none';
        var tx = document.getElementById('admin-live-text');
        if(tx) tx.textContent = '';
      }else{
        live.style.display = '';
        live.title = 'Cerrar sesión admin';
        live.style.cursor = 'pointer';
      }
    }
    syncMuteButton(false);
  }
  function syncMuteButton(show){
    var b = document.getElementById('visit-sound-toggle');
    if(!b) return;
    var m = isMuted();
    var logged = hasAdminSession();
    b.style.display = logged ? '' : 'none';
    b.textContent = m ? '🔕' : '🔔';
    b.classList.toggle('off', m);
    b.classList.toggle('tu-muted', m);
    b.title = m ? 'MUTE: activar sonido de entrada de visitantes' : 'Silenciar solo entrada de visitantes';
    b.setAttribute('aria-label', m ? 'Sonido de visitantes silenciado' : 'Sonido de visitantes activo');
    if(show) toastMsg(m ? '🔕 MUTE: sonido de visitantes silenciado' : '🔔 Sonido de visitantes activado');
  }
  function toggleMute(ev){
    if(ev){ try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){} }
    try{ localStorage.setItem(LS_MUTE, isMuted() ? '0' : '1'); }catch(e){}
    setTimeout(function(){ syncMuteButton(true); }, 10);
    setTimeout(function(){ syncMuteButton(false); }, 250);
    return false;
  }
  function rebindMuteButton(){
    var b = document.getElementById('visit-sound-toggle');
    if(!b) return;
    if(b.dataset.v73MuteBound === '1'){ syncMuteButton(false); return; }
    var clone = b.cloneNode(true);
    clone.dataset.v73MuteBound = '1';
    clone.onclick = toggleMute;
    clone.addEventListener('click', toggleMute, true);
    b.parentNode.replaceChild(clone, b);
    syncMuteButton(false);
  }
  function forceLogout(ev){
    if(ev){ try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){} }
    try{ localStorage.removeItem(LS_ADMIN); }catch(e){}
    try{ sessionStorage.removeItem('tomauno-admin-ok'); }catch(e){}
    try{ window._adminWasActive = false; }catch(e){}
    try{ if(typeof window.logoutAdminRealTomauno === 'function') window.logoutAdminRealTomauno(); }
    catch(e){ try{ if(typeof window.cerrarSesionAdminTomauno === 'function') window.cerrarSesionAdminTomauno(); }catch(_e){} }
    try{ if(typeof window.toggleAdmin === 'function') window.toggleAdmin(false); }catch(e){}
    try{ if(typeof window.cerrarAdmin === 'function') window.cerrarAdmin(); }catch(e){}
    try{ document.getElementById('chat-popover')?.classList.remove('open','expanded'); }catch(e){}
    setTimeout(syncAdminVisual, 20);
    setTimeout(syncAdminVisual, 220);
    setTimeout(syncAdminVisual, 900);
    toastMsg('🔒 Sesión admin cerrada');
    return false;
  }
  function askPin(){
    try{ if(typeof window.showPin === 'function'){ window.showPin(); return; } }catch(e){}
    try{ if(typeof window.handleLogoClick === 'function') window.handleLogoClick({preventDefault:function(){},stopPropagation:function(){},stopImmediatePropagation:function(){}}); }catch(e){}
  }
  function openAdminSafe(){
    if(hasAdminSession()){
      try{ if(typeof window.toggleAdmin === 'function'){ window.toggleAdmin(true); return; } }catch(e){}
      try{ if(typeof window.abrirAdminRapido === 'function'){ window.abrirAdminRapido(); return; } }catch(e){}
    }
    askPin();
  }
  function goInicio(){
    try{ if(typeof window.cerrarAdmin === 'function') window.cerrarAdmin(); }catch(e){}
    try{ if(location.hash){ history.replaceState({}, '', location.pathname + location.search); } }catch(e){}
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
  }
  function bindLogo(){
    var logo = document.getElementById('logo-btn');
    if(!logo || logo.dataset.v73LogoBound === '1') return;
    logo.dataset.v73LogoBound = '1';
    logo.title = 'Clic: inicio · Doble clic: admin';
    var t = null, c = 0;
    logo.addEventListener('click', function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      c += 1; clearTimeout(t);
      t = setTimeout(function(){ if(c >= 2) openAdminSafe(); else goInicio(); c = 0; }, 260);
      return false;
    }, true);
  }
  function bindAdm(){
    var live = document.getElementById('admin-live-indicator');
    if(live && live.dataset.v73LogoutBound !== '1'){
      live.dataset.v73LogoutBound = '1';
      live.addEventListener('click', forceLogout, true);
    }
  }
  document.addEventListener('keydown', function(ev){
    if(ev.altKey && ev.shiftKey && String(ev.key||'').toLowerCase() === 'a'){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      openAdminSafe();
    }
  }, true);
  document.addEventListener('click', function(ev){
    var b = ev.target && ev.target.closest && ev.target.closest('#visit-sound-toggle');
    if(b) return toggleMute(ev);
  }, true);
  function init(){ addVersion(); bindLogo(); bindAdm(); rebindMuteButton(); syncAdminVisual(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
  setTimeout(init, 300);
  setTimeout(init, 900);
  setInterval(init, 2500);
})();
