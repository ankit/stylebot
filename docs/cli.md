# Stylebot CLI

A command line for driving Stylebot in a running browser: list tabs, read and inspect pages, hover and pick elements, get and set styles, and take screenshots. It's meant for scripting and for coding agents such as Claude Code, which can restyle a page and check the result without the editor open.

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

Then turn on **Let apps on this computer control Stylebot** in Stylebot's options, under Basics, and allow what the browser asks for. The extension connects to the host while the setting is on; turning it off disconnects it and gives back the permission to talk to the host. If it was already on before you installed, reload the extension or restart the browser. The host runs only while the browser does.

### When it can't connect

A command that can't reach the host works out why and prints one fix:

- No browser could be set up: install Chrome or Edge.
- No browser profile has Stylebot: add it. The CLI looks for Stylebot's store ids in each profile's extensions and preferences, which covers unpacked dev builds too, and says this only when it found profiles to look in.
- The host is registered but no browser has ever started it, so the setting is almost certainly off: turn it on. The host leaves a timestamp in `~/.stylebot/` each time a browser starts it, one per socket, so a test browser's doesn't count for yours.
- A browser has started it before: the browser is closed, or Stylebot isn't running in it. Open it.

The Claude Code skill relays these messages to you as they are.

## Commands

`yarn stylebot --help` lists every command, and `yarn stylebot <command> --help` describes one.

### Naming the target

Commands that only read default to the active tab, or take `--tab` when their arguments are selectors. Commands that change a style, take a screenshot or move the pointer (`css set`, `profile`, `screenshot`, `hover`, `inspect`) need the site or tab named, because an agent runs its commands over several steps and the active tab can change in between.

- A **tab** is a tab id, from `tabs` or `open`.
- A **target** is a tab id or a site, such as `news.ycombinator.com`.
- A **profile** is named by its name or id.

### Pages

```bash
yarn stylebot open news.ycombinator.com
yarn stylebot outline 54432929
yarn stylebot screenshot 54432929 -o page.png
yarn stylebot done
```

- `open` shows the page in the CLI's own window, which opens behind yours without taking focus, so an agent never switches your tabs. It reuses that window's tab for the page (any page on the site, for a bare site); `--new` always opens another.
- `tabs` lists open tabs, starring the one each window shows.
- `outline` prints the page's visible elements as an indented outline.
- `screenshot` saves a PNG of a tab. A hidden tab is shown for a moment to capture it, then the window switches back.
- `done` closes the CLI's window.

### Inspecting a page

```bash
yarn stylebot suggestions 54432929
yarn stylebot css-variables 54432929
yarn stylebot page-rules '.titleline > a' --tab 54432929
yarn stylebot computed-styles body color font-size --tab 54432929
yarn stylebot match-count '.titleline > a' '.subline' --tab 54432929
```

These read the page the way Chat does, so an agent can look at a page before styling it without another browser tool.

- `suggestions` prints the three requests Chat's empty state would offer for the page: up to two that suit it, and a creative look.
- `css-variables` prints the page's css variables, as the `:root` and `body` rules that set them, so a style can override them.
- `page-rules` prints the page's own rules for the elements a selector matches (the first five). Cross-origin stylesheets can't be read, so they're only counted.
- `computed-styles` prints computed values on the first element a selector matches: the properties named, or common layout, color and type ones.
- `match-count` prints how many elements each selector matches, and `invalid` for one that doesn't parse.

### Pointer

```bash
yarn stylebot hover 54432929 '#nav .menu'
yarn stylebot inspect 54432929 120,340
```

These point at the page, so an agent can open what only shows on hover, and find the selector for an element it sees in a screenshot. Neither clicks anything or draws on the page, so screenshots stay clean. Each needs the tab named.

- `hover` moves the pointer onto an element, or a point given as `x,y` in the pixels of a `screenshot` of the tab. A selector aims at the middle of its first visible match, scrolled into view.
- `inspect` prints the selector Stylebot's inspector would pick for an element or point, preferring one the site's style already has rules for. Below it come the other selectors the editor's selector menu would offer for the element, each with how many elements it matches, so an agent can pick a narrower or broader one. It sends the page no events and doesn't open the editor.

Hover's events are synthetic: the page's own handlers run, but CSS `:hover` doesn't apply, and a site that checks for a real user can ignore them.

### Styles

```bash
yarn stylebot css get news.ycombinator.com
yarn stylebot css set news.ycombinator.com < hn.css
```

- `styles` lists saved styles.
- `css get` prints a style's css.
- `css set` saves css from stdin or `--file` and applies it to open tabs right away. Empty css deletes the style.
  - It refuses css that doesn't parse, saying at which line, and adds Google Fonts imports for the families the css names, as Chat does. It also saves a selector's partly generated class names by their stable part, as Chat does, and says which it changed.
  - When the profile it saves is the one in use and an open tab shows the site (the tab named, else an active one), it checks the page and reports back as Chat's model is told after each edit: how many elements each selector matched, text the change made hard to read, and surfaces a theme change missed. It also flags selectors still built on class names the site generates, which have no stable part. With no such tab, or when the profile isn't in use, it says the style wasn't checked and why.

### Profiles

```bash
yarn stylebot profile create Dark news.ycombinator.com --use
yarn stylebot css set news.ycombinator.com --profile Dark < dark.css
```

- `profiles` lists a style's profiles, starring the one in use.
- `profile create`, `use`, `rename` and `delete` manage them.
- `css get` and `css set` take `--profile` to name the profile rather than use the active one. The `/stylebot` skill always passes it, so a profile switch mid-session can't send its css into your own style.

### Output

Every command takes `--json` to print the raw response instead of text.

## Claude Code

