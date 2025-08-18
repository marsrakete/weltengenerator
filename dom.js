// dom.js - small DOM helpers
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const text = (el, value) => { if (el) el.textContent = value; };
export const val  = (el, value) => { if (el) el.value = value; };
export const html = (el, value) => { if (el) el.innerHTML = value; };
export const on   = (el, type, handler, opts) => el && el.addEventListener(type, handler, opts);
