import type { Store } from 'vuex';

import type { State } from 'editor/store';

import { createCommandHandler } from '../handlers/command';
import { bindCommands } from '../utils/bind-commands';

export const initCommandListener = (store: Store<State>): void => {
  const onCommand = createCommandHandler(store);
  bindCommands(store.state.commands, onCommand);

  // Shortcuts can be changed elsewhere (the reader dock, the options page)
  // while this page is already open — re-bind so they take effect immediately.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.commands) {
      store.commit('setCommands', changes.commands.newValue);
      bindCommands(store.state.commands, onCommand);
    }
  });
};
