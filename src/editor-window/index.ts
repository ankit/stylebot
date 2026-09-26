import { t } from '@stylebot/i18n';
import { setPageBridge, RemotePageBridge } from '@stylebot/page-bridge';

import {
  createStore,
  mountEditor,
  initCommandListener,
} from '@stylebot/editor';

import { initWindowListeners, initTabInfo } from './listeners';

import './index.scss';

const tabId = Number(new URLSearchParams(window.location.search).get('tabId'));

const renderUnavailable = (): void => {
  const app = document.getElementById('app');
  if (app) {
    app.className = 'editor-window-unavailable';
    app.textContent = t('editor_window_unavailable');
  }
};

const updateTitle = (href: string): void => {
  try {
    document.title = t('editor_window_title', [new URL(href).hostname]);
  } catch {
    //
  }
};

const start = async (): Promise<void> => {
  const store = createStore('window');
  store.commit('setTabId', tabId);

  const bridge = new RemotePageBridge(tabId, {
    onStateChanged: state => store.dispatch('syncFromPage', state),
    onSnapshotChanged: snapshot => {
      store.commit('setPage', snapshot);
      updateTitle(snapshot.href);
    },
    onContextMenuSelector: selector => {
      store.commit('setInspecting', false);
      store.commit('setActiveSelector', selector);
    },
    onInspectingStopped: () => store.commit('setInspecting', false),
  });

  setPageBridge(bridge);
  bridge.on('connection', connected => {
    store.commit('setPageConnected', connected);
    // The reconnecting content script starts out not inspecting.
    if (!connected) {
      store.commit('setInspecting', false);
    }
  });

  // Picking an element happens in the page's window; bring the editor back
  // in front so the pick can be styled right away, as devtools does.
  bridge.on('select', () => {
    chrome.windows.getCurrent().then(current => {
      if (current.id !== undefined) {
        chrome.windows.update(current.id, { focused: true });
      }
    });
  });

  initTabInfo(store, tabId);

  await bridge.connect();
  await store.dispatch('initialize');
  await store.dispatch('openStylebot', { inspect: false });

  initWindowListeners(store);
  initCommandListener(store);

  const app = document.getElementById('app');
  if (app) {
    mountEditor(store, app);
  }
};

if (Number.isInteger(tabId) && tabId > 0) {
  start();
} else {
  renderUnavailable();
}
