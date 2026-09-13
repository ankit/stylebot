export {};

declare global {
  interface Window {
    // Set by inject-css's contextmenu listener, read by editor/index.js once
    // injected — content scripts from the same extension in the same frame
    // share one JS `window`, so this needs no messaging.
    __stylebotPendingContextMenuSelector?: string;

    // Guards against re-running editor/index.js's full init if
    // chrome.scripting.executeScript injects it into an already-injected tab.
    __stylebotEditorInjected?: boolean;

    // Set once editor/index.js's own hotkeys-js binding is live — tells
    // inject-css's hotkey listener to stand down so a keypress isn't
    // handled twice.
    __stylebotHotkeysBound?: boolean;
  }
}
