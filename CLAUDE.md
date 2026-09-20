# Stylebot

Browser extension (Chrome/Edge/Firefox) that lets users change the appearance of any website via a visual CSS editor. Vue 2 + TypeScript, built with webpack.

## Structure

- `src/` — extension source (background, content scripts, popup, options UI, editor)
- `src/_locales/` — i18n strings per locale
- `e2e/` — Playwright end-to-end tests, driven against a real built extension: via CDP (`Extensions.loadUnpacked`) on Chrome/Edge, via Firefox's remote debugging protocol on Firefox; engine-specific code lives in `e2e/chromium/` and `e2e/firefox/` behind the `e2e/engine.ts` contract
- `__mocks__/` — Jest mocks
- `dist/` — Chrome/Edge build output; `firefox-dist/` — Firefox build output
- `docs/` — stylebot.dev static site
- `patches/` — patch-package patches applied to dependencies on install

## Workflow

Always make changes in a new worktree, never directly on `main` or the checkout the
session started in. Use the `EnterWorktree` tool before starting any edits, unless the
session is already inside a worktree.

## Commands

- `yarn watch` — build for Chrome/Edge in watch mode
- `yarn watch:firefox` — build for Firefox in watch mode
- `yarn dev:chrome` — watch + launch a Chrome instance with the extension loaded
- `yarn lint` / `yarn lint:fix` — ESLint
- `yarn typecheck` — `tsc --noEmit` for the extension, then again with `.storybook/tsconfig.json` for Storybook config and stories
- `yarn test` — Jest unit tests
- `yarn e2e` — builds the extension then runs the Playwright e2e suite headless on Chrome, as CI does. `--edge` / `--firefox` switch browser, `--headed` / `--ui` / `--debug` switch mode, `--no-build` skips the rebuild; see `e2e/README.md`.
- `yarn test:storybook` — builds Storybook and runs every story headless with `@storybook/test-runner`, asserting the `play` functions. `--no-build` reuses `storybook-static`; `--dev --watch <path>` runs against a `yarn storybook` already on :6006.
- `yarn storybook` — Storybook 7.6 (last line with Vue 2 support) for the shared primitives and popup/options/editor composites, with a light/dark toolbar

## Validation

Always validate UI/extension changes headless, not with manual/headed browser interaction. Behaviour that lives inside a Vue surface (the editor panel, popup, options page) is tested as Storybook interaction tests: `*.interactions.stories.ts` beside the component, with `play` functions using `@storybook/test` (`within`, `userEvent`, `expect`, `waitFor`) and the helpers in `.storybook/story-helpers.ts`; run `yarn test:storybook`. Only what needs the real extension — popup/background/content-script messaging, storage persistence across reloads, CSS injected into a real page, web-font fetches, Firefox/Edge — goes in the Playwright e2e suite (`e2e/fixtures.ts` loads the real unpacked extension via CDP); run `yarn e2e` (or a targeted spec, e.g. `yarn e2e --no-build editor-open`). Confirm a change works with the relevant suite before calling it done.

Stories live beside their component as `*.stories.ts`; give new shared primitives a story. Visual stories only set up the state they show (a `play` may open a menu and wait for it, nothing more); interaction tests go in a separate `*.interactions.stories.ts` file titled `Tests/<Surface>/<Feature>` with `tags: ['test']`, so they sit in their own sidebar root.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format: `<type>[optional scope]: <description>` (e.g. `fix: correct Firefox extension launch`, `feat(editor): add JS snippet execution`). Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.

## Comments

Avoid comments by default. Only add one to state something non-obvious — a hidden constraint, a workaround, a reason that isn't clear from the code itself. Never add comments in CSS. When a comment is warranted, keep it to 1-2 lines max, and use `/* */` for multiline comments.

Comments on functions and methods use JSDoc style, always in this shape:

```ts
/**
 * What the function does, in plain prose.
 * A second line if the first doesn't fit.
 */
```

`/**` and `*/` each go on their own line — never `/** text */` on one line. Up to 4 lines of prose is fine. Never use `@` tags (`@param`, `@returns`, `@throws`, etc.); the TypeScript signature already documents those.

## i18n

Never hardcode user-facing strings — always add an i18n key in `src/_locales/*.config` (all 15 locales) and reference it via `t('key')`. This applies to every string a user sees: labels, placeholders, titles, aria-labels, error messages.

Keep each key matching its English string (e.g. `@box` → `Box`, not a stale `@layout_properties` → `Box`). When a string's copy changes, rename the key to match in the same change, across all 15 locale files. If two keys end up with the identical string in every locale, collapse them into one key instead of keeping duplicates.
