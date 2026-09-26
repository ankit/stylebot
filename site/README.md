# `site`

Source for [stylebot.dev](https://stylebot.dev/), built with [Astro](https://astro.build/). The interactive pieces (the hero demo, theme menu and logo) are Preact islands; everything else is static HTML.

Uses Node 24 (see `.nvmrc`), separate from the extension's Node version.

## Development

```
yarn install
yarn dev
```

## Build

```
yarn build    # outputs to dist/
yarn preview  # serves dist/ locally
yarn check    # type-checks .astro and .tsx files
```

## Deployment

```
yarn deploy
```

Builds and pushes `dist/` to the `gh-pages` branch. `public/.nojekyll` keeps GitHub Pages from dropping the `_astro/` directory, and `public/sw.js` unregisters the service worker left behind by the old Gatsby site.

The extension links to `/help` (now a redirect to `/manual`), `/goodbye` (the uninstall page) and `/releases/<major.minor>`, so keep those URLs working.
