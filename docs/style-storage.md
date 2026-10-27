# Style storage

Where a user's styles live, the copies Stylebot keeps of them to apply them fast, and how a page finds the styles that are its own.

This page is the summary; the code comments carry the detail.

## The style map

Every style lives in one map in the extension's local storage, under `styles`, keyed by the url pattern it applies to:

```jsonc
{
  "styles": {
    "craigslist.org": {
      "css": "/**\n * ==Stylebot==\n * @option scheme select [system, light, dark] system\n * ==/Stylebot==\n */\n…",
      "enabled": true,
      "readability": false,
      "modifiedTime": "2026-10-27T09:12:44.120Z",
      "activeProfile": "default",
      "profiles": {
        "default": { "name": "Classifieds" },
        "4f1c…": { "name": "Night Market", "css": "…", "createdAt": "…" }
      },
      "profileOptions": { "default": { "scheme": "dark" } }
    },
    "*": {
      "css": "…",
      "enabled": false,
      "readability": false,
      "modifiedTime": "…"
    }
  }
}
```

| Field            | What                                                                                                         |
| :--------------- | :----------------------------------------------------------------------------------------------------------- |
| `css`            | The applied profile's CSS, as the user wrote it                                                              |
| `enabled`        | The style's on/off switch                                                                                    |
| `readability`    | Whether the site opens in the reader view                                                                    |
| `modifiedTime`   | When it was last edited. Sync uses it to tell which copy is newer; switches and choices don't change it      |
| `forceImportant` | Override site styles. Missing means on; only `false` is stored                                               |
| `profiles`       | The other profiles, and the applied one's name. Missing for a style that never had more than one             |
| `activeProfile`  | Which profile is applied, on this device                                                                     |
| `profileOptions` | Choices for options the profiles' CSS declares, by profile, on this device. Missing until something's chosen |

[Profiles](profiles.md) explains the profile fields, and [Style options](style-options.md) the choices. Fields a newer Stylebot adds to a profile are kept as they are by older versions, so a downgrade doesn't lose them.

Saving CSS removes the style once none of its profiles has any. A style with no CSS can still exist, made by turning Readability on for a site that had no style.

## Which styles a page gets

A page gets every enabled style whose pattern matches its url, and treats the most specific one that isn't `*` as its own: the one the popup lists profiles for, the editor opens, and the reader and color scheme settings come from.

A pattern is one of:

- **A url**, such as `craigslist.org` or `news.ycombinator.com/item`. Without a scheme or path, it matches the host and its subdomains; with a path, pages on that exact host whose path ends with it. Several can be listed with commas.
- **A wildcard**, with `*` matching anything but `/` and `**` anything at all. `*` on its own applies to every page.
- **A regular expression**, starting with `^`.

## The copies kept for applying

Turning a user's CSS into what gets injected means parsing it, taking out `@import`s and, unless the style opts out, marking every declaration `!important`. That's too slow to do as each page loads, so Stylebot keeps two copies ahead of time.

**A compiled copy of the map**, under `styles-compiled`, rebuilt on every write: each style's injectable CSS, import urls, flags and color scheme. It's stamped with the last write's time from `styles-metadata` and a format version, and rebuilt when either doesn't match, so a stale copy is never injected.

**A per-site copy for the first paint**, in each site's own `localStorage`. Extension storage isn't readable before the page starts drawing, so a load applies what was applied last time, then patches any difference. A site without one hides for up to 150ms while its styles arrive.

## Kept elsewhere

- **Version history** is a separate store of past copies of the style map; restoring one writes it back as an edit.
- **Sync** keeps the map in a single Google Drive file in the same shape, plus a local copy of the last state both sides agreed on (see [Sync](sync.md)). Which profile is applied and the choices for style options stay on each device.
- **Backups** export the map as a file with a small header; an import merges it in.
- **Stylebot's own settings**, such as its theme, dock position and shortcuts, and Readability's reading settings, are stored apart from styles and never synced.
