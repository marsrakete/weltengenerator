const cols = 30, rows = 10;
let maxSymbols = 50;
let mode = 'game';
let currentWorld = 'galaxy';
let gameGrid = [], originalGrid = [], editorGrid = [];
let playerX = 0, playerY = 0, foundCount = 0, initialTargets = 0;
let timerStart = null, timerInterval = null;
let selectedSymbol = '';
let playerJustSpawned = true;
let lang = 'de';
let langData = {};
const supportedLangs = ['de', 'en'];
const isEnglish = lang === 'en';
let gameOver = false;
let animationsEnabled = true;
let cometIntervals = [];

let monsterX = -1, monsterY = -1;

let maxSymbolsSlider = document.getElementById('maxSymbolsSlider');
let maxSymbolsValue = document.getElementById('maxSymbolsValue');

// Berechne die maximale Symbolzahl: (cols * rows) - 25%
function updateMaxSymbolsSlider() {
    //let max = Math.floor(cols * rows * 0.50);
    let max = 100;
    maxSymbolsSlider.max = max;
    if (parseInt(maxSymbolsSlider.value) > max) {
        maxSymbolsSlider.value = max;
    }
    maxSymbolsValue.textContent = maxSymbolsSlider.value;
}

function setupMaxSymbolsSlider() {
  const slider = document.getElementById('maxSymbolsSlider');
  const valueDisplay = document.getElementById('maxSymbolsValue');
  // Dynamische Maximalgrenze berechnen:
  function updateMax() {
    //const max = Math.floor(cols * rows * 0.50);
   let max = 100;
    slider.max = max;
    if (parseInt(slider.value) > max) slider.value = max;
    valueDisplay.textContent = slider.value;
    maxSymbols = parseInt(slider.value);
  }
  updateMax();

  slider.addEventListener('input', function() {
    maxSymbols = parseInt(this.value);
    valueDisplay.textContent = this.value;
    generateRandomWorld(); // Welt neu berechnen!
  });

  // Falls cols/rows dynamisch geändert werden, muss updateMax erneut aufgerufen werden!
}

function updateLangButtonLabel() {
  document.getElementById('langSwitchBtn').textContent = (lang === 'de') ? '🌐 Sprache: DE' : '🌐 Language: EN';
}


// Swipe-Steuerung für Mobilgeräte
let touchStartX = null;
let touchStartY = null;
let touchInGame = false;

document.addEventListener('touchstart', function(e) {
  const target = e.target.closest('#gameOutput');
  if (target && e.touches.length === 1) {
    touchInGame = true;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  } else {
    touchInGame = false;
  }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
  if (touchInGame && touchStartX !== null && touchStartY !== null) {
    e.preventDefault(); // ✅ verhindert Scrollen der Seite
  }
}, { passive: false });

document.addEventListener('touchend', function(e) {
  if (!touchInGame || touchStartX === null || touchStartY === null) return;

  const deltaX = e.changedTouches[0].clientX - touchStartX;
  const deltaY = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 30) movePlayer(1, 0);
    else if (deltaX < -30) movePlayer(-1, 0);
  } else {
    if (deltaY > 30) movePlayer(0, 1);
    else if (deltaY < -30) movePlayer(0, -1);
  }

  touchStartX = null;
  touchStartY = null;
  touchInGame = false;
}, { passive: false });

// Steuerung für Maus am PC
document.getElementById("gameOutput").addEventListener("click", (e) => {
  const cellSize = e.currentTarget.querySelector(".cell")?.offsetWidth || 0;
  const rect = e.currentTarget.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  const col = Math.floor(clickX / cellSize);
  const row = Math.floor(clickY / cellSize);

  const dx = col - playerX;
  const dy = row - playerY;

  if (Math.abs(dx) + Math.abs(dy) === 1 || Math.abs(dx) + Math.abs(dy) === 2) {
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) movePlayer(-1, 0);
      else if (dx > 0) movePlayer(1, 0);
    } else {
      if (dy < 0) movePlayer(0, -1);
      else if (dy > 0) movePlayer(0, 1);
    }
  }
});
// Anzeige Maus-Hover berechnen
document.getElementById("gameOutput").addEventListener("mousemove", (e) => {
  const cells = document.querySelectorAll("#gameOutput .cell");
  cells.forEach(c => c.classList.remove("hover-target"));

  const rect = e.currentTarget.getBoundingClientRect();
  const cellSize = e.currentTarget.querySelector(".cell")?.offsetWidth || 0;
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const col = Math.floor(mouseX / cellSize);
  const row = Math.floor(mouseY / cellSize);

  const dx = col - playerX;
  const dy = row - playerY;

  if ((Math.abs(dx) + Math.abs(dy)) === 1 || (Math.abs(dx) + Math.abs(dy)) === 2) {
    const index = row * cols + col;
    const cell = cells[index];
    if (cell) {
      cell.classList.add("hover-target");
    }
  }
});


