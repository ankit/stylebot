import {
  getPageSupport,
  isEditorSidePanelOpen,
  supportsEditorSidePanel,
} from '@stylebot/utils';

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
  if (await editorWindow.isOpen(tabId)) {
    return 'window';
  }

  if (supportsEditorSidePanel() && (await isEditorSidePanelOpen(tabId))) {
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
    } else {
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

// Each tab's content scripts, by their index in the manifest.
type TabScripts = Map<number, { tab: chrome.tabs.Tab; scripts: Array<number> }>;

const pendingKey = (tabId: number): string => `restore-tab-${tabId}`;

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
  if (tab.id === undefined || (await getPageSupport(tab)) !== 'unreachable') {
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
  const later = [...tabScripts].filter(
    ([tabId, { tab }]) => !tab.active && !editors[tabId]
  );

  if (later.length) {
    await chrome.storage.session.set(
      Object.fromEntries(
        later.map(([tabId, { scripts }]) => [pendingKey(tabId), scripts])
      )
    );
  }

  const tabIds = new Set([
    ...tabScripts.keys(),
    ...Object.keys(editors).map(Number),
  ]);

  await Promise.all(
    [...tabIds].map(async tabId => {
      const injecting = tabScripts.get(tabId);

      if (injecting && (injecting.tab.active || editors[tabId])) {
        await inject(injecting.tab, injecting.scripts);
      }

      if (editors[tabId]) {
        await reopen(tabId, editors[tabId]);
      }
    })
  );
};

let restoring = Promise.resolve();

/**
 * Runs the content scripts again in the tabs they match whose copies a reload
 * or update cut off, since Chrome only injects into new pages, then opens
 * Stylebot again where it was showing: in `open`, or else wherever a cut-off
 * panel is left on the page. Tabs out of view are left for `restoreTab`.
 * Needs scripting, so it does nothing without it.
 */
export const restoreOpenTabs = (open?: OpenEditors): Promise<void> => {
  if (!chrome.scripting) {
    return Promise.resolve();
  }

  // Tabs are found right away, so one opened after this call, which gets the
  // content scripts from Chrome, is left alone. Restores then run one at a
  // time, so a tab two of them find is only injected once.
  const found = findTabScripts();

  restoring = restoring
    .then(() => restore(found, open))
    .catch(e => console.error('Stylebot: could not restore open tabs', e));
  return restoring;
};

/**
 * Restores a tab `restoreOpenTabs` left for later, once. A discarded tab
 * stays pending, since the page it loads again gets the scripts anyway.
 */
const restorePending = async (tabId: number): Promise<void> => {
  const key = pendingKey(tabId);
  const { [key]: scripts } = await chrome.storage.session.get(key);

  if (!Array.isArray(scripts)) {
    return;
  }

  const tab = await chrome.tabs.get(tabId).catch(() => undefined);

  if (tab?.discarded) {
    return;
  }

  await chrome.storage.session.remove(key);

  if (tab) {
    await inject(tab, scripts);
  }
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
    restoringTab = restorePending(tabId)
      .catch(e => console.error('Stylebot: could not restore tab', e))
      .finally(() => restoringTabs.delete(tabId));
    restoringTabs.set(tabId, restoringTab);
  }

  return restoringTab;
};
