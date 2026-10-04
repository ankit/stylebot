export type UnsupportedPage = {
  // A locale key naming the page, or null to name it by its host.
  nameKey: string | null;
  reasonKey: string;
  // The reason doubles as a link to where file access is turned on.
  needsFileAccess: boolean;
};

const CHROME_PAGE_NAMES: Record<string, string> = {
  newtab: 'new_tab',
  'new-tab-page': 'new_tab',
  settings: 'chrome_settings',
  history: 'history',
  extensions: 'extensions',
};

const WEB_STORE_URLS = [
  'https://chrome.google.com/webstore',
  'https://chromewebstore.google.com',
];

const page = (
  nameKey: string | null,
  reasonKey: string,
  needsFileAccess = false
): UnsupportedPage => ({ nameKey, reasonKey, needsFileAccess });

/**
 * Names a page Stylebot can't run on, and says why, for the popup.
 */
export const describeUnsupportedPage = (url: string): UnsupportedPage => {
  if (url.startsWith('chrome://')) {
    const host = url.slice('chrome://'.length).split(/[/?#]/)[0];

    return page(
      CHROME_PAGE_NAMES[host] ?? 'browser_page',
      'stylebot_cant_style_browser_pages'
    );
  }

  if (url.startsWith('chrome-extension://')) {
    return page('extension_page', 'stylebot_cant_style_extension_pages');
  }

  if (WEB_STORE_URLS.some(storeUrl => url.startsWith(storeUrl))) {
    return page(
      'chrome_web_store',
      'chrome_doesnt_allow_extensions_to_change_this_page'
    );
  }

  if (url.startsWith('file://')) {
    return page(
      'local_file',
      'allow_file_url_access_to_style_local_files',
      true
    );
  }

  if (/^https?:\/\//.test(url)) {
    return page(null, 'stylebot_cant_style_this_page');
  }

  return page('browser_page', 'stylebot_cant_style_this_page');
};