// BFS-Suche ob die Welt gelöst werden kann
// Überladene Funktion: grid, playerSymbol, targetSymbol als Parameter
function canPlayerReachAllTargets(grid = gameGrid, playerSymbol, targetSymbol) {
  // Fallback auf aktuelle Welt, falls Symbole nicht übergeben werden
  const w = worldData[currentWorld];
  playerSymbol = playerSymbol || w.player;
  targetSymbol = targetSymbol || w.target;

  // Spielerposition suchen
  let start = null;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === playerSymbol) start = {x, y};
    }
  }
  if (!start) return false; // kein Spieler gefunden

  // Ziele suchen
  const targets = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === targetSymbol) targets.push({x, y});
    }
  }
  if (targets.length === 0) return false;

  // BFS
  const visited = Array.from({length: rows}, () => Array(cols).fill(false));
  const queue = [start];
  visited[start.y][start.x] = true;
  const directions = [[0,1],[1,0],[0,-1],[-1,0]];

  while (queue.length) {
    const {x, y} = queue.shift();
    for (const [dx, dy] of directions) {
      const nx = x + dx, ny = y + dy;
      if (
        nx >= 0 && ny >= 0 && nx < cols && ny < rows &&
        !visited[ny][nx] &&
        (grid[ny][nx] === ' ' || grid[ny][nx] === targetSymbol)
      ) {
        visited[ny][nx] = true;
        queue.push({x: nx, y: ny});
      }
    }
  }

  // Prüfe, ob alle Ziele erreichbar sind
  for (const t of targets) {
    if (!visited[t.y][t.x]) return false;
  }
  return true;
}

function switchMode() {
  const gameContainer = document.getElementById('gameContainer');
  const editorContainer = document.getElementById('editorContainer');
  const w = worldData[currentWorld];
  const isEditorVisible = window.getComputedStyle(editorContainer).display !== "none";

  if (!isEditorVisible) {
    // Wechsel ZUM Editor: aktuelles Spiel ins Editor-Grid übernehmen
    editorGrid = gameGrid.map(row => row.slice());
    renderEditor();
    updatePlayerTargetInfo();
    populateSymbolPalette();
    populateWorldButtonsEditor();
    gameContainer.style.display = "none";
    editorContainer.style.display = "";
    return;
  }

  // Wechsel ZUM Spiel: Vorher Editor-Welt prüfen
  if (!canPlayerReachAllTargets(editorGrid, w.player, w.target)) {
    showToast(t('editorApplyFailed'), 'error');
    return;
  }
  // Editor-Welt übernehmen
  gameGrid = editorGrid.map(row => row.slice());
  renderGame();
  updatePlayerTargetInfo();
  populateSymbolPalette();
  populateWorldButtonsEditor();
  gameContainer.style.display = "";
  editorContainer.style.display = "none";
}
document.getElementById('toggleModeGame').addEventListener('click', switchMode);
document.getElementById('toggleModeEditor').addEventListener('click', switchMode);

window.addEventListener('keydown', e => {
  if (mode !== 'game') return;
  if (['ArrowUp','w','W'].includes(e.key)) { movePlayer(0,-1); e.preventDefault(); }
  if (['ArrowDown','s','S'].includes(e.key)) { movePlayer(0,1); e.preventDefault(); }
  if (['ArrowLeft','a','A'].includes(e.key)) { movePlayer(-1,0); e.preventDefault(); }
  if (['ArrowRight','d','D'].includes(e.key)) { movePlayer(1,0); e.preventDefault(); }
});

