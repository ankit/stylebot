import { getStylesForPage } from '@stylebot/saved-styles';
import { isSafari, isWebPageUrl } from '@stylebot/utils';
import type { GetIsReaderShowing, StyleMap } from '@stylebot/types';

import { get as getOption } from './options';
import { getAll } from './styles';

const ACTIVE_BADGE_COLOR = '#5f6368';

const isReaderShowing = (tabId: number): Promise<boolean> =>
  new Promise(resolve => {
    const message: GetIsReaderShowing = { name: 'GetIsReaderShowing' };

    chrome.tabs.sendMessage(tabId, message, (showing?: boolean) => {
      resolve(!chrome.runtime.lastError && !!showing);
    });
  });

/**
 * Counts what Stylebot has applied to a tab: its styles, plus the reader.
 * Only a tab whose site has the reader on is asked, so most are left alone.
 */
const countActive = async (
  tab: chrome.tabs.Tab,
  allStyles: StyleMap
): Promise<number> => {
  if (!tab.url || !isWebPageUrl(tab.url)) {
    return 0;
  }

  const { styles, defaultStyle } = getStylesForPage(tab.url, allStyles);
  const count = styles.filter(style => style.enabled && style.css).length;

  if (!defaultStyle?.readability || tab.id === undefined) {
    return count;
  }

  const showing = await isReaderShowing(tab.id);

  return showing ? count + 1 : count;
};

const setBadge = async (tabId: number, count: number): Promise<void> => {
  try {
    await chrome.action.setBadgeBackgroundColor({
      color: ACTIVE_BADGE_COLOR,
      tabId,
    });
    await chrome.action.setBadgeText({
      text: count ? `${count}` : '',
      tabId,
    });
  } catch {
    // The tab closed meanwhile.
  }
};

/**
 * Shows on the toolbar icon how much Stylebot has applied to the tab. Safari
 * always paints the badge red, like an alert, so it never gets one.
 */
export const refreshBadge = async (tab: chrome.tabs.Tab): Promise<void> => {
  const enabled = await getOption('activeStyleBadge');

  if (!enabled || isSafari() || tab.id === undefined) {
    return;
  }

  const allStyles = await getAll();
  const count = await countActive(tab, allStyles);

  await setBadge(tab.id, count);
};

/**
 * Refreshes every tab's badge, clearing them all when the option is off.
 */
export const refreshAllBadges = async (): Promise<void> => {
  if (isSafari()) {
    return;
  }

  const enabled = await getOption('activeStyleBadge');
  const allStyles = enabled ? await getAll() : {};
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(async tab => {
      if (tab.id !== undefined) {
        const count = await countActive(tab, allStyles);

        await setBadge(tab.id, count);
      }
    })
  );
};
