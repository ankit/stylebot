import type { OpenStylebot, StylebotLayout } from '@stylebot/types';
import {
  SIDE_PANEL_IGNORED_KEY,
  isEditorSidePanelOpen,
  isSidePanelIgnoringTabs,
  markSidePanelIgnoringTabs,
  supportsEditorSidePanel,
} from '@stylebot/utils';

import { get as getOption, set as setOption } from './options';

const LOAD_TIMEOUT_MS = 5000;
const POLL_MS = 250;

let ignoresTabs = false;

/**
 * Whether the editor can open in the browser's side panel: it has one, and
 * hasn't been found to ignore per-tab panels. Answers at once, so callers
 * can still open the panel during the user's gesture.
 */
export const canUseEditorSidePanel = (): boolean =>
  supportsEditorSidePanel() && !ignoresTabs;

/**
 * Keeps canUseEditorSidePanel's answer in step with storage.
 */
export const initSidePanelCheck = (): void => {
  isSidePanelIgnoringTabs().then(value => {
    ignoresTabs = value;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[SIDE_PANEL_IGNORED_KEY]) {
      ignoresTabs = !!changes[SIDE_PANEL_IGNORED_KEY].newValue;
    }
  });
};

/**
 * Checks that a side panel just opened on the tab loaded the editor. A
 * browser that ignores per-tab panels (Vivaldi) shows an empty one instead:
 * then the editor docks in the page from now on, and opens there.
 */
export const checkEditorSidePanel = async (tabId: number): Promise<void> => {
  for (let waited = 0; waited < LOAD_TIMEOUT_MS; waited += POLL_MS) {
    if (await isEditorSidePanelOpen(tabId)) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }

  const layout = (await getOption('layout')) as StylebotLayout;
  ignoresTabs = true;
  await markSidePanelIgnoringTabs();
  await setOption('layout', { ...layout, dockLocation: 'right' });

  const tab = await chrome.tabs.get(tabId).catch(() => undefined);
  if (tab) {
    chrome.sidePanel.close?.({ windowId: tab.windowId }).catch(() => undefined);
  }

  const message: OpenStylebot = { name: 'OpenStylebot' };
  chrome.tabs.sendMessage(tabId, message, () => void chrome.runtime.lastError);
};
