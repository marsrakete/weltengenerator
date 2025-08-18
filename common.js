// common.js

// Zentralen AudioContext einmalig erzeugen
const globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Gemeinsame Sound-Funktionen
function playPewSound() {
  if (!globalAudioCtx) return;
  const oscillator = globalAudioCtx.createOscillator();
  const gain = globalAudioCtx.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(440, globalAudioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(globalAudioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, globalAudioCtx.currentTime + 0.2);
  oscillator.stop(globalAudioCtx.currentTime + 0.2);
}

function playPowSound() {
  if (!globalAudioCtx) return;
  const oscillator = globalAudioCtx.createOscillator();
  const gain = globalAudioCtx.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(200, globalAudioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(globalAudioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.0001, globalAudioCtx.currentTime + 0.2);
  oscillator.stop(globalAudioCtx.currentTime + 0.2);
}

// Funktion zum Erzeugen eines leeren Rasters
function initGrid(gridRows, gridCols) {
  const gridData = [];
  const output = document.getElementById("output");
  output.innerHTML = "";
  for (let r = 0; r < gridRows; r++) {
    let row = [];
    for (let c = 0; c < gridCols; c++) {
      row.push(" ");
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.textContent = " ";
      output.appendChild(cell);
    }
    gridData.push(row);
  }
  return gridData;
}

// Funktion zum Rendern des Rasters basierend auf gridData
function renderGameGrid(gridData, gridCols, gridRows) {
  const cells = document.querySelectorAll("#output .cell");
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const index = r * gridCols + c;
      if (cells[index]) {
        cells[index].textContent = gridData[r][c];
      }
    }
  }
}




// Sprachlogik
// Lade Sprachdatei (lang.json)
async function loadLangData() {
    const res = await fetch('lang.json');
    langData = await res.json();
}

// Erkenne die Sprache des Browsers
function detectLang() {
    const browserLang = navigator.language?.slice(0,2).toLowerCase();
    if (supportedLangs.includes(browserLang)) return browserLang;
    return 'de';
}

// Text holen, mit Platzhalter-Ersatz
function t(key, vars={}) {
    let str = langData[lang]?.[key] || langData['de']?.[key] || key;
    Object.keys(vars).forEach(k => {
        str = str.replaceAll(`{${k}}`, vars[k]);
    });
    return str;
}

// Sprache wechseln
function switchLang() {
    lang = (lang === 'de') ? 'en' : 'de';
    updateUIText();
    updateGameInfo();
    populateWorldGallery();
    populateWorldButtonsEditor();
    localStorage.setItem('appLang', lang);
    document.getElementById('langSwitchBtn').innerText = (lang === 'de') ? '🌐 EN' : '🌐 DE';
}

