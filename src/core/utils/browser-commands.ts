import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';

import { fromBrowserShortcut, toBrowserShortcut } from './browser-shortcut';
import { isMac } from './is-mac';

export const COMMAND_NAMES: Array<StylebotCommandName> = [
  'stylebot',
  'style',
  'readability',
  'grayscale',
];

/**
 * Reads the global shortcuts from the browser, which owns them. Only
 * extension pages and the background can reach chrome.commands.
 */
export const getBrowserCommands = async (): Promise<StylebotCommands> => {
  const commands = await chrome.commands.getAll();
  const mac = isMac();

  return Object.fromEntries(
    COMMAND_NAMES.map(name => [
      name,
      fromBrowserShortcut(
        commands.find(command => command.name === name)?.shortcut ?? '',
        mac
      ),
    ])
  ) as StylebotCommands;
};

/**
 * Whether Stylebot can change its own shortcuts. Firefox lets it; Chrome and
 * Edge keep that to their extension shortcuts page.
 */
export const canSetBrowserCommands = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome.commands?.update;

/**
 * Sets a global shortcut in the browser, rejecting a combo it can't take.
 */
export const setBrowserCommand = async (
  name: StylebotCommandName,
  combo: string
): Promise<void> => {
  const shortcut = toBrowserShortcut(combo, isMac());

  if (shortcut === null) {
    throw new Error(`Unsupported shortcut: ${combo}`);
  }

  await chrome.commands.update?.({ name, shortcut });
};
