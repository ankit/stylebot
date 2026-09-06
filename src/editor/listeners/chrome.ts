import { Store } from 'vuex';

import { State } from 'editor/store';
import { TabMessage } from '@stylebot/types';

import {
  apply as applyReadability,
  remove as removeReadability,
} from '@stylebot/readability';

import {
  applyStyles,
  toggleStylebot,
  toggleReadability,
  updateSelectorWithContextMenuSelector,
} from './common';

import { getStylesForPage } from '../utils/chrome';

const initChromeListener = (store: Store<State>): void => {
  const { state, commit, dispatch } = store;

  // Re-derive readability only on real URL changes, not favicon/title-only
  // TabUpdated events — null so the first event here still runs.
  let lastUrl: string | null = null;

  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _, sendResponse: (response: boolean) => void) => {
      if (window !== window.top) {
        return;
      }

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
      } else if (message.name === 'ApplyStylesToTab') {
        applyStyles({ dispatch }, message.defaultStyle, message.styles);
      }
    }
  );
};

export default initChromeListener;
