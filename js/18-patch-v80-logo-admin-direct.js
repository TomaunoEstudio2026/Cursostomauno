// Extraído de <script id="patch-v80-logo-admin-direct">
(function(){
  var VERSION='v80';
  var LS_ADMIN='tomauno-admin-notify';
  var clickTimer=null;
  var clickCount=0;

  function adminSession(){
    try{ return localStorage.getItem(LS_ADMIN)==='1'; }catch(e){ return false; }
  }
  function setVersion(){
    try{
      var tag=document.getElementById('tomauno-version-tag');
      if(!tag){
        var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;
        tag=document.createElement('span');
        tag.id='tomauno-version-tag';
        tag.className='tomauno-version-tag';
        f.appendChild(tag);
      }
      tag.textContent='Tomauno '+VERSION;
    }catch(e){}
  }
  function toast(msg){ try{ if(typeof window.toast==='function') window.toast(msg,true); }catch(e){} }
  function goHome(){
    try{ if(typeof window.cerrarAdmin==='function') window.cerrarAdmin(); }catch(e){}
    try{ if(location.hash){ history.replaceState({},'',location.pathname+location.search); } }catch(e){}
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ try{window.scrollTo(0,0);}catch(_e){} }
  }
  function showPinManual(){
    try{
      var m=document.getElementById('mcontent'), ov=document.getElementById('moverlay');
      if(!m || !ov) return false;
      m.innerHTML='<div style="max-width:280px;margin:0 auto;text-align:left;">'+
        '<div class="mtitle" style="font-size:26px;margin-bottom:12px;text-align:center;line-height:1;">🔐 ACCESO</div>'+
        '<label class="flbl" style="text-align:center;display:block;">PIN ADM</label>'+
        '<input class="finput" id="pin-inp" type="password" placeholder="••••" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.25em;margin-bottom:10px;" />'+
        '<button class="btn-main" id="pin-submit-v80" style="padding:11px;margin-top:4px;">Entrar</button>'+
        '</div>';
      ov.style.display='flex';
      var box=ov.querySelector('.mbox');
      if(box){ box.style.maxWidth='380px'; box.style.padding='26px 24px 30px'; box.dataset.compactPin='1'; }
      var inp=document.getElementById('pin-inp'), btn=document.getElementById('pin-submit-v80');
      var submit=function(){ try{ if(typeof window.submitPin==='function') window.submitPin(); }catch(e){} };
      if(btn) btn.onclick=submit;
      if(inp){ inp.onkeydown=function(ev){ if(ev.key==='Enter') submit(); }; setTimeout(function(){ try{ inp.focus(); }catch(e){} },60); }
      return true;
    }catch(e){ return false; }
  }
  function openAdminDirect(){
    try{
      var adm=document.getElementById('admin-section');
      if(!adm) return false;
      try{ localStorage.setItem(LS_ADMIN,'1'); }catch(e){}
      try{ window._adminWasActive=true; }catch(e){}
      adm.style.display='block';
      ['hero','sec-cursos','sec-eventos','sec-servicios','sec-galeria','sec-testimonios','sec-faq','sec-ubicacion'].forEach(function(id){
        var el=document.getElementById(id); if(el) el.style.display='none';
      });
      var footer=document.querySelector('footer'); if(footer) footer.style.display='none';
      try{ history.pushState({admin:true},'', '#admin'); }catch(e){}
      try{ window.scrollTo(0,0); }catch(e){}
      try{ if(typeof window.updateAdminLiveIndicator==='function') window.updateAdminLiveIndicator(); }catch(e){}
      try{ document.body.classList.remove('tu-admin-logged-out'); }catch(e){}
      var live=document.getElementById('admin-live-indicator'); if(live){ live.style.display=''; live.title='Cerrar sesión admin'; }
      var bell=document.getElementById('visit-sound-toggle'); if(bell){ bell.style.display=''; }
      return true;
    }catch(e){ return false; }
  }
  function openAdminControlled(){
    if(adminSession()){
      if(openAdminDirect()) return;
    }
    showPinManual();
  }
  function bindLogo(){
    var old=document.getElementById('logo-btn');
    if(!old || old.dataset.v80LogoBound==='1') return;
    var logo=old.cloneNode(true);
    logo.dataset.v80LogoBound='1';
    // Evita que parches anteriores vuelvan a enganchar el logo clonado.
    logo.dataset.v73LogoBound='1';
    logo.dataset.v77DblAdmin='1';
    logo.dataset.v78LogoClean='1';
    logo.removeAttribute('onclick');
    logo.setAttribute('href','#');
    logo.title='Clic: inicio · Doble clic: admin';
    logo.onclick=function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer=setTimeout(function(){
        if(clickCount>=2) openAdminControlled();
        else goHome();
        clickCount=0;
      },260);
      return false;
    };
    logo.ondblclick=function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      clearTimeout(clickTimer); clickCount=0;
      openAdminControlled();
      return false;
    };
    old.parentNode.replaceChild(logo,old);
  }
  function init(){ setVersion(); bindLogo(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,300); setTimeout(init,1200); setInterval(setVersion,3000);
})();
