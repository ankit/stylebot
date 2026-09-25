# Editor

The editor is one Vue app that runs in two hosts: docked inside the page, or in its own browser window. Everything it does to the page goes through a page bridge, which is what lets the same components run in either place.

## In the page

- The editor's content script runs on every page. It creates the store, sets up the local
  page bridge, and starts listening for tab messages right away, so a click in the popup
  can't arrive before the store is ready.
- Messages are handled once options, shortcuts, reader settings and the page's saved style
  have loaded; keyboard shortcuts and the context menu are bound after that.
- Nothing is mounted until the editor first opens. Then it adds a host element with a
  shadow root, fetches the editor stylesheet and mounts the app.
- Opening refreshes what the store knows about the page, re-enables the style if needed
  and shows the panel. Closing only hides it; the app stays mounted.
- Every edit follows the same path: the bridge injects the CSS into the page, and the store
  saves it to the background.

## The page bridge

Everything an editor host does to the page it styles — injecting CSS, running the
reader, inspecting and highlighting elements, sampling page colors, reading computed
values — sits behind one interface, so the editor's store and components never touch the
document themselves. The bridge only touches the page: the style itself lives in the
editor's store, which saves it to the background.

There are two implementations:

- **Local**, for the editor docked inside the page. It calls straight into the document.
- **Remote**, for the editor in its own window. It sends each call over a port to the
  tab's content script, which runs it against the page and sends back the result and any
  page events.

## In its own window

The background opens the window for a specific tab and keeps track of which window belongs
to which tab. The window connects a port to that tab, loads its initial state from the
page, and mounts the same app with the remote bridge. Every page-touching operation
travels over the port to the tab's content script.

The window remembers its size and position, so it reopens where the user left it.
