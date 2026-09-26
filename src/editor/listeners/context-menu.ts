import type { Commit } from 'vuex';

import { createContextMenuHandler } from '../handlers/context-menu';

export const initContextMenuListener = (store: { commit: Commit }): void => {
  const handle = createContextMenuHandler(store);
  document.addEventListener('contextmenu', event => handle(event.target));
};
