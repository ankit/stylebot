# Stylebot

![CI](https://github.com/ankit/stylebot/workflows/CI/badge.svg)
[![Kofi](https://badgen.net/badge/icon/kofi?icon=kofi&label)](https://ko-fi.com/stylebot)
[![Chrome Webstore Version](https://img.shields.io/chrome-web-store/v/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Chrome Users](https://badgen.net/chrome-web-store/users/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Webstore Rating](https://img.shields.io/chrome-web-store/stars/oiaejidbmkiecgbjeifoejpgmdaleoha)](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha)
[![Follow Stylebot](https://badgen.net/twitter/follow/stylebot)](https://twitter.com/stylebot)
![License](https://img.shields.io/github/license/ankit/stylebot)

Stylebot is a browser extension that lets you change the appearance of the web instantly. Currently only available on [Chrome Web Store](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha).

- Easy to use: Pick and style elements using UI actions
- Simple & Quick: Changes are saved instantly
- Code editor - Write your own CSS 
- Readability Mode - Make articles on any site readable by hiding non-essential page elements like sidebars, footers and ads. 
- Grayscale Mode - Turn on grayscale to reduce strain from websites

## How to contribute

### Donate

[Buy me a coffee](https://ko-fi.com/stylebot) via Ko-fi

### Localize the extension

Please help add support for your language via the following steps

- Fork the repository and copy [`src/_locales/en.config`](src/_locales/en.config) to `src/_locales/[locale].config` where locale is one of the [supported locales](https://developer.chrome.com/webstore/i18n#localeTable).
- Update strings in `src/_locales/[locale].config` to your language
- Create a pull request


### Add new features or fix bugs

If you would like to <strong>add a new feature</strong> to Stylebot or <strong>fix a bug</strong>, <strong>submit an issue</strong> in GitHub (if there is no existing one), discuss it, and wait for <strong>approval</strong>.

#### Chrome

- Run `yarn` to install dependencies
- Run `yarn watch` to build locally
- Open the chrome://extensions page.
- Disable the official Stylebot version.
- Enable the Developer mode.
- Click Load unpacked extension button
- Navigate to the project's `dist/` folder

## License

Stylebot is MIT licensed.
