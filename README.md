# Stylebot

![CI](https://github.com/ankit/stylebot/workflows/CI/badge.svg)

This extension lets you change the appearance of the web instantly. Currently only available on Google Chrome.
Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha) to install.

- Pick and style elements on any site using UI actions.
- Save custom CSS for sites which is automatically applied on page load.
- Code your own custom css to style pages.
- Make articles on any site readable by hiding non-essential page elements like sidebars, footers and ads.

## How to contribute

### Donate

[Buy me a coffee](https://ko-fi.com/stylebot) via Ko-fi

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

## Supported URL Patterns

By default, Stylebot uses simple text strings to match styles to websites. Examples:

- `docs.google.com` - Matches any URL with `docs.google.com` in it.
- `docs.google.com, spreadsheets.google.com` - Matches any URL with `docs.google.com` or `spreadsheets.google.com` in it.

### Wildcard support

Stylebot supports wildcards `**`, `*` and `,`

- `**` matches any character sequence. Example:

  - `docs**` - Any URL beginning with `docs`

- `*` matches any character sequence, until a `/` is found

  - `docs_.google.com` - This will match `http://docs.google.com`, `http://docs1.google.com`, `http://docs2.google.com` and so on

  - `\*.ycombinator.com` - This will match `http://news.ycombinator.com` and `http://apps.ycombinator.com`

- `,` separates a list of advanced patterns. Matches a URL if any sub-pattern matches it.

### RegEx support

Stylebot treats a string as a regex if it start it with `^`.

- `^http://www.reddit.com/$` - This matches only the Reddit homepage.

## License

Stylebot is MIT licensed.
