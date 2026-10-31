/**
 * CLI mode's terminal: where the user follows what their coding agent does on
 * the page through the `stylebot` CLI. Loaded on demand by the page's
 * Stylebot script.
 */
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import type {
  CliModeAction,
  CliModeAppWindow,
  CliModeEvent,
  CliModePageEvent,
} from '@stylebot/types';

import { mountTerminal, type Terminal } from './mount';

let terminal: Promise<Terminal> | null = null;

const removeTerminal = (): void => {
  const removing = terminal;

  terminal = null;
  removing?.then(({ remove }) => remove()).catch(() => undefined);
};

/**
 * Tells the background what the user did with the terminal.
 */
const sendTerminalEvent = (event: CliModePageEvent): void => {
  const message: CliModeEvent = { name: 'CliModeEvent', event };

  if (event.type === 'off') {
    removeTerminal();
  }

  chrome.runtime.sendMessage(message).catch(() => undefined);
};

/**
 * Answers what the background asks of the terminal.
 */
const handleCliModeAction = async (action: CliModeAction): Promise<unknown> => {
  switch (action.kind) {
    case 'on': {
      terminal ??= mountTerminal(sendTerminalEvent).catch((e: unknown) => {
        terminal = null;
        throw e;
      });

      const { state } = await terminal;

      Object.assign(state, action.state);

      if (action.open) {
        state.expanded = true;
      }

      return null;
    }

    case 'state': {
      if (terminal) {
        Object.assign((await terminal).state, action.state);
      }

      return null;
    }

    case 'off':
      removeTerminal();
      return null;

    case 'locate':
      return terminal ? (await terminal).locate() : null;
  }
};

const register = (): void => {
  Vue.mixin({ methods: { t } });
  (window as CliModeAppWindow).stylebotCliMode = handleCliModeAction;
};

register();
