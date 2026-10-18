// Stylebot's own sites, whose pages may install and preview styles.
const STYLEBOT_SITE_ORIGINS = [
  'https://stylebot.dev',
  'https://gallery.stylebot.dev',
];

/**
 * Whether a page is on stylebot.dev or its gallery, which may install and
 * preview styles, or in development builds on a localhost dev server.
 */
export const isStylebotSite = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  const { origin, protocol, hostname } = new URL(url);
  const isDevServer =
    process.env.NODE_ENV === 'development' &&
    protocol === 'http:' &&
    hostname === 'localhost';

  return STYLEBOT_SITE_ORIGINS.includes(origin) || isDevServer;
};
