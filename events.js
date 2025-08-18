// events.js - declarative, delegated event binding
export function bindEvents(registry, root = document) {
  const cache = new Map(); // eventType -> handler
  const entries = Object.entries(registry);

  const types = Array.from(new Set(entries.map(([k]) => k.split(' ')[0])));
  for (const type of types) {
    const delegated = (e) => {
      for (const [key, handler] of entries) {
        const [evtType, ...selParts] = key.split(' ');
        if (evtType !== type) continue;
        const selector = selParts.join(' ');
        const target = e.target?.closest?.(selector);
        if (target && root.contains(target)) {
          handler(e, target);
          break;
        }
      }
    };
    root.addEventListener(type, delegated);
    cache.set(type, delegated);
  }

  return () => {
    for (const [type, handler] of cache.entries()) {
      root.removeEventListener(type, handler);
    }
    cache.clear();
  };
}
