# `src/editor-window`

Entry point for the editor in its own browser window, opened by the background's
`editor-window` module with `?tabId=` of the page it styles. It mounts the same
`TheStylebotApp` tree as the in-page editor, with the store created for the `window`
host and a `RemotePageBridge` in place of the in-page `LocalPageBridge`, so every
page-touching operation travels over a port to that tab's content script.

- **`index`**: connects the port, initializes the store from the page's connected message, mounts the app
- **`listeners`**: persists the window's bounds into `options.layout.window`
