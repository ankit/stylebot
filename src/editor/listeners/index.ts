import { Store } from 'vuex';
import { State } from 'editor/store';

import initChromeListener from './chrome';
import initCommandListener from './commands';
import initContextMenuListener from './context-menu';

const initListeners = (store: Store<State>): void => {
  initChromeListener(store);
  initCommandListener(store);
  initContextMenuListener(store);
};

export { initListeners };
