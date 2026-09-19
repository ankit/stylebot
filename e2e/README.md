# e2e

Playwright tests that drive the real, built extension in a real browser. Chrome is the
default and what runs on every PR; Edge and Firefox run on release PRs.

## Running

```
yarn e2e [--edge | --firefox] [--headed | --ui | --debug] [--no-build] [playwright test args]
```

| command               | what you get                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------- |
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

`fixtures.ts` launches one browser per Playwright worker and keeps it for every test that
worker runs (relaunching if it dies). Each test gets a fresh set of tabs and cleared
extension storage, so tests can run fully in parallel.

**Chrome / Edge** — `chromium.launchPersistentContext` with `--enable-unsafe-extension-debugging`,
then CDP `Extensions.loadUnpacked` on `dist/`. The popup is opened as a real page via
`Target.createTarget`, and extension-privileged code runs in the MV3 service worker.

**Firefox** — Playwright can't load extensions into Firefox, so the harness starts Firefox
with `--start-debugger-server` and talks Firefox's Remote Debugging Protocol (the same
thing `web-ext run` and about:debugging use) through `firefox-rdp.ts`: it installs
`firefox-dist/` as a temporary add-on and evaluates JS in the extension's background page
through the DevTools console actor.

### What doesn't run on Firefox, and why

Neither of Playwright's Firefox drivers can attach to `moz-extension://` documents — its
own build's Juggler skips them, and stock Firefox's BiDi excludes extension contexts
([bug 1755014](https://bugzilla.mozilla.org/show_bug.cgi?id=1755014)). So the popup can't
be driven as a page there. Any test that uses the `openPopup` fixture is skipped on
Firefox by the fixture itself; the storage-seeded content-script specs (`style-*.spec.ts`)
run on all three browsers.

If a new test can be written as "seed styles into storage, load a page, assert on the
DOM", it gets Firefox coverage for free. If it needs the popup, just use `openPopup` —
nothing else to declare.

## Fixtures

Import `test`/`expect` from `./fixtures`, not `@playwright/test`.

| fixture                    | use                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `context`                  | the shared `BrowserContext`; tabs opened during a test are closed after it                                                                                                     |
| `runInExtension(fn, arg?)` | run `fn` with the extension's privileges (service worker on Chromium, background page on Firefox) and get its JSON-serializable result — how tests read/write `chrome.storage` |
| `openPopup()`              | open the popup as a page, in the background so the page under test stays the "current tab"; skips the test on Firefox                                                          |
| `extensionId`              | the extension's id (its `moz-extension://` UUID on Firefox)                                                                                                                    |

Helpers in `helpers.ts`: `startTestServer(routes)` for local pages (use `closeServer` in
`afterAll` — the shared browser keeps connections alive), `seedStyles(runInExtension, …)`,
`openEditor`, `switchEditorMode`, `getMonacoFrame`.