function updateUIText() {
    // Dokument-Titel
    document.title = t('gameTitle');

    // --- SPIELMODUS ---
    // Headline
    if (document.getElementById('gameInfo')) document.getElementById('gameInfo').innerText = t('game_title');
    // Buttons
    if (document.getElementById('toggleModeGame')) document.getElementById('toggleModeGame').innerText = t('btnSwitchMode');
    if (document.getElementById('newRandomGame')) document.getElementById('newRandomGame').innerText = t('btnNewGame');
    if (document.getElementById('generateGameAltText')) document.getElementById('generateGameAltText').innerText = t('btnAltText');
    if (document.getElementById('copyGameGraphic')) document.getElementById('copyGameGraphic').innerText = t('btnCopyGraphic');
    if (document.getElementById('copyGameText')) document.getElementById('copyGameText').innerText = t('btnCopyText');
    if (document.getElementById('generateGamePermalink')) document.getElementById('generateGamePermalink').innerText = t('btnPermalink');
    if (document.getElementById('postToBsky')) document.getElementById('postToBsky').innerText = t('btnPostBsky');

    // Zeit & Ziele in Statusleiste (werden dynamisch ergänzt, aber für Initialanzeige sinnvoll)
    if (document.getElementById('timerDisplay')) document.getElementById('timerDisplay').innerText = t('time', {seconds: 0});
    if (document.getElementById('foundCount')) document.getElementById('foundCount').innerText = t('found_targets', {count: 0});

    // Hinweistext unter Steuerfeld
    if (document.getElementById('swipeHint')) {
        document.getElementById('swipeHint').innerText =
            ('ontouchstart' in window || navigator.maxTouchPoints > 0)
            ? t('hintSwipe')
            : t('hintMouse');
    }

    // --- EDITORMODUS ---
    if (document.getElementById('toggleModeEditor')) document.getElementById('toggleModeEditor').innerText = t('btnSwitchModeGame');
    if (document.getElementById('clearGrid')) document.getElementById('clearGrid').innerText = t('btnClearGrid');
    if (document.getElementById('newEditorRandom')) document.getElementById('newEditorRandom').innerText = t('btnNewEditorRandom');
    if (document.getElementById('generateEditorAltText')) document.getElementById('generateEditorAltText').innerText = t('btnAltText');
    if (document.getElementById('copyEditorGraphic')) document.getElementById('copyEditorGraphic').innerText = t('btnCopyEditorGraphic');
    if (document.getElementById('copyEditorText')) document.getElementById('copyEditorText').innerText = t('btnCopyEditorText');
    // Falls aktiviert:
    if (document.getElementById('applyToGame')) document.getElementById('applyToGame').innerText = t('btnApplyToGame');

    // Überschriften/Labels im Editormodus
    if (document.querySelector('#editorContainer h1')) document.querySelector('#editorContainer h1').innerText = t('editorMode');
    if (document.querySelector('#editorContainer h2')) document.querySelector('#editorContainer h2').innerText = t('outputField');

    // --- SLIDER & LABELS ---
    // Zoom
    const zoomLabel = document.querySelector('label[for="zoomSlider"]');
    if (zoomLabel) zoomLabel.innerText = t('zoom');
    // Symbolanzahl
    const symbolsLabel = document.querySelector('label[for="maxSymbolsSlider"]');
    if (symbolsLabel) symbolsLabel.innerText = `| ${t('symbols')}`;

    // --- WELTENZÄHLER ---
    const countDiv = document.getElementById('worldCount');
    if (countDiv) {
        const n = Object.keys(worldData).length;
        countDiv.innerHTML = `<span class="icon">✨</span> <span>${t('worldsAvailable', {count: n})}</span>`;
    }

    // --- Sprache-Umschaltbutton (Label aktualisieren) ---
    if (document.getElementById('langSwitchBtn')) {
        document.getElementById('langSwitchBtn').innerText = (lang === 'de') ? '🌐 EN' : '🌐 DE';
    }
    // -- Animations-Schalter
    if (document.getElementById('toggleAnimationsBtn')) {
      updateAnimationToggleLabel();
    }
  
}
// Statusmeldungen
function showToast(message, type = 'info', duration = 6000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 3000);
  }, duration);
}

function showCopyOverlay(targetElement, message = '✓ Kopiert') {
  const overlay = document.createElement('div');
  overlay.textContent = message;

  Object.assign(overlay.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.4)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    borderRadius: getComputedStyle(targetElement).borderRadius || '0',
    zIndex: '100',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 1s ease',
  });

  // Eltern-Element muss relativ positioniert sein
  const container = targetElement.closest('.overlay-wrapper') || targetElement.parentElement;
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  // Einfügen und anzeigen
  container.appendChild(overlay);
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  // Automatisch ausblenden und entfernen
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 400);
  }, 1200);
}

function showDialogToast(message, onConfirm) {
  const overlay = document.getElementById('modal-overlay');
  const dialog = document.getElementById('dialog-toast');
  overlay.hidden = false;
  //dialog.hidden = false;
  dialog.style.display = 'flex';
  dialog.innerHTML = `<div>${message.replace(/\n/g, '<br>')}</div><button class="toast-ok-btn">OK</button>`;
  dialog.querySelector('.toast-ok-btn').addEventListener('click', () => {
    overlay.hidden = true;
    dialog.style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  });
  dialog.querySelector('.toast-ok-btn').focus();
}


// Permalink-Funktionen

/**
 * Permalink encoding with embedded palette + indices and FNV-1a integrity hash.
 * Drop this file after your existing code (e.g., include in index.html after main.js/common.js),
 * or paste functions into your permalink module.
 */

// URL-safe alphabet for indices (0..63)
const __PLINK_ALPH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
// Base64 (URL-safe) helpers for palette JSON
const __b64u = s => btoa(unescape(encodeURIComponent(s)));
const __ub64 = s => decodeURIComponent(escape(atob(s)));

