// Extraído de <script id="patch-v77-human-admin-safe">
(function(){
  var VERSION='v77';
  var lastHumanAlert=Object.create(null);

  function toast(msg){ try{ if(typeof window.toast==='function') window.toast(msg,true); }catch(e){} }
  function setVersion(){
    try{
      var tag=document.getElementById('tomauno-version-tag');
      if(tag) tag.textContent='Tomauno '+VERSION;
    }catch(e){}
  }
  function beepStrong(){
    try{
      var Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx) return;
      var ctx=window.__tuHumanCtx77||(window.__tuHumanCtx77=new Ctx());
      if(ctx.state==='suspended') ctx.resume();
      var t=ctx.currentTime;
      [0,.18,.36,.62].forEach(function(d,i){
        var o=ctx.createOscillator(), g=ctx.createGain();
        o.type=i%2?'square':'sine'; o.frequency.value=i%2?880:660;
        g.gain.setValueAtTime(0.0001,t+d);
        g.gain.exponentialRampToValueAtTime(0.18,t+d+.025);
        g.gain.exponentialRampToValueAtTime(0.0001,t+d+.14);
        o.connect(g); g.connect(ctx.destination); o.start(t+d); o.stop(t+d+.16);
      });
    }catch(e){}
  }
  function showHumanBanner(chatId, body){
    try{ document.querySelectorAll('.tu-human-alert-v77').forEach(function(x){x.remove();}); }catch(e){}
    var d=document.createElement('div');
    d.className='tu-human-alert-v77';
    d.innerHTML='<div class="t">⚠️ Atención humana</div><div class="b">'+String(body||'Hay una persona esperando a Javier')+'</div>';
    d.onclick=function(){ try{ if(chatId && typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(chatId); }catch(e){} d.remove(); };
    document.body.appendChild(d);
    setTimeout(function(){ try{ d.remove(); }catch(e){} }, 18000);
  }
  window.tomaunoHumanAlarm=function(chatId, body){
    var key=String(chatId||'_')+'|'+String(body||'');
    var now=Date.now();
    if(lastHumanAlert[key] && now-lastHumanAlert[key]<12000) return;
    lastHumanAlert[key]=now;
    beepStrong();
    showHumanBanner(chatId, body || 'Hay una persona esperando a Javier');
    toast('⚠️ Atención humana solicitada');
    try{
      if('Notification' in window && Notification.permission==='granted'){
        var n=new Notification('⚠️ Atención humana Tomauno',{body:String(body||'Hay una persona esperando a Javier'),tag:'tomauno-human-'+(chatId||'general'),renotify:true,requireInteraction:false});
        n.onclick=function(){ try{ window.focus(); if(chatId && typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(chatId); }catch(e){} try{n.close();}catch(_e){} };
      }
    }catch(e){}
  };

  function openByFiveClicks(){
    try{
      if(typeof window.handleLogoClick==='function'){
        var fake={preventDefault:function(){},stopPropagation:function(){},stopImmediatePropagation:function(){}};
        for(var i=0;i<5;i++) window.handleLogoClick(fake);
        return true;
      }
    }catch(e){}
    toast('No pude abrir admin desde el logo');
    return false;
  }
  function bindLogoDblClick(){
    var logo=document.getElementById('logo-btn');
    if(!logo || logo.dataset.v77DblAdmin==='1') return;
    logo.dataset.v77DblAdmin='1';
    logo.title='Clic: inicio · Doble clic: admin';
    logo.addEventListener('dblclick',function(ev){
      try{ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }catch(e){}
      openByFiveClicks();
      return false;
    },true);
  }
  function init(){ setVersion(); bindLogoDblClick(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,300); setTimeout(init,1000);
})();
