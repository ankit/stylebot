import { defaultCommands } from '@stylebot/settings';
import { canSetBrowserCommands } from '@stylebot/utils';

import { set as setCommands } from '../commands';

const MIGRATION_KEY = 'migration_commands_to_browser';

/**
 * Moves the shortcuts Stylebot kept in storage into the browser, which owns
 * them now. Only Firefox lets an extension set them; on Chrome and Edge a
 * customized shortcut has to be set again in the browser.
 */
const commandsToBrowser = async (): Promise<void> => {
  const items = await chrome.storage.local.get([MIGRATION_KEY, 'commands']);

  if (items[MIGRATION_KEY]) {
    return;
  }

  if (items['commands'] && canSetBrowserCommands()) {
    await setCommands({ ...defaultCommands, ...items['commands'] });
  }

  await chrome.storage.local.remove('commands');
  await chrome.storage.local.set({ [MIGRATION_KEY]: true });
};

export default commandsToBrowser;
