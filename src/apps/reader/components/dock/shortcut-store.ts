import Vue from 'vue';

import type { StylebotCommands } from '@stylebot/types';

import { getCommands } from '../../utils/get-commands';

// Shared between TheReaderDock, MoreMenu and ShortcutMenu, which sit in
// disconnected branches of the dock's template.
const state = Vue.observable({
  commands: null as StylebotCommands | null,
  promptDismissed: false,
});

const PROMPT_DISMISSED_KEY = 'readabilityShortcutPromptDismissed';

const getPromptDismissed = async (): Promise<boolean> => {
  const items = await chrome.storage.local.get(PROMPT_DISMISSED_KEY);
  return Boolean(items[PROMPT_DISMISSED_KEY]);
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

  dismissPrompt(): void {
    if (state.promptDismissed) {
      return;
    }

    state.promptDismissed = true;
    chrome.storage.local.set({ [PROMPT_DISMISSED_KEY]: true });
  },
};
