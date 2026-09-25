import { defaultCommands } from '@stylebot/settings';
import type { StylebotCommands } from '@stylebot/types';

export const get = async (): Promise<StylebotCommands> => {
  const items = await chrome.storage.local.get('commands');
  return items['commands'] || defaultCommands;
};

export const set = (value: StylebotCommands): Promise<void> =>
  chrome.storage.local.set({ commands: value });