// --- Spielfunktionen ---
function populateWorldGallery() {
  const container = document.getElementById('worldGallery');
  container.innerHTML = '';

  const isEnglish = lang === 'en';

  const sortedWorlds = Object.entries(worldData)
    .sort((a, b) => {
      const titleA = (isEnglish ? a[1].title_en : a[1].title) || a[0];
      const titleB = (isEnglish ? b[1].title_en : b[1].title) || b[0];
      return titleA.toLocaleLowerCase().localeCompare(titleB.toLocaleLowerCase(), 'de');
    });

  for (let [name, world] of sortedWorlds) {
    const card = document.createElement('div');
    card.className = 'world-card';
    if (name === currentWorld) card.classList.add('selected');

    const title = document.createElement('div');
    title.className = 'world-title';
    title.textContent = isEnglish
      ? (world.title_en || world.title || name)
      : (world.title || name);

    const symbols = document.createElement('div');
    symbols.className = 'world-symbols';
    symbols.textContent = `${world.player} → ${world.target}`;

    const desc = document.createElement('div');
    desc.className = 'world-description';
    desc.textContent = isEnglish
      ? (world.description_en || world.description || '')
      : (world.description || '');

    card.appendChild(title);
    card.appendChild(symbols);
    card.appendChild(desc);

    card.onclick = () => {
      currentWorld = name;
      document.querySelectorAll('.world-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateGameInfo?.();
      generateRandomWorld?.();

      if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        card.classList.toggle('show-description');
      }
    };

    container.appendChild(card);
  }
  setTimeout(() => {
      document.querySelector('.world-card.selected')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
      });
  }, 100);
} 

// --- Anzahl der Welten mit Icon anzeigen ---
const countDiv = document.getElementById('worldCount');
const n = (worldData && typeof worldData === 'object') ? Object.keys(worldData).length : 0;

if (countDiv) {
  const label = isEnglish
    ? `${n} world${n === 1 ? '' : 's'} available`
    : `${n} Welt${n === 1 ? '' : 'en'} verfügbar`;

  countDiv.innerHTML = `<span class="icon">✨</span> <span>${label}</span>`;
}

// --- Tap außerhalb -> Tooltip ausblenden ---
document.addEventListener('click', (e) => {
  document.querySelectorAll('.world-card.show-description').forEach(card => {
    if (!card.contains(e.target)) {
      card.classList.remove('show-description');
    }
  });
});


function populateWorldButtonsGame() {
  const container = document.getElementById('worldButtonsGame');
  container.innerHTML = '';

  for (let name in worldData) {
    const label = document.createElement('label');
    label.style.display = 'inline-block';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'worldSelect';
    input.value = name;
    input.style.display = 'none';
    if (name === currentWorld) input.checked = true;

    const span = document.createElement('span');
    span.className = 'world-chip';

    const title = worldData[name]?.title || name;
    const playerSymbol = worldData[name]?.player || '';
    span.innerText = `${title} ${playerSymbol}`;
    span.title = worldData[name]?.description || '';

    input.addEventListener('change', () => {
      currentWorld = name;
      updateGameInfo();
      generateRandomWorld();
    });

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
  }
}

function highlightButton(containerId, selected) {
  document.querySelectorAll('#'+containerId+' button').forEach(b => b.style.background = b.innerText===selected?'#555':'#333');
}

function updateGameInfo() {
  const w = worldData[currentWorld];
  if (lang == 'en') {
    document.getElementById('gameInfo').innerText =
    `You control ${w.player} and must find ${w.target}. ${w.description_en}`;
  } else {
    document.getElementById('gameInfo').innerText =
    `Du steuerst ${w.player} und musst ${w.target} finden. ${w.description}`;
  }
}

function initGameGridEmpty() {
  gameGrid = [];
  const output = document.getElementById('gameOutput'); output.innerHTML = '';
  for (let y=0; y<rows; y++) {
    const row = [];
    for (let x=0; x<cols; x++) {
      row.push(' ');
      const cell = document.createElement('div'); cell.className = 'cell'; output.appendChild(cell);
    }
    gameGrid.push(row);
  }
}
function updateZoom(value) {
  document.getElementById("gameOutput").style.fontSize = value + "em";
  document.getElementById("zoomPercentage").innerText = Math.round(value * 100) + "%";
}

function renderGame() {
  const cells = document.querySelectorAll('#gameOutput .cell');
  const w = worldData[currentWorld];
  const animRules = w.animation || {};

  gameGrid.forEach((row, y) => row.forEach((sym, x) => {
    const cell = cells[y * cols + x];
    cell.textContent = sym;

    // Vorherige Animationen entfernen
    cell.className = 'cell';

    // Player-Highlight bei Spawn
    if (x === playerX && y === playerY && playerJustSpawned) {
      cell.classList.add('player-highlight');
    }

    // Falls Animationen definiert sind: prüfen, ob Symbol betroffen ist
    if (animationsEnabled && sym !== ' ' && animRules) {
      for (const [animClass, symbolList] of Object.entries(animRules)) {
        if (symbolList.includes(sym)) {
          cell.classList.add(animClass);
          break;
        }
      }
    }
  }));
}

