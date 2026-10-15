import { setPageBridge, LocalPageBridge } from '@stylebot/page-bridge';

import { createCommandHandler } from './handlers/command';
import { createContextMenuHandler } from './handlers/context-menu';
import { createEditorWindowHandler } from './handlers/editor-window';
import { createMessageHandler } from './handlers/message';
import initOptionsListener from './listeners/options';
import type { EditorApp, EditorAppWindow } from './load-editor';
import { createStore } from './store';
import { getStylesForPage } from './utils/chrome';
import { initEditor, preloadEditorCss } from './utils/init-editor';

const store = createStore('page');
store.commit('setUrl', document.domain);
setPageBridge(
  new LocalPageBridge({
    getStylebotCss: () => store.state.css,
    // The side panel and window ask for it too, before the page has a panel.
    reviewScreenshot: screenshot => {
      initEditor(store);
      return store.dispatch('reviewScreenshot', screenshot);
    },
  })
);

preloadEditorCss().catch(() => undefined);

const ready = (async () => {
  const [{ defaultStyle }] = await Promise.all([
    getStylesForPage(),
    store.dispatch('initialize'),
  ]);

  if (defaultStyle) {
    store.dispatch('initializeDefaultStyle', defaultStyle);
  }
})();

(window as EditorAppWindow).stylebotEditorApp = ready.then((): EditorApp => {
  initOptionsListener(store);

  return {
    handleMessage: createMessageHandler(store, ready),
    handleCommand: createCommandHandler(store),
    handleContextMenu: createContextMenuHandler(store),
    handleEditorWindowPort: createEditorWindowHandler(store),
  };
});
