import { Store } from 'vuex';

import { State } from 'editor/store';
import { TabMessage } from '@stylebot/types';

import { apply as applyReadability } from '@stylebot/readability';

import {
  toggleStylebot,
  toggleReadability,
  enableStyle,
  disableStyle,
  updateSelectorWithContextMenuSelector,
} from './common';

const initChromeListener = (store: Store<State>): void => {
  const { state, commit, dispatch } = store;

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
      } else if (message.name === 'EnableStyleForTab') {
        enableStyle({ state, commit }, message.css, message.url);
      } else if (message.name === 'DisableStyleForTab') {
        disableStyle({ state, commit }, message.url);
      } else if (message.name === 'TabUpdated') {
        if (state.readability) {
          applyReadability();
        }
      } else if (message.name === 'GetIsStylebotOpen') {
        sendResponse(state.visible);
      } else if (message.name === 'ToggleReadabilityForTab') {
        toggleReadability({ state, dispatch });
      }
    }
  );
};

export default initChromeListener;
