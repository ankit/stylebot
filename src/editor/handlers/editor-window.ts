import type { Store } from 'vuex';
import type { State } from 'editor/store';

import type {
  RemotePageBridgeMessageToWindow,
  RemotePageBridgeMessageToPage,
} from '@stylebot/page-bridge';
import { getPageBridge } from '@stylebot/page-bridge';
import { initEditor } from '../utils/init-editor';
import { closeEditorWindow } from '../utils/chrome';

const SYNCED_MUTATIONS: Record<
  string,
  'url' | 'css' | 'enabled' | 'readability' | 'forceImportant'
> = {
  setUrl: 'url',
  setCss: 'css',
  setEnabled: 'enabled',
  setReadability: 'readability',
  setForceImportant: 'forceImportant',
};

/**
 * Returns a handler that serves a separate editor window over its port:
 * applies what it sends, forwards page-side state and inspector picks back,
 * and cleans up any in-progress inspecting or highlight when it goes away.
 */
export const createEditorWindowHandler = (
  store: Store<State>
): ((incoming: chrome.runtime.Port) => void) => {
  // Tears down the current connection; disconnecting a port ourselves does
  // not fire our own onDisconnect, so a replacement has to call this.
  let teardown: (() => void) | null = null;

  return incoming => {
    // A second window for the same tab replaces the first.
    teardown?.();

    // The other end can be gone before onDisconnect tells us; a post then
    // throws, and must not do so from inside a store commit.
    const post = (message: RemotePageBridgeMessageToWindow) => {
      try {
        incoming.postMessage(message);
      } catch {
        //
      }
    };
    const bridge = getPageBridge();

    // The overlay tip mounts into the editor's themed root; the panel itself
    // stays hidden while the window owns the editing.
    initEditor(store);
    store.commit('setWindowConnected', true);

    post({
      type: 'connected',
      state: {
        url: store.state.url,
        css: store.state.css,
        enabled: store.state.enabled,
        readability: store.state.readability,
        forceImportant: store.state.forceImportant,
      },
      snapshot: store.state.page,
      activeSelector: store.state.activeSelector,
    });
    store.commit('setActiveSelector', '');

    // Edits the window sent must not echo back as stateChanged, or a fast
    // sequence of keystrokes has stale css overwrite newer window state.
    let applyingFromWindow = false;

    const unsubscribe = store.subscribe(mutation => {
      const key = SYNCED_MUTATIONS[mutation.type];

      if (key && !applyingFromWindow) {
        post({ type: 'stateChanged', state: { [key]: mutation.payload } });
      } else if (mutation.type === 'setPage') {
        post({ type: 'snapshotChanged', snapshot: mutation.payload });
      } else if (mutation.type === 'setActiveSelector' && mutation.payload) {
        post({
          type: 'selectorChosen',
          selector: mutation.payload,
          source: 'contextMenu',
        });
        store.commit('setActiveSelector', '');
      }
    });

    const unsubscribeSelect = bridge.on('select', selector => {
      post({ type: 'selectorChosen', selector, source: 'inspector' });
    });

    // The page has no keyboard-shortcut handler while its panel is hidden,
    // so Escape here is the way out of inspecting for the window's user.
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && store.state.inspecting) {
        store.commit('setInspecting', false);
        bridge.stopInspecting();
        post({ type: 'inspectingStopped' });
      }
    };
    document.addEventListener('keydown', onKeydown, true);

    const cleanup = () => {
      if (teardown !== cleanup) {
        return;
      }
      teardown = null;

      unsubscribe();
      unsubscribeSelect();
      document.removeEventListener('keydown', onKeydown, true);
      store.commit('setInspecting', false);
      bridge.stopInspecting();
      bridge.unhighlight();
      store.commit('setWindowConnected', false);
    };
    teardown = cleanup;

    const respond = async (id: number, work: () => Promise<unknown>) => {
      try {
        post({ type: 'response', id, result: await work() });
      } catch (e) {
        post({ type: 'response', id, error: String(e) });
      }
    };

    incoming.onMessage.addListener((message: RemotePageBridgeMessageToPage) => {
      switch (message.type) {
        case 'request':
          respond(message.id, () => {
            switch (message.method) {
              case 'getSnapshot':
                return bridge.getSnapshot();
              case 'getPageColors':
                return bridge.getPageColors();
              case 'getComputedStyles':
                return bridge.getComputedStyles(...message.args);
              case 'getPageOutline':
                return bridge.getPageOutline();
              case 'getPageCssContext':
                return bridge.getPageCssContext(...message.args);
            }
          });
          break;

        case 'applyCss':
          applyingFromWindow = true;
          try {
            store.commit('setForceImportant', message.forceImportant);
            store.dispatch('applyCss', {
              css: message.css,
              source: 'window',
            });
          } finally {
            applyingFromWindow = false;
          }
          break;

        case 'previewCss':
          bridge.setPreviewCss(message.preview);
          break;

        case 'applyReadability':
          applyingFromWindow = true;
          try {
            store.dispatch('applyReadability', message.value);
          } finally {
            applyingFromWindow = false;
          }
          break;

        case 'startInspecting':
          store.commit('setInspecting', true);
          bridge.startInspecting();
          break;

        case 'stopInspecting':
          store.commit('setInspecting', false);
          bridge.stopInspecting();
          break;

        case 'highlight':
          bridge.highlight(message.selector);
          break;

        case 'unhighlight':
          bridge.unhighlight();
          break;

        case 'openInPage':
          // Hand off before showing the panel, or its own selector edits
          // would be forwarded and wiped as context-menu picks. The port
          // itself drops when the window closes.
          cleanup();
          store.dispatch('openStylebot', { inspect: false });
          closeEditorWindow();
          break;
      }
    });

    incoming.onDisconnect.addListener(cleanup);
  };
};
