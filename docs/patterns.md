# Pattern Matching in Stylebot

## Basic (default)
By default, Stylebot uses simple text strings to match styles to websites. Examples:

* `docs.google.com`: Matches any URL with `docs.google.com` in it.
* `docs.google.com, spreadsheets.google.com`: Matches any URL with `docs.google.com` or `spreadsheets.google.com` in it.

## Advanced
Stylebot supports wildcards `**`, `*` and `,`
* `**` matches any character sequence. Examples:
    * `docs**`: Any URL beginning with `docs`.
* `*` matches any character sequence, until a `/` is found.
    * `docs*.google.com`: This will match `http://docs.google.com`, `http://docs1.google.com`, `http://docs2.google.com` and so on.
    * `*.ycombinator.com`: This will match `http://news.ycombinator.com` and `http://apps.ycombinator.com`
* `,` separates a list of advanced patterns. Matches a URL if any sub-pattern matches it.

## Regular Expressions
Stylebot treats a string as a regex if it start it with `^`. Examples:
* `^http://www.reddit.com/$`: This matches only the Reddit homepage.
