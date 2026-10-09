---
name: capture-gallery
description: Retake the stylebot.dev gallery's theme screenshots in site/src/assets/gallery/ with `yarn capture:gallery`, then check each one by eye before committing. Use when a gallery theme is added or its CSS changes, when a gallery image looks out of date, or when the user asks to "screenshot the gallery theme", "retake the gallery shots", or add a theme to the gallery.
---

# Capture the gallery screenshots

`yarn capture:gallery` builds the extension, then applies each theme in
`site/src/assets/gallery/<site>/<theme>.css` on its live site in a fresh headless Chrome and
saves the page, without the panel, as `<theme>.png` beside it (1440×900 at 2x).

## 1. Run it

```
yarn capture:gallery hn/newspaper
```

- Names pick a theme (`hn/newspaper`) or a whole site (`hn`); none retakes every theme.
  `yarn capture:gallery --help` lists them.
- `--no-build` reuses `dist/`.
- Only sites with a page in `PAGES` in `scripts/capture/gallery.mjs` are taken: NYTimes
  blocks headless Chrome and Gmail needs a sign-in, so theirs are still taken by hand.

## 2. Look at every image

Open each PNG and check, before saying they're done:

- **The site loaded**, not a bot check, consent dialog or error page.
- **The theme's fonts arrived**, rather than the browser's fallback.
- **Nothing reads as broken**: a clipped header, overlapping text, an unstyled block.

Send the user the images, then commit them once they're happy.

## Adding a theme

- Save its CSS as `site/src/assets/gallery/<site>/<theme>.css`, starting with a
  `/* Site: Name */` line.
- Add an entry to `site/src/lib/gallery.ts`: its name, the image and CSS imports, and two
  swatch colors, the background and its accent.
- A site that isn't in `PAGES` yet needs a page there that loads headless, with no images or
  ads up top that would shift between runs.
