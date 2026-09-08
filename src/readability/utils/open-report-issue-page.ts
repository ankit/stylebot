/**
 * Opens the GitHub issue tracker in a new tab.
 */
export const openReportIssuePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenReportIssuePage' });
};
