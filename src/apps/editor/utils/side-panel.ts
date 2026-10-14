import {
  getChromiumVariant,
  doesSidePanelWorkInChromiumVariant,
} from '@stylebot/utils';
import type { ChromiumVariant } from '@stylebot/utils';

let chromiumVariant: ChromiumVariant | undefined;

/**
 * Reads whether this is a browser that won't show the side panel, for
 * hasSidePanel. The store calls this as it initializes.
 */
export const loadSidePanelSupport = async (): Promise<void> => {
  chromiumVariant = await getChromiumVariant().catch(() => undefined);
};

/**
 * Whether the browser can host the editor in its side panel, which then
 * replaces the left and right positions in the page. Only Chromium has one,
 * and content scripts can't see chrome.sidePanel, so this goes by the browser.
 */
export const hasSidePanel = (): boolean =>
  /Chrome\//.test(navigator.userAgent) &&
  doesSidePanelWorkInChromiumVariant(chromiumVariant);
