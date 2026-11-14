import type { Commit } from 'vuex';
import { getSelector } from '@stylebot/css';
import type { LocalPageBridge } from '@stylebot/page-bridge';

/**
 * Returns a handler that remembers the element a context menu was opened
 * on and its selector, for "Style this element" to pick up.
 */
export const createContextMenuHandler =
  (
    { commit }: { commit: Commit },
    bridge: Pick<LocalPageBridge, 'setPickedElement'>
  ) =>
  (target: EventTarget | null): void => {
    if (target) {
      bridge.setPickedElement(target as HTMLElement);
      commit('setContextMenuSelector', getSelector(target as HTMLElement));
    }
  };
