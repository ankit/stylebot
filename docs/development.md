# Development

Stylebot is built with Vue 2, TypeScript and webpack.

## Setup

- Use the Node version in [`.nvmrc`](../.nvmrc) (e.g. `nvm use`)
- Run `yarn install`

## Project layout

- `src/` — extension source (background, content scripts, popup, options page, editor)
- `src/_locales/` — translations
- `e2e/` — Playwright end-to-end tests
- `site/` — the [stylebot.dev](https://stylebot.dev) site
- `docs/` — developer docs ([index](README.md))
- `patches/` — patches to dependencies

## Run a development build

Each command builds in watch mode and opens a fresh browser profile with the extension loaded:

- `yarn dev:chrome`
- `yarn dev:edge`
- `yarn dev:firefox`

## Lint and typecheck

- `yarn lint` (or `yarn lint:fix`)
- `yarn typecheck`

## Storybook

Run `yarn storybook` to browse the popup, options page, editor and shared components on port 6006, with a light/dark toggle in the toolbar.

## Tests

- Run `yarn test` for unit tests
- Run `yarn test:storybook` for the Storybook interaction tests (every story rendered headless, play functions asserted); `yarn test:storybook --dev --watch` against a running `yarn storybook` while writing them
- Run `yarn e2e` for the Playwright end-to-end suite (headless Chrome, as in CI); `yarn e2e --firefox --ui` and friends for other browsers and modes — see [`docs/e2e.md`](e2e.md)

## Google Drive Sync

How sync works, and how to use it from a local build or a fork, is described in [`docs/sync.md`](sync.md).

## Patches

Patches to dependencies are located under `/patches` and are automatically applied on running `yarn` using [patch-package](https://github.com/ds300/patch-package).

- `vue-draggable-resizable+2.3.0.patch` — removes a `Function("return this")()` call that the extension's Content Security Policy blocks.
