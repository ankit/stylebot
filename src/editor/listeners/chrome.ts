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

  // chrome.tabs.onUpdated (and so 'TabUpdated') also fires for favicon/title
  // changes with no navigation — only re-derive readability when the URL
  // actually changed, so those don't race a just-persisted toggle. Starts
  // null so the first 'TabUpdated' for this page load isn't skipped too.
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
