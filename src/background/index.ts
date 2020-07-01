import Cache from './cache';
import Options from './options';
import Listeners from './listeners';

import ContextMenu from './contextmenu';
import BrowserAction from './browseraction';

declare global {
  interface Window {
    // todo
    saveOption: any;
  }
}

Cache.init(() => {
  Listeners.init();
  ContextMenu.init();
  BrowserAction.init();
});

// todo: Find alternative approach to make methods accessible to Options page
window.saveOption = Options.saveOption;
