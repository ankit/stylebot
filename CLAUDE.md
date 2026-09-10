# Stylebot

Browser extension (Chrome/Edge/Firefox) that lets users change the appearance of any website via a visual CSS editor. Vue 2 + TypeScript, built with webpack.

## Structure

- `src/` — extension source (background, content scripts, popup, options UI, editor)
- `src/_locales/` — i18n strings per locale
- `e2e/` — Playwright end-to-end tests, driven against a real built extension via CDP (`Extensions.loadUnpacked`)
- `__mocks__/` — Jest mocks
- `dist/` — Chrome/Edge build output; `firefox-dist/` — Firefox build output
- `docs/` — stylebot.dev static site
- `patches/` — patch-package patches applied to dependencies on install

## Commands

- `yarn watch` — build for Chrome/Edge in watch mode
- `yarn watch:firefox` — build for Firefox in watch mode
- `yarn dev:chrome` — watch + launch a Chrome instance with the extension loaded
- `yarn lint` / `yarn lint:fix` — ESLint
- `yarn typecheck` — `tsc --noEmit`
- `yarn test` — Jest unit tests
- `yarn test:e2e` — builds the extension then runs the Playwright e2e suite (headless by default; loads the unpacked extension into Chrome via CDP)

## Validation

Always validate UI/extension changes with headless Playwright, not manual/headed browser interaction — the e2e harness in `e2e/fixtures.ts` already loads the real unpacked extension via CDP. Run `yarn test:e2e` (or a targeted Playwright test) to confirm a change works end-to-end before calling it done.

## Comments

Avoid comments by default. Only add one to state something non-obvious — a hidden constraint, a workaround, a reason that isn't clear from the code itself. Never add comments in CSS. When a comment is warranted, keep it to 1-2 lines max, and use `/* */` for multiline comments.
