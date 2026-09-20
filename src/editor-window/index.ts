import Vue from 'vue';
import { t } from '@stylebot/i18n';

import { createStore } from '../editor/store';
import { setPageBridge, RemotePageBridge } from '@stylebot/page-bridge';
import { setupVue } from '../editor/utils/init-editor';
import initCommandListener from '../editor/listeners/commands';
import TheStylebotApp from '../editor/components/TheStylebotApp.vue';

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
  setupVue();
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

  new Vue({
    store,
    el: '#app',
    render: h => h(TheStylebotApp),
  });
};

if (Number.isInteger(tabId) && tabId > 0) {
  start();
} else {
  renderUnavailable();
}
