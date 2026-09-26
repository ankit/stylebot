import { setPageBridge, LocalPageBridge } from '@stylebot/page-bridge';

import { createCommandHandler } from './handlers/command';
import { createContextMenuHandler } from './handlers/context-menu';
import { createEditorWindowHandler } from './handlers/editor-window';
import { createMessageHandler } from './handlers/message';
import initOptionsListener from './listeners/options';
import type { EditorApp, EditorAppWindow } from './load-editor';
import { createStore } from './store';
import { onCommandsChanged } from './utils/bind-commands';
import { getStylesForPage } from './utils/chrome';

const store = createStore('page');
store.commit('setUrl', document.domain);
setPageBridge(new LocalPageBridge({ getStylebotCss: () => store.state.css }));

const ready = (async () => {
  await store.dispatch('initialize');

  const { defaultStyle } = await getStylesForPage();
  if (defaultStyle) {
    store.dispatch('initializeDefaultStyle', defaultStyle);
  }
})();

(window as EditorAppWindow).stylebotEditorApp = ready.then((): EditorApp => {
  initOptionsListener(store);
  onCommandsChanged(commands => store.commit('setCommands', commands));

  return {
    handleMessage: createMessageHandler(store, ready),
    handleCommand: createCommandHandler(store),
    handleContextMenu: createContextMenuHandler(store),
    handleEditorWindowPort: createEditorWindowHandler(store),
  };
});
