import type { StylebotLayout } from '@stylebot/types';
import {
  configureEditorSidePanel,
  supportsEditorSidePanel,
} from '@stylebot/utils';

import { get as getOption } from './options';

/**
 * Sets up the editor's side panel on the given tabs, or every tab, while the
 * side panel is the dock, and takes it away otherwise. The toggle shortcut
 * relies on this: it has to open the panel before it could read the dock.
 */
export const configureSidePanelTabs = async (
  tabs?: Array<chrome.tabs.Tab>
): Promise<void> => {
  if (!supportsEditorSidePanel()) {
    return;
  }

  const layout = (await getOption('layout')) as StylebotLayout;
  const enabled = layout.dockLocation === 'sidepanel';

  (tabs ?? (await chrome.tabs.query({}))).forEach(tab => {
    if (tab.id !== undefined) {
      configureEditorSidePanel(tab.id, enabled).catch(() => undefined);
    }
  });
};

/**
 * Keeps the tabs' side panels in step with the dock as tabs open and the
 * dock changes. Chrome keeps a tab's panel set up while the background sleeps.
 */
export const initSidePanelTabs = (): void => {
  chrome.tabs.onCreated.addListener(tab => configureSidePanelTabs([tab]));

  chrome.storage.onChanged.addListener((changes, area) => {
    const before = changes['options']?.oldValue?.layout?.dockLocation;
    const after = changes['options']?.newValue?.layout?.dockLocation;

    if (area === 'local' && before !== after) {
      configureSidePanelTabs();
    }
  });
};
