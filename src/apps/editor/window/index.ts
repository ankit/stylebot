import { t } from '@stylebot/i18n';
import { setPageBridge, RemotePageBridge } from '@stylebot/page-bridge';

import { createStore, mountEditor } from '@stylebot/editor';
import { getPageSupport } from '@stylebot/utils';

import { getAllOptions, openEditorWindow } from '../utils/chrome';
import { initWindowListeners, initTabInfo } from './listeners';

import './index.scss';

const params = new URLSearchParams(window.location.search);
const tabId = Number(params.get('tabId'));
const host = params.get('host') === 'sidepanel' ? 'sidepanel' : 'window';
const followsActiveTab = params.has('follow');

document.documentElement.lang = t('language_code');

const renderUnavailable = (
  message = t('stylebot_cant_style_this_page')
): void => {
  const app = document.getElementById('app');
  if (app) {
    app.className = 'editor-window-unavailable';
    app.textContent = message;
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

  // Bring the editor back in front after a pick in the page, as devtools does.
  // Safari's windows.getCurrent() returns the page's window, so ask the background.
  if (host === 'window') {
    bridge.on('select', () => openEditorWindow(tabId));
  }

  initTabInfo(store, tabId);

  await bridge.connect();
  await store.dispatch('initialize');
  // A context-menu pick arrives with the connection and is already chosen.
  await store.dispatch('openStylebot', {
    inspect: host === 'sidepanel' && !store.state.activeSelector,
  });

  if (host === 'window') {
    initWindowListeners(store);
  }

  const app = document.getElementById('app');
  if (app) {
    mountEditor(store, app);
  }
};

const canStyleTab = async (tab?: chrome.tabs.Tab): Promise<boolean> =>
  !!tab && (await getPageSupport(tab)) === 'supported';

/**
 * Starts over when the tab loads a page whose answer differs from the one
 * shown, so a panel left open on a PDF becomes the editor on the next page.
 */
const watchTab = (showingEditor: boolean): void => {
  chrome.tabs.onUpdated.addListener(async (id, { status }, tab) => {
    if (id === tabId && status === 'complete') {
      if ((await canStyleTab(tab)) !== showingEditor) {
        window.location.reload();
      }
    }
  });
};

/**
 * Reopens the panel on its window's active tab, with the tab in the URL so
 * the background can tell which tab the panel is showing.
 */
const showActiveTab = async (windowId: number): Promise<boolean> => {
  const [tab] = await chrome.tabs.query({ active: true, windowId });
  if (tab?.id === undefined) {
    return false;
  }

  window.location.replace(`?tabId=${tab.id}&host=sidepanel&follow=${windowId}`);
  return true;
};

/**
 * Switches to whichever tab becomes active in the panel's window, for
 * browsers that show one panel per window, like Vivaldi.
 */
const followActiveTab = (windowId: number): void => {
  chrome.tabs.onActivated.addListener(activeInfo => {
    if (activeInfo.windowId === windowId && activeInfo.tabId !== tabId) {
      showActiveTab(windowId);
    }
  });
};

/**
 * Whether a panel per window should edit its tab: only while it's in view
 * and the side panel is the dock. Vivaldi keeps it loaded while collapsed,
 * and can't close it for a tab when the editor moves elsewhere.
 */
const shouldAttach = async (): Promise<boolean> =>
  document.visibilityState === 'visible' &&
  (await getAllOptions()).layout.dockLocation === 'sidepanel';

/**
 * Starts over when the panel comes into view or the dock changes, so it
 * attaches to its tab or lets go of it.
 */
const reloadWhenAttachChanges = (attached: boolean): void => {
  const check = async () => {
    if ((await shouldAttach()) !== attached) {
      window.location.reload();
    }
  };

  document.addEventListener('visibilitychange', check);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes['options']) {
      check();
    }
  });
};

/**
 * Opens the editor on the tab, or says the tab can't be styled rather than
 * waiting on a page script that isn't there, as on a PDF or browser page.
 */
const init = async (): Promise<void> => {
  // Browsers that ignore per-tab panels (Vivaldi) open the manifest's default.
  if (host === 'sidepanel' && !params.has('tabId')) {
    const { id } = await chrome.windows.getCurrent();
    if (id === undefined || !(await showActiveTab(id))) {
      renderUnavailable();
    }
    return;
  }

  if (followsActiveTab) {
    followActiveTab(Number(params.get('follow')));
  }

  if (!Number.isInteger(tabId) || tabId <= 0) {
    renderUnavailable();
    return;
  }

  const tab = await chrome.tabs.get(tabId).catch(() => undefined);
  const canStyle = await canStyleTab(tab);

  watchTab(canStyle);

  if (!canStyle) {
    renderUnavailable();
    return;
  }

  if (followsActiveTab) {
    const attached = await shouldAttach();
    reloadWhenAttachChanges(attached);

    if (!attached) {
      renderUnavailable(t('stylebot_isnt_set_to_open_in_the_side_panel'));
      return;
    }
  }

  start();
};

init();
