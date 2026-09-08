/**
 * Opens the Ko-fi donation page in a new tab.
 */
export const openDonatePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenDonatePage' });
};
