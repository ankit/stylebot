import type { Store } from 'vuex';
import type { State } from 'editor/store';
import type { StylebotOptions } from '@stylebot/types';

/**
 * The dock location (and window bounds) can change from the editor window
 * while this page is open; mirror just that, so a mode override the page
 * holds locally without persisting isn't clobbered.
 */
const initOptionsListener = (store: Store<State>): void => {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const options = changes.options?.newValue as StylebotOptions | undefined;

    if (areaName === 'local' && options?.layout) {
      store.commit('setOptions', {
        ...store.state.options,
        layout: options.layout,
      });
    }
  });
};

export default initOptionsListener;
