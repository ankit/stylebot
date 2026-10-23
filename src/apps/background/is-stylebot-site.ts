const GALLERY_ORIGIN = 'https://gallery.stylebot.dev';

// Stylebot's own sites, whose pages may install and preview styles.
const STYLEBOT_SITE_ORIGINS = ['https://stylebot.dev', GALLERY_ORIGIN];

const isDevServer = ({ protocol, hostname }: URL): boolean =>
  process.env.NODE_ENV === 'development' &&
  protocol === 'http:' &&
  hostname === 'localhost';

/**
 * Whether a page is on stylebot.dev or its gallery, which may install and
 * preview styles, or in development builds on a localhost dev server.
 */
export const isStylebotSite = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  const parsed = new URL(url);

  return STYLEBOT_SITE_ORIGINS.includes(parsed.origin) || isDevServer(parsed);
};

/**
 * Whether a page is on the gallery, which alone may read and publish drafts,
 * or in development builds on a localhost dev server.
 */
export const isGallerySite = (url: string | undefined): boolean => {
  if (!url) {
    return false;
  }

  const parsed = new URL(url);

  return parsed.origin === GALLERY_ORIGIN || isDevServer(parsed);
};
