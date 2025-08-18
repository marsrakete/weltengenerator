// loader.js - resilient loader for world data (module, global, or JSON)
export async function loadWorldData() {
  // 1) Try ESM import
  try {
    const mod = await import('./worldData.js');
    // Accept named exports or default
    const data = mod.default ?? mod.worldData ?? mod.WORLD_DATA ?? mod;
    if (data) return deepFreeze(structuredClone(data));
  } catch (_) {}

  // 2) Try global
  if (typeof window !== 'undefined') {
    const cand = window.worldData || window.WORLD_DATA || window.WORLD || window.data;
    if (cand) return deepFreeze(structuredClone(cand));
  }

  // 3) Fallback to JSON file
  try {
    const res = await fetch('./worldData.json', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      return deepFreeze(json);
    }
  } catch (_) {}

  // 4) Empty shape as last resort
  return deepFreeze({ types: [], symbols: {}, rules: {} });
}

function deepFreeze(obj) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    for (const k of Object.keys(obj)) deepFreeze(obj[k]);
  }
  return obj;
}
