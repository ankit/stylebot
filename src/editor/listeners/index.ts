import { Store } from 'vuex';
import { State } from 'editor/store';

import initChromeListener from './chrome';
import initCommandListener from './commands';
import initContextMenuListener from './context-menu';
import initEditorWindowListener from './editor-window';

/**
 * The message listener goes up synchronously so a popup click can't beat
 * the async store initialization; the rest can wait for it.
 */
const initListeners = (store: Store<State>, ready: Promise<void>): void => {
  initChromeListener(store, ready);

  ready.then(() => {
    initCommandListener(store);
    initContextMenuListener(store);
    initEditorWindowListener(store);
  });
};

export { initListeners };
