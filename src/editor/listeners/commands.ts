import { Store } from 'vuex';
import hotkeys from 'hotkeys-js';

import { State } from 'editor/store';
import { StylebotCommandName } from '@stylebot/types';

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

const initCommandListener = (store: Store<State>): void => {
  const commands = store.state.commands;

  if (commands) {
    const names = Object.keys(commands) as Array<StylebotCommandName>;

    names.forEach(name => {
      if (commands[name]) {
        hotkeys(commands[name], () => {
          handleCommand(store, name);
        });
      }
    });
  }
};

export default initCommandListener;
