import './listeners';

import ContextMenu from './contextmenu';
import DefaultShortcutUpdate from './default-shortcut-update';
import StylesMetadataUpdate from './styles-metadata-update';
import StylesModifiedTimeUpdate from './styles-modified-time-update';

(async () => {
  await DefaultShortcutUpdate();
  await StylesMetadataUpdate();
  await StylesModifiedTimeUpdate();
})();

chrome.runtime.setUninstallURL('https://stylebot.dev/goodbye');
chrome.action.setBadgeBackgroundColor({
  color: '#555',
});

ContextMenu.init();
