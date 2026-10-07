# Stylebot CLI

A command line for driving Stylebot in a running browser: list tabs, read a page's outline, get and set styles, and take screenshots. It's meant for scripting and for coding agents such as Claude Code, which can restyle a page and check the result without the editor open.

For now it only works with development builds of the extension on Chrome and Edge.

## Setup

The CLI needs Node 20 or later. Inside this repo, `yarn stylebot` runs it. To run it as `stylebot` from anywhere, link it onto your `PATH`:

```bash
ln -s "$PWD/tools/cli/bin/stylebot" ~/bin/stylebot
```

Then register it with your browsers, from the repo so it finds the dev profiles:

```bash
yarn stylebot install
```

This copies the CLI's native messaging host into `~/.stylebot/` and registers it with the dev profiles `yarn dev:chrome` launches, and with your installed Chrome and Edge. Then start (or reload) a dev build:

```bash
yarn dev:chrome
```

The extension connects to the host when it starts. The host runs only while the browser does.

## Commands

`yarn stylebot --help` lists every command, and `yarn stylebot <command> --help` describes one.

### Naming the target

Commands that only read default to the active tab. Commands that change a style or take a screenshot (`css set`, `profile`, `screenshot`) need the site or tab named, because an agent runs its commands over several steps and the active tab can change in between.

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

### Styles

```bash
yarn stylebot css get news.ycombinator.com
yarn stylebot css set news.ycombinator.com < hn.css
```

- `styles` lists saved styles.
- `css get` prints a style's css.
- `css set` saves css from stdin or `--file` and applies it to open tabs right away. Empty css deletes the style.

### Profiles

```bash
yarn stylebot profile create Dark news.ycombinator.com --use
yarn stylebot css set news.ycombinator.com --profile Dark < dark.css
```

- `profiles` lists a style's profiles, starring the one in use.
- `profile create`, `use`, `rename` and `delete` manage them.
- `css get` and `css set` take `--profile` for a profile that isn't in use.

### Output

Every command takes `--json` to print the raw response instead of text.

## A second browser

A test, or a second worktree, can run its own dev browser beside yours without taking over your CLI connection: give it its own profile and socket.

```bash
STYLEBOT_PROFILE_DIR=.chrome-dev-profile-test STYLEBOT_SOCKET=~/.stylebot/test.sock yarn start:chrome
```

Run `yarn stylebot install` once the profile folder exists, and run the CLI with the same `STYLEBOT_SOCKET` to drive that browser.

## How it works

The browser starts the native host when the extension connects to it, and keeps it running while the connection is open. The host listens on a Unix socket in `~/.stylebot/`, readable only by you, and relays each CLI command to the extension and its answer back.

Development builds add the `nativeMessaging` permission for the host and `<all_urls>` for screenshots. `<all_urls>` also lifts CORS on the background's own requests, so a cross-origin fetch that works in a dev build can still fail in a release build.

## Before it can ship

- An opt-in setting, with `nativeMessaging` as an optional permission so existing users aren't asked to re-approve the extension
- Publishing the CLI to npm
- Install support for Edge's store id, other Chromium browsers, Windows and Firefox
- A visible sign that the CLI is connected, and a separate opt-in for reading pages (outlines and screenshots), since any local process can use the socket
