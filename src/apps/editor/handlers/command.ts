import type { Store } from 'vuex';

import type { State } from 'apps/editor/store';
import type { StylebotCommandName } from '@stylebot/types';

import { toggleStylebot, toggleReadability, toggleGrayscale } from './common';

/**
 * Returns a handler that runs a Stylebot keyboard shortcut against the store.
 */
export const createCommandHandler =
  (store: Store<State>) =>
  (name: StylebotCommandName): void => {
    switch (name) {
      case 'stylebot':
        toggleStylebot(store);
        break;

      case 'readability':
        toggleReadability(store);
        break;

      case 'grayscale':
        toggleGrayscale(store);
        break;
    }
  };
