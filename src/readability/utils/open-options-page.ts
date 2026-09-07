/**
 * Opens the Stylebot options page in a new tab.
 */
export const openOptionsPage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenOptionsPage' });
};
