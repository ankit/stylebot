import { getPageSupport, getRestorePendingKey } from '@stylebot/utils';
import {
  isSidePanelGranted,
  isEditorSidePanelOpen,
} from '@stylebot/side-panel';

import * as editorWindow from './editor-window';

export type EditorHost = 'page' | 'window' | 'sidepanel';

export type OpenEditors = Record<number, EditorHost>;

/**
 * Whether the page has Stylebot's panel showing. Runs inside the page, where
 * the panel's host element is readable by any copy of the script, including
 * releases before 4.0, whose panel has only the `stylebot` class.
 */
const isPanelShowing = (): boolean =>
  !!document.getElementById('stylebot')?.shadowRoot?.querySelector('.stylebot');

const findHost = async (tabId: number): Promise<EditorHost | undefined> => {
  const isWindowOpen = await editorWindow.isOpen(tabId);
  if (isWindowOpen) {
    return 'window';
  }

  const isSidePanelOpen = await isEditorSidePanelOpen(tabId);
  if (isSidePanelOpen) {
    return 'sidepanel';
  }

  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: isPanelShowing,
    });

    return result?.result ? 'page' : undefined;
  } catch {
    // A page the extension can't script, or one closed meanwhile.
    return undefined;
  }
};

/**
 * Records where Stylebot is open in each tab, to open it again after a
 * reload, which closes the windows and side panels and cuts off the panels
 * in pages. Needs scripting, so it finds nothing without it.
 */
export const findOpenEditors = async (): Promise<OpenEditors> => {
  if (!chrome.scripting) {
    return {};
  }

  const tabs = await chrome.tabs.query({});
  const found: OpenEditors = {};

  await Promise.all(
    tabs.map(async ({ id }) => {
      const host = id === undefined ? undefined : await findHost(id);

      if (id !== undefined && host) {
        found[id] = host;
      }
    })
  );

  return found;
};

const reopen = async (tabId: number, host: EditorHost): Promise<void> => {
  try {
    if (host === 'page') {
      await chrome.tabs.sendMessage(tabId, { name: 'OpenStylebot' });
    } else if (host === 'window') {
      await editorWindow.open(tabId);
    } else if (isSidePanelGranted()) {
      // Chrome only opens a side panel during a user gesture, which the
      // reload has ended, so this works only where the browser allows it.
      await chrome.sidePanel.open({ tabId });
    }
  } catch {
    // The tab closed meanwhile, or the browser refused.
  }
};

type ContentScript = NonNullable<
  chrome.runtime.Manifest['content_scripts']
>[number];

// A tab and its content scripts, by their index in the manifest.
type TabEntry = { tab: chrome.tabs.Tab; scripts: Array<number> };

type TabScripts = Map<number, TabEntry>;

const getContentScripts = (): Array<ContentScript> =>
  chrome.runtime.getManifest().content_scripts ?? [];

/**
 * Runs the scripts in a tab, unless its page already answers this copy of
 * Stylebot, as one loaded since the reload or update does.
 */
const inject = async (
  tab: chrome.tabs.Tab,
  scripts: Array<number>
): Promise<void> => {
  if (tab.id === undefined) {
    return;
  }

  const support = await getPageSupport(tab);
  if (support !== 'unreachable') {
    return;
  }

  const tabId = tab.id;
  const contentScripts = getContentScripts();

  await Promise.all(
    scripts.map(i =>
      chrome.scripting
        .executeScript({
          target: { tabId, allFrames: !!contentScripts[i]?.all_frames },
          files: contentScripts[i]?.js ?? [],
        })
        // A page the extension can't script, or one closed meanwhile.
        .catch(() => undefined)
    )
  );
};

/**
 * Finds the tabs each content script matches, leaving out discarded ones,
 * which get the scripts when they load again.
 */
const findTabScripts = async (): Promise<TabScripts> => {
  const matches = await Promise.all(
    getContentScripts().map(script =>
      chrome.tabs.query({ url: script.matches, discarded: false })
    )
  );
  const tabScripts: TabScripts = new Map();

  matches.forEach((tabs, i) =>
    tabs.forEach(tab => {
      if (tab.id !== undefined) {
        const found = tabScripts.get(tab.id)?.scripts ?? [];
        tabScripts.set(tab.id, { tab, scripts: [...found, i] });
      }
    })
  );

  return tabScripts;
};

/**
 * Saves the tabs to restore once they're first shown.
 */
