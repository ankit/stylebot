# Releases

Releases go through a pull request from a `release/vX.Y.Z` branch — the `release/` prefix is what triggers the Edge e2e suite, which doesn't run on ordinary PRs.

Pull requests target `main`, and the release workflow only runs on pull requests into it.

- Branch off `main` as `release/vX.Y.Z`
- Add entry to `CHANGELOG`
- Update version in `package.json` and `src/assets/manifest/manifest.json`
- A unit test fails if a release manifest's required permissions, hosts or content script matches change, since a new install warning disables Stylebot for existing users until they re-approve it. Before publishing, also check the update with Chrome's [Extension Update Testing Tool](https://github.com/GoogleChromeLabs/extension-update-testing-tool)
- Open the PR and wait for `build`, `validation`, `storybook`, `e2e`, `e2e (edge)` and `e2e (firefox)` to pass
- Squash-merge — the GitHub Release and its `vX.Y.Z` tag are then created automatically from the changelog entry
- Build for the stores from that tag: `git fetch origin --tags && git checkout vX.Y.Z`. Packaging and uploading refuse to run anywhere else, and every production build starts from an empty output folder
- Set `STYLEBOT_GOOGLE_CLIENT_SECRET` to the Desktop OAuth client's secret before building for any store — Drive sign-in needs it, and a production build outside CI fails without it
- Chrome and Edge: Run `yarn build` and manually create zip for distribution from `dist/`
- Firefox: Run `yarn package:firefox` from a clean working tree. It stops if a JavaScript file is too large for AMO's linter to parse, and otherwise builds the extension and writes the extension zip and the source zip AMO asks for, with build steps for reviewers, to `release/`
- To upload instead of zipping by hand, run each store's command from a clean working tree. Each builds what it uploads and publishes nothing; Chrome and Edge share one zip per commit in `release/`, so the second reuses the first's
  - `yarn upload:chrome` uploads a draft of the next version to the Chrome Web Store; publish it from the Developer Dashboard. Needs `CHROME_WEB_STORE_PUBLISHER_ID` (Publisher > Settings in the dashboard), and the OAuth client and refresh token of the account that owns the item, with the `chromewebstore` scope, as `CHROME_WEB_STORE_CLIENT_ID`, `CHROME_WEB_STORE_CLIENT_SECRET` and `CHROME_WEB_STORE_REFRESH_TOKEN`
  - `yarn upload:edge` replaces the package in the Edge Add-ons draft submission; publish it from Partner Center. Needs `EDGE_ADDONS_PRODUCT_ID`, `EDGE_ADDONS_CLIENT_ID` and `EDGE_ADDONS_API_KEY`, from Partner Center's Publish API page
  - `yarn upload:firefox` only validates the upload, since AMO has no drafts. `--submit` creates the version from it instead, with the source zip and the changelog's notes, which submits it for review. Needs `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`, from AMO's API keys page
- Safari (Mac App Store, macOS 15 and later):
  - Run `yarn upload:safari`, with `STYLEBOT_GOOGLE_CLIENT_SECRET` set. It builds the extension, archives the app and uploads it to App Store Connect, signing with the Apple account signed in to Xcode, or with an App Store Connect API key when `APP_STORE_CONNECT_KEY_PATH`, `APP_STORE_CONNECT_KEY_ID` and `APP_STORE_CONNECT_ISSUER_ID` are set
  - The app and extension take their version from the manifest and a build number from the build's time, so there's nothing to bump in Xcode, and a rebuilt upload of the same version is accepted as a new build
  - For the listing, `yarn store:safari-text` writes each language's name, subtitle, keywords and description, from the store copy in the locale files, into `store/safari/listing/`. Then `yarn upload:safari-listing`, with the API key set, fills in the version being prepared in App Store Connect: its version number, each language's listing, the screenshots in `store/safari/` and the newest processed build of that version. App Privacy, the age rating, pricing and the review notes are set in App Store Connect itself
  - In App Store Connect, try the build through TestFlight, then submit the version for review. Before installing it, quit Safari and run `yarn clean:safari`, which unregisters every other Stylebot.app so Safari loads only the TestFlight one

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
