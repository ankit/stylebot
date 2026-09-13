/**
 * Injects custom CSS for the page as soon as it starts loading. Applies the
 * localStorage cache (cache.ts) immediately if there is one, otherwise hides
 * the page (hide-page.ts) until chrome.storage.local.get resolves.
 */
import { extractImports, pruneImportCache, getSelector } from '@stylebot/css';
// Bypasses the @stylebot/readability barrel, whose side-effectful SCSS
// import defeats tree-shaking and would pull the whole apply/reader/Defuddle
// stack into this document_start bundle just for this one heuristic.
import { isReaderable } from '../readability/eligibility';
import { getStylesForPage } from '@stylebot/styles';
import { defaultCommands } from '@stylebot/settings';
import { keydownToShortcut } from '@stylebot/utils';
import {
  StyleMap,
  TabMessage,
  StylebotCommands,
  StylebotCommandName,
  RequestEditorInjection,
} from '@stylebot/types';

import { applyState } from './apply-state';
import { CachedState, readCache, writeCache } from './cache';
import { hidePage, revealPage } from './hide-page';

// editor/index.js is on-demand injected (Chrome/Edge only — Firefox keeps it
// static), so the first keyboard-shortcut press on a page has to be caught
// here instead, before it exists.
const initHotkeyListener = (): void => {
  let commands: StylebotCommands = defaultCommands;

  chrome.storage.local.get('commands', items => {
    commands = items['commands'] || defaultCommands;
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.commands) {
      commands = changes.commands.newValue || defaultCommands;
    }
  });

  const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    // Mirrors hotkeys-js's default filter (used once editor/index.js takes
    // over hotkey binding for the rest of the page's lifetime), plus
    // contentEditable, which it doesn't check but arguably should.
    return (
      ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
      target.isContentEditable
    );
  };

  document.addEventListener('keydown', event => {
    // Once editor/index.js's own hotkeys-js binding is live, it's the
    // authoritative handler — without this, a keypress after the editor's
    // already open would fire the command twice.
    if (window.__stylebotHotkeysBound) {
      return;
    }

    if (isEditableTarget(event.target)) {
      return;
    }

    const combo = keydownToShortcut(event);
    if (!combo) {
      return;
    }

    const name = (Object.keys(commands) as StylebotCommandName[]).find(
      commandName => commands[commandName] === combo
    );

    if (name) {
      const message: RequestEditorInjection = {
        name: 'RequestEditorInjection',
        command: name,
      };
      chrome.runtime.sendMessage(message);
    }
  });
};

// Right-click target capture also has to live here now, for the same
// on-demand-injection reason — it stays running for the tab's whole
// lifetime, so it keeps working correctly even after the editor's loaded.
const initContextMenuSelectorListener = (): void => {
  document.addEventListener('contextmenu', event => {
    if (event.target) {
      window.__stylebotPendingContextMenuSelector = getSelector(
        event.target as HTMLElement
      );
    }
  });
};

// Registered synchronously here (unlike the editor script's listener,
// gated behind async init) so the popup always gets a response.
if (window === window.top) {
  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _sender, sendResponse: (response: boolean) => void) => {
      if (message.name === 'GetIsPageReaderable') {
        sendResponse(isReaderable());
      } else if (message.name === 'GetIsReadabilityActive') {
        sendResponse(!!document.getElementById('stylebot-reader'));
      }
    }
  );

  initHotkeyListener();
  initContextMenuSelectorListener();
}

// Fallback if the storage read (or an @import fetch) stalls — real
// completion almost always wins the race and reveals sooner.
const REVEAL_TIMEOUT_MS = 150;

const run = () => {
  const cached = readCache();

  if (cached) {
    applyState(cached);
  } else {
    hidePage();
  }

  const revealTimeout = setTimeout(revealPage, REVEAL_TIMEOUT_MS);

  chrome.storage.local.get('styles', items => {
    const allStyles: StyleMap = items['styles'] || {};
    const { styles, defaultStyle } = getStylesForPage(
      window.location.href,
      allStyles,
      true
    );

    const freshState: CachedState = {
      styles: styles.map(({ url, css, enabled }) => ({ url, css, enabled })),
      readability: Boolean(defaultStyle && defaultStyle.readability),
    };

    const finish = () => {
      writeCache(freshState);

      const liveImportUrls = new Set(
        freshState.styles.flatMap(
          style => extractImports(style.css).importUrls
        )
      );
      pruneImportCache(liveImportUrls);

      clearTimeout(revealTimeout);
      revealPage();
    };

    if (cached && JSON.stringify(cached) === JSON.stringify(freshState)) {
      finish();
      return;
    }

    applyState(freshState).then(finish);
  });
};

run();
