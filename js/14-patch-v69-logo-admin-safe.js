// Extraído de <script id="patch-v69-logo-admin-safe">
(function(){
  var timer = null;
  var clicks = 0;

  function rememberedAdmin(){
    try{ return localStorage.getItem('tomauno-admin-notify') === '1'; }catch(e){ return false; }
  }

  function goInicio(){
    try{
      var admin = document.getElementById('admin-section');
      if(admin && admin.style.display !== 'none' && typeof window.cerrarAdmin === 'function'){
        window.cerrarAdmin();
      }
    }catch(e){}
    try{
      if(location.hash && ['#admin','#chat','#consulta','#asistente'].indexOf(String(location.hash).toLowerCase()) >= 0){
        history.replaceState({}, '', location.pathname + location.search);
      }
    }catch(e){}
    try{
      var hero = document.querySelector('.hero') || document.getElementById('hero');
      if(hero && hero.scrollIntoView) hero.scrollIntoView({behavior:'smooth', block:'start'});
      else window.scrollTo({top:0, behavior:'smooth'});
    }catch(e){ try{ window.scrollTo(0,0); }catch(_e){} }
  }

  function openAdmin(){
    try{
      if(rememberedAdmin() && typeof window.toggleAdmin === 'function'){
        window.toggleAdmin(true);
        return;
      }
    }catch(e){}
    try{
      if(typeof window.showPin === 'function'){
        window.showPin();
        return;
      }
    }catch(e){}
    try{
      if(typeof window.handleLogoClick === 'function'){
        var fake = {preventDefault:function(){}, stopPropagation:function(){}, stopImmediatePropagation:function(){}};
        for(var i=0;i<5;i++) window.handleLogoClick(fake);
      }
    }catch(e){}
  }

  function bind(){
    var logo = document.getElementById('logo-btn');
    if(!logo || logo.dataset.v69LogoSafe === '1') return;
    logo.dataset.v69LogoSafe = '1';
    logo.title = 'Clic: inicio · Doble clic: admin';
    logo.addEventListener('click', function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(function(){
        if(clicks >= 2) openAdmin();
        else goInicio();
        clicks = 0;
      }, 260);
      return false;
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
  setTimeout(bind, 500);
})();
