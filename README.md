# Stylebot

**Note: This is a fork of <https://github.com/ankit/stylebot> with the intention of keeping the project at least semi-alive.**

A Google Chrome extension that allows users to manipulate a web page’s appearance in a WYSIWYG manner.

Using Stylebot, users are able to:

1. Incrementally build custom stylesheets for Chrome.
2. Save custom CSS rules for sites. The next time they visit a site, their custom CSS is already applied.
3. Share, explore and apply CSS created by other users via [Stylebot Social](http://stylebot.me).

## Usage 

## Patterns

### Basic (default)
By default, Stylebot uses simple text strings to match styles to websites. Examples:
* `docs.google.com`: Matches any URL with `docs.google.com` in it.
* `docs.google.com`, `spreadsheets.google.com`: Matches any URL with `docs.google.com` or `spreadsheets.google.com` in it.

### Advanced
Stylebot supports wildcards `**`, `*` and `,`
* `**` matches any character sequence. Examples:
* `docs**`: Any URL beginning with `docs`.
* `*` matches any character sequence, until a `/` is found.
* `docs*.google.com`: This will match `http://docs.google.com`, `http://docs1.google.com`, `http://docs2.google.com` and so on.
* `*.ycombinator.com`: This will match `http://news.ycombinator.com` and `http://apps.ycombinator.com`
* `,` separates a list of advanced patterns. Matches a URL if any sub-pattern matches it.

### Regular Expressions
Stylebot treats a string as a regex if it start it with `^`. Examples:
`^http://www.reddit.com/$`: This matches only the Reddit homepage.

## Links

* Chrome Webstore: <https://chrome.google.com/extensions/detail/oiaejidbmkiecgbjeifoejpgmdaleoha>
* About: <http://stylebot.me/about>
* Changelog: <http://stylebot.me/changelog>
* Donate on Pledgie: [http://pledgie.com/campaigns/14409](http://pledgie.com/campaigns/14409)
* Issues and feature requests: <https://github.com/ankit/stylebot/issues>

## About

This project began as a Google Summer of Code 2010 project, where I was mentored by Rachel Shearer.
I have since continued to maintain it and build new features.
Along the way, few people have contributed new features and bugfixes.

## License

Dual licensed under the GPL and MIT Licenses.