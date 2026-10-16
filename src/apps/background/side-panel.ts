import type { OpenStylebot, StylebotLayout } from '@stylebot/types';
import {
  CHROMIUM_VARIANT_KEY,
  detectChromiumVariant,
  getChromiumVariant,
  doesSidePanelWorkInChromiumVariant,
} from '@stylebot/utils';
import {
  isSidePanelAwaitingReload,
  isSidePanelGranted,
  isEditorSidePanelOpen,
  markSidePanelAwaitingReload,
  openEditorSidePanel,
  hasSidePanelPermission,
  removeSidePanelPermission,
  requestSidePanelPermission,
  supportsEditorSidePanel,
} from '@stylebot/side-panel';
import type { ChromiumVariant } from '@stylebot/utils';

import { reloadForGrant, resumeAfterGrantReload } from './grant-reload';
import {
  get as getOption,
  set as setOption,
  waitForPendingWrites as waitForPendingOptionWrites,
} from './options';

const LOAD_TIMEOUT_MS = 2000;
const POLL_MS = 250;
const RELOADED_FOR_SIDE_PANEL_KEY = 'side-panel-reloaded-for-grant';

let chromiumVariant: ChromiumVariant | undefined;
let isDock: boolean | undefined;
let startedAfterGrantReload = Promise.resolve(false);

/**
 * Whether the editor can open in the browser's side panel: it has one, and
 * shows it, possibly once Stylebot has the permission. Answers at once, so
 * callers can still open the panel during the user's gesture.
 */
export const canUseEditorSidePanel = (): boolean =>
  supportsEditorSidePanel() &&
  doesSidePanelWorkInChromiumVariant(chromiumVariant);

/**
 * Whether the editor opens in the side panel. Says yes until the dock is
 * read after the worker wakes; callers fall back to the page.
 */
export const opensEditorInSidePanel = (): boolean =>
  isDock !== false && canUseEditorSidePanel();

/**
 * Gives up the sidePanel permission in a browser whose side panel doesn't
 * work, as Vivaldi opens the panel of any extension holding it on updates.
 */
const dropPermissionWhereBroken = (
  variant: ChromiumVariant | undefined
): void => {
  if (!doesSidePanelWorkInChromiumVariant(variant)) {
    removeSidePanelPermission();
  }
};

/**
 * Keeps canUseEditorSidePanel's and opensEditorInSidePanel's answers in step
 * with storage.
 */
export const initSidePanel = (): void => {
  getChromiumVariant().then(variant => {
    chromiumVariant = variant;
    dropPermissionWhereBroken(variant);
  });

  getOption('layout').then(layout => {
    isDock = (layout as StylebotLayout).dockLocation === 'sidepanel';
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') {
      return;
    }

    if (changes[CHROMIUM_VARIANT_KEY]) {
      chromiumVariant = changes[CHROMIUM_VARIANT_KEY].newValue;
      dropPermissionWhereBroken(chromiumVariant);
    }

    if (changes['options']) {
      isDock =
        changes['options'].newValue?.layout?.dockLocation === 'sidepanel';
    }
  });

  chrome.permissions?.onAdded?.addListener(markSidePanelAwaitingReload);
  startedAfterGrantReload = resumeAfterGrantReload(RELOADED_FOR_SIDE_PANEL_KEY);
};

/**
 * Gets the sidePanel permission, then reloads Stylebot, as Chrome crashes on
 * a side panel opened before then. The reload ends the user's gesture, so
 * the editor opens in the tab's page this once. Rejects where it can't.
 */
const grantEditorSidePanel = (tabId: number): Promise<void> => {
  const granted = isSidePanelAwaitingReload()
    ? Promise.resolve(true)
    : requestSidePanelPermission();

  return granted.then(async ok => {
    const variant = await detectChromiumVariant();

    if (!doesSidePanelWorkInChromiumVariant(variant)) {
      await removeSidePanelPermission();
      throw new Error('This browser does not show side panels');
    }

    const reloaded = await startedAfterGrantReload;
    if (!ok || reloaded) {
      throw new Error('The side panel is not available');
    }

    // The editor may have just saved the side panel as its dock.
    await waitForPendingOptionWrites();
    reloadForGrant(RELOADED_FOR_SIDE_PANEL_KEY, { open: { [tabId]: 'page' } });
  });
};

/**
 * Reloads Stylebot for the sidePanel permission Options just got, as the side
 * panel the user then opens from a tab would otherwise wait for a reload.
 */
export const reloadForSidePanelGrant = async (): Promise<void> => {
  const granted = await hasSidePanelPermission();
  if (!granted || isSidePanelGranted()) {
    return;
  }

  // Options saved the side panel as the dock just before.
  await waitForPendingOptionWrites();
  await reloadForGrant(RELOADED_FOR_SIDE_PANEL_KEY, {
    optionsRoute: '/basics',
  });
};

/**
 * Waits for the side panel to find, as it loads, that the browser won't show
 * it (Vivaldi, Arc), or for the editor to show up in it.
 */
const waitForHiddenPanel = async (tabId: number): Promise<boolean> => {
  for (let waited = 0; waited < LOAD_TIMEOUT_MS; waited += POLL_MS) {
    const variant = await getChromiumVariant();
    if (!doesSidePanelWorkInChromiumVariant(variant)) {
      return true;
    }

    const isOpen = await isEditorSidePanelOpen(tabId);
    if (isOpen) {
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }

  return false;
};

/**
 * Follows up a side panel just opened on the tab. In a browser that won't
 * show it (Vivaldi, Arc) the panel closes itself, so the editor docks in the
 * page from now on, and opens there.
 */
export const onEditorSidePanelOpened = async (tabId: number): Promise<void> => {
  const isHidden = await waitForHiddenPanel(tabId);
  if (!isHidden) {
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
 * callers must reach it before awaiting anything. Without the permission it
 * asks for it and reloads Stylebot, which then opens the editor in the page.
 */
export const openEditorSidePanelWithFallback = (
  tabId: number
): Promise<void> => {
  if (!isSidePanelGranted()) {
    return grantEditorSidePanel(tabId);
  }

  const opened = openEditorSidePanel(tabId);
  opened.then(
    () => onEditorSidePanelOpened(tabId),
    () => undefined
  );
  return opened;
};
