import Cache from './cache';
import Options from './options';
import Listeners from './listeners';
import ContextMenu from './contextmenu';

declare global {
  interface Window {
    // todo
    saveOption: any;
  }
}

Cache.init((styles, options) => {
  ContextMenu.init();
  Listeners.init(styles, options);
});

// todo: Find alternative approach to make methods accessible to Options page
window.saveOption = Options.saveOption;
