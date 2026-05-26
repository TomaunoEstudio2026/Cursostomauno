// Extraído de <script id="patch-v54-admin-logout-fast-open">
(function(){
  function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn(); }
  ready(function(){
    try{
      var live = document.getElementById('admin-live-indicator');
      if(live){ live.title = 'Cerrar sesión admin'; live.style.cursor = 'pointer'; }
    }catch(e){}

    var openAdminOriginal = window.abrirAdminRapido;

    // Desde ahora, hacer clic en ADM vuelve a cerrar sesión. La apertura rápida queda por teclado.
    window.abrirAdminRapido = function(){
      try{
        if(typeof window.cerrarSesionAdminTomauno === 'function'){
          window.cerrarSesionAdminTomauno();
          return true;
        }
      }catch(e){}
      return false;
    };

    // Acceso rápido al panel completo solo por teclado si ya estaba logueado/recordado.
    document.addEventListener('keydown', function(ev){
      if(ev.altKey && ev.shiftKey && String(ev.key||'').toLowerCase()==='a'){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        try{
          if(typeof openAdminOriginal === 'function') return openAdminOriginal.call(window);
        }catch(e){}
      }
    }, true);
  });
})();
