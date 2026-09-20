import { Store } from 'vuex';

import { State } from 'editor/store';
import { TabMessage } from '@stylebot/types';

import { applyReadability, removeReadability } from '@stylebot/readability';

import {
  applyStyles,
  toggleStylebot,
  toggleReadability,
  updateSelectorWithContextMenuSelector,
} from './common';

import { getStylesForPage } from '../utils/chrome';

const initChromeListener = (
  store: Store<State>,
  ready: Promise<void>
): void => {
  const { state, commit, dispatch } = store;

  // Re-derive readability only on real URL changes, not favicon/title-only
  // TabUpdated events — null so the first event here still runs.
  let lastUrl: string | null = null;

  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _, sendResponse: (response: boolean) => void) => {
      if (window !== window.top) {
        return;
      }

      // Handled once the store is initialized, so an early message isn't
      // dropped. Only GetIsStylebotOpen answers, so only it holds the channel.
      ready.then(() => handleMessage(message, sendResponse));
      return message.name === 'GetIsStylebotOpen';
    }
  );

  const handleMessage = (
    message: TabMessage,
    sendResponse: (response: boolean) => void
  ): void => {
    if (message.name === 'ToggleStylebot') {
      toggleStylebot(store);
    } else if (message.name === 'OpenStylebot') {
      if (!state.visible) {
        toggleStylebot(store);
      }
    } else if (message.name === 'OpenStylebotFromContextMenu') {
      updateSelectorWithContextMenuSelector({ state, commit });

      if (!state.visible) {
        toggleStylebot(store, false);
      }
    } else if (message.name === 'GetIsStylebotOpen') {
      sendResponse(state.visible);
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
      getStylesForPage(false).then(({ defaultStyle }) => {
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
};

export default initChromeListener;
