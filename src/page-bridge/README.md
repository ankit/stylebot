# `page-bridge`

Aliased as `@stylebot/page-bridge`.

Everything an editor host does to the page it styles — injecting CSS, running the
reader, inspecting and highlighting elements, sampling page colors — behind one
`PageBridge` type, so the editor's store and components never touch the document
themselves. The bridge only touches the page: the style itself lives in the editor's
store, which persists it to the background.

- **`PageBridge`**: the type, plus `PageSnapshot`, the page facts the store mirrors
- **`LocalPageBridge`**: the implementation for a host that runs inside the page (the
  content script)
- **`PageBridgeEmitter`**: the small typed emitter both implementations share
- **`page-colors`**: samples the colors in use on the page for the color picker
- **`index`**: `setPageBridge` / `getPageBridge`, the registry each host fills at boot
