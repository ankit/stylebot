import Vue from 'vue';

import { StylebotCommands } from '@stylebot/types';

import { getCommands } from '../../utils/get-commands';
import { setCommands } from '../../utils/set-commands';

// Shared between TheReaderDock, MoreMenu and ShortcutMenu, which sit in
// disconnected branches of the dock's template.
const state = Vue.observable({
  commands: null as StylebotCommands | null,
  recording: false,
  promptDismissed: false,
});

const PROMPT_DISMISSED_KEY = 'readabilityShortcutPromptDismissed';

const getPromptDismissed = (): Promise<boolean> => {
  return new Promise(resolve => {
    chrome.storage.local.get(PROMPT_DISMISSED_KEY, items => {
      resolve(Boolean(items[PROMPT_DISMISSED_KEY]));
    });
  });
};

let loadPromise: Promise<void> | null = null;

const ensureLoaded = (): Promise<void> => {
  if (!loadPromise) {
    loadPromise = Promise.all([
      getCommands().then(commands => {
        state.commands = commands;
      }),
      getPromptDismissed().then(dismissed => {
        state.promptDismissed = dismissed;
      }),
    ]).then(() => undefined);
  }
  return loadPromise;
};

export const shortcutStore = {
  state,
  ensureLoaded,

  value(): string {
    return state.commands?.readability ?? '';
  },

  setRecording(recording: boolean): void {
    state.recording = recording;
  },

  dismissPrompt(): void {
    if (state.promptDismissed) {
      return;
    }

    state.promptDismissed = true;
    chrome.storage.local.set({ [PROMPT_DISMISSED_KEY]: true });
  },

  update(value: string): void {
    if (!state.commands) {
      return;
    }

    state.commands = { ...state.commands, readability: value };
    setCommands(state.commands);

    // Once a shortcut is set, the invite has served its purpose — don't
    // resurface it later if the shortcut is subsequently removed.
    if (value) {
      this.dismissPrompt();
    }
  },
};
