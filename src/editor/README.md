# `editor`

This package includes code for the stylebot editor displayed on the page.

- **`components`**: Vue components for rendering the editor

- **`listeners`**: Tab-message, hotkey and context-menu listeners for the content script

- **`scss`**: Typography overrides

- **`store`**: [Vuex](https://vuex.vuejs.org/) store to manage editor state

- **`utils/chrome`**: Methods to send messages to extension background page

- **`index`**: Entry point for build and content script. Does not export anything to be consumed by any other packages.

## How it works

- `index` runs as a content script on every page: it creates the store, sets up
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
- All other page access — readability, inspecting, selector highlights, page colors — goes
  through the bridge too, so the store and components never touch the document themselves.
