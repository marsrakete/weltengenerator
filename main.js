// main.js - orchestration without window.load
import { setupUI } from './ui.js';
import { loadWorldData } from './loader.js';

window.addEventListener('error', (e)=>reportFatal(e.error||e.message));
init();

async function init() {
  const data = await loadWorldData();
  setupUI(data);
}


function reportFatal(err){
  try{
    const box = document.querySelector('#app-status');
    if(!box) return;
    box.style.display='block';
    const msg = (err && (err.stack||err.message||String(err))) || 'Unbekannter Fehler';
    box.textContent = 'Fehler: ' + msg + ' (Tipp: Seite über http://localhost und nicht per file:// öffnen)';
  }catch(_){}
}
