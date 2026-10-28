import { supportsCLI } from '@stylebot/settings';
import { getGoodbyeUrl } from '@stylebot/utils';

import { initCliBridge } from './cli';
import { ContextMenu } from './contextmenu';
import { scheduleGalleryUpdates } from './gallery-updates';
import { initListeners } from './listeners';
import { runMigrations } from './migrations';
import { ensureCompiledStyles, holdWritesUntil } from './styles';
import { updatePeriodicSync } from './sync-scheduler';

initListeners();

// Before any event is dispatched, so no write reads styles a migration has
// yet to repair. runMigrations never rejects, so startup always continues.
holdWritesUntil(runMigrations());
ensureCompiledStyles().then(updatePeriodicSync);
scheduleGalleryUpdates();

chrome.runtime.setUninstallURL(getGoodbyeUrl());

ContextMenu.init();

if (supportsCLI()) {
  initCliBridge();
}
