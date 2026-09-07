import { Style, GetIsReadabilityActive } from '@stylebot/types';

// Asked live from the content script rather than tracked/persisted here,
// so there's no stale cached value to race against.
export const getIsReadabilityActive = (tabId: number): Promise<boolean> =>
  new Promise(resolve => {
    const message: GetIsReadabilityActive = { name: 'GetIsReadabilityActive' };

    chrome.tabs.sendMessage(tabId, message, (response: boolean) => {
      resolve(!!response);
    });
  });

// Signals "styles are applied here" — readability doesn't need its own
// color since the 📖 badge glyph already reads as distinct on its own.
const STYLES_APPLIED_BADGE_COLOR = '#2e8b57';
const DEFAULT_BADGE_COLOR = '#555';

export const updateIcon = (
  tab: chrome.tabs.Tab,
  styles: Array<Style>,
  readabilityActive: boolean
): void => {
  const enabledStyles = styles.filter(style => style.enabled);

  if (readabilityActive) {
    chrome.action.setBadgeBackgroundColor({
      color: DEFAULT_BADGE_COLOR,
      tabId: tab.id,
    });
    chrome.action.setBadgeText({
      text: `📖`,
      tabId: tab.id,
    });
  } else if (enabledStyles.length > 0) {
    chrome.action.setBadgeBackgroundColor({
      color: STYLES_APPLIED_BADGE_COLOR,
      tabId: tab.id,
    });
    chrome.action.setBadgeText({
      text: `${enabledStyles.length}`,
      tabId: tab.id,
    });
  } else {
    chrome.action.setBadgeBackgroundColor({
      color: DEFAULT_BADGE_COLOR,
      tabId: tab.id,
    });
    chrome.action.setBadgeText({ text: '', tabId: tab.id });
  }
};
