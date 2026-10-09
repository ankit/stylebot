---
name: capture-store
description: Retake the Chrome Web Store and Edge Add-ons screenshots in store/screenshots/ with `yarn capture:store`, then check each one by eye before committing. Use when the UI has changed and the listing's screenshots are out of date, before a release, or when the user asks to "update the store screenshots", "retake the store shots", or change what one of them shows.
---

# Capture the store screenshots

`yarn capture:store` builds the extension, then takes each listing screenshot in a fresh
headless Chrome on the live site, saving 1280×800 PNGs into `store/screenshots/`. Chrome
takes the first five, Edge all of them. `yarn capture:store --help` lists them.

The script gets every shot to the same state each time; whether the result is a good store
image still takes a look, because the sites it shows change under it.

## 1. Run it

```
yarn capture:store
```

- `--only 2-chat 4` retakes some shots, by name or number; `--no-build` reuses `dist/`.
- It takes about a minute. A shot that fails says why and the others still run.
- The command line shot drives the real CLI in a temporary HOME, as its e2e spec does, so
  it never touches `~/.stylebot` or the user's browsers.

## 2. Look at every image

Open each PNG and check, before saying they're done:

- **The site loaded.** A bot check, consent dialog, or error page instead of the site means
  that site now blocks headless Chrome (NYTimes does): pick another and say so.
- **Nothing reads as broken.** A warning icon in the panel, a wrapped or clipped row, text
  justified into big gaps, a menu cut off at the edge.
- **The panel is in the theme it should be.** Every shot's Stylebot panel is dark; pages
  alternate between dark and light so the set doesn't read as a dark-mode extension.
- **Chat's cards** are Morning newspaper, Swiss poster and Night owl.
- **The terminal's last line still describes the page beside it.** It's written by hand
  (`SUMMARY` in `cli-shot.mjs`); rewrite it whenever the Newspaper theme changes.

Send the user the images in order, then commit them once they're happy.

## Changing a shot

Each shot is an entry in `scripts/capture/shots.mjs`: the site, the theme it's seeded
with, and what's opened or hovered. Gallery themes come from `site/src/assets/gallery/`,
including the Hacker News profiles the gallery also lists; Modern, which it doesn't, is kept
in `scripts/capture/themes/`. When the user updates one in their browser, refresh its
copy with `yarn stylebot css get news.ycombinator.com --profile "<name>"`, keeping the
gallery file's `/* Site: Name */` first line, then retake the shots and, with the `capture-gallery` skill, the gallery image.

Choosing what to show:

- **Pick an article whose opening has no images** for Wikipedia in Slate: its two justified
  columns squeeze around pictures and leave gaps between words.
- **Check a site loads headless** before moving a shot to it. Reddit, Stack Overflow and
  NYTimes block it; Gmail needs a sign-in.
- **Keep Chat honest**: the shot shows its suggestions, never a reply, since a reply needs a
  real API key. The key the script seeds is a placeholder that is never sent anywhere.

