import { ContextMenu } from './contextmenu';
import { initListeners } from './listeners';
import { runMigrations } from './migrations';
import { ensureCompiledStyles } from './styles';
import { updatePeriodicSync } from './sync-scheduler';

initListeners();

// Alarms are set up after the migrations so the first sync they trigger
// sees repaired data.
runMigrations().then(ensureCompiledStyles).then(updatePeriodicSync);

chrome.runtime.setUninstallURL('https://stylebot.dev/goodbye');
chrome.action.setBadgeBackgroundColor({
  color: '#555',
});

ContextMenu.init();
