import 'crx-hotreload';

import Cache from './cache';
import Listeners from './listeners';
import ContextMenu from './contextmenu';
import DefaultShortcutUpdate from './default-shortcut-update';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';

(async () => {
  await DefaultShortcutUpdate();
  await StylesMetadataUpdate();
  await StylesModifiedTimeUpdate();

  const { styles, options } = await Cache.init();

  if (options.get('contextMenu')) {
    ContextMenu.init();
  }

  Listeners.init(styles, options);

  chrome.browserAction.setBadgeBackgroundColor({
    color: '#555',
  });
})();
