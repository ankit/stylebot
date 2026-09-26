import type { Store } from 'vuex';
import hotkeys from 'hotkeys-js';

import type { State } from 'editor/store';
import type { StylebotCommandName, StylebotCommands } from '@stylebot/types';

import {
  toggleStylebot,
  toggleReadability,
  toggleGrayscale,
  sendToggleStyleMessage,
} from './common';

/**
 * Runs a Stylebot keyboard shortcut against the editor store.
 */
export const handleCommand = (
  store: Store<State>,
  name: StylebotCommandName
): void => {
  switch (name) {
    case 'stylebot':
      if (store.state.host === 'window') {
        store.dispatch('closeStylebot');
      } else {
        toggleStylebot(store);
      }
      break;

    case 'style':
      sendToggleStyleMessage(store);
      break;

    case 'readability':
      toggleReadability(store);
      break;

    case 'grayscale':
      toggleGrayscale(store);
      break;
  }
};

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

const initCommandListener = (store: Store<State>): void => {
  const onCommand = (name: StylebotCommandName) => handleCommand(store, name);
  bindCommands(store.state.commands, onCommand);

  // Shortcuts can be changed elsewhere (the reader dock, the options page)
  // while this page is already open — re-bind so they take effect immediately.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.commands) {
      store.commit('setCommands', changes.commands.newValue);
      bindCommands(store.state.commands, onCommand);
    }
  });
};

export default initCommandListener;
