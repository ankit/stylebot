# Releases

Releases go through a pull request from a `release/vX.Y.Z` branch — the `release/` prefix is what triggers the Edge e2e suite, which doesn't run on ordinary PRs.

Day-to-day pull requests target `v4`. 3.x releases ship from `main`, and the release workflow only runs on pull requests into it.

- Branch off `main` as `release/vX.Y.Z`
- Add entry to `CHANGELOG`
- Update version in `package.json` and `src/assets/manifest/manifest.json`
- A unit test fails if a release manifest's required permissions, hosts or content script matches change, since a new install warning disables Stylebot for existing users until they re-approve it. Before publishing, also check the update with Chrome's [Extension Update Testing Tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
- Open the PR and wait for `build`, `validation`, `storybook`, `e2e`, `e2e (edge)` and `e2e (firefox)` to pass
- Squash-merge — the GitHub Release and its `vX.Y.Z` tag are then created automatically from the changelog entry
- Chrome and Edge: Run `yarn build` and manually create zip for distribution from `dist/`
- Firefox: Run `yarn package:firefox` from a clean working tree. It builds the extension and writes the extension zip and the source zip AMO asks for, with build steps for reviewers, to `release/`
- Safari (Mac App Store, macOS 15 and later):
  - Run `yarn upload:safari` with `STYLEBOT_GOOGLE_CLIENT_SECRET` set to the Desktop OAuth client's secret — Drive sign-in needs it. It builds the extension, archives the app and uploads it to App Store Connect, signing with the Apple account signed in to Xcode, or with an App Store Connect API key when `APP_STORE_CONNECT_KEY_PATH`, `APP_STORE_CONNECT_KEY_ID` and `APP_STORE_CONNECT_ISSUER_ID` are set
  - The app and extension take their version from the manifest and a build number from the build's time, so there's nothing to bump in Xcode, and a rebuilt upload of the same version is accepted as a new build
  - In App Store Connect, try the build through TestFlight, then add it to the new version and submit it for review

## CLI

The CLI is published to npm as `@stylebot/cli`, from `tools/cli`, with its own version. Publish its first version at the same time as the v4 store release, once that's live in the Chrome Web Store and Edge Add-ons: earlier versions of the extension can't talk to it.

- Bump `version` in `tools/cli/package.json`: patch for fixes, minor for new commands or flags, major for a change that breaks scripts using it. The host in `~/.stylebot/` is copied again whenever the version changes, so bump it for any release that changes the host
- Bump the protocol, in the CLI and the extension together, only when a command's arguments or result change incompatibly; `docs/cli.md` describes when. A protocol bump means the CLI and the extension release at the same time
- Check what ships with `npm pack --dry-run` in `tools/cli`
- Publish from `tools/cli`, signed in to npm as a member of the `stylebot` org, entering the 2FA code when asked:

```bash
npm publish --access public
```

npm's trusted publishing from GitHub Actions could replace this manual step later.
