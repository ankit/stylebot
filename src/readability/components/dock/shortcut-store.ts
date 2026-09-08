import Vue from 'vue';

import { StylebotCommands } from '@stylebot/types';

import { getCommands } from '../../utils/get-commands';
import { setCommands } from '../../utils/set-commands';
import { formatShortcut } from './utils/format-shortcut';

// Shared between TheReaderDock's keycap tooltip and ShortcutMenu, which sit
// in disconnected branches of the dock's template.
const state = Vue.observable({
  commands: null as StylebotCommands | null,
  recording: false,
});

let loadPromise: Promise<void> | null = null;

const ensureLoaded = (): Promise<void> => {
  if (!loadPromise) {
    loadPromise = getCommands().then(commands => {
      state.commands = commands;
    });
  }
  return loadPromise;
};

export const shortcutStore = {
  state,
  ensureLoaded,

  get value(): string {
    return state.commands?.readability ?? '';
  },

  get tooltip(): string {
    if (!this.value) {
      return 'Set a shortcut to toggle readability on a site';
    }

    const { parts, joiner } = formatShortcut(this.value);
    return `Modify shortcut (${parts.join(joiner)}) to toggle readability on a site`;
  },

  setRecording(recording: boolean): void {
    state.recording = recording;
  },

  update(value: string): void {
    if (!state.commands) {
      return;
    }

    state.commands = { ...state.commands, readability: value };
    setCommands(state.commands);
  },
};
