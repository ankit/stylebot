# `background`

This package includes code for the extension background page.

- **`cache`**: Setup styles and options on initial load

- **`contextmenu`**: Setup and update right-click context menu

- **`listeners`**: Setup `chrome.runtime.onMessage` listeners to respond to messages from content scripts and options page

- **`messages`**: All message handlers for `chrome.runtime.onMessage`

- **`notification-manager`**: Show extension update notification if applicable

- **`options`**: Getters/setters of stylebot options

- **`styles`**: Getters/setters for styles

- **`utils`**: Utility methods consumed by background page

- **`index`**: Entry point for build. Does not export anything to be consumed by any other packages.
