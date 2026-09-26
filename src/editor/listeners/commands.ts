import type { Store } from 'vuex';

import type { State } from 'editor/store';

import { createCommandHandler } from '../handlers/command';
import { bindCommands, onCommandsChanged } from '../utils/bind-commands';

export const initCommandListener = (store: Store<State>): void => {
  const onCommand = createCommandHandler(store);
  bindCommands(store.state.commands, onCommand);

  onCommandsChanged(commands => {
    store.commit('setCommands', commands);
    bindCommands(store.state.commands, onCommand);
  });
};
