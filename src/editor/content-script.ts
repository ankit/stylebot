/**
 * Listens for the page's editor events and loads the editor on first use.
 * Until then, events that only touch the page are handled here, so a page
 * where Stylebot is never opened doesn't load the editor at all.
 */
import { reapplySavedStyles } from '@stylebot/inject-css';
import { applyReadability, removeReadability } from '@stylebot/readability';
import type { StylebotCommandName, TabMessage } from '@stylebot/types';

// The page-bridge entry would bundle the in-page bridge, and with it postcss.
import { REMOTE_PAGE_BRIDGE_PORT } from '../page-bridge/remote-page-bridge/constants';

import type { EditorApp } from './load-editor';
import { isEditorLoading, loadEditor } from './load-editor';
import { bindCommands, onCommandsChanged } from './utils/bind-commands';
import {
  getCommands,
  getIsEditorWindowOpen,
  getStylesForPage,
} from './utils/chrome';

const EDITOR_MESSAGES: Array<TabMessage['name']> = [
  'ToggleStylebot',
  'OpenStylebot',
  'OpenStylebotFromContextMenu',
  'ToggleReadabilityForTab',
];

let contextMenuTarget: EventTarget | null = null;

/**
 * Runs work against the editor, loading it first if needed. The first load
 * replays the last context menu target, which the editor didn't see.
 */
const withEditor = (work: (app: EditorApp) => void): void => {
  const firstLoad = !isEditorLoading();
  const app = loadEditor();

  if (firstLoad) {
    app.then(editor => editor.handleContextMenu(contextMenuTarget));
  }

  app.then(work).catch(() => undefined);
};

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

chrome.runtime.onMessage.addListener(
  (message: TabMessage, _, sendResponse: (response: boolean) => void) => {
    if (window !== window.top) {
      return;
    }

    if (isEditorLoading() || EDITOR_MESSAGES.includes(message.name)) {
      withEditor(editor => editor.handleMessage(message, sendResponse));
      return message.name === 'GetIsStylebotOpen';
    }

    return handlePageMessage(message, sendResponse);
  }
);

const runCommand = (name: StylebotCommandName) =>
  withEditor(editor => editor.handleCommand(name));

getCommands().then(commands => bindCommands(commands, runCommand));
onCommandsChanged(commands => bindCommands(commands, runCommand));

document.addEventListener('contextmenu', event => {
  contextMenuTarget = event.target;

  if (isEditorLoading()) {
    withEditor(editor => editor.handleContextMenu(event.target));
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

  withEditor(editor => {
    if (!disconnected) {
      editor.handleEditorWindowPort(port);
    }
  });
});
