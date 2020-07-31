import { defaultCommands } from '@stylebot/settings';
import { StylebotCommands } from '@stylebot/types';

export const get = (): Promise<StylebotCommands> => {
  return new Promise(resolve => {
    chrome.storage.local.get('commands', items => {
      const commands = items['commands'];

      if (commands) {
        resolve(commands);
        return;
      }

      resolve(defaultCommands);
    });
  });
};

export const set = (value: StylebotCommands): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.set({ commands: value }, () => {
      resolve();
    });
  });
};