The Stylebot plugin teaches Claude Code to restyle pages with the CLI: open the page, read its outline, write CSS, fix what the page check reports, then look at a screenshot. It doesn't contain the CLI; its `stylebot` command runs the one on your `PATH`, or the published one through `npx` when there's none.

To try it in one session:

```bash
claude --plugin-dir tools/claude-plugin
```

Or install it from this repo's marketplace so every session has it:

```bash
claude plugin marketplace add ./
```

```bash
claude plugin install stylebot@stylebot
```

Then ask for a look, such as "give Hacker News a dark theme", and Claude picks the plugin up on its own; or run `/stylebot <site> <what to change>`. Without saying what to change, it offers the suggestions Chat shows for the page. The skill holds the styling guidance, adapted from Chat's.

It runs without permission prompts: the skill pre-approves `stylebot` commands and reading and writing files in `~/.stylebot/work/`, where it keeps its CSS and screenshots. When you name a profile, it updates that one; otherwise its changes go into a new profile named after the look, such as "Claude: Dark", so switching back to your own style is one profile change.

## A second browser

A test, or a second worktree, can run its own dev browser beside yours without taking over your CLI connection: give it its own profile and socket.

```bash
STYLEBOT_PROFILE_DIR=.chrome-dev-profile-test STYLEBOT_SOCKET=~/.stylebot/test.sock yarn start:chrome
```

Run `yarn stylebot install` once the profile folder exists, so it's registered there too, and run the CLI with the same `STYLEBOT_SOCKET` to drive that browser.

To try the CLI against a release-like build, run `yarn build:preview` and add `STYLEBOT_EXTENSION_DIR=preview-dist`. It carries the store's key, so it gets the extension id the host allows.

## How it works

The browser starts the native host when the extension connects to it, and keeps it running while the connection is open. The host listens on a Unix socket in `~/.stylebot/`, readable only by you, and relays each CLI command to the extension and its answer back.

The code that reads a page loads into it the first time the CLI asks about that page, so pages the CLI never touches don't carry it.

The extension connects only while the setting is on and the browser has granted its two optional permissions: `nativeMessaging` for the host, and `<all_urls>` for screenshots. Once granted, `<all_urls>` also lifts CORS on the background's own requests, so a cross-origin fetch that works there can still fail for someone who never turned the setting on. Chrome won't let the extension give `<all_urls>` back, since its content scripts already match every site, so turning the setting off removes only `nativeMessaging`.

Chrome lets the background reach the native host only once it starts again after the grant, so turning the setting on restarts the extension once. A restart cuts off the content scripts already running in open tabs, and Chrome only injects into pages that load afterwards. So the setting also asks for `scripting`, which has no install warning, and after the restart Stylebot runs its content scripts again in the open tabs. The fresh copy removes the panel the old one left, which no longer responds.

### Versions

After it's published, the extension updates from the browser's store and the CLI from npm, so they can drift apart. Each request carries the CLI's protocol number and version, and each response the extension's. They work together only when the protocol numbers are equal: the extension refuses a request in another protocol without running it, and the CLI says which side to update, the CLI with npm or Stylebot in the browser. An extension that sends no protocol predates the check, so the CLI asks for Stylebot to be updated. The check rides on every command, with no extra round trip.

Bump the protocol, in the CLI and the extension together, when a change to a command's arguments or result would break the other side: renaming or removing a command or a field, or changing what one means. Adding a command or an optional field doesn't need a bump.

The host copy in `~/.stylebot/` records the CLI version that installed it. When a different version of the CLI runs, it copies the host again first, and when the node the launcher is pinned to is gone, such as after a node upgrade, it pins the launcher to its own. Both happen quietly before the command runs. A browser keeps running the host it started until the extension reconnects, which is harmless while the host only relays; after a repin, though, the browser couldn't start the host at all, so the CLI asks for a browser restart if it then can't connect.

### Windows

Windows has no Unix sockets, so there the host listens on a named pipe for your user, and a `STYLEBOT_SOCKET` path names a pipe after its file. A pipe can't be taken over, so on Windows the first browser to connect keeps the CLI until it quits.

### Where browsers find the host

Browsers find the host through a manifest that names its launcher and allows Stylebot's Chrome Web Store and Edge Add-ons ids. On macOS and Linux the manifest goes in a `NativeMessagingHosts` folder in the browser's user data folder, and the dev profiles get their own. On Windows one manifest in `~/.stylebot/` is registered under a `NativeMessagingHosts` key in `HKCU\Software`.

#### Chrome

- macOS: `~/Library/Application Support/Google/Chrome`
- Linux: `~/.config/google-chrome`
- Windows: `HKCU\Software\Google\Chrome`

#### Edge

- macOS: `~/Library/Application Support/Microsoft Edge`
- Linux: `~/.config/microsoft-edge`
- Windows: `HKCU\Software\Microsoft\Edge`

#### Brave

Brave reads Chrome's hosts on macOS and Windows, so it shares Chrome's registration there.

- macOS: `~/Library/Application Support/Google/Chrome`
- Linux: `~/.config/BraveSoftware/Brave-Browser`
- Windows: `HKCU\Software\Google\Chrome`

#### Chromium

- macOS: `~/Library/Application Support/Chromium`
- Linux: `~/.config/chromium`
- Windows: `HKCU\Software\Chromium`

#### Vivaldi

Vivaldi reads Chrome's key on Windows.

- macOS: `~/Library/Application Support/Vivaldi`
- Linux: `~/.config/vivaldi`
- Windows: `HKCU\Software\Google\Chrome`

#### Arc

- macOS: `~/Library/Application Support/Arc/User Data`

## Before it can ship

- Publishing the CLI to npm, with the v4 store release, and the plugin through a public marketplace
- Install support for Firefox
- A visible sign that the CLI is connected, since any local process can use the socket
