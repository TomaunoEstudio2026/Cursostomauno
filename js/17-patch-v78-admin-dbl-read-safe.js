// Extraído de <script id="patch-v78-admin-dbl-read-safe">
(function(){
  var VERSION='v78';
  var LS_ADMIN='tomauno-admin-notify';
  var originalLogoHandler = window.handleLogoClick;
  var readLocks = Object.create(null);

  function toast(msg){ try{ if(typeof window.toast==='function') window.toast(msg,true); }catch(e){} }
  function hasAdminSession(){ try{ return localStorage.getItem(LS_ADMIN)==='1'; }catch(e){ return false; } }
  function fakeEvent(){ return {preventDefault:function(){},stopPropagation:function(){},stopImmediatePropagation:function(){}}; }
  function setVersion(){
    try{
      var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body;
      var tag=document.getElementById('tomauno-version-tag');
      if(!tag){ tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag); }
      tag.textContent='Tomauno '+VERSION;
    }catch(e){}
  }
  function showPinManual(){
    try{
      var m=document.getElementById('mcontent'), ov=document.getElementById('moverlay');
      if(!m || !ov) return false;
      m.innerHTML = '<div style="max-width:280px;margin:0 auto;text-align:left;">' +
        '<div class="mtitle" style="font-size:26px;margin-bottom:12px;text-align:center;line-height:1;">🔐 ACCESO</div>' +
        '<label class="flbl" style="text-align:center;display:block;">PIN ADM</label>' +
        '<input class="finput" id="pin-inp" type="password" placeholder="••••" maxlength="8" style="text-align:center;font-size:20px;letter-spacing:.25em;margin-bottom:10px;" />' +
        '<button class="btn-main" id="pin-submit-v78" style="padding:11px;margin-top:4px;">Entrar</button>' +
        '</div>';
      ov.style.display='flex';
      var box=ov.querySelector('.mbox');
      if(box){ box.style.maxWidth='380px'; box.style.padding='26px 24px 30px'; box.dataset.compactPin='1'; }
      var inp=document.getElementById('pin-inp'), btn=document.getElementById('pin-submit-v78');
      var submit=function(){ try{ if(typeof window.submitPin==='function') window.submitPin(); }catch(e){} };
      if(btn) btn.onclick=submit;
      if(inp){ inp.onkeydown=function(ev){ if(ev.key==='Enter') submit(); }; setTimeout(function(){try{inp.focus();}catch(e){}},60); }
      return true;
    }catch(e){ return false; }
  }
  function openAdminByOriginal(){
    try{
      if(typeof originalLogoHandler==='function'){
        for(var i=0;i<5;i++) originalLogoHandler.call(window, fakeEvent());
        return true;
      }
    }catch(e){}
    return false;
  }
  function openAdminControlled(){
    if(hasAdminSession()){
      if(openAdminByOriginal()) return;
    }
    showPinManual();
  }
  // Desde ahora cualquier parche viejo que llame handleLogoClick cae en esta lógica controlada.
  window.handleLogoClick=function(ev){
    try{ if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); } }catch(e){}
    openAdminControlled();
    return false;
  };
  function goHome(){
    try{ if(typeof window.cerrarAdmin==='function') window.cerrarAdmin(); }catch(e){}
    try{ if(location.hash){ history.replaceState({},'',location.pathname+location.search); } }catch(e){}
    try{ window.scrollTo({top:0,behavior:'smooth'}); }catch(e){ try{window.scrollTo(0,0);}catch(_e){} }
  }
  function bindLogoClean(){
    var old=document.getElementById('logo-btn');
    if(!old || old.dataset.v78LogoClean==='1') return;
    var logo=old.cloneNode(true);
    logo.dataset.v78LogoClean='1';
    logo.removeAttribute('onclick');
    logo.setAttribute('href','#');
    logo.title='Clic: inicio · Doble clic: admin';
    var timer=null, clicks=0;
    logo.addEventListener('click',function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      clicks++; clearTimeout(timer);
      timer=setTimeout(function(){
        if(clicks>=2) openAdminControlled(); else goHome();
        clicks=0;
      },260);
      return false;
    },true);
    old.parentNode.replaceChild(logo,old);
  }
  // Atajo: si no hay sesión, nunca abre directo; muestra PIN.
  document.addEventListener('keydown',function(ev){
    if(ev.altKey && ev.shiftKey && String(ev.key||'').toLowerCase()==='a'){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      openAdminControlled();
      return false;
    }
  },true);

  function lastUserTs(c){
    try{
      var msgs = (typeof window.chatMsgs==='function') ? window.chatMsgs(c) : Object.entries((c&&c.messages)||{});
      var users = msgs.filter(function(p){ var m=p[1]; return m && m.from==='user' && !m.typing; });
      if(users.length){ return Number(users[users.length-1][1].createdAt || c.updatedAt || 0); }
    }catch(e){}
    return Number((c&&c.updatedAt)||0);
  }
  function markReadLocal(id){
    if(!id) return;
    readLocks[id]=Date.now()+20000;
    try{
      if(window.chatsDB && window.chatsDB[id]){
        window.chatsDB[id].unreadAdmin=false;
        window.chatsDB[id].lastAdminReadAt=Date.now();
      }
    }catch(e){}
  }
  function cleanReadDom(id){
    if(!id) return;
    try{
      document.querySelectorAll('.chat-tab,.chat-list-item').forEach(function(el){
        var oc=String(el.getAttribute('onclick')||'');
        if(oc.indexOf("abrirChatAdmin('"+id+"')")!==-1 || oc.indexOf('abrirChatAdmin(\"'+id+'\")')!==-1){
          el.classList.remove('unread','waiting');
          el.classList.add('tu-read-fix');
          var status=el.querySelector('.chat-status');
          if(status && /nuevo|esperando/i.test(status.textContent||'')){ status.textContent='Leído'; status.classList.remove('new'); }
          var foot=el.querySelector('.chat-tab-foot');
          if(foot && /^Esperando/i.test(foot.textContent||'')){ foot.textContent=foot.textContent.replace(/^Esperando/i,'Leído'); }
        }
      });
    }catch(e){}
  }
  function wrapOpenChat(){
    if(typeof window.abrirChatAdmin!=='function' || window.abrirChatAdmin.__v78ReadWrapped) return;
    var old=window.abrirChatAdmin;
    var wrapped=function(id){
      markReadLocal(id);
      var r=old.apply(this,arguments);
      markReadLocal(id);
      setTimeout(function(){ markReadLocal(id); cleanReadDom(id); },40);
      setTimeout(function(){ markReadLocal(id); cleanReadDom(id); },250);
      setTimeout(function(){ markReadLocal(id); cleanReadDom(id); },900);
      return r;
    };
    wrapped.__v78ReadWrapped=true;
    window.abrirChatAdmin=wrapped;
  }
  function maintainReadState(){
    try{
      var id=window.currentOpenChatId || '';
      if(id && readLocks[id] && readLocks[id]>Date.now()){
        markReadLocal(id); cleanReadDom(id);
      }
    }catch(e){}
  }
  function init(){ setVersion(); bindLogoClean(); wrapOpenChat(); maintainReadState(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,250); setTimeout(init,900); setInterval(init,1800); setInterval(maintainReadState,700);
})();
