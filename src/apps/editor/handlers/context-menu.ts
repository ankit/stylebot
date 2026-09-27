import type { Commit } from 'vuex';
import { getSelector } from '@stylebot/css';

/**
 * Returns a handler that remembers the selector of the element a context menu
 * was opened on, for "Style this element" to pick up.
 */
export const createContextMenuHandler =
  ({ commit }: { commit: Commit }) =>
  (target: EventTarget | null): void => {
    if (target) {
      commit('setContextMenuSelector', getSelector(target as HTMLElement));
    }
  };
