import {
  COMMAND_NAMES,
  canSetBrowserCommands,
  getBrowserCommands,
  setBrowserCommand,
} from '@stylebot/utils';
import type { StylebotCommands } from '@stylebot/types';

export const get = getBrowserCommands;

/**
 * Applies the shortcuts that changed, where the browser lets Stylebot set
 * them, and returns what it has now: a combo it rejects keeps the old one.
 */
export const set = async (
  value: StylebotCommands
): Promise<StylebotCommands> => {
  if (canSetBrowserCommands()) {
    const current = await getBrowserCommands();

    for (const name of COMMAND_NAMES) {
      if (value[name] !== current[name]) {
        await setBrowserCommand(name, value[name]).catch(() => undefined);
      }
    }
  }

  return getBrowserCommands();
};