function generateRandomWorld() {
  gameOver = false;
  // Timer zurücksetzen
  if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerStart = null;
    foundCount = 0;
    playerJustSpawned = true;
    
    const w = worldData[currentWorld];
    initGameGridEmpty();

  // Pool aus normalen und seltenen Symbolen
  const symbolPool = [...w.symbols, ...w.rare];

  // Zufällige Symbole platzieren
  for (let i = 0; i < maxSymbols; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * cols);
      y = Math.floor(Math.random() * rows);
    } while (gameGrid[y][x] !== ' ');
    gameGrid[y][x] = symbolPool[Math.floor(Math.random() * symbolPool.length)];
  }

  // Optionales Bottom-Element unten einfügen
  if (w.bottom.length > 0) {
    const x = Math.floor(Math.random() * cols);
    gameGrid[rows - 1][x] = w.bottom[Math.floor(Math.random() * w.bottom.length)];
  }

  // Sicherstellen, dass mindestens ein Target vorhanden ist
  let targetCount = gameGrid.flat().filter(c => c === w.target).length;
  if (targetCount === 0) {
    let tx, ty;
    do {
      tx = Math.floor(Math.random() * cols);
      ty = Math.floor(Math.random() * rows);
    } while (gameGrid[ty][tx] !== ' ');
    gameGrid[ty][tx] = w.target;
    targetCount = 1;
  }
  initialTargets = targetCount;

  // Spielerposition wählen (entweder vorhandenes Player-Symbol oder zufällige freie Zelle)
  const playerPositions = [];
  gameGrid.forEach((row, ry) =>
    row.forEach((c, cx) => {
      if (c === w.player) playerPositions.push({
        x: cx,
        y: ry
      });
    })
  );
  let start;
  if (playerPositions.length > 0) {
    start = playerPositions[Math.floor(Math.random() * playerPositions.length)];
  } else {
    let px, py;
    do {
      px = Math.floor(Math.random() * cols);
      py = Math.floor(Math.random() * rows);
    } while (gameGrid[py][px] !== ' ');
    start = {
      x: px,
      y: py
    };
  }
  playerX = start.x;
  playerY = start.y;
  gameGrid[playerY][playerX] = w.player;

  // Anzeige aktualisieren
  renderGame();
  updateGameInfo();
  document.getElementById('foundCount').innerText = t('foundCount') + ' 0';
  document.getElementById('timerDisplay').innerText = t('timerDisplay') + ' 0 s';

  // Ursprungszustand speichern
  originalGrid = gameGrid.map(row => row.slice());

  if (!canPlayerReachAllTargets()) {
    // Optional: max. 30 Versuche, sonst lockere die Platzierung!
    for (let tries = 0; tries < 30; tries++) {
      generateRandomWorld();
      if (canPlayerReachAllTargets()) break;
    }
    // Optional: Zeige Hinweis, falls nach 10 Versuchen kein Pfad da ist
    if (!canPlayerReachAllTargets()) {
      showToast(t('editorApplyFailed'), 'error');
    }
  }
  const monsterSymbol = w.monster;
  if (monsterSymbol) {
    let mx, my;
    do {
      mx = Math.floor(Math.random() * cols);
      my = Math.floor(Math.random() * rows);
    } while (gameGrid[my][mx] !== ' ');
    monsterX = mx;
    monsterY = my;
    gameGrid[my][mx] = monsterSymbol;
  } 
  clearOffGridComets(); 
  clearCometIntervals();
  launchOffGridComets();
}

function movePlayer(dx,dy) {
  if (gameOver) return; // ✅ Blockiert alle Bewegungen nach Spielende
  if (playerJustSpawned) {
    playerJustSpawned = false;
    renderGame();
  }    
  if (!timerStart) { 
      timerStart = Date.now(); 
      timerInterval = setInterval(() => {
          document.getElementById('timerDisplay').innerText = t('timerDisplay') + ` ${Math.floor((Date.now()-timerStart)/1000)} s`;
      }, 1000); 
  }
  const w = worldData[currentWorld], target=w.target;
  const nx = playerX+dx, ny = playerY+dy;
  if (nx<0||ny<0||nx>=cols||ny>=rows) {
      playPowSound(); 
      return; 
  }
  const cell = gameGrid[ny][nx];
  if (cell===' '||cell===target) {
    if (cell===target) { 
        playPewSound(); 
        foundCount++; 
        document.getElementById('foundCount').innerText=`Gefundene Ziele: ${foundCount}`; 
    }
    gameGrid[playerY][playerX] = ' '; 
    gameGrid[ny][nx] = w.player; 
    playerX=nx; 
    playerY=ny;
    renderGame();
    if (foundCount >= initialTargets) {
        clearInterval(timerInterval);
        gameOver = true; // ✅ Blockieren weiterer Züge
        const msg = t('gameFinished')
            .replace('{count}', foundCount)
            .replace('{seconds}', Math.floor((Date.now() - timerStart) / 1000));
        setTimeout(() => {
            showDialogToast(msg, () => {
                resetToOriginalGrid();
            });
        }, 50);
    }
  } else {
      playPowSound(); 
  }
  moveMonster();
}

