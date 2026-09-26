import type { Store } from 'vuex';

import type { State } from 'editor/store';
import type { TabMessage } from '@stylebot/types';

import { applyReadability, removeReadability } from '@stylebot/readability';

import {
  applyStyles,
  toggleStylebot,
  openStylebot,
  usesEditorWindow,
  toggleReadability,
  updateSelectorWithContextMenuSelector,
} from './common';

import { getStylesForPage, getIsEditorWindowOpen } from '../utils/chrome';

/**
 * Returns a handler for tab messages to the editor, which answers whether it
 * will respond asynchronously. Messages are held until `ready`, so one sent
 * before the store has initialized isn't dropped.
 */
export const createMessageHandler = (
  store: Store<State>,
  ready: Promise<void>
): ((
  message: TabMessage,
  sendResponse: (response: boolean) => void
) => boolean) => {
  const { state, commit, dispatch } = store;

  // Re-derive readability only on real URL changes, not favicon/title-only
  // TabUpdated events — null so the first event here still runs.
  let lastUrl: string | null = null;

  const handleMessage = (
    message: TabMessage,
    sendResponse: (response: boolean) => void
  ): void => {
    if (message.name === 'ToggleStylebot') {
      toggleStylebot(store);
    } else if (message.name === 'OpenStylebot') {
      openStylebot(store);
    } else if (message.name === 'OpenStylebotFromContextMenu') {
      updateSelectorWithContextMenuSelector({ state, commit });
      openStylebot(store, false);
    } else if (message.name === 'GetIsStylebotOpen') {
      // A window that is open but still loading hasn't connected yet;
      // the background knows either way.
      if (state.visible || state.windowConnected) {
        sendResponse(true);
      } else if (usesEditorWindow(state)) {
        getIsEditorWindowOpen().then(sendResponse);
      } else {
        sendResponse(false);
      }
    } else if (message.name === 'TabUpdated') {
      if (window.location.href === lastUrl) {
        return;
      }
      lastUrl = window.location.href;
      if (state.visible || state.windowConnected) {
        dispatch('refreshPage');
      }

      // A same-tab SPA navigation still fires this — re-derive readability
      // for the new URL instead of trusting the previous page's flag.
      getStylesForPage().then(({ defaultStyle }) => {
        const readability = Boolean(defaultStyle?.readability);
        commit('setReadability', readability);

        if (readability) {
          applyReadability();
        } else {
          removeReadability();
        }
      });
    } else if (message.name === 'ToggleReadabilityForTab') {
      toggleReadability({ state, dispatch });
    } else if (message.name === 'ReadabilityStateChanged') {
      // Keep local state in sync when a change originates outside this
      // action (e.g. the reader's own dock), so the next toggle isn't stale.
      commit('setReadability', message.value);

      if (message.value) {
        applyReadability();
      } else {
        removeReadability();
      }
    } else if (message.name === 'ApplyStylesToTab') {
      applyStyles({ state, dispatch }, message.defaultStyle, message.styles);
    }
  };

  // Only GetIsStylebotOpen answers, so only it holds the channel open.
  return (message, sendResponse) => {
    ready.then(() => handleMessage(message, sendResponse));
    return message.name === 'GetIsStylebotOpen';
  };
};

const initChromeListener = (
  store: Store<State>,
  ready: Promise<void>
): void => {
  const handle = createMessageHandler(store, ready);

  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _, sendResponse: (response: boolean) => void) => {
      if (window !== window.top) {
        return;
      }

      return handle(message, sendResponse);
    }
  );
};

export default initChromeListener;
