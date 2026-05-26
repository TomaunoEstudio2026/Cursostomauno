// Extraído de <script type="module" id="patch-v54-presencia-sonido-visitas">
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const cfg = {
  apiKey: "AIzaSyBtTGAJ1X3yrvj-Dx-fsNmfe_Zw09yfrZo",
  authDomain: "medicamentos-8352a.firebaseapp.com",
  databaseURL: "https://medicamentos-8352a-default-rtdb.firebaseio.com",
  projectId: "medicamentos-8352a",
  storageBucket: "medicamentos-8352a.firebasestorage.app",
  messagingSenderId: "828746191058",
  appId: "1:828746191058:web:00f74a7502f7ce2121dd0b"
};
const app = getApps().length ? getApp() : initializeApp(cfg);
const db = getDatabase(app);

const LS_MUTE = 'tomauno-visit-sound-muted';
function isAdminRemembered(){
  try{ return localStorage.getItem('tomauno-admin-notify') === '1'; }catch(e){ return false; }
}
function isMuted(){
  try{ return localStorage.getItem(LS_MUTE) === '1'; }catch(e){ return false; }
}
function setMuted(v){
  try{ localStorage.setItem(LS_MUTE, v ? '1' : '0'); }catch(e){}
  const b = document.getElementById('visit-sound-toggle');
  if(b){ b.textContent = v ? '🔕' : '🔔'; b.classList.toggle('off', !!v); b.title = v ? 'Activar sonido de entrada de visitantes' : 'Silenciar solo entrada de visitantes'; }
}
function ensureButton(){
  const live = document.getElementById('admin-live-indicator');
  if(!live || document.getElementById('visit-sound-toggle')) return;
  const b = document.createElement('button');
  b.id = 'visit-sound-toggle';
  b.type = 'button';
  b.addEventListener('click', function(ev){
    ev.preventDefault(); ev.stopPropagation();
    setMuted(!isMuted());
  }, true);
  live.insertAdjacentElement('afterend', b);
  setMuted(isMuted());
}
function tinyVisitBeep(){
  if(isMuted() || !isAdminRemembered()) return;
  try{
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if(!Ctx) return;
    const ctx = new Ctx();
    [760, 1140].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.13);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.13 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.13 + 0.23);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.13);
      o.stop(ctx.currentTime + i * 0.13 + 0.25);
    });
    setTimeout(()=>ctx.close().catch(()=>{}), 700);
  }catch(e){}
}

let initialized = false;
let known = new Set();
function syncOnlineCount(obj){
  const now = Date.now();
  const active = Object.entries(obj||{}).filter(([id,v]) => v && v.ts && now - Number(v.ts) < 90000);
  const count = active.length;
  document.querySelectorAll('#online-count,[data-online-count]').forEach(el => { el.textContent = String(count); });
  const currentIds = new Set(active.map(([id]) => id));
  if(initialized){
    for(const id of currentIds){
      if(!known.has(id)) { tinyVisitBeep(); break; }
    }
  }
  known = currentIds;
  initialized = true;
}

window.addEventListener('DOMContentLoaded', ensureButton);
setTimeout(ensureButton, 500);
setInterval(ensureButton, 3000);
onValue(ref(db, 'tomauno/presence'), snap => syncOnlineCount(snap.exists() ? snap.val() : {}));
