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
extension storage, so tests can run fully in parallel. Everything engine-specific sits
behind the small `Engine` / `Extension` contract in `engine.ts` (launch the browser, load
the build, evaluate with the extension's privileges), with one directory per engine:

**`chromium/` (Chrome / Edge)** — `chromium.launchPersistentContext` with
`--enable-unsafe-extension-debugging`, then CDP `Extensions.loadUnpacked` on `dist/`.
Extension-privileged code runs in the MV3 service worker, and `fixtures.ts` opens the
popup as a real page via `Target.createTarget`.

**`firefox/`** — Playwright can't load extensions into Firefox, so it starts Firefox with
`--start-debugger-server` and talks Firefox's Remote Debugging Protocol (the same thing
`web-ext run` and about:debugging use; `rdp-client.ts`): it installs `firefox-dist/` as a
temporary add-on and evaluates JS in the extension's background page through the DevTools
console actor.

### The popup on Firefox

Neither of Playwright's Firefox drivers can attach to `moz-extension://` documents — its
own build's Juggler skips them, and stock Firefox's BiDi excludes extension contexts
([bug 1755014](https://bugzilla.mozilla.org/show_bug.cgi?id=1755014)). So on Firefox the
popup is not a Playwright page: `FirefoxEngine.openPopup` has the extension open it in a
background tab (`chrome.tabs.create`) and drives its DOM through the same DevTools console
channel as the background page. That's why tests get a `Popup` (below) rather than a
`Page` — the smaller surface is what both engines can honour.

The one thing Firefox can't do is let `context.route()` see requests the extension itself
makes from its background; a spec that needs that checks `engine.routesExtensionRequests`
and skips otherwise (`editor-webfont.spec.ts`).

## Fixtures

Import `test`/`expect` from `./fixtures`, not `@playwright/test`.

| fixture                    | use                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `context`                  | the shared `BrowserContext`; tabs opened during a test are closed after it                                                                                                     |
| `runInExtension(fn, arg?)` | run `fn` with the extension's privileges (service worker on Chromium, background page on Firefox) and get its JSON-serializable result — how tests read/write `chrome.storage` |
| `openPopup()`              | open the popup in the background (so the page under test stays the "current tab") and get a `Popup`                                                                            |
| `engine`                   | the `Engine` in use, for the rare spec that must know what it can observe                                                                                                      |
| `extensionId`              | the extension's id (its `moz-extension://` UUID on Firefox)                                                                                                                    |

### Driving the popup

`Popup` is deliberately small: `locator(selector, { hasText? })` (CSS selectors, chainable),
and on a locator `click()` (a synthetic click — the popup closes itself right after some
clicks, which a real click's stability wait would race), `isVisible()`, `isEnabled()`,
`isChecked()`; plus `evaluate(fn, arg?)` and `close()` on the popup. The state checks don't
auto-wait, so pair them with `expect.poll`:

```ts
const popup = await openPopup();
await popup.locator('button', { hasText: 'Style this page' }).click();

const toggle = popup.locator('label.switch', { hasText: 'Readability' });
await expect.poll(() => toggle.locator('input').isChecked()).toBe(true);
```

Helpers in `helpers.ts`: `startTestServer(routes)` for local pages (use `closeServer` in
`afterAll` — the shared browser keeps connections alive), `seedStyles(runInExtension, …)`,
`openEditor`, `switchEditorMode`, `getMonacoFrame`.
