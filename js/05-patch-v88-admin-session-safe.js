// Extraído de <script id="patch-v88-admin-session-safe">
(function(){
  var VERSION='v88';
  var LS_ADMIN='tomauno-admin-notify';

  function hasAdmin(){ try{ return localStorage.getItem(LS_ADMIN)==='1'; }catch(e){ return false; } }
  function setVersion(){
    try{
      var tag=document.getElementById('tomauno-version-tag');
      if(!tag){
        var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;
        tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);
      }
      tag.textContent='Tomauno '+VERSION;
    }catch(e){}
  }
  function showPublic(){
    try{
      var adm=document.getElementById('admin-section'); if(adm) adm.style.display='none';
      ['hero','sec-cursos','sec-eventos','sec-servicios','sec-galeria','sec-testimonios','sec-faq','sec-ubicacion'].forEach(function(id){var el=document.getElementById(id); if(el) el.style.display='';});
      var footer=document.querySelector('footer'); if(footer) footer.style.display='';
      if(location.hash==='#admin') history.replaceState({},'',location.pathname+location.search);
    }catch(e){}
  }
  function syncControls(){
    try{
      var ok=hasAdmin();
      document.body.classList.toggle('tu-admin-closed', !ok);
      var live=document.getElementById('admin-live-indicator');
      if(live){
        live.style.display=ok?'':'none';
        live.title=ok?'Cerrar sesión admin':'Admin cerrado';
        if(ok){ live.classList.add('on'); live.classList.remove('v71-off'); }
      }
      var tx=document.getElementById('admin-live-text');
      if(tx && ok && String(tx.textContent||'').trim()==='') tx.textContent='ADM *';
      var bell=document.getElementById('visit-sound-toggle');
      if(bell) bell.style.display=ok?'':'none';
      if(ok && typeof window.updateAdminLiveIndicator==='function') window.updateAdminLiveIndicator();
    }catch(e){}
  }
  function closeAdminPanelOnly(){
    // Salir del panel: conserva sesión admin. No borra localStorage, no apaga AUTO/ADM.
    showPublic();
    try{ localStorage.setItem(LS_ADMIN,'1'); }catch(e){}
    try{ window._adminWasActive=true; }catch(e){}
    syncControls();
    return false;
  }
  function closeAdminSessionReal(){
    // Cierre real: se usa al tocar ADM. Limpia sesión y cierra panel/chat admin.
    try{ localStorage.removeItem(LS_ADMIN); }catch(e){}
    try{ window._adminWasActive=false; }catch(e){}
    try{
      var pop=document.getElementById('chat-popover');
      if(pop) pop.classList.remove('open','expanded','chat-tools-collapsed');
    }catch(e){}
    showPublic();
    syncControls();
    try{ if(typeof window.toast==='function') window.toast('🔒 Sesión admin cerrada', true); }catch(e){}
    return false;
  }
  function patchCerrarAdmin(){
    // En esta web el botón ← Salir llama a cerrarAdmin(); debe cerrar solo el panel.
    if(!window.cerrarAdmin || window.cerrarAdmin.__v88PanelOnly) return;
    var fn=function(){ return closeAdminPanelOnly(); };
    fn.__v88PanelOnly=true;
    window.cerrarAdmin=fn;
  }
  function patchLogoutReal(){
    if(typeof window.logoutAdminRealTomauno==='function' && !window.logoutAdminRealTomauno.__v88Logout){
      var old=window.logoutAdminRealTomauno;
      var fn=function(){
        try{ old.apply(this, arguments); }catch(e){}
        return closeAdminSessionReal();
      };
      fn.__v88Logout=true;
      window.logoutAdminRealTomauno=fn;
    }else if(typeof window.logoutAdminRealTomauno!=='function'){
      window.logoutAdminRealTomauno=closeAdminSessionReal;
      window.logoutAdminRealTomauno.__v88Logout=true;
    }
  }
  function bindAdmClick(){
    var live=document.getElementById('admin-live-indicator');
    if(!live || live.dataset.v88AdmBound==='1') return;
    live.dataset.v88AdmBound='1';
    live.addEventListener('click',function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      if(!hasAdmin()) return false;
      if(typeof window.showConfirm==='function') window.showConfirm('¿Cerrar sesión admin y volver a pedir PIN?', function(){ closeAdminSessionReal(); });
      else if(confirm('¿Cerrar sesión admin?')) closeAdminSessionReal();
      return false;
    },true);
  }
  function init(){ setVersion(); patchCerrarAdmin(); patchLogoutReal(); bindAdmClick(); syncControls(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,250); setTimeout(init,1000); setTimeout(init,2500);
  setInterval(init,3000);
})();
