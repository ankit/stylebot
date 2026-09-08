import { Store } from 'vuex';
import hotkeys from 'hotkeys-js';

import { State } from 'editor/store';
import { StylebotCommandName, StylebotCommands } from '@stylebot/types';

import {
  toggleStylebot,
  toggleReadability,
  toggleGrayscale,
  sendToggleStyleMessage,
} from './common';

const handleCommand = (store: Store<State>, name: StylebotCommandName) => {
  switch (name) {
    case 'stylebot':
      toggleStylebot(store);
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
let boundCombos: string[] = [];

const bindCommands = (store: Store<State>): void => {
  boundCombos.forEach(combo => hotkeys.unbind(combo));
  boundCombos = [];

  const commands = store.state.commands;

  if (!commands) {
    return;
  }

  (Object.keys(commands) as StylebotCommandName[]).forEach(name => {
    const combo = commands[name];

    if (combo) {
      hotkeys(combo, () => handleCommand(store, name));
      boundCombos.push(combo);
    }
  });
};

const initCommandListener = (store: Store<State>): void => {
  bindCommands(store);

  // Shortcuts can be changed elsewhere (the reader dock, the options page)
  // while this page is already open — re-bind so they take effect immediately.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.commands) {
      store.commit('setCommands', changes.commands.newValue as StylebotCommands);
      bindCommands(store);
    }
  });
};

export default initCommandListener;