// -------- FNV-1a (32-bit) --------
function fnv1aHex(str) {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ("00000000" + (h >>> 0).toString(16)).slice(-8);
}

// Canonical payload to hash (keep this EXACTLY stable across versions)
function canonicalPayload(v, rows, cols, paletteJson, dataStr) {
  return `${v}|${rows}|${cols}|${paletteJson}|${dataStr}`;
}

// Build palette from a 2D grid in first-seen order
function gridPalette(grid) {
  const seen = new Set(), pal = [];
  for (const row of grid) for (const cell of row) {
    if (!seen.has(cell)) { seen.add(cell); pal.push(cell); }
  }
  return pal;
}

// Encode grid into 1 char per cell using palette indices (palette must have <= 64 symbols)
function indicesEncode(grid, palette) {
  const map = new Map(palette.map((sym, i) => [sym, i]));
  let out = "";
  for (const row of grid) for (const cell of row) {
    const idx = map.get(cell);
    if (idx == null) throw new Error("Symbol not in palette");
    if (idx > 63) throw new Error("Palette > 64 symbols (unsupported in 1-char mode)");
    out += __PLINK_ALPH[idx];
  }
  return out;
}

// Decode 1-char-per-cell payload back to grid
function indicesDecode(str, palette, rows, cols) {
  const inv = new Map(__PLINK_ALPH.split("").map((c, i) => [c, i]));
  const grid = [];
  let k = 0;
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const ch = str[k++];
      const idx = inv.get(ch);
      row.push(palette[idx]);
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Create permalink for the given grid (2D array of symbols).
 * meta.world is optional and added as &w=...
 */
function makePermalinkFromGrid(grid, meta = {}) {
  const rows = grid.length, cols = grid[0]?.length ?? 0;
  const palette = gridPalette(grid);
  const data = indicesEncode(grid, palette);

  const pJson = JSON.stringify(palette);                  // raw JSON for hashing
  const payload = canonicalPayload("1", rows, cols, pJson, data);
  const h = fnv1aHex(payload);                            // 8 hex chars

  const p = __b64u(pJson);                                // Base64URL for link

  const params = new URLSearchParams({
    v: "1",
    r: String(rows),
    c: String(cols),
    p,
    d: data,
    h,
    ...(meta.world ? { w: meta.world } : {})
  });
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

/**
 * Load grid from current location (permalink). Returns null if no permalink
 * or if hash check fails. Call early on page load.
 */
function loadGridFromPermalink() {
  const q = new URLSearchParams(location.search);
  const v = q.get("v");
  if (!v) return null;

  const rows = parseInt(q.get("r"), 10);
  const cols = parseInt(q.get("c"), 10);
  const pRaw = q.get("p");
  const data = q.get("d") || "";
  const h = q.get("h") || "";

  if (!pRaw || !data || !h) {
    return { error: "Permalink unvollständig oder beschädigt" };
  }

  let pJson;
  try {
    pJson = __ub64(pRaw);
  } catch (e) {
    return { error: "Permalink-Palette ungültig" };
  }

  const payload = canonicalPayload(v, rows, cols, pJson, data);
  const expected = fnv1aHex(payload);
  if (expected !== h) {
    return { error: "Permalink ungültig (Hash mismatch)" };
  }

  let palette;
  try {
    palette = JSON.parse(pJson);
  } catch (e) {
    return { error: "Permalink-Palette nicht lesbar" };
  }

  const grid = indicesDecode(data, palette, rows, cols);
  const worldName = q.get("w") || null;

  return { grid, rows, cols, palette, worldName, v };
}

/* ---------- Optional glue helpers (adapt to your code) ---------- */

// Example: integrate with your existing grid and currentWorld variables
// Call this where you previously built your permalink.
function generateGamePermalink_FNV(grid, currentWorld) {
  return makePermalinkFromGrid(grid, { world: currentWorld });
}

// Example: on load
function tryLoadPermalink_FNV(applyGridCallback) {
  const res = loadGridFromPermalink();
  if (!res) return false;
  // applyGridCallback should draw the grid into your game state
  applyGridCallback(res.grid, { rows: res.rows, cols: res.cols, worldName: res.worldName });
  return true;
}
