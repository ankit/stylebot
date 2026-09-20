import './listeners';

import ContextMenu from './contextmenu';
import { runMigrations } from './migrations';

runMigrations();

chrome.runtime.setUninstallURL('https://stylebot.dev/goodbye');
chrome.action.setBadgeBackgroundColor({
  color: '#555',
});

ContextMenu.init();
