// generator.js - world generation wrapper with graceful fallback
import { getState, setOutput } from './store.js';

/**
 * We prefer to call an existing core implementation if present:
 * - window.generateWorldCore(state, data) -> string
 * - or common.generate(state, data)      -> string
 * If none exists, we fallback to a simple symbol fill.
 */
export function generateWorld(data, overrides = {}) {
  const state = getState(overrides);
  const core = getCore();
  const output = core ? core(state, data) : fallbackGenerate(state, data);
  setOutput(output);
  syncOutputToDOM(output);
  return output;
}

export function copyWorld() {
  const out = getState().output || '';
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(out);
  } else {
    // Legacy fallback
    const ta = document.createElement('textarea');
    ta.value = out;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

function getCore() {
  if (typeof window !== 'undefined') {
    if (typeof window.generateWorldCore === 'function') return window.generateWorldCore;
    if (window.common && typeof window.common.generate === 'function') return window.common.generate;
  }
  // Try dynamic import of existing common.js exporting generate()
  try {
    // Note: dynamic import may fail if common.js is not a module; that's fine.
    return null;
  } catch (_) {
    return null;
  }
}

function fallbackGenerate(state, data) {
  // Very simple generator if no core is available: fill grid with first symbol set
  const width  = Number(state.width  ?? 30);
  const height = Number(state.height ?? 10);
  const type = state.worldType || (data?.types?.[0] ?? 'Default');
  const symbolSet = pickSymbolSet(data, type);

  const lines = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += randomFromSet(symbolSet);
    }
    lines.push(row);
  }
  // Optional message at top centered
  const msg = (state.message ?? '').trim();
  if (msg) {
    const top = centerText(msg, width);
    lines[0] = top;
  }
  return lines.join('\n');
}

function pickSymbolSet(data, type) {
  if (!data) return ['.', '*', ' '];
  // try common shapes
  if (Array.isArray(data.symbols?.[type])) return data.symbols[type];
  if (Array.isArray(data.SYMBOLS?.[type])) return data.SYMBOLS[type];
  if (Array.isArray(data.symbolsDefault))   return data.symbolsDefault;
  // flatten any first array in symbols map
  const values = data.symbols ? Object.values(data.symbols) : [];
  for (const v of values) if (Array.isArray(v) && v.length) return v;
  return ['.', '*', ' '];
}

function randomFromSet(set) {
  // Allow weighted tuples like ['.', '.', '.', '*']
  const idx = Math.floor(Math.random() * set.length);
  const token = set[idx];
  if (Array.isArray(token)) return token[0];
  return String(token);
}

function centerText(txt, width) {
  const cropped = txt.slice(0, Math.max(0, width));
  const pad = Math.max(0, Math.floor((width - cropped.length) / 2));
  return ' '.repeat(pad) + cropped + ' '.repeat(Math.max(0, width - pad - cropped.length));
}

function syncOutputToDOM(text) {
  const out = document.querySelector('#output, textarea[name="output"]');
  if (out) out.value = text;
}
