/**
 * Whether this context can open the editor in a window of its own. Safari on
 * iPad has no chrome.windows.create, and content scripts no chrome.windows.
 */
export const supportsEditorWindow = (): boolean =>
  typeof chrome !== 'undefined' && typeof chrome.windows?.create === 'function';
