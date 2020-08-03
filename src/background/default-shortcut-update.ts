import { set as setCommands } from './commands';
import { defaultCommands } from '@stylebot/settings';

const defaultShortcutUpdate = async (): Promise<void> => {
  const key = `default_shortcut_update_complete`;

  return new Promise(resolve => {
    chrome.storage.local.get(key, async items => {
      if (items[key]) {
        // update has already been applied.
        resolve();
        return;
      }

      // override default global shortcuts for all existing users
      // since the previous default shortcuts conflict with languages
      // and easy to accidentally press.
      await setCommands(defaultCommands);

      chrome.storage.local.set({ [key]: true }, () => {
        resolve();
      });
    });
  });
};

export default defaultShortcutUpdate;
