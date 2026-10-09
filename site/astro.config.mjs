import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import {
  DEFAULT_LOCALE,
  LOCALES,
  unlocalizedPath,
} from './src/i18n/locales.ts';

const UNLISTED = ['/welcome/', '/goodbye/', '/404/'];

export default defineConfig({
  site: 'https://stylebot.dev',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    preact(),
    sitemap({
      filter: (page) =>
        !UNLISTED.includes(unlocalizedPath(new URL(page).pathname)),
      i18n: {
        defaultLocale: DEFAULT_LOCALE,
        locales: Object.fromEntries(LOCALES.map((l) => [l.code, l.lang])),
      },
    }),
  ],
  redirects: { '/help': '/manual/' },
});
