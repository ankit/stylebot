import type { Store } from 'vuex';

import type { State } from 'editor/store';
import { REMOTE_PAGE_BRIDGE_PORT } from '@stylebot/page-bridge';

import { createEditorWindowHandler } from '../handlers/editor-window';

export const initEditorWindowListener = (store: Store<State>): void => {
  const handle = createEditorWindowHandler(store);

  chrome.runtime.onConnect.addListener(incoming => {
    if (incoming.name === REMOTE_PAGE_BRIDGE_PORT) {
      handle(incoming);
    }
  });
};
