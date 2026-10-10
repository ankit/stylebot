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
 * the panel's host element is readable by any copy of the script.
 */
const isPanelShowing = (): boolean =>
  !!document
    .getElementById('stylebot')
    ?.shadowRoot?.querySelector('.stylebot-content');

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

type TabScripts = Map<
  number,
  { tab: chrome.tabs.Tab; scripts: Array<ContentScript> }
>;

/**
 * Runs the scripts in a tab, unless its page already answers this copy of
 * Stylebot, as one loaded since the reload or update does.
 */
const inject = async (
  tab: chrome.tabs.Tab,
  scripts: Array<ContentScript>
): Promise<void> => {
  if (tab.id === undefined || (await getPageSupport(tab)) !== 'unreachable') {
    return;
  }

  const tabId = tab.id;

  await Promise.all(
    scripts.map(script =>
      chrome.scripting
        .executeScript({
          target: { tabId, allFrames: !!script.all_frames },
          files: script.js ?? [],
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
const findTabScripts = async (
  scripts: Array<ContentScript>
): Promise<TabScripts> => {
  const matches = await Promise.all(
    scripts.map(script =>
      chrome.tabs.query({ url: script.matches, discarded: false })
    )
  );
  const tabScripts: TabScripts = new Map();

  matches.forEach((tabs, i) =>
    tabs.forEach(tab => {
      if (tab.id !== undefined) {
        const found = tabScripts.get(tab.id)?.scripts ?? [];
        tabScripts.set(tab.id, { tab, scripts: [...found, scripts[i]] });
      }
    })
  );

  return tabScripts;
};

const restore = async (
  found: Promise<TabScripts>,
  open?: OpenEditors
): Promise<void> => {
  const tabScripts = await found;
  const editors = open ?? (await findOpenEditors());
  const tabIds = new Set([
    ...tabScripts.keys(),
    ...Object.keys(editors).map(Number),
  ]);

  await Promise.all(
    [...tabIds].map(async tabId => {
      const injecting = tabScripts.get(tabId);

      if (injecting) {
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
 * panel is left on the page. Needs scripting, so it does nothing without it.
 */
export const restoreOpenTabs = (open?: OpenEditors): Promise<void> => {
  if (!chrome.scripting) {
    return Promise.resolve();
  }

  // Tabs are found right away, so one opened after this call, which gets the
  // content scripts from Chrome, is left alone. Restores then run one at a
  // time, so a tab two of them find is only injected once.
  const found = findTabScripts(
    chrome.runtime.getManifest().content_scripts ?? []
  );

  restoring = restoring
    .then(() => restore(found, open))
    .catch(e => console.error('Stylebot: could not restore open tabs', e));
  return restoring;
};