function moveMonster() {
  const w = worldData[currentWorld];
  if (!w.monster) return;

  const dx = Math.sign(playerX - monsterX);
  const dy = Math.sign(playerY - monsterY);

  const newX = monsterX + dx;
  const newY = monsterY + dy;

  if (
    newX >= 0 && newX < cols &&
    newY >= 0 && newY < rows &&
    gameGrid[newY][newX] === ' '
  ) {
    gameGrid[monsterY][monsterX] = ' ';
    monsterX = newX;
    monsterY = newY;
    gameGrid[monsterY][monsterX] = w.monster;
  }

  // Prüfen, ob der Spieler gefangen wurde
  if (monsterX === playerX && monsterY === playerY) {
    gameOver = true;
    clearInterval(timerInterval);
    showDialogToast("Du wurdest vom Monster gefangen! 😱", () => {
      resetToOriginalGrid();
    });
  }
}

function resetToOriginalGrid() {
  gameOver = false;
  gameGrid = originalGrid.map(r=>r.slice());
  const w = worldData[currentWorld];
  initialTargets = gameGrid.flat().filter(c => c === w.target).length;
  foundCount = 0;
  timerStart = null;
  playerX = 0; playerY = 0;
  gameGrid.forEach((row, ry) => row.forEach((c, cx) => {
    if (c === w.player) { playerX = cx; playerY = ry; }
  }));
  document.getElementById('foundCount').innerText = t('foundCount') + ' 0';
  document.getElementById('timerDisplay').innerText = t('timerDisplay') + ' 0 s';
  playerJustSpawned = true;    
  renderGame();
}

// Spiel-Buttons
document.getElementById('newRandomGame').addEventListener('click', generateRandomWorld);
document.getElementById('generateGameAltText').addEventListener('click', () => {
  const w = worldData[currentWorld];
  const rows = gameGrid.length;
  const cols = gameGrid[0]?.length || 0;

  const description = lang === 'en'
    ? (w.description_en || w.description || '')
    : (w.description || '');

  const txt = t('altTextGame')
    .replace('{description}', description)
    .replace('{rows}', rows)
    .replace('{cols}', cols);

  navigator.clipboard.writeText(txt)
    .then(() => showToast(t('alertAltTextCopied'), 'success'))
    .catch(err => showToast(t('copyUrlFailed').replace('{error}', err), 'error'));
});


document.getElementById('copyGameGraphic').addEventListener('click', async () => {
  try {
    const canvasTarget = document.getElementById('gameOutput');
    const canvas = await html2canvas(canvasTarget);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        throw new Error(t('blobCreationFailed'));
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      // 1. Zeige Toast-Nachricht
      showToast(t('alertGraphicCopied'), 'success');

      // 2. Zeige visuelles Overlay auf dem Canvas-Bereich
      showCopyOverlay(canvasTarget, t('alertGraphicCopied'));
    });
  } catch (err) {
    showToast(t('alertErrorOnCopy') + err, 'error');
  }
});


document.getElementById('copyGameText').addEventListener('click', () => {
  const text = gameGrid.map(row => row.join('').replace(/\s+$/, '')).join('\r\n');
  navigator.clipboard.writeText(text)
    .then(() => showToast(t('alertTextCopied'), 'success'))
    .catch(err => showToast(t('copyUrlFailed').replace('{error}', err), 'error'));
});

document.getElementById('generateGamePermalink').addEventListener('click', () => {
  try {
    // Permalink mit Hash erzeugen
    const url = makePermalinkFromGrid(gameGrid, { world: currentWorld });

    // In die Zwischenablage kopieren
    navigator.clipboard.writeText(url).then(() => {
      showToast(t('alertPermalinkCopied'), 'success', 4000);
    }).catch(err => {
      showToast(t('alertErrorOnPermalinkCopy') + " " + err, 'error', 6000);
      console.error("Permalink copy error:", err);
    });

  } catch (err) {
    // Fehler schon beim Erzeugen (z. B. Palette zu groß)
    showToast(t('alertErrorOnPermalinkCreate') + " " + err, 'error', 6000);
    console.error("Permalink creation error:", err);
  }
});


