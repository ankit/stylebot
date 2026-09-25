# Releases

Releases go through a pull request from a `release/vX.Y.Z` branch — the `release/` prefix is what triggers the Edge e2e suite, which doesn't run on ordinary PRs.

Day-to-day pull requests target `v4`. 3.x releases ship from `main`, and the release workflow only runs on pull requests into it.

- Branch off `main` as `release/vX.Y.Z`
- Add entry to `CHANGELOG`
- Update version in `package.json` and `src/extension/manifest.json`
- Open the PR and wait for `build`, `validation`, `storybook`, `e2e`, `e2e (edge)` and `e2e (firefox)` to pass
- Squash-merge — the GitHub Release and its `vX.Y.Z` tag are then created automatically from the changelog entry
- Chrome and Edge: Run `yarn build` and manually create zip for distribution from `dist/`
- Firefox: Run `yarn build:firefox` and manually create zip for distribution from `firefox-dist/`
