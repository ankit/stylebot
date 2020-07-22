import 'crx-hotreload';

import Cache from './cache';
import Listeners from './listeners';
import ContextMenu from './contextmenu';
import MigrateOldFormat from './migrate';
import NotificationManager from './notification-manager';

(async () => {
  await MigrateOldFormat();
  const { styles, options } = await Cache.init();

  if (options.get('contextMenu')) {
    ContextMenu.init();
  }

  Listeners.init(styles, options);
  NotificationManager.init();
})();