// Editorfunktionen
function renderEditor() {
  document.querySelectorAll('#editorOutput .cell').forEach((cell,idx) => {
    const r=Math.floor(idx/cols), c=idx%cols;
    cell.textContent = editorGrid[r][c];
  });
}
function generateRandomEditor() {
  generateRandomWorld();
  editorGrid = originalGrid.map(r=>r.slice());
  renderEditor();
}

document.getElementById('newEditorRandom').addEventListener('click', generateRandomEditor);
document.getElementById('generateEditorAltText').addEventListener('click', () => {
  const w = worldData[currentWorld];
  const description = lang === 'en'
    ? (w.description_en || w.description || '')
    : (w.description || '');

  const txt = t('altTextEditor')
    .replace('{description}', description)
    .replace('{rows}', rows)
    .replace('{cols}', cols);

  navigator.clipboard.writeText(txt)
    .then(() => showToast(t('alertAltTextCopied'), 'success'))
    .catch(err => showToast(t('copyUrlFailed').replace('{error}', err), 'error'));
});


document.getElementById('applyToGame')?.addEventListener('click', () => {
  const w = worldData[currentWorld];
  if (!canPlayerReachAllTargets(editorGrid, w.player, w.target)) {
      showToast(t('alertNoSolution'), 'error');
      return;
  }

  gameGrid = editorGrid.map(r => r.slice());
  initialTargets = gameGrid.flat().filter(c => c === w.target).length;
  foundCount = 0;
  timerStart = null;
  clearInterval(timerInterval);
  if (document.getElementById('foundCount')) document.getElementById('foundCount').innerText =  t('foundCount') + ' 0';
  if (document.getElementById('timerDisplay')) document.getElementById('timerDisplay').innerText = t('timerDisplay') + ' 0 s';
  renderGame();
  switchMode();
});

document.getElementById('copyEditorGraphic').addEventListener('click', () => {
  html2canvas(document.getElementById('editorOutput')).then(canvas => {
    canvas.toBlob(blob => {
      if (!blob) {
        showToast(t('blobCreationFailed'), 'error');
        return;
      }

      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        .then(() => showToast(t('alertGraphicCopied'), 'success'))
        .catch(err => showToast(t('alertErrorOnCopy') + err, 'error'));
    });
  });
});


document.getElementById('copyEditorText').addEventListener('click', () => {
  const text = editorGrid.map(row => row.join('').replace(/\s+$/, '')).join('\r\n');

  navigator.clipboard.writeText(text)
    .then(() => showToast(t('alertTextCopied'), 'success'))
    .catch(err => showToast(t('alertErrorOnCopy') + err, 'error'));
});


document.getElementById('postToBsky').addEventListener('click', () => {
  // 1. Welt als Text mit Zeilenumbrüchen
  const text = gameGrid.map(row => row.join('').replace(/\s+$/, '')).join('\n');

  // 2. Längenprüfung (max. ~300 Zeichen bei BlueSky)
  if (text.length > 350) {
      showToast(t('alertBskyLen'), 'error');
      return;
  }

  // 3. Encoding (Zeilenumbrüche bleiben erhalten)
  const encodedText = encodeURIComponent(text);

  // 4. Plattform prüfen
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const baseURL = isMobile
    ? 'bluesky://intent/compose'
    : 'https://bsky.app/intent/compose';

  const fullURL = `${baseURL}?text=${encodedText}`;

  // 5. Öffnen
  const newTab = window.open(fullURL, '_blank');
  if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
    showToast(t('alertPopupBlocked'), 'error');
  }
});

function populateWorldButtonsEditor() {
  const container = document.getElementById('worldButtonsEditor');
  container.innerHTML = '';

  const isEnglish = lang === 'en';

  // Welten sortieren nach sprachabhängigem Titel (fällt zurück auf name)
  const sortedWorlds = Object.entries(worldData)
    .sort((a, b) => {
      const titleA = (isEnglish ? a[1].title_en : a[1].title) || a[0];
      const titleB = (isEnglish ? b[1].title_en : b[1].title) || b[0];
      return titleA.toLocaleLowerCase().localeCompare(titleB.toLocaleLowerCase(), 'de');
    });

  for (const [worldKey, worldValue] of sortedWorlds) {
    const label = document.createElement('label');
    label.style.display = 'inline-block';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'worldSelect';
    input.value = worldKey;
    input.style.display = 'none';
    if (worldKey === currentWorld) input.checked = true;

    const span = document.createElement('span');
    span.className = 'world-chip';
    span.innerText = isEnglish ? (worldValue.title_en || worldKey) : (worldValue.title || worldKey);
    span.title = isEnglish ? (worldValue.description_en || '') : (worldValue.description || '');

    input.addEventListener('change', () => {
      currentWorld = worldKey;
      updateGameInfo();
      updatePlayerTargetInfo();
      populateSymbolPalette();
      generateRandomWorld();
      launchOffGridComets();
    });

    label.appendChild(input);
    label.appendChild(span);
    container.appendChild(label);
  }
}



