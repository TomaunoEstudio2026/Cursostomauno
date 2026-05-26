// Extraído de <script id="patch-v92-admin-master-state">
(function(){
  var VERSION='v92';
  var LS='tomauno-admin-notify';
  var PIN='3233';
  var clickTimer=null, clickCount=0;
  function safe(fn){try{return fn();}catch(e){return undefined;}}
  function toast(msg){safe(function(){ if(typeof window.toast==='function') window.toast(msg,true); });}
  function logged(){return !!safe(function(){return localStorage.getItem(LS)==='1';});}
  function setLogged(v){safe(function(){ if(v) localStorage.setItem(LS,'1'); else localStorage.removeItem(LS); }); safe(function(){window._adminWasActive=!!v;});}
  function showSectionsPublic(){
    safe(function(){
      ['hero','sec-cursos','sec-eventos','sec-servicios','sec-galeria','sec-testimonios','sec-faq','sec-ubicacion'].forEach(function(id){var el=document.getElementById(id); if(el) el.style.display='';});
      var footer=document.querySelector('footer'); if(footer) footer.style.display='';
      var adm=document.getElementById('admin-section'); if(adm) adm.style.display='none';
      if(location.hash==='#admin') history.replaceState({},'',location.pathname+location.search);
    });
  }
  function syncVisual(){
    var ok=logged();
    safe(function(){document.body.classList.toggle('tu-master-admin-open',ok); document.body.classList.toggle('tu-master-admin-closed',!ok);});
    safe(function(){
      var live=document.getElementById('admin-live-indicator');
      if(live){
        live.style.display=ok?'inline-flex':'none';
        live.style.visibility=ok?'visible':'hidden';
        live.style.opacity=ok?'1':'0';
        live.style.pointerEvents=ok?'auto':'none';
        live.title=ok?'Cerrar sesión admin':'Admin cerrado';
        var txt=document.getElementById('admin-live-text');
        if(txt && ok && !/ADM/i.test(txt.textContent||'')) txt.textContent='ADM ON';
      }
      var bell=document.getElementById('visit-sound-toggle');
      if(bell){bell.style.display=ok?'inline-flex':'none'; bell.style.visibility=ok?'visible':'hidden';}
    });
  }
  function setVersion(){
    safe(function(){
      var tag=document.getElementById('tomauno-version-tag');
      if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body; tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);}
      tag.textContent='Tomauno '+VERSION;
    });
  }
  function openAdminPanel(){
    setLogged(true);
    safe(function(){document.body.classList.remove('tu-master-admin-closed'); document.body.classList.add('tu-master-admin-open');});
    safe(function(){
      var adm=document.getElementById('admin-section'); if(adm) adm.style.display='block';
      ['hero','sec-cursos','sec-eventos','sec-servicios','sec-galeria','sec-testimonios','sec-faq','sec-ubicacion'].forEach(function(id){var el=document.getElementById(id); if(el) el.style.display='none';});
      var footer=document.querySelector('footer'); if(footer) footer.style.display='none';
      if(location.hash!=='#admin') history.pushState({admin:true},'','#admin');
      window.scrollTo(0,0);
    });
    syncVisual();
  }
  function closePanelOnly(){
    showSectionsPublic();
    syncVisual();
    return false;
  }
  function logoutReal(){
    setLogged(false);
    safe(function(){sessionStorage.removeItem(LS); sessionStorage.removeItem('tomauno-admin-ok');});
    safe(function(){
      var pop=document.getElementById('chat-popover');
      if(pop){pop.classList.remove('admin','admin-open','is-admin','expanded');}
    });
    showSectionsPublic();
    syncVisual();
    toast('🔒 Sesión admin cerrada');
    return false;
  }
  function showPin(){
    safe(function(){
      var ov=document.getElementById('moverlay'), m=document.getElementById('mcontent');
      if(!ov||!m) return;
      m.innerHTML='<div style="max-width:280px;margin:0 auto;text-align:left;">'+
        '<div class="mtitle" style="font-size:26px;margin-bottom:12px;text-align:center;line-height:1;">🔐 ACCESO</div>'+
        '<label class="flbl" style="text-align:center;display:block;">PIN ADM</label>'+
        '<input class="finput" id="pin-inp" type="password" placeholder="••••" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.25em;margin-bottom:10px;" />'+
        '<button class="btn-main" id="pin-submit-v92" style="padding:11px;margin-top:4px;">Entrar</button>'+
        '</div>';
      ov.style.display='flex';
      var box=ov.querySelector('.mbox'); if(box){box.style.maxWidth='380px'; box.style.padding='26px 24px 30px';}
      var inp=document.getElementById('pin-inp'), btn=document.getElementById('pin-submit-v92');
      var submit=function(){var v=(inp&&inp.value)||''; if(v===PIN){safe(function(){if(typeof window.closeModal==='function') window.closeModal(); else ov.style.display='none';}); openAdminPanel(); toast('✅ Bienvenido');} else toast('❌ PIN incorrecto');};
      if(btn) btn.onclick=submit;
      if(inp){inp.onkeydown=function(ev){if(ev.key==='Enter') submit();}; setTimeout(function(){safe(function(){inp.focus();});},60);}
    });
  }
  function adminAccess(){ if(logged()) openAdminPanel(); else showPin(); }
  function goHome(){ closePanelOnly(); safe(function(){window.scrollTo({top:0,behavior:'smooth'});}); }
  function controlEvent(ev){safe(function(){ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation();});}

  // APIs únicas para que los parches viejos no inviertan acciones.
  window.abrirAdminRapido=adminAccess;
  window.tomaunoOpenAdmin=adminAccess;
  window.logoutAdminRealTomauno=logoutReal;
  window.cerrarSesionAdminTomauno=logoutReal;
  window.cerrarAdmin=closePanelOnly;
  window.submitPin=function(){
    var inp=document.getElementById('pin-inp');
    if(inp && inp.value===PIN){safe(function(){if(typeof window.closeModal==='function') window.closeModal();}); openAdminPanel(); toast('✅ Bienvenido');}
    else toast('❌ PIN incorrecto');
  };

  // Ventana en captura: corre antes que los listeners viejos de document.
  window.addEventListener('keydown',function(ev){
    if(ev.altKey && ev.shiftKey && String(ev.key||'').toLowerCase()==='a'){
      controlEvent(ev); adminAccess(); return false;
    }
  },true);
  window.addEventListener('click',function(ev){
    var live=ev.target&&ev.target.closest&&ev.target.closest('#admin-live-indicator');
    if(live){controlEvent(ev); logoutReal(); return false;}
  },true);
  window.addEventListener('dblclick',function(ev){
    var logo=ev.target&&ev.target.closest&&ev.target.closest('#logo-btn,.nav-logo,.logo-txt,.logo-mark');
    if(logo){controlEvent(ev); adminAccess(); return false;}
  },true);

  function bindLogo(){
    var old=document.getElementById('logo-btn');
    if(!old || old.dataset.v92Logo==='1') return;
    var logo=old.cloneNode(true);
    logo.dataset.v92Logo='1';
    logo.removeAttribute('onclick');
    logo.href='#';
    logo.title='Clic: inicio · Doble clic: admin';
    logo.onclick=function(ev){
      controlEvent(ev);
      clickCount++; clearTimeout(clickTimer);
      clickTimer=setTimeout(function(){ if(clickCount>=2) adminAccess(); else goHome(); clickCount=0; },260);
      return false;
    };
    logo.ondblclick=function(ev){controlEvent(ev); clearTimeout(clickTimer); clickCount=0; adminAccess(); return false;};
    old.parentNode.replaceChild(logo,old);
  }
  function init(){setVersion(); bindLogo(); syncVisual();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,300); setTimeout(init,1200); setInterval(init,2500);
})();
