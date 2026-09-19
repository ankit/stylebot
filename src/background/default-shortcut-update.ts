import { set as setCommands } from './commands';
import { defaultCommands } from '@stylebot/settings';

const defaultShortcutUpdate = async (): Promise<void> => {
  const key = `default_shortcut_update_complete`;
  const items = await chrome.storage.local.get(key);

  if (items[key]) {
    // update has already been applied.
    return;
  }

  // override default global shortcuts for all existing users
  // since the previous default shortcuts conflict with languages
  // and easy to accidentally press.
  await setCommands(defaultCommands);
  await chrome.storage.local.set({ [key]: true });
};

export default defaultShortcutUpdate;
