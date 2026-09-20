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

/**
 * Mirrors the tab's title and favicon into the store so the window can
 * show which tab it is editing, following the tab as it navigates.
 */
const initTabInfo = (store: Store<State>, tabId: number): void => {
  const update = (tab: chrome.tabs.Tab) => {
    store.commit('setTab', {
      title: tab.title ?? '',
      favIconUrl: tab.favIconUrl ?? '',
      active: tab.active,
    });
  };

  const refresh = () => chrome.tabs.get(tabId).then(update, () => undefined);
  refresh();

  chrome.tabs.onUpdated.addListener((updatedTabId, changeInfo, tab) => {
    if (
      updatedTabId === tabId &&
      (changeInfo.title !== undefined || changeInfo.favIconUrl !== undefined)
    ) {
      update(tab);
    }
  });

  // Another tab taking over the tab's window, or it being moved, changes
  // whether the page being edited is actually on screen.
  chrome.tabs.onActivated.addListener(refresh);
  chrome.tabs.onAttached.addListener(refresh);
};

export { initWindowListeners, initTabInfo };