function updatePlayerTargetInfo() {
  if (lang == 'de') {
      const w=worldData[currentWorld]; document.getElementById('playerTargetInfo').innerHTML= 
          `Spielersymbol: <span style="color:limegreen;">${w.player}</span> | Zielsymbol: <span style="color:red;">${w.target}</span>`;
  } else {
      const w=worldData[currentWorld]; document.getElementById('playerTargetInfo').innerHTML= 
          `Player symbol: <span style="color:limegreen;">${w.player}</span> | Target symbol: <span style="color:red;">${w.target}</span>`;
  }
}

function populateSymbolPalette() {
  const palette = document.getElementById('symbolPalette');
  palette.innerHTML = '';

  const w = worldData[currentWorld];
  // Alle Symbole zusammenfassen und Duplikatentfernung 
  const allSymbols = []
  .concat(w.symbols || [])
  .concat(w.rare || [])
  .concat(w.bottom || []);


  allSymbols.forEach(sym => {
    const span = document.createElement('span');
    span.className = 'symbol-chip';
    span.textContent = sym;

    if (sym === w.player) span.classList.add('symbol-player');
    if (sym === w.target) span.classList.add('symbol-target');

    span.onclick = () => {
      document.querySelectorAll('#symbolPalette .symbol-chip').forEach(el => el.classList.remove('selected'));
      span.classList.add('selected');
      selectedSymbol = sym;
    };

    palette.appendChild(span);
  });

  // Leeres Symbol am Ende hinzufügen
  const emptySpan = document.createElement('span');
  emptySpan.className = 'symbol-chip symbol-empty';
  emptySpan.textContent = '␣'; // Alternativ: '□' oder '␢'

  emptySpan.onclick = () => {
    document.querySelectorAll('#symbolPalette .symbol-chip').forEach(el => el.classList.remove('selected'));
    emptySpan.classList.add('selected');
    selectedSymbol = " ";
  };

  palette.appendChild(emptySpan);
}

function initEditorGrid() {
  editorGrid=[]; const out=document.getElementById('editorOutput'); out.innerHTML='';
  for (let y=0; y<rows; y++) { const rowArr=[]; const line=document.createElement('div'); line.className='row';
    for (let x=0; x<cols; x++) { rowArr.push(' '); const cell=document.createElement('span'); cell.className='cell';
      cell.onclick=()=>{ if(selectedSymbol){ cell.textContent=selectedSymbol; editorGrid[y][x]=selectedSymbol;} };
      line.appendChild(cell);
    }
    editorGrid.push(rowArr); out.appendChild(line);
  }
}

function supportsClipboardImage() {
  const hasClipboard = !!(navigator.clipboard && window.ClipboardItem);
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  return hasClipboard && !isTouchDevice;
}

// Übergabe als Parameter
function applyGridFromPermalink(res) {
  // optional: Weltname aus dem Link übernehmen
  if (res.worldName && worldData[res.worldName]) {
    currentWorld = res.worldName;
  }

  // Grid anwenden
  const w = worldData[currentWorld];
  gameGrid = res.grid.map(row => row.slice());
  originalGrid = gameGrid.map(row => row.slice());

  // Player-Position suchen
  playerX = 0; playerY = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (gameGrid[y][x] === w.player) { playerX = x; playerY = y; }
    }
  }

  initialTargets = gameGrid.flat().filter(c => c === w.target).length;
  foundCount = 0;
  timerStart = null;

  renderGame();
  updateGameInfo();
  updatePlayerTargetInfo();
  populateWorldGallery();
  document.getElementById('foundCount').innerText = t('foundCount') + ' 0';
  document.getElementById('timerDisplay').innerText = t('timerDisplay') + ' 0 s';
}

// Sprachumschaltung
document.getElementById('langSwitchBtn').addEventListener('click', () => {
    switchLang();
    // Aktualisiere das Label des Buttons:
    updateLangButtonLabel();
});

