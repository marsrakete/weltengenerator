# Weltengenerator v3 — Modulare Struktur (Variante 2)

Diese Version ersetzt die alte, monolithische JS-Struktur vollständig durch **ES-Module**.
Alle Event-Listener sind zentral, delegiert und deklarativ registriert. Die Daten werden robust geladen (ESM, globales Script oder JSON-Fallback).

## Struktur

```
/
├─ index.html
├─ common.css
├─ favicon.ico
├─ worldData.json
├─ lang.json
├─ main.js          # Bootstrap: init() + Daten laden + UI starten
├─ ui.js            # UI-Verdrahtung & deklarative Events
├─ events.js        # Event-Delegation (1 Listener je Event-Typ)
├─ store.js         # Zentraler State (width, height, worldType, message, output)
├─ loader.js        # Robuster World-Data-Loader (ESM → global → JSON)
├─ generator.js     # Generation-API; nutzt Core, fallback bei Bedarf
└─ dom.js           # kleine DOM-Helfer (optional)
```

## Schnellstart (ohne Build-Tool)

1. **Static Server starten** (wegen `import` und `fetch`):  
   - Python: `python -m http.server 8080`  
   - Node: `npx http-server -p 8080`  
   - VS Code: Extension “Live Server”

2. **Seite öffnen:**  
   `http://localhost:8080/`

> Hinweis: Direktes Öffnen der `index.html` per Doppelklick scheitert i. d. R. an CORS/Module-Beschränkungen. Bitte einen lokalen Webserver nutzen.

## index.html – Einbindung

```html
<!-- Daten (optional global). Wenn worldData.js nicht existiert, wird worldData.json geladen. -->
<!-- <script src="./worldData.js"></script> -->

<!-- App als ES-Module: -->
<script type="module" defer src="./main.js"></script>
```

Du kannst `worldData.js` weglassen, wenn `worldData.json` vorhanden ist. Der Loader versucht der Reihe nach:
1. ESM-Import `./worldData.js` (wenn vorhanden, `export default {...}` oder benannte Exporte)  
2. globales `window.worldData` aus `worldData.js`  
3. `fetch('./worldData.json')`

## UI-IDs (müssen im HTML existieren)

- `#generateBtn` – Welt generieren  
- `#copyBtn` – Ausgabe kopieren  
- `#message` – zentrierte Top-Zeile  
- `#worldType` – Auswahl des Welt-Typs  
- `#output` – Ausgabe-Textarea (readonly empfohlen)

Die Beispiel-`index.html` enthält passende Markup-Elemente.

## Events (deklarativ & delegiert)

In `ui.js` definierst du alle Events an einer Stelle:

```js
bindEvents({
  'click #generateBtn': () => generateWorld(worldData),
  'click #copyBtn':     () => copyWorld(),
  'input #message':     (e) => setMessage(e.target.value),
  'change #worldType':  (e) => { setWorldType(e.target.value); generateWorld(worldData); },
});
```

`events.js` registriert intern **einen Listener pro Event-Typ** (z. B. nur 1× `click`) und verteilt über Delegation an die passenden Targets (per CSS-Selektor).

## Generator-Logik (Core & Fallback)

`generator.js` ruft – falls vorhanden – **deinen** Core auf:

- `window.generateWorldCore(state, data)` **oder**
- `window.common.generate(state, data)`

Wenn kein Core existiert, greift ein **Fallback**, der ein Grid basierend auf den Symbolsets erzeugt und die Nachricht in der obersten Zeile mittig einfügt.

### State-Form
`store.js` hält Standardwerte und Setter:

```js
{
  width: 30,
  height: 10,
  worldType: 'Galaxy',
  message: '',
  output: ''
}
```

## worldData – Format & Pflege

Beispiel `worldData.json` (vereinfacht):

```json
{
  "Galaxy": {
    "symbols": ["✮","🌕","🪐","⭐️","🌌"],
    "rare":    ["🚀","🛸"],
    "bottom":  ["🔭","📡"],
    "player":  "🚀",
    "target":  "🌍",
    "title":   "Galaxie",
    "description": "Eine galaktische Welt voller Sterne und Planeten."
  },
  "Blumenwiese": {
    "symbols": ["🌿","🌼","🌸","🌷","🌻"]
  }
}
```

- **Pflichtfelder:** gibt es keine harten, aber sinnvoll sind zumindest `symbols` (Array).
- **Optionale Felder:** `rare`, `bottom`, `player`, `target`, `title`, `description`.
- Du kannst das Schema je Welt-Typ frei erweitern; dein Core kann es nutzen.

## Typische Anpassungen

- **Neue Welt hinzufügen:** In `worldData.json` neuen Key anlegen; Option in `<select id="worldType">` ergänzen (oder dynamisch rendern).
- **Andere Standardwerte:** In `store.js` (`state`) anpassen.
- **Debounce für Input:** Gern ergänzbar – z. B. in `dom.js` eine `debounce(fn, ms)`-Hilfe und im `input`-Handler nutzen.

## Migration von Altcode

- Alte `common.js`/`worldData.js` werden **nicht mehr benötigt**.  
- Wenn du eigene Generierungslogik hast, exportiere sie als globale Funktion `window.generateWorldCore(state, data)` oder als `window.common.generate(...)`, bis du sie als ESM-Funktion in `generator.js`/eigenes Modul migrierst.

## Lizenz & Hinweise

- Emojis unterliegen Unicode/Plattform-Support. Achte auf Kompatibilität (ältere Systeme zeigen ggf. leere Kästchen).
- Dieses Repo ist buildfrei (kein Bundler nötig). Für Produktion kannst du optional bundeln/minifizieren.
