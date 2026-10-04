import type { GetCanStylePage } from '@stylebot/types';

/**
 * Whether Stylebot can style a tab: "supported", "unsupported" when its page
 * script runs there but the document isn't a web page (a PDF, JSON or XML
 * file), or "unreachable" when the script isn't running there at all.
 */
export type PageSupport = 'supported' | 'unsupported' | 'unreachable';

/**
 * Whether a URL can hold a page Stylebot runs on. Browser and extension pages
 * can't; whether a web page can is up to the page itself.
 */
export const isWebPageUrl = (url: string): boolean =>
  /^(https?|file):/.test(url);

/**
 * Asks the tab's page script whether it can style the page. Browser and
 * extension pages have no page script, so they aren't asked.
 */
export const getPageSupport = (tab: chrome.tabs.Tab): Promise<PageSupport> =>
  new Promise(resolve => {
    if (tab.id === undefined || !tab.url || !isWebPageUrl(tab.url)) {
      resolve('unreachable');
      return;
    }

    const message: GetCanStylePage = { name: 'GetCanStylePage' };

    chrome.tabs.sendMessage(tab.id, message, (canStyle?: boolean) => {
      if (chrome.runtime.lastError || canStyle === undefined) {
        resolve('unreachable');
        return;
      }

      resolve(canStyle ? 'supported' : 'unsupported');
    });
  });
