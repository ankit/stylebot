import type { OpenStylebot, StylebotLayout } from '@stylebot/types';
import {
  SIDE_PANEL_IGNORED_KEY,
  isEditorSidePanelOpen,
  isSidePanelIgnoringTabs,
  openEditorSidePanel,
  supportsEditorSidePanel,
} from '@stylebot/utils';

import { get as getOption, set as setOption } from './options';

const LOAD_TIMEOUT_MS = 2000;
const POLL_MS = 250;

let ignoresTabs = false;
let isDock: boolean | undefined;

/**
 * Whether the editor can open in the browser's side panel: it has one, and
 * hasn't been found to ignore per-tab panels. Answers at once, so callers
 * can still open the panel during the user's gesture.
 */
export const canUseEditorSidePanel = (): boolean =>
  supportsEditorSidePanel() && !ignoresTabs;

/**
 * Whether the editor opens in the side panel. Says yes until the dock is
 * read after the worker wakes; callers fall back to the page.
 */
export const opensEditorInSidePanel = (): boolean =>
  isDock !== false && canUseEditorSidePanel();

/**
 * Keeps canUseEditorSidePanel's and opensEditorInSidePanel's answers in step
 * with storage.
 */
export const initSidePanelCheck = (): void => {
  isSidePanelIgnoringTabs().then(value => {
    ignoresTabs = value;
  });
  getOption('layout').then(layout => {
    isDock = (layout as StylebotLayout).dockLocation === 'sidepanel';
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
      return;
    }
    if (changes[SIDE_PANEL_IGNORED_KEY]) {
      ignoresTabs = !!changes[SIDE_PANEL_IGNORED_KEY].newValue;
    }
    if (changes['options']) {
      isDock =
        changes['options'].newValue?.layout?.dockLocation === 'sidepanel';
    }
  });
};

/**
 * Waits for the side panel to report that the browser hosts it as a tab,
 * which it does as it loads (Vivaldi), or for the editor to show up in it.
 */
const waitForPanelHostedAsTab = async (tabId: number): Promise<boolean> => {
  for (let waited = 0; waited < LOAD_TIMEOUT_MS; waited += POLL_MS) {
    if (await isSidePanelIgnoringTabs()) {
      return true;
    }
    if (await isEditorSidePanelOpen(tabId)) {
      return false;
    }
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
  return false;
};

/**
 * Follows up a side panel just opened on the tab. In a browser that ignores
 * per-tab panels (Vivaldi) the panel closes itself, so the editor docks in
 * the page from now on, and opens there.
 */
export const onEditorSidePanelOpened = async (tabId: number): Promise<void> => {
  if (!(await waitForPanelHostedAsTab(tabId))) {
    return;
  }

  const layout = (await getOption('layout')) as StylebotLayout;
  if (layout.dockLocation === 'sidepanel') {
    await setOption('layout', { ...layout, dockLocation: 'right' });
  }

  const message: OpenStylebot = { name: 'OpenStylebot' };
  chrome.tabs.sendMessage(tabId, message, () => void chrome.runtime.lastError);
};

/**
 * Opens the editor in the tab's side panel, or in the page where the browser
 * can't host it there. Chrome only opens the panel during a user gesture, so
 * callers must reach it before awaiting anything.
 */
export const openEditorSidePanelWithFallback = (
  tabId: number
): Promise<void> => {
  const opened = openEditorSidePanel(tabId);
  opened.then(
    () => onEditorSidePanelOpened(tabId),
    () => undefined
  );
  return opened;
};
