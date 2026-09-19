import { createStore } from './store';
import { setPageBridge, LocalPageBridge } from '@stylebot/page-bridge';
import { initListeners } from './listeners';
import { getStylesForPage } from './utils/chrome';

const store = createStore('page');
setPageBridge(new LocalPageBridge({ getStylebotCss: () => store.state.css }));

const ready = (async () => {
  await store.dispatch('initialize');

  const { defaultStyle } = await getStylesForPage(false);
  if (defaultStyle) {
    store.dispatch('initializeDefaultStyle', defaultStyle);
  }
})();

initListeners(store, ready);
