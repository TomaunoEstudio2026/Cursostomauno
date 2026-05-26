// Extraído de <script id="patch-v38-conexion-segura-ui">
(function(){
  window.TOMAUNO_PATCH_VERSION = 'v38-restaurado-conexion-chat-estable';

  // Este parche NO toca Firebase ni reemplaza listeners: evita romper conexión.
  // Solo refuerza el botón desplegable si alguna versión anterior dejó el handler perdido.
  function findPopover(){ return document.getElementById('chat-popover'); }

  document.addEventListener('click', function(ev){
    var btn = ev.target && ev.target.closest ? ev.target.closest('.chat-tools-toggle,[data-chat-tools-toggle]') : null;
    if(!btn) return;
    var pop = findPopover();
    if(!pop) return;
    ev.preventDefault();
    ev.stopPropagation();
    pop.classList.toggle('chat-tools-collapsed');
    btn.classList.toggle('on', !pop.classList.contains('chat-tools-collapsed'));
  }, true);

  // Quita puntos duplicados visuales si quedaron dos indicadores dentro de una misma fila.
  function cleanDuplicatedDots(){
    document.querySelectorAll('.chat-admin-tab,.chat-list-item,.chat-tab,.chat-user-row').forEach(function(row){
      var dots = row.querySelectorAll('.chat-status-dot,.chat-user-dot,.chat-tab-dot,.chat-live-dot');
      if(dots.length > 1){
        for(var i=1;i<dots.length;i++) dots[i].style.display='none';
      }
    });
  }
  setInterval(cleanDuplicatedDots, 1200);
  document.addEventListener('DOMContentLoaded', cleanDuplicatedDots);
})();
