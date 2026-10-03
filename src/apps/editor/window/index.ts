import { t } from '@stylebot/i18n';
import { setPageBridge, RemotePageBridge } from '@stylebot/page-bridge';

import { createStore, mountEditor } from '@stylebot/editor';

import { initWindowListeners, initTabInfo } from './listeners';

import './index.scss';

const params = new URLSearchParams(window.location.search);
const tabId = Number(params.get('tabId'));
const host = params.get('host') === 'sidepanel' ? 'sidepanel' : 'window';

document.documentElement.lang = t('language_code');

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

// Read back by appearance-init.js when the page is opened without an appearance.
const APPEARANCE_KEY = 'editor-window-appearance';

const rememberAppearance = (appearance: string): void => {
  try {
    localStorage.setItem(APPEARANCE_KEY, appearance);
  } catch {
    //
  }
};

const start = async (): Promise<void> => {
  const store = createStore(host);
  store.subscribe(mutation => {
    if (mutation.type === 'setOptions') {
      rememberAppearance(mutation.payload.appearance);
    }
  });
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
    // Replayed so the panel's own shortcut handling takes it as if typed here.
    onShortcut: key =>
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      ),
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
  if (host === 'window') {
    bridge.on('select', () => {
      chrome.windows.getCurrent().then(current => {
        if (current.id !== undefined) {
          chrome.windows.update(current.id, { focused: true });
        }
      });
    });
  }

  initTabInfo(store, tabId);

  await bridge.connect();
  await store.dispatch('initialize');
  await store.dispatch('openStylebot', { inspect: false });

  if (host === 'window') {
    initWindowListeners(store);
  }

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
