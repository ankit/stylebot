# Stylebot

![CI](https://github.com/ankit/stylebot/workflows/CI/badge.svg)
[![Kofi](https://badgen.net/badge/icon/kofi?icon=kofi&label)](https://ko-fi.com/stylebot)
[![Chrome Webstore Version](https://img.shields.io/chrome-web-store/v/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Chrome Users](https://badgen.net/chrome-web-store/users/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Webstore Rating](https://img.shields.io/chrome-web-store/stars/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Follow on Twitter](https://badgen.net/twitter/follow/ahujaankit)](https://twitter.com/ahujaankit)
![License](https://img.shields.io/github/license/ankit/stylebot)

Stylebot is a browser extension that lets you change the appearance of the web instantly.

Available on [Chrome](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha), [Firefox](https://addons.mozilla.org/firefox/addon/stylebot-web/) and [Edge](https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai).

- Easy to use: Pick and style elements using UI actions
- Simple & Quick: Changes are saved instantly
- Code editor - Write your own CSS
- Readability Mode - Make articles on any site readable by hiding non-essential page elements like sidebars, footers and ads.
- Grayscale Mode - Turn on grayscale to reduce strain from websites

## How to contribute

### Donate

[Buy me a coffee](https://ko-fi.com/stylebot) via Ko-fi

### Translate

Add support for a locale via the following steps

- See [supported locales](https://developer.chrome.com/webstore/i18n#localeTable)
- If `src/_locales/[locale].config` already exists, please help improve translations
- If not, copy [`src/_locales/en.config`](src/_locales/en.config) to `src/_locales/[locale].config`
- Update strings in `src/_locales/[locale].config` to match the locale

### Add new features or fix bugs

If you would like to <strong>add a new feature</strong> to Stylebot or <strong>fix a bug</strong>, <strong>submit an issue</strong> in GitHub (if there is no existing one), discuss it, and wait for <strong>approval</strong>.

## Development

### Firefox

- Run `yarn watch:firefox` to build locally
- Run `yarn start:firefox` to launch Firefox with development build

### Chrome/Edge

- Run `yarn watch` to build locally
- Open `chrome://extensions` page.
- Disable the official Stylebot version.
- Enable the Developer mode.
- Click Load unpacked extension button
- Navigate to the project's `dist/` folder

### Google Drive Sync

When running the extension from a local build, you will not be able to use the Google Drive Sync feature as the OAuth authenticator will not recognize your extension id.

If you want to use the Google Drive Sync feature locally, and/or for your own forked version of the extension, you must create a Google Cloud project and associated OAuth consent screen associated with the extension.

You can do so as follows:

1. Obtain your extension redirect URL. This is returned by the `chrome.identity.getRedirectURL()` function. This is already printed as a debug console message: if you load your extension into Chrome, click to "Inspect views background page", ensure that the All Levels of messages are shown (particularly Verbose), and then click the Sync button on the extension, the extension redirectURL will be printed onto the console for you to copy. Save this redirectURL, as you will need it below.
2. Create a Google Cloud project. You can do this through the [Google Cloud console](https://cloud.google.com/cloud-console). The name of the project does not matter, but remember it for your own reference. Select the project after it has been created.
3. Search for "Google Drive API" in the console, and click "Enable".
4. Select "OAuth consent screen" in the left-pane menu, and choose Internal (if for local development or sharing within an organization), or External (if you intend to publish as your own Chrome Extension). You can leave all optional fields on first page blank. On the second page, add the following scope: `https://www.googleapis.com/auth/drive.file`
5. When completed, select "Credentials" on the left-pane menu. Click "CREATE CREDENTIALS", and select "OAuth client ID". Under "Application type", select "Web application". Provide any name, and under "Authorized redirect URIs" add the redirectURL that you copied in step #1.
6. You will see "Your Client ID" once you have finished creating the credential. Copy the client ID, and use it to replace the value of `CLIENT_ID` in the `get-access-token.ts` file of this repository.

That's it! Now you are ready to use the Google Drive Sync feature with your local extension.

### Release

- Add entry to `CHANGELOG`
- Update version in `package.json` and `src/extension/manifest.json`
- Chrome and Edge: Run `yarn build` and manually create zip for distribution from `dist/`
- Firefox: Run `yarn build:firefox` and manually create zip for distribution from `firefox-dist/`

### Patches

Patches to dependencies are located under `/patches` and are automatically applied on running `yarn` using [patch-package](https://github.com/ds300/patch-package).

- `bootstrap-vue+2.21.1.patch` - Patch to work around a [requestAnimationFrame issue](https://github.com/facebook/react/issues/16606) in Firefox extensions.

## License

Stylebot is MIT licensed.
