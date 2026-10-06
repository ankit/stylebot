import { ContextMenu } from './contextmenu';
import { initListeners } from './listeners';
import { runMigrations } from './migrations';
import { ensureCompiledStyles, holdWritesUntil } from './styles';
import { updatePeriodicSync } from './sync-scheduler';

initListeners();

// Before any event is dispatched, so no write reads styles a migration has
// yet to repair. runMigrations never rejects, so startup always continues.
holdWritesUntil(runMigrations());
ensureCompiledStyles().then(updatePeriodicSync);

chrome.runtime.setUninstallURL('https://stylebot.dev/goodbye');
chrome.action.setBadgeBackgroundColor({
  color: '#555',
});

ContextMenu.init();
