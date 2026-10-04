import type { PageSupport } from '@stylebot/utils';

// A locale key, with the browser to put in its $browser$ placeholder.
type Text = { key: string; browser?: string };

export type UnsupportedPage = {
  // Null to name the page by its host, as for a PDF on a website.
  name: Text | null;
  reason: Text;
  // The reason doubles as a link to where file access is turned on.
  needsFileAccess: boolean;
};

const BROWSER_PAGE_NAMES: Record<string, string> = {
  newtab: 'new_tab',
  'new-tab-page': 'new_tab',
  home: 'new_tab',
  settings: 'browser_settings',
  preferences: 'browser_settings',
  history: 'history',
  extensions: 'extensions',
};

const BROWSER_SCHEMES: Record<string, string> = {
  'chrome:': 'Chrome',
  'edge:': 'Edge',
  'about:': 'Firefox',
};

const EXTENSION_SCHEMES = [
  'chrome-extension:',
  'extension:',
  'moz-extension:',
  'safari-web-extension:',
];

const STORES: Array<{ url: string; nameKey: string; browser: string }> = [
  {
    url: 'https://chrome.google.com/webstore',
    nameKey: 'chrome_web_store',
    browser: 'Chrome',
  },
  {
    url: 'https://chromewebstore.google.com',
    nameKey: 'chrome_web_store',
    browser: 'Chrome',
  },
  {
    url: 'https://microsoftedge.microsoft.com/addons',
    nameKey: 'edge_add_ons',
    browser: 'Edge',
  },
  {
    url: 'https://addons.mozilla.org',
    nameKey: 'firefox_add_ons',
    browser: 'Firefox',
  },
];

const page = (
  name: Text | null,
  reason: Text,
  needsFileAccess = false
): UnsupportedPage => ({ name, reason, needsFileAccess });

/**
 * The page part of a browser URL: "settings" for chrome://settings/fonts or
 * "preferences" for about:preferences#home.
 */
const browserPage = (url: string, scheme: string): string =>
  url.slice(scheme.length).replace(/^\/\//, '').split(/[/?#]/)[0];

/**
 * Names a page Stylebot can't run on, and says why, for the popup. `support`
 * is the tab's own answer: a page that answered but can't be styled is a
 * file such as a PDF; one that didn't answer is closed to extensions, or has
 * to be reloaded to pick up Stylebot.
 */
export const describeUnsupportedPage = (
  url: string,
  support: Exclude<PageSupport, 'supported'>
): UnsupportedPage => {
  const scheme = Object.keys(BROWSER_SCHEMES).find(prefix =>
    url.startsWith(prefix)
  );

  if (scheme) {
    const browser = BROWSER_SCHEMES[scheme];
    const key = BROWSER_PAGE_NAMES[browserPage(url, scheme)] ?? 'browser_page';

    return page({ key, browser }, { key: 'stylebot_cant_style_browser_pages' });
  }

  if (EXTENSION_SCHEMES.some(prefix => url.startsWith(prefix))) {
    return page(
      { key: 'extension_page' },
      { key: 'stylebot_cant_style_extension_pages' }
    );
  }

  const store = STORES.find(({ url: storeUrl }) => url.startsWith(storeUrl));

  if (store) {
    return page(
      { key: store.nameKey },
      {
        key: 'browser_doesnt_allow_extensions_to_change_this_page',
        browser: store.browser,
      }
    );
  }

  if (url.startsWith('file:') && support === 'unreachable') {
    return page(
      { key: 'local_file' },
      { key: 'allow_file_url_access_to_style_local_files' },
      true
    );
  }

  if (/^(https?|file):/.test(url)) {
    return page(null, {
      key:
        support === 'unreachable'
          ? 'reload_this_page_to_style_it'
          : 'stylebot_cant_style_this_page',
    });
  }

  return page(
    { key: 'browser_page' },
    { key: 'stylebot_cant_style_this_page' }
  );
};
