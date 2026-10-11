/**
 * Listens for the page's editor events and loads the editor on first use.
 * Until then, events that only touch the page are handled here, so a page
 * where Stylebot is never opened doesn't load the editor at all.
 */
import { reapplySavedStyles } from '@stylebot/inject-css';
import { applyReadability, removeReadability } from '@stylebot/readability';
import { isStylableDocument } from '@stylebot/saved-styles';
import type { TabMessage } from '@stylebot/types';

import { REMOTE_PAGE_BRIDGE_PORT } from '@stylebot/page-bridge';

import type { EditorApp } from './load-editor';
import { isEditorLoading, loadEditor } from './load-editor';
import { loadInspector } from './load-inspector';
import { whenDomReady } from './utils/dom-ready';
import { getIsEditorWindowOpen, getStylesForPage } from './utils/chrome';

const EDITOR_MESSAGES: Array<TabMessage['name']> = [
  'ToggleStylebot',
  'OpenStylebot',
  'OpenStylebotFromContextMenu',
  'ToggleReadabilityForTab',
];

let contextMenuTarget: EventTarget | null = null;

/**
 * Forwards an event to the editor, loading it first if needed. The first load
 * replays the last context menu target, which the editor didn't see.
 */
const forwardToEditorNow = (forward: (editor: EditorApp) => void): void => {
  const firstLoad = !isEditorLoading();
  const loaded = loadEditor();

  if (firstLoad) {
    loaded.then(editor => editor.handleContextMenu(contextMenuTarget));
  }

  loaded.then(forward).catch(() => undefined);
};

/**
 * Forwards an event to the editor once the page has a body to mount it in.
 */
const forwardToEditor = (forward: (editor: EditorApp) => void): void =>
  whenDomReady(() => forwardToEditorNow(forward));

// Re-derive readability only on real URL changes, not favicon/title-only
// TabUpdated events — null so the first event here still runs.
let lastUrl: string | null = null;

/**
 * Handles a message that only touches the page, before the editor has
 * loaded. Returns whether it will respond asynchronously.
 */
const handlePageMessage = (
  message: TabMessage,
  sendResponse: (response: boolean) => void
): boolean => {
  switch (message.name) {
    case 'GetIsStylebotOpen':
      // The panel can't be open yet, but a separate window can be.
      getIsEditorWindowOpen().then(sendResponse);
      return true;

    case 'TabUpdated':
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        getStylesForPage().then(({ defaultStyle }) =>
          defaultStyle?.readability ? applyReadability() : removeReadability()
        );
      }
      return false;

    case 'ReadabilityStateChanged':
      if (message.value) {
        applyReadability();
      } else {
        removeReadability();
      }
      return false;

    case 'ApplyStylesToTab':
      reapplySavedStyles();
      return false;

    default:
      return false;
  }
};

/**
 * Listens for the page's messages, context menu and editor window.
 */
const listen = (): void => {
  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _, sendResponse: (response: unknown) => void) => {
      if (window !== window.top) {
        return;
      }

      // supportsCLI() inlined, since its module would load on every page.
      if (
        process.env.STYLEBOT_CLI === 'true' &&
        message.name === 'InspectPage'
      ) {
        whenDomReady(() =>
          loadInspector()
            .then(inspectPage =>
              inspectPage(message.inspection, { reapplySavedStyles })
            )
            .then(sendResponse, error => sendResponse({ error: String(error) }))
        );
        return true;
      }

      // A global shortcut, which the browser catches wherever focus is.
      if (message.name === 'RunCommand') {
        forwardToEditor(editor => editor.handleCommand(message.command));
        return false;
      }

      if (isEditorLoading() || EDITOR_MESSAGES.includes(message.name)) {
        // The editor restyles the page itself, but the next load paints first
        // from the cache, which only the saved-styles path keeps current.
        if (message.name === 'ApplyStylesToTab') {
          reapplySavedStyles();
        }

        forwardToEditor(editor => editor.handleMessage(message, sendResponse));
        return message.name === 'GetIsStylebotOpen';
      }

      if (document.readyState === 'loading') {
        whenDomReady(() => handlePageMessage(message, sendResponse));
        return message.name === 'GetIsStylebotOpen';
      }

      return handlePageMessage(message, sendResponse);
    }
  );

  document.addEventListener('contextmenu', event => {
    contextMenuTarget = event.target;

    if (isEditorLoading()) {
      forwardToEditor(editor => editor.handleContextMenu(event.target));
    }
  });

  chrome.runtime.onConnect.addListener(port => {
    if (port.name !== REMOTE_PAGE_BRIDGE_PORT) {
      return;
    }

    // A window that closes while the editor loads must not be adopted, since
    // its disconnect has already fired and the editor would never see it.
    let disconnected = false;
    port.onDisconnect.addListener(() => {
      disconnected = true;
    });

    // Not held until DOMContentLoaded, which a slow script in the page's
    // head can delay by seconds; the handler waits for the body itself.
    forwardToEditorNow(editor => {
      if (!disconnected) {
        editor.handleEditorWindowPort(port);
      }
    });
  });
};

/**
 * Removes what an earlier copy of this script left on the page: after
 * Stylebot reloads it runs again here, and the old copy no longer responds.
 * A panel left behind would also stop the new one from mounting.
 */
const removeDeadEditor = (): void => {
  const host = document.getElementById('stylebot');

  // The old copy runs in another world, out of reach, but still hears the
  // page: Escape has it close its panel, which stops its inspector, whose
  // listeners on window outlive the panel's removal.
  if (host?.shadowRoot?.querySelector('.stylebot')) {
    host.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        composed: true,
      })
    );
  }

  ['stylebot', 'stylebot-overlay', 'stylebot-inspect-cursor'].forEach(id =>
    document.getElementById(id)?.remove()
  );
};

// A PDF, JSON or XML file gets nothing; its viewer breaks under the editor.
if (isStylableDocument(document.contentType)) {
  removeDeadEditor();
  listen();
}
