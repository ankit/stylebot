/**
 * Whether the browser can host the editor in its side panel, which then
 * replaces the left and right positions in the page. Content scripts can't
 * see chrome.sidePanel, so this goes by the browser instead.
 */
export const hasSidePanel = (): boolean =>
  !/firefox/i.test(navigator.userAgent);
