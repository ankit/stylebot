/**
 * Whether the browser can host the editor in its side panel, which then
 * replaces the left and right positions in the page. Only Chromium has one,
 * and content scripts can't see chrome.sidePanel, so this goes by the browser.
 */
export const hasSidePanel = (): boolean => /Chrome\//.test(navigator.userAgent);
