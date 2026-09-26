import hotkeys from 'hotkeys-js';

import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';

// Combos currently bound via hotkeys(), so a later re-bind can unbind them first.
let boundCombos: Array<string> = [];

/**
 * Binds each shortcut's key combo to onCommand, replacing any combos bound
 * by an earlier call.
 */
export const bindCommands = (
  commands: StylebotCommands | null,
  onCommand: (name: StylebotCommandName) => void
): void => {
  boundCombos.forEach(combo => hotkeys.unbind(combo));
  boundCombos = [];

  if (!commands) {
    return;
  }

  (Object.keys(commands) as Array<StylebotCommandName>).forEach(name => {
    const combo = commands[name];

    if (combo) {
      hotkeys(combo, () => onCommand(name));
      boundCombos.push(combo);
    }
  });
};
