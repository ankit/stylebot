import { Store } from 'vuex';
import { State } from 'editor/store';

const BOUNDS_DEBOUNCE_MS = 300;

/**
 * Remembers where the user left the window so the next one opens there.
 * Moves don't fire resize, so the final position is captured on unload.
 */
const initWindowListeners = (store: Store<State>): void => {
  const persistBounds = () => {
    store.dispatch('setLayout', {
      ...store.state.options.layout,
      window: {
        width: window.outerWidth,
        height: window.outerHeight,
        left: window.screenX,
        top: window.screenY,
      },
    });
  };

  let timer: ReturnType<typeof setTimeout> | null = null;
  window.addEventListener('resize', () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(persistBounds, BOUNDS_DEBOUNCE_MS);
  });

  window.addEventListener('pagehide', persistBounds);
};

export { initWindowListeners };
