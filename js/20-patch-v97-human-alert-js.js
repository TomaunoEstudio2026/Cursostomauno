// Extraído de <script id="patch-v97-human-alert-js">
(function(){
  'use strict';
  var VERSION='Tomauno v98';
  var alerted=Object.create(null);
  var audioReady=false;
  function safe(fn){try{return fn();}catch(e){try{console.warn('v97 human alert:',e);}catch(_){}}}
  function isAdminActive(){
    return safe(function(){return localStorage.getItem('tomauno-admin-notify')==='1';}) || !!document.querySelector('#admin-live-indicator.on,#admin-live-indicator.admin-on,.admin-live.on,.adm-on');
  }
  function setVersion(){safe(function(){
    var tag=document.getElementById('tomauno-version-tag');
    if(!tag){var f=document.querySelector('footer .fcred')||document.querySelector('footer')||document.body; tag=document.createElement('span'); tag.id='tomauno-version-tag'; tag.className='tomauno-version-tag'; f.appendChild(tag);}
    tag.textContent=VERSION;
  });}
  function unlockAudio(){audioReady=true;}
  window.addEventListener('pointerdown',unlockAudio,{once:true,capture:true});
  window.addEventListener('keydown',unlockAudio,{once:true,capture:true});
  function beep(){safe(function(){
    if(!audioReady) return;
    var AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
    var ctx=new AC();
    var now=ctx.currentTime;
    [0,0.18,0.36].forEach(function(t,i){
      var osc=ctx.createOscillator(); var gain=ctx.createGain();
      osc.type='square'; osc.frequency.setValueAtTime(i===1?980:760,now+t);
      gain.gain.setValueAtTime(0.0001,now+t);
      gain.gain.exponentialRampToValueAtTime(0.22,now+t+0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+t+0.13);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(now+t); osc.stop(now+t+0.15);
    });
    setTimeout(function(){safe(function(){ctx.close();});},900);
  });}
  function toastMsg(msg){safe(function(){ if(typeof window.toast==='function') window.toast(msg); });}
  function showBanner(chatId,body){safe(function(){
    document.querySelectorAll('.tu-human-alert-v97').forEach(function(x){x.remove();});
    var box=document.createElement('div'); box.className='tu-human-alert-v97';
    box.innerHTML='<div class="tu-title">⚠️ Atención humana solicitada</div><div class="tu-body"></div><div class="tu-actions"><button class="tu-close" type="button">Cerrar</button><button class="tu-open" type="button">Abrir chat</button></div>';
    box.querySelector('.tu-body').textContent=body||'Hay una persona esperando a Javier.';
    box.querySelector('.tu-close').onclick=function(){box.remove();};
    box.querySelector('.tu-open').onclick=function(){safe(function(){ if(typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(chatId); }); box.remove();};
    document.body.appendChild(box);
    setTimeout(function(){safe(function(){box.remove();});},18000);
  });}
  function browserNotify(chatId,body){safe(function(){
    if(!('Notification' in window)) return;
    if(Notification.permission!=='granted') return;
    var n=new Notification('⚠️ Atención humana Tomauno',{body:body||'Hay una persona esperando a Javier',tag:'tomauno-human-'+chatId,renotify:true,requireInteraction:false});
    n.onclick=function(){safe(function(){window.focus(); if(typeof window.abrirChatAdmin==='function') window.abrirChatAdmin(chatId);}); n.close();};
  });}
  function visibleName(c,id){
    var s=(c&&(c.name||c.nombre||c.whatsappName))||'';
    s=String(s||'').trim();
    if(!s || /^(visitante|usuario|sin nombre)$/i.test(s)) return 'Visitante '+String(id||'').slice(-4);
    return s;
  }
  function scan(){safe(function(){
    if(!isAdminActive()) return;
    if(typeof chatsDB==='undefined' || !chatsDB) return;
    Object.keys(chatsDB).forEach(function(id){
      var c=chatsDB[id]||{};
      if(!c || c.status==='cerrado') return;
      if(!(c.humanRequested || c.prioridad)) return;
      if(!c.unreadAdmin) return;
      var stamp=String(c.humanRequestedAt||c.humanWaitStartedAt||c.updatedAt||c.createdAt||'0');
      var key=id+'|'+stamp;
      if(alerted[key]) return;
      alerted[key]=1;
      var body=visibleName(c,id)+' necesita atención de Javier'+(c.lastMsg?': '+String(c.lastMsg).slice(0,90):'.');
      beep(); toastMsg('⚠️ Atención humana solicitada'); showBanner(id,body); browserNotify(id,body);
    });
  });}
  setVersion(); setTimeout(setVersion,500); setInterval(setVersion,4000);
  setInterval(scan,1500); setTimeout(scan,2500);
})();
