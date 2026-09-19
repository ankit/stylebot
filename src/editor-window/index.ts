import Vue from 'vue';
import { t } from '@stylebot/i18n';

import { createStore } from '../editor/store';
import { setPageBridge, RemotePageBridge } from '@stylebot/page-bridge';
import { setupVue } from '../editor/utils/init-editor';
import TheStylebotApp from '../editor/components/TheStylebotApp.vue';

import { initWindowListeners } from './listeners';

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

  await bridge.connect();
  await store.dispatch('initialize');
  await store.dispatch('openStylebot', { inspect: false });

  initWindowListeners(store);

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
