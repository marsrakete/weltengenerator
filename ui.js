// ui.js - connect DOM to store & generator (dynamic worldType options)
import { bindEvents } from './events.js';
import { setMessage, setWorldType, getState } from './store.js';
import { generateWorld, copyWorld } from './generator.js';

export function setupUI(worldData) {
  const select = document.querySelector('#worldType');
  hydrateWorldTypeOptions(select, worldData);

  // Declarative event registry
  bindEvents({
    'click #generateBtn': () => generateWorld(worldData),
    'click #copyBtn':     () => copyWorld(),
    'input #message':     (e) => { setMessage(e.target.value); },
    'change #worldType':  (e) => { setWorldType(e.target.value); generateWorld(worldData); },
  });

  // initial render
  generateWorld(worldData);
}

/**
 * Rebuilds the <select id="worldType"> options from the provided worldData object.
 * Uses worldData[key].title if available, otherwise the key itself as label.
 */
function hydrateWorldTypeOptions(selectEl, worldData) {
  if (!selectEl) return;
  const keys = worldData && typeof worldData === 'object' ? Object.keys(worldData) : [];
  if (!keys.length) return;

  // Try to preserve a previously selected or default state value
  const current = getState().worldType;
  let selectedKey = keys.includes(current) ? current : keys[0];

  // Build options HTML
  const options = keys.map(k => {
    const label = (worldData[k] && (worldData[k].title || worldData[k].name)) || k;
    const sel = (k === selectedKey) ? ' selected' : '';
    return `<option value="${escapeHtml(k)}"${sel}>${escapeHtml(label)}</option>`;
  }).join('');

  selectEl.innerHTML = options;

  // Make sure store aligns with selection
  if (current !== selectedKey) {
    setWorldType(selectedKey);
  }
}

function escapeHtml(s) {
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#39;');
}
