# Editor

The editor is one Vue app that runs in two hosts: docked inside the page, or in its own browser window. Everything it does to the page goes through a page bridge, which is what lets the same components run in either place.

## In the page

- Only a small listener script runs on every page. It listens for tab messages, keyboard
  shortcuts, right-clicks and editor-window connections from the start, and loads the
  editor itself the first time one of them needs it.
- Until then, the listener script handles what only touches the page: re-applying saved
  styles pushed from elsewhere, switching the reader on or off, and answering whether the
  editor is open.
- Once loaded, the editor creates the store and the local page bridge, loads options,
  shortcuts, reader settings and the page's saved style, and then takes every event.
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

## Undo and redo

The editor keeps an undo stack of the page's CSS for as long as it is open: every edit
records the CSS it replaced, and Cmd/Ctrl+Z walks back through those snapshots by
re-applying them down the same path an edit takes, so the page and storage follow. Rapid
changes from one control — a slider drag, a burst of typing — collapse into a single step,
and housekeeping like pruning blank rules is never recorded. Nothing is persisted; closing
the editor drops the stack.

This is deliberately not the same thing as version history, which is the durable record
of style changes the options page restores from. Undo is for taking back the gesture you
just made: in memory, one step per gesture, gone when the editor closes. Version history
is for recovering from something you did a while ago: saved, and folded so that a whole
editing session is one entry. Undoing therefore never adds entries to the version list —
an undo is just another write in the session already under way — and once the editor is
closed, version history is what is left to recover from.

The code editor is the exception to the keys. It runs in its own document, so they never
reach the panel from inside it: there they stay the code editor's, working on its own
model history. To keep that alive, CSS the panel pushes down is applied as an undoable
edit rather than replacing the model outright, which would reset it. Undoing inside the
code editor then reaches the panel as an ordinary code change, and becomes a new step in
the panel's undo stack.
