import store from './store/index';

// chrome.scripting.executeScript can inject this into an already-injected
// tab (e.g. a context-menu click racing a hotkey press) — guard against
// re-running the whole init, which would double-register listeners.
if (!window.__stylebotEditorInjected) {
  window.__stylebotEditorInjected = true;
  store.dispatch('initialize', store);
}
