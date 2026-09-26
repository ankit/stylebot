import type { Store } from 'vuex';
import type { State } from 'editor/store';
import type { StylebotOptions } from '@stylebot/types';

/**
 * Options can change from the editor window while this page is open; mirror
 * only the keys a write actually changed, so a mode override the page holds
 * locally without persisting isn't clobbered by an unrelated write.
 */
const initOptionsListener = (store: Store<State>): void => {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    const options = changes.options?.newValue as StylebotOptions | undefined;
    const previous = changes.options?.oldValue as
      | Partial<StylebotOptions>
      | undefined;

    if (areaName !== 'local' || !options) {
      return;
    }

    const changed = (
      Object.keys(options) as Array<keyof StylebotOptions>
    ).filter(
      name => JSON.stringify(options[name]) !== JSON.stringify(previous?.[name])
    );

    if (changed.length === 0) {
      return;
    }

    store.commit('setOptions', {
      ...store.state.options,
      ...Object.fromEntries(changed.map(name => [name, options[name]])),
    });
  });
};

export default initOptionsListener;
