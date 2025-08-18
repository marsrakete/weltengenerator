// store.js - tiny app state
const state = {
  width: 30,
  height: 10,
  worldType: 'Galaxy',
  message: '',
  output: ''
};

export const getState = (overrides = {}) => Object.freeze({ ...state, ...overrides });
export const setState = (patch = {}) => Object.assign(state, patch);
export const setMessage = (msg) => setState({ message: String(msg ?? '') });
export const setWorldType = (t) => setState({ worldType: String(t ?? 'Galaxy') });
export const setOutput = (text) => setState({ output: String(text ?? '') });
