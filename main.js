// main.js - orchestration without window.load
import { setupUI } from './ui.js';
import { loadWorldData } from './loader.js';

init();

async function init() {
  const data = await loadWorldData();
  setupUI(data);
}
