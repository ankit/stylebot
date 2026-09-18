---
name: release
description: Cut a Stylebot release — CHANGELOG entry, version bump, release PR, tag, and store zips. Use when the user wants to "release", "cut a release", "ship version X.Y.Z", "bump the version", or prepare builds for the Chrome Web Store, Edge Add-ons, or AMO.
---

# Cut a Stylebot release

Releases go through a **pull request**, not a direct push to `main`. The PR is what
gates the release on CI — in particular the Edge e2e suite, which only runs on release
PRs (`.github/workflows/e2e-edge.yml`).

## 1. Branch

Branch off the latest `main`:

```
git fetch origin main && git checkout -b release/vX.Y.Z origin/main
```

The `release/` prefix is **not** cosmetic — `.github/workflows/e2e-edge.yml` gates on
`startsWith(github.head_ref, 'release/')`. Any other branch name silently skips the Edge
run, which is the whole point of the release PR.

## 2. Changelog

Prepend a new section to `CHANGELOG.md` (newest first):

```markdown
## Version X.Y.Z (Month Year)

- Short description of the change (#PR)
```

Write entries from the user's perspective — what changed for someone using the
extension, not what changed in the code. Every bullet ends with its `(#PR)` reference.
`git log --oneline <last-release-tag>..HEAD` gives you the raw material; PR numbers are
the `(#NNN)` suffixes that squash merges leave in commit subjects.

## 3. Version bump

Update `version` in both:

- `package.json`
- `src/extension/manifest.json`

`src/extension/manifest-firefox.json` has **no** `version` field — it only overrides
`background` and `browser_specific_settings`, and webpack shallow-merges it over the base
manifest. Leave it alone.

## 4. Commit and open the PR

```
git commit -am "Release X.Y.Z"
git push -u origin release/vX.Y.Z
```

`Release X.Y.Z` is a deliberate exception to the Conventional Commits rule in CLAUDE.md,
matching every previous release commit. Don't write `chore(release): ...`.

Open the PR against `main`. Do not create a GitHub Release yet — the tag comes after
merge.

## 5. Wait for CI

Four checks must pass before merging:

| Check | Covers |
| --- | --- |
| `build` | `yarn build` |
| `validation` | lint, typecheck, unit tests, locale validation |
| `e2e` | Playwright suite on Chrome |
| `e2e (edge)` | Playwright suite on Edge — **release PRs only** |

If `e2e (edge)` shows as *skipped*, the branch name is wrong: it must start with
`release/`. A skipped run is not a passed run.

## 6. Merge and tag

Squash-merge the PR, then create the GitHub Release against the resulting commit on
`main` with tag `vX.Y.Z` (matching the existing `v3.2.0`–`v3.2.4` tags). Use the
changelog section as the release body.

## 7. Build the store packages

```
yarn build          # -> dist/        Chrome Web Store + Edge Add-ons
yarn build:firefox  # -> firefox-dist/  AMO
```

Zip each output directory and upload by hand. There is no automated packaging or store
upload — this step is manual.

## Optional follow-up

Minor releases (X.Y.0) usually get a marketing page under
`docs/src/pages/releases/X.Y.js`. Patch releases don't.