const savePendingTabs = async (pendingTabs: TabScripts): Promise<void> => {
  if (!pendingTabs.size) {
    return;
  }

  const pending: Record<string, Array<number>> = {};

  pendingTabs.forEach(({ scripts }, tabId) => {
    pending[getRestorePendingKey(tabId)] = scripts;
  });

  await chrome.storage.session.set(pending);
};

/**
 * Restores the tabs left for later that were shown before they were saved,
 * so their activation found nothing to restore.
 */
const restoreShownMeanwhile = async (
  pendingTabs: TabScripts
): Promise<void> => {
  const shown = await chrome.tabs.query({ active: true });

  await Promise.all(
    shown
      .filter(({ id }) => id !== undefined && pendingTabs.has(id))
      .map(({ id }) => restoreTab(id as number))
  );
};

/**
 * Runs the scripts in a tab, if it has any to run, then reopens the editor
 * there, if it was open.
 */
const restoreNow = async (
  tabId: number,
  entry?: TabEntry,
  host?: EditorHost
): Promise<void> => {
  if (entry) {
    await inject(entry.tab, entry.scripts);
  }

  if (host) {
    await reopen(tabId, host);
  }
};

/**
 * Puts Stylebot back right away where it's in view or was open: the active
 * tab of each window and the tabs with the editor. The rest wait until they
 * are first shown, so an update doesn't run the scripts in every tab at once.
 */
const restore = async (
  found: Promise<TabScripts>,
  open?: OpenEditors
): Promise<void> => {
  const tabScripts = await found;
  const editors = open ?? (await findOpenEditors());
  const tabsInView: TabScripts = new Map();
  const pendingTabs: TabScripts = new Map();

  tabScripts.forEach((entry, tabId) => {
    const inView = entry.tab.active || !!editors[tabId];

    if (inView) {
      tabsInView.set(tabId, entry);
    } else {
      pendingTabs.set(tabId, entry);
    }
  });

  await savePendingTabs(pendingTabs);

  const tabIds = new Set([
    ...tabsInView.keys(),
    ...Object.keys(editors).map(Number),
  ]);

  await Promise.all([
    restoreShownMeanwhile(pendingTabs),
    ...Array.from(tabIds, tabId =>
      restoreNow(tabId, tabsInView.get(tabId), editors[tabId])
    ),
  ]);
};

let restoring = Promise.resolve();

/**
 * Puts Stylebot back into open tabs after an update or reload, and reopens
 * the editor where it was open. Visible tabs are restored now, the rest later.
 */
export const restoreOpenTabs = (open?: OpenEditors): Promise<void> => {
  if (!chrome.scripting) {
    return Promise.resolve();
  }

  // Tabs are listed now, since tabs opened later get the scripts from Chrome.
  // Restores run one after another so no tab is injected twice.
  const found = findTabScripts();

  restoring = restoring
    .then(() => restore(found, open))
    .catch(e => console.error('Stylebot: could not restore open tabs', e));
  return restoring;
};

/**
 * Runs the content scripts in the tab if it's on the list of tabs an update
 * left for later, then takes it off the list. A discarded tab stays on it,
 * since reloading gives it the scripts anyway.
 */
const restoreIfPending = async (tabId: number): Promise<void> => {
  const key = getRestorePendingKey(tabId);
  const { [key]: scripts } = await chrome.storage.session.get(key);

  if (!Array.isArray(scripts)) {
    return;
  }

  const tab = await chrome.tabs.get(tabId).catch(() => undefined);

  if (tab?.discarded) {
    return;
  }

  if (tab) {
    await inject(tab, scripts);
  }

  // Removed only now, so a popup opened meanwhile still waits for the inject.
  await chrome.storage.session.remove(key);
};

const restoringTabs = new Map<number, Promise<void>>();

/**
 * Puts Stylebot back into a tab an update or reload left for later, as it's
 * shown or about to be used, and resolves once its page can answer. A tab
 * already being restored isn't injected twice.
 */
export const restoreTab = (tabId: number): Promise<void> => {
  if (!chrome.scripting || !chrome.storage?.session) {
    return Promise.resolve();
  }

  let restoringTab = restoringTabs.get(tabId);

  if (!restoringTab) {
    restoringTab = restoreIfPending(tabId)
      .catch(e => console.error('Stylebot: could not restore tab', e))
      .finally(() => restoringTabs.delete(tabId));
    restoringTabs.set(tabId, restoringTab);
  }

  return restoringTab;
};
