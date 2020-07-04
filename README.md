_I am currently working on a major release with improved maintainability, lots of bugfixes and exciting new UI and features. In the meanwhile, I will likely be slow to respond to bugs / feature requests. Thanks for your patience._

## Stylebot

A Google Chrome extension that lets you personalize a web page’s appearance using WYSIWYG editor

- Incrementally build custom stylesheets for Chrome.
- Save custom CSS rules for sites. The next time they visit a site, their custom CSS is already applied.
- Share, explore and apply CSS created by other users (_currently down_)

## Pattern matching

### Basic (default)

By default, Stylebot uses simple text strings to match styles to websites. Examples:

- `docs.google.com`: Matches any URL with `docs.google.com` in it.
- `docs.google.com, spreadsheets.google.com`: Matches any URL with `docs.google.com` or `spreadsheets.google.com` in it.

### Advanced

Stylebot supports wildcards `**`, `*` and `,`

- `**` matches any character sequence. Example: `docs**`: Any URL beginning with `docs`
- `*` matches any character sequence, until a `/` is found

  - `docs_.google.com`: This will match `http://docs.google.com`, `http://docs1.google.com`, `http://docs2.google.com` and so on
  - `\*.ycombinator.com`: This will match `http://news.ycombinator.com` and `http://apps.ycombinator.com`

- `,` separates a list of advanced patterns. Matches a URL if any sub-pattern matches it.

### Regular Expressions

Stylebot treats a string as a regex if it start it with `^`. Examples:

- `^http://www.reddit.com/$`: This matches only the Reddit homepage.

## Resources

- Chrome Webstore: <https://chrome.google.com/extensions/detail/oiaejidbmkiecgbjeifoejpgmdaleoha>
- Issues and feature requests: <https://github.com/ankit/stylebot/issues>

## History

This project began as a [Google Summer of Code project](https://opensource.googleblog.com/2010/09/changing-look-of-web-with-stylebot.html) back in 2010.

## Browser support

Stylebot is currently only supported on Google Chrome.

## License

Dual licensed under the GPL and MIT Licenses.
