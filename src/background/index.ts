import 'crx-hotreload';

import Cache from './cache';
import Listeners from './listeners';
import ContextMenu from './contextmenu';
import NotificationManager from './notification-manager';

Cache.init((styles, options) => {
  if (options.get('contextMenu')) {
    ContextMenu.init();
  }

  Listeners.init(styles, options);
  NotificationManager.init();
});