// Responsive
window.addEventListener('orientationchange', () => {
  // Bei Wechsel von Portrait ↔ Landscape Schriftgröße ggf. neu setzen
  if (window.innerWidth < 800) {
    const zoomSlider = document.getElementById("zoomSlider");
    updateZoom(zoomSlider.value); // Schriftgröße neu anwenden
  }
});

document.getElementById('toggleAnimationsBtn').addEventListener('click', () => {
  animationsEnabled = !animationsEnabled;
  localStorage.setItem('animationsEnabled', animationsEnabled);
  updateAnimationToggleLabel();
  renderGame(); // sofortige Wirkung
  clearCometIntervals();
  clearOffGridComets();
  if (animationsEnabled) launchOffGridComets();
});

function updateAnimationToggleLabel() {
  const btn = document.getElementById('toggleAnimationsBtn');
  btn.title = t('tooltipToggleAnimations');
  btn.textContent = animationsEnabled ? '✨' : '🛑';
}

document.getElementById('settingsToggleBtn').addEventListener('click', () => {
  document.getElementById('settingsDropdown').classList.toggle('hidden');
});

// Dropdown automatisch schließen bei Klick außerhalb
document.addEventListener('click', function(event) {
  const settings = document.getElementById('settingsMenu');
  if (!settings.contains(event.target)) {
    document.getElementById('settingsDropdown').classList.add('hidden');
  }
});

// Animationen der Cometen
function clearCometIntervals() {
  cometIntervals.forEach(id => clearInterval(id));
  cometIntervals = [];
}

function createOffGridComet(symbol = "☄️", rowPercent = 40, duration = 14000) {
  const overlay = document.getElementById("cometOverlay");
  if (!overlay) return;

  const comet = document.createElement("div");
  comet.className = "comet-fx";
  comet.textContent = symbol;
  comet.style.top = `${rowPercent}%`;
  comet.style.animationDuration = `${duration}ms`;

  overlay.appendChild(comet);
  setTimeout(() => comet.remove(), duration);
}

function clearOffGridComets() {
  const overlay = document.getElementById("cometOverlay");
  if (overlay) overlay.innerHTML = "";
}

function launchOffGridComets() {
  if (!animationsEnabled) return;

  const w = worldData[currentWorld];
  const symbols = w?.rare;
  if (!Array.isArray(symbols) || symbols.length === 0) return;

  for (const symbol of symbols) {
    const delay = 10000 + Math.random() * 10000;
    const id = setInterval(() => {
      if (!animationsEnabled) return; // Laufzeitprüfung
      const row = Math.floor(Math.random() * 60) + 10;
      createOffGridComet(symbol, row, 12000);
    }, delay);

    cometIntervals.push(id);
  }
}

document.getElementById('clearGrid').addEventListener('click', ()=>{ editorGrid.forEach(r=>r.fill(' ')); document.querySelectorAll('#editorOutput .cell').forEach(c=>c.textContent=' '); });

async function init(){
await loadWorldData();
    validateWorldData(worldData);
    await loadLangData();
    // Sprache wählen
    lang = localStorage.getItem('appLang') || detectLang();
    // Button-Label passend setzen
    updateLangButtonLabel();
    updateUIText();
    
    //populateWorldButtonsGame();
    populateWorldGallery();
    updateGameInfo();
    generateRandomWorld();
    populateWorldButtonsEditor();
    updatePlayerTargetInfo();
    populateSymbolPalette();
    initEditorGrid();
    if (supportsClipboardImage()) {
        document.getElementById('copyEditorGraphic').style.display = 'inline-block';
        document.getElementById('copyGameGraphic').style.display = 'inline-block';
        document.getElementById('swipeHint').innerText = t('hintMouse'); 
    }
    updateZoom(document.getElementById("zoomSlider").value);
    setupMaxSymbolsSlider();
    updateMaxSymbolsSlider();

    const loaded = loadGridFromPermalink();
    if (loaded && !loaded.error) {
      applyGridFromPermalink(loaded);
      showToast(t('alertPermalinkLoadedOk'), 'success', 4000);
    } else if (loaded && loaded.error) {
      showToast("❌ " + t('alertPermalinkError') + " " + loaded.error, 'error', 5000);
      console.warn(loaded.error);
    } else {
      console.log("ℹ️ " + t('alertNoPermalink'));
    }
    animationsEnabled = localStorage.getItem('animationsEnabled') !== 'false'; // Standard: true
    clearOffGridComets(); 
    clearCometIntervals();
    if (animationsEnabled) launchOffGridComets();

}
// Boot immediately (script is at the end of <body>)
init();

