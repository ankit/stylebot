---
name: validate-stylebot
description: Launch Stylebot in a real, headed Chrome window (via `yarn dev:chrome`) so the user can manually eyeball a change — in whatever checkout the current session is in, worktree or main. Use when the user wants to "try this out", "see it in the browser", "manually test/validate", "load the extension so I can look at it", or "smoke test this change" themselves, as opposed to running the automated e2e suite.
---

# Validate Stylebot manually

Stylebot's CLAUDE.md defaults to Playwright e2e for verifying changes — use that
(`yarn test:e2e`) when the goal is confirming correctness. Reach for this skill instead
when the **user** wants to look at the extension with their own eyes: visual/UI tweaks,
"does this feel right" judgment calls, or anything the e2e suite doesn't cover.

## What `yarn dev:chrome` already does

`scripts/launch-chrome.mjs` is worktree-aware out of the box — don't reinvent this:

- Runs `yarn watch` and launches Chrome via CDP (`Extensions.loadUnpacked`) against
  the current checkout's `dist/`.
- Uses a Chrome profile at `<checkout>/.chrome-dev-profile` — scoped to whichever
  worktree (or main) you run it from, so parallel sessions in different worktrees each
  get their own isolated browser instance with no port/profile collisions.
- Stamps a corner badge on every page with `basename(rootDir)` (e.g. `🌲
  fix-toggle-hitbox`), so if the user has several of these windows open they can tell
  them apart at a glance, including in the Cmd+Tab thumbnail.
- Hot-reloads the extension in place on every rebuild — no need to relaunch after edits.
- Opens to Hacker News as a default test page; the user can navigate wherever they want
  to check the change.

## How to run

1. Confirm you're at the repo root of the **current session's checkout** (worktree or
   main — do not `cd` elsewhere; the whole point is testing what's checked out here).
2. If `node_modules` is missing, run `yarn install` first (fresh worktrees don't always
   have it — check before assuming `yarn dev:chrome` will just work).
3. Launch it **in the background** — it blocks until the browser window closes:
   ```
   yarn dev:chrome
   ```
   Use `run_in_background: true`. Do not use `yarn dev:chrome:headless` here — headless
   defeats the purpose of *manual* validation.
4. Watch the output for `🎉 Stylebot loaded on Hacker News` to confirm it launched
   rather than assuming success. If it fails to launch, the most likely cause is a
   `dev:chrome` already running in this same checkout (the profile dir is locked) —
   check for a stray background task before retrying.
5. Tell the user it's up, which worktree/badge to look for, and that edits will
   hot-reload automatically. Let them drive from there — don't attempt to interact with
   this window via browser automation tools, since the point is the human looking at it.

## Stopping

The background task ends when the user closes the Chrome window. If they're done
before that, stop the background task directly rather than leaving it running.
