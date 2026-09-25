# Editor

The editor is one Vue app, `TheStylebotApp`, that runs in two hosts: docked inside the page, or in its own browser window. Everything it does to the page goes through a `PageBridge`, which is what lets the same components run in either place.

Code: `src/editor` (the app and the in-page host), `src/page-bridge` (`@stylebot/page-bridge`), `src/editor-window` (the window host).

## In the page

- `editor/index` runs as a content script on every page: it creates the store, sets up
  `@stylebot/page-bridge` with the local bridge, and registers the tab-message listener
  right away so a popup click can't arrive before the store is ready.
- Handling waits for `initialize` (options, commands, reader settings) and the page's saved
  style; hotkeys and the context-menu listener are bound after that.
- Nothing is mounted until the editor opens: `toggleStylebot` calls `initEditor`, which adds
  the `#stylebot` host with a shadow root, fetches the editor stylesheet and mounts
  `TheStylebotApp`.
- `openStylebot` refreshes the page snapshot, re-enables the style if needed and shows the
  panel; closing only hides it, the app stays mounted.
- Every edit runs through `applyCss`: the bridge injects the CSS into the page, the store
  persists it (`SetStyle`) and commits the css and its selectors.

## The page bridge

Everything an editor host does to the page it styles — injecting CSS, running the
reader, inspecting and highlighting elements, sampling page colors — sits behind one
`PageBridge` type, so the editor's store and components never touch the document
themselves. The bridge only touches the page: the style itself lives in the editor's
store, which persists it to the background.

- **`PageBridge`**: the type, plus `PageSnapshot`, the page facts the store mirrors
- **`LocalPageBridge`**: the implementation for a host that runs inside the page (the
  content script)
- **`remote-page-bridge`**: the implementation for a host in its own extension window,
  driving the tab's content script over a port — the class, the port name and the messages
  that cross it in both directions
- **`PageBridgeEmitter`**: the small typed emitter both implementations share
- **`page-colors`**: samples the colors in use on the page for the color picker
- **`computed-styles`**: reads a selector's computed values for the basic editor's placeholders
- **`index`**: `setPageBridge` / `getPageBridge`, the registry each host fills at boot

## In its own window

The background's `editor-window` module opens the window with `?tabId=` of the page it
styles. `editor-window/index` connects a port to that tab, initializes the store from the
page's connected message, and mounts the same `TheStylebotApp` tree with the store created
for the `window` host and a `RemotePageBridge` in place of the local one. Every
page-touching operation travels over the port to the tab's content script, where the
editor's `editor-window` listener serves it.

`editor-window/listeners` persists the window's bounds into `options.layout.window`.
