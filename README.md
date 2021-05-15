# Stylebot

![CI](https://github.com/ankit/stylebot/workflows/CI/badge.svg)
[![Kofi](https://badgen.net/badge/icon/kofi?icon=kofi&label)](https://ko-fi.com/stylebot)
[![Chrome Webstore Version](https://img.shields.io/chrome-web-store/v/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Chrome Users](https://badgen.net/chrome-web-store/users/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Webstore Rating](https://img.shields.io/chrome-web-store/stars/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Follow on Twitter](https://badgen.net/twitter/follow/ahujaankit)](https://twitter.com/ahujaankit)
![License](https://img.shields.io/github/license/ankit/stylebot)

Stylebot is a browser extension that lets you change the appearance of the web instantly.
Available on [Chrome](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/stylebot-web/) and [Edge](https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai).

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
