# Releases

Releases go through a pull request from a `release/vX.Y.Z` branch — the `release/` prefix is what triggers the Edge e2e suite, which doesn't run on ordinary PRs.

Day-to-day pull requests target `v4`. 3.x releases ship from `main`, and the release workflow only runs on pull requests into it.

- Branch off `main` as `release/vX.Y.Z`
- Add entry to `CHANGELOG`
- Update version in `package.json` and `src/assets/manifest/manifest.json`
- Open the PR and wait for `build`, `validation`, `storybook`, `e2e`, `e2e (edge)` and `e2e (firefox)` to pass
- Squash-merge — the GitHub Release and its `vX.Y.Z` tag are then created automatically from the changelog entry
- Chrome and Edge: Run `yarn build` and manually create zip for distribution from `dist/`
- Firefox: Run `yarn build:firefox` and manually create zip for distribution from `firefox-dist/`
- Safari (Mac App Store, macOS 15 and later):
  - Run `yarn build:safari` with `STYLEBOT_GOOGLE_CLIENT_SECRET` set to the Desktop OAuth client's secret — the build fails without it, since Drive sign-in needs it
  - Open `safari/Stylebot/Stylebot.xcodeproj` and choose Product → Archive. The app and extension take their version and build number from the manifest, so there's nothing to bump in Xcode — but App Store Connect rejects a second upload of the same version, so a rebuilt upload needs a new version
  - In the Organizer, choose Distribute App → App Store Connect, which signs with the team set in the project and uploads the build
  - In App Store Connect, try the build through TestFlight, then add it to the new version and submit it for review
