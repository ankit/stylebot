import {
  isEditorSidePanelOpen,
  supportsEditorSidePanel,
} from '@stylebot/utils';

import * as editorWindow from '../editor-window';

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

/**
 * Runs the content scripts again in every tab they match, then opens Stylebot
 * again where it was showing. A reload cuts off the copies already running
 * there, and Chrome only injects into new pages. Needs scripting, so it does
 * nothing without it.
 */
export const restoreOpenTabs = async (
  open: OpenEditors = {}
): Promise<void> => {
  if (!chrome.scripting) {
    return;
  }

  const scripts = chrome.runtime.getManifest().content_scripts ?? [];

  await Promise.all(
    scripts.map(async script => {
      const tabs = await chrome.tabs.query({ url: script.matches });

      await Promise.all(
        tabs.flatMap(({ id }) =>
          id === undefined
            ? []
            : chrome.scripting
                .executeScript({
                  target: { tabId: id, allFrames: !!script.all_frames },
                  files: script.js ?? [],
                })
                // A page the extension can't script, or one closed meanwhile.
                .catch(() => undefined)
        )
      );
    })
  );

  await Promise.all(
    Object.entries(open).map(([tabId, host]) => reopen(Number(tabId), host))
  );
};
