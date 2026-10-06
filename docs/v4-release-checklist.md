# v4 release checklist

Tracking the 4.0.0 release. The general release steps are in [releases.md](releases.md); this list covers what's specific to v4.

## Before cutting the release

- [ ] Merge `main` into `v4` so the 3.2.x fixes are carried over, and resolve conflicts
- [ ] Confirm the new permissions (`alarms`, `idle`, `sidePanel`) don't trigger a permission warning that disables the extension for existing users on update
- [ ] Check the upgrade path from 3.2.4: styles, settings, and Google Drive sync data carry over
- [ ] `yarn validate-locales` passes, and new v4 strings are translated in every locale
- [ ] Privacy policy covers the agent (API keys, chat conversations, model providers)
- [ ] Review `site/src/pages/releases/4.0.astro` against what ships

## Marketing and store listings

- [ ] Record video for the Chrome Web Store
- [ ] Record a dedicated Chat video for the website?
- [ ] Update demo and screenshots to match UI updates (`store/`, `site/src/assets/manual/`)
- [ ] Update store listing descriptions for Chrome, Edge, and AMO
- [ ] Add locales to the website

## Release

- [ ] Merge `v4` into `main`
- [ ] Branch `release/v4.0.0` from `main` and open the PR
- [ ] Add the 4.0.0 entry to `CHANGELOG.md`
- [ ] Bump the version to 4.0.0 in `package.json` and `src/assets/manifest/manifest.json`
- [ ] CI is green: `build`, `validation`, `storybook`, `e2e`, `e2e (edge)`, `e2e (firefox)`
- [ ] Squash-merge, then confirm the release workflow created the `v4.0.0` tag and GitHub Release
- [ ] Chrome Web Store: upload the `dist/` zip
- [ ] Edge Add-ons: upload the `dist/` zip
- [ ] AMO: upload the `firefox-dist/` zip
- [ ] Deploy the website with the 4.0 release page

## After release

- [ ] Point day-to-day PRs back at `main` and retire the `v4` branch
- [ ] Watch store reviews and GitHub issues for regressions
- [ ] Release Safari (fast follow)
