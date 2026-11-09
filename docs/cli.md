# Stylebot CLI

A command line for driving Stylebot in a running browser: list tabs, read and inspect pages, hover and pick elements, force hover and focus states, get and set styles, and take screenshots. It's meant for scripting and for coding agents such as Claude Code, Codex or Cursor, which can restyle a page and check the result without the editor open.

It works with Stylebot on Chrome, Edge and the other Chromium browsers listed below, on macOS, Linux and Windows, once turned on in Stylebot's options. Firefox and Safari aren't supported yet.

## Setup

The CLI needs Node 20 or later, and Stylebot 4 or later in the browser. It's published to npm as `@stylebot/cli`:

```bash
npm install -g @stylebot/cli
stylebot install
```

To run this checkout's CLI instead, use `yarn stylebot` inside the repo. To run it as `stylebot` from anywhere on macOS or Linux, link it onto your `PATH`:

```bash
ln -s "$PWD/tools/cli/bin/stylebot.mjs" ~/bin/stylebot
```

On Windows, run `yarn stylebot` or `node tools\cli\lib\cli.mjs`.

The first command sets the CLI up with your browsers on its own, saying which. To check setup, or after installing another browser, run `install`; for this checkout's CLI, run it from the repo so it finds the dev profiles:

```bash
yarn stylebot install
```

This copies the CLI's native messaging host into `~/.stylebot/` and registers it with each installed browser, then prints a checklist of what's done and what's left: the browsers it found, whether Stylebot is in one of them, and whether it's connected. Run it again any time to check. On macOS and Linux it also registers with the dev profiles `yarn dev:chrome` launches, which keep their own list of hosts; on Windows the browser's registration covers them.

| Browser  | macOS | Linux | Windows |
| -------- | ----- | ----- | ------- |
| Chrome   | ✓     | ✓     | ✓       |
| Edge     | ✓     | ✓     | ✓       |
| Brave    | ✓     | ✓     | ✓       |
| Chromium | ✓     | ✓     | ✓       |
| Vivaldi  | ✓     | ✓     | ✓       |
| Arc      | ✓     |       |         |

A browser counts as installed once it has run, which leaves a `Local State` file in its user data folder, so run `install` again after installing a new browser.

Then turn on **Allow command line access** in Stylebot's options, under Basics, and allow what the browser asks for. The extension connects to the host while the setting is on; turning it off disconnects it and gives back the permission to talk to the host. If it was already on before you installed, reload the extension or restart the browser. The host runs only while the browser does.

### When it can't connect

A command that can't reach the host works out why and prints one fix:

- No browser could be set up: install Chrome or Edge.
- No browser profile has Stylebot: add it. The CLI looks for Stylebot's store ids in each profile's extensions and preferences, which covers unpacked dev builds too, and says this only when it found profiles to look in.
- The host is registered but no browser has ever started it, so the setting is almost certainly off: turn it on. The host leaves a timestamp in `~/.stylebot/` each time a browser starts it, one per socket, so a test browser's doesn't count for yours.
- A browser has started it before: the browser is closed, or Stylebot isn't running in it. Open it.

The Stylebot skill relays these messages to you as they are.

## More

- [Commands](cli/commands.md) — naming the target, several browsers, pages, inspecting a page, the pointer, output
- [Styles, profiles and options](cli/styles.md) — getting, editing and checking a style's css, its profiles and style options
- [Forced states](cli/forced-states.md) — making hover and focus styles apply without a real pointer
- [CLI mode](cli/cli-mode.md) — marking the page and writing notes for an agent from a terminal on the tab
- [Coding agents](cli/coding-agents.md) — the Stylebot skill, and installing it in Claude Code, Codex, Copilot, Cursor and Antigravity
- [How it works](cli/how-it-works.md) — the native host, versions, Windows, where browsers find the host, and a second dev browser
