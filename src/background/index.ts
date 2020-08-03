import 'crx-hotreload';

import Cache from './cache';
import Listeners from './listeners';
import ContextMenu from './contextmenu';
import MigrateOldFormat from './migrate';
import DefaultShortcutUpdate from './default-shortcut-update';

(async () => {
  await MigrateOldFormat();
  await DefaultShortcutUpdate();

  const { styles, options } = await Cache.init();

  if (options.get('contextMenu')) {
    ContextMenu.init();
  }

  Listeners.init(styles, options);

  chrome.browserAction.setBadgeBackgroundColor({
    color: '#555',
  });
})();
