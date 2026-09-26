import type { Commit } from 'vuex';
import { getSelector } from '@stylebot/css';

/**
 * Remembers the selector of the element a context menu was opened on, for
 * "Style this element" to pick up.
 */
export const handleContextMenu = (
  { commit }: { commit: Commit },
  target: EventTarget | null
): void => {
  if (target) {
    commit('setContextMenuSelector', getSelector(target as HTMLElement));
  }
};

const initContextMenuListener = (store: { commit: Commit }): void => {
  document.addEventListener('contextmenu', event =>
    handleContextMenu(store, event.target)
  );
};

export default initContextMenuListener;
