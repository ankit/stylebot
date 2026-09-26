import type { Store } from 'vuex';

import type { State } from 'editor/store';
import type { TabMessage } from '@stylebot/types';

import { createMessageHandler } from '../handlers/message';

export const initChromeListener = (
  store: Store<State>,
  ready: Promise<void>
): void => {
  const handle = createMessageHandler(store, ready);

  chrome.runtime.onMessage.addListener(
    (message: TabMessage, _, sendResponse: (response: boolean) => void) => {
      if (window !== window.top) {
        return;
      }

      return handle(message, sendResponse);
    }
  );
};
