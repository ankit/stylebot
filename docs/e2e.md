# e2e

Playwright tests that drive the real, built extension in a real browser. Chrome is the
default; Chrome runs on every PR, Firefox and Edge on release PRs (or manually via
workflow_dispatch).

## What belongs here

These tests are for what only the real extension can prove: the popup talking to the
background and the content script, styles persisting across reloads and SPA navigations,
CSS actually landing on the page, web fonts fetched from the background, iframes and
cross-origin frames, and anything engine-specific. They are slow — every test launches
the popup and waits for the editor's content script — so behaviour that lives entirely
inside the panel (menus, shortcuts, property controls, the inspector's keyboard flow,
the font and color pickers) is tested as Storybook interaction tests instead (the `Tests`
root in the Storybook sidebar), run with `yarn test:storybook`.
When a test here only needs the panel, it belongs there.

## Running

```
yarn e2e [--edge | --firefox] [--headed | --ui | --debug] [--no-build] [playwright test args]
```

| command               | what you get                                                                                      |
| :-------------------- | :------------------------------------------------------------------------------------------------ |
| `yarn e2e`            | Chrome, headless — same as CI                                                                     |
| `yarn e2e --edge`     | Edge, headless (same `dist/` build as Chrome)                                                     |
| `yarn e2e --firefox`  | Firefox, headless (`firefox-dist/` build)                                                         |
| `yarn e2e --headed`   | a real browser window, one worker at a time                                                       |
| `yarn e2e --ui`       | [Playwright UI mode](https://playwright.dev/docs/test-ui-mode): pick tests, watch, inspect traces |
| `yarn e2e --debug`    | [Playwright inspector](https://playwright.dev/docs/debug): step through a test                    |
| `yarn e2e --no-build` | skip the rebuild when the dist is already current                                                 |

Flags combine, and anything else is passed to `playwright test`:

```
yarn e2e --firefox --ui
yarn e2e --edge --headed style-host-path
yarn e2e --firefox --debug --no-build style-important-override
```

Failing tests attach a trace, which the HTML report (`playwright-report/`) opens with
"View trace".

## How the extension gets loaded

Each Playwright worker launches one browser and keeps it for every test it runs,
relaunching if it dies. Each test gets a fresh set of tabs and cleared extension storage,
so tests can run fully in parallel. Everything engine-specific sits behind a small
contract — launch the browser, load the build, evaluate with the extension's privileges,
fire a global shortcut — with one implementation per engine:

**Chrome / Edge** — a persistent Chromium context with
`--enable-unsafe-extension-debugging`, then CDP `Extensions.loadUnpacked` on `dist/`.
Extension-privileged code runs in the MV3 service worker, and the popup is opened as a
real page through CDP. A shortcut is fired through the dispatch Chrome's own event
bindings use.

**Firefox** — Playwright can't load extensions into Firefox, so it starts Firefox with
`--start-debugger-server` and talks Firefox's Remote Debugging Protocol (the same thing
`web-ext run` and about:debugging use): it installs `firefox-dist/` as a temporary add-on
and evaluates JS in the extension's background page through the DevTools console actor.
A shortcut is fired in the parent process's console, where Firefox's own key handler
fires it, so it goes to the focused tab like a real press.

**Upgrading from an earlier release** — the upgrade test, Chrome and Edge only, launches
its own browser. It downloads that release's published zip once into `e2e/.cache/`
(gitignored) and seeds storage under it. Then it copies the current build over the same
folder, with a newer version number, and loads that path again. Loading an enabled
extension's path a second time reloads it from disk as an update, keeping its id and
storage. `chrome.runtime.reload()` doesn't work here: it leaves a CDP-loaded extension
disabled.

### The popup on Firefox

Neither of Playwright's Firefox drivers can attach to `moz-extension://` documents — its
own build's Juggler skips them, and stock Firefox's BiDi excludes extension contexts
([bug 1755014](https://bugzilla.mozilla.org/show_bug.cgi?id=1755014)). So on Firefox the
popup is not a Playwright page: the extension opens it in a background tab and the tests
drive its DOM through the same DevTools console channel as the background page. That's
why tests get a small popup handle rather than a Playwright `Page` — the smaller surface is
what both engines can honour.

The same limit applies to every other extension page: navigating to an extension URL fails
on Firefox, and the page can't be attached to either. Specs that drive the options page or
the editor window directly check whether the engine can open extension pages, and skip on
Firefox.

The other thing Firefox can't do is let `context.route()` see requests the extension itself
makes from its background; specs that need that check the engine and skip otherwise.

## Writing a test

Import `test` and `expect` from the suite's fixtures, not `@playwright/test`. Each test
then gets:

- **the shared browser context**, whose tabs are closed after the test
- **the loaded extension**, which can evaluate a function with the extension's privileges
  (the service worker on Chromium, the background page on Firefox) — this is how tests read
  and write `chrome.storage`
- **a way to open the popup** in the background, so the page under test stays the current
  tab
- **the engine in use**, for the rare spec that must know what it can observe

The popup handle is deliberately small: CSS locators, a synthetic click (the popup closes
itself right after some clicks, which a real click's stability wait would race), and state
checks. The state checks don't auto-wait, so pair them with `expect.poll`.

Shared helpers cover serving local test pages, seeding styles and opening the editor. The
shared browser keeps connections alive, so close any test server after the suite.

## The CLI

The CLI spec drives the real `stylebot` command, as a child process, through the native
host to the extension and the page. It's the one spec with its own browser, launched for
the file and closed after it, on Chrome and Edge only.

It never touches your own setup. The CLI, the browser and the host the browser starts all
get a temporary `HOME`, and the browser's user data folder sits where that `HOME` says the
browser keeps it, so `stylebot install` registers the host there and nowhere else. The
whole folder is deleted after the run.

Two things a release build can't do on its own are set up from outside it, in the test:

- **The store id.** The host allows only Stylebot's store ids, so the spec loads a copy of
  the build with the store's public key, as `yarn build:preview` does.
- **The permissions.** Turning the setting on asks for two optional permissions, and
  headless Chrome can't show that prompt. Before the real build, the spec loads a copy
  that requires them; Chrome keeps them granted when the next version makes them optional,
  so the Options toggle's request then succeeds without a prompt. Nothing in the extension
  changes for this. As the grant doesn't survive turning the setting off, the spec turns it
  on once.
