import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

const UNLISTED = ['/welcome/', '/goodbye/', '/404/'];

export default defineConfig({
  site: 'https://stylebot.dev',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !UNLISTED.includes(new URL(page).pathname),
    }),
  ],
  redirects: { '/help': '/manual/' },
});
