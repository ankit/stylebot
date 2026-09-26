import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

export default defineConfig({
  site: 'https://stylebot.dev',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [preact()],
  redirects: { '/help': '/manual' },
});
