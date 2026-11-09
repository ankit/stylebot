# How the CLI works

The browser starts the native host when the extension connects to it, and keeps it running while the connection is open. Each browser profile with Stylebot connected starts its own host. Each host listens on its own Unix socket in `~/.stylebot/browsers/`, readable only by you, and relays each CLI command to the extension and its answer back.

The CLI finds the browsers through their sockets. With more than one, it asks each extension which browser it runs in and what page that browser shows, to name them for `--browser` and to ask you which to use. A socket nothing listens on, left by a host that quit without cleaning up, is removed. A host started before each browser had its own socket listens on the one all browsers used to share, and the CLI finds it there too until the browser restarts.

The code that reads a page loads into it the first time the CLI asks about that page, so pages the CLI never touches don't carry it. It runs in the top frame only.

The extension connects only while the setting is on and the browser has granted its optional `nativeMessaging` permission for the host. Screenshots need `<all_urls>`, which Stylebot already holds on Chrome and Edge, to restore open tabs after an update.

Chrome lets the background reach the native host only once it starts again after the grant, so turning the setting on restarts the extension once. A restart cuts off the content scripts already running in open tabs, and Chrome only injects into pages that load afterwards. So after the restart Stylebot runs its content scripts again in the open tabs, as it does after an update. The fresh copy removes the panel the old one left, which no longer responds.

## Versions

After it's published, the extension updates from the browser's store and the CLI from npm, so they can drift apart. Each request carries the CLI's protocol number and version, and each response the extension's. They work together only when the protocol numbers are equal: the extension refuses a request in another protocol without running it, and the CLI says which side to update, the CLI with npm or Stylebot in the browser. An extension that sends no protocol predates the check, so the CLI asks for Stylebot to be updated. The check rides on every command, with no extra round trip.

Bump the protocol, in the CLI and the extension together, when a change to a command's arguments or result would break the other side: renaming or removing a command or a field, or changing what one means. Adding a command or an optional field doesn't need a bump.

The host copy in `~/.stylebot/` records the CLI version that installed it. When a different version of the CLI runs, it copies the host again first, and when the node the launcher is pinned to is gone, such as after a node upgrade, it pins the launcher to its own. Both happen quietly before the command runs. A browser keeps running the host it started until the extension reconnects, which is harmless while the host only relays; after a repin, though, the browser couldn't start the host at all, so the CLI asks for a browser restart if it then can't connect.

## Windows

Windows has no Unix sockets, so there each host listens on a named pipe for your user, and a `STYLEBOT_SOCKET` path names a pipe after its file. A pipe can't be taken over, so with `STYLEBOT_SOCKET` set, the first browser to connect keeps it until it quits.

## Where browsers find the host

Browsers find the host through a manifest that names its launcher and allows Stylebot's Chrome Web Store and Edge Add-ons ids. On macOS and Linux the manifest goes in a `NativeMessagingHosts` folder in the browser's user data folder, and the dev profiles get their own. On Windows one manifest in `~/.stylebot/` is registered under a `NativeMessagingHosts` key in `HKCU\Software`.

### Chrome

- macOS: `~/Library/Application Support/Google/Chrome`
- Linux: `~/.config/google-chrome`
- Windows: `HKCU\Software\Google\Chrome`

### Edge

- macOS: `~/Library/Application Support/Microsoft Edge`
- Linux: `~/.config/microsoft-edge`
- Windows: `HKCU\Software\Microsoft\Edge`

### Brave

Brave reads Chrome's hosts on macOS and Windows, so it shares Chrome's registration there.

- macOS: `~/Library/Application Support/Google/Chrome`
- Linux: `~/.config/BraveSoftware/Brave-Browser`
- Windows: `HKCU\Software\Google\Chrome`

### Chromium

- macOS: `~/Library/Application Support/Chromium`
- Linux: `~/.config/chromium`
- Windows: `HKCU\Software\Chromium`

### Vivaldi

Vivaldi reads Chrome's key on Windows.

- macOS: `~/Library/Application Support/Vivaldi`
- Linux: `~/.config/vivaldi`
- Windows: `HKCU\Software\Google\Chrome`

### Arc

- macOS: `~/Library/Application Support/Arc/User Data`

## A second browser

A test, or a second worktree, can run its own dev browser beside yours. It connects like any other browser, so the CLI asks which to use. To keep it apart entirely, give it its own profile and socket:

```bash
STYLEBOT_PROFILE_DIR=.chrome-dev-profile-test STYLEBOT_SOCKET=~/.stylebot/test.sock yarn start:chrome
```

Run `stylebot install` once the profile folder exists, so it's registered there too, and run the CLI with the same `STYLEBOT_SOCKET` to drive that browser. With it set, the CLI sees only that browser, and without it, never sees it.

To try the CLI against a release-like build, run `yarn preview:chrome` instead of `yarn start:chrome`. It carries the store's key, so it gets the extension id the host allows.

## Before it can ship

- Publishing the CLI to npm, with the v4 store release, and the plugin through a public marketplace
- Install support for Firefox
- A visible sign that the CLI is connected, since any local process can use the socket
