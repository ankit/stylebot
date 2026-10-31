/**
 * CLI mode's terminal: where the user follows what their coding agent does on
 * the page through the `stylebot` CLI, and marks areas of it for the agent.
 * Loaded on demand by the page's Stylebot script.
 */
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import type {
  CliModeAction,
  CliModeAppWindow,
  CliModeEvent,
  CliModePageEvent,
  CliModeState,
} from '@stylebot/types';

import type { Marks } from './marks';
import { mountTerminal, type Terminal } from './mount';

type Mounted = { connected: boolean; terminal: Promise<Terminal> };

let mounted: Mounted | null = null;
// The user hid the invite on this page; it stays away until the page reloads.
let dismissed = false;

const removeTerminal = (): void => {
  const removing = mounted?.terminal;

  mounted = null;
  removing?.then(({ remove }) => remove()).catch(() => undefined);
};

/**
 * Tells the background what the user did with the terminal, resolving once
 * it has handled it.
 */
const sendTerminalEvent = async (event: CliModePageEvent): Promise<void> => {
  const message: CliModeEvent = { name: 'CliModeEvent', event };

  if (event.type === 'dismiss') {
    dismissed = true;
  }

  if (event.type === 'off' || event.type === 'dismiss') {
    removeTerminal();
  }

  await chrome.runtime.sendMessage(message).catch(() => undefined);
};

/**
 * The terminal, mounted for the connected tab or for an invite, swapping the
 * one on the page when it was mounted for the other. A new one starts from
 * the state given, so what it holds already doesn't count as news.
 */
const getTerminal = (
  connected: boolean,
  initial?: CliModeState
): Promise<Terminal> => {
  if (mounted && mounted.connected !== connected) {
    removeTerminal();
  }

  if (!mounted) {
    const terminal = mountTerminal(sendTerminalEvent, {
      connected,
      initial,
    }).catch((e: unknown) => {
      mounted = null;
      throw e;
    });

    mounted = { connected, terminal };
  }

  return mounted.terminal;
};

/**
 * The connected tab's terminal, if the page shows it.
 */
const getConnected = (): Promise<Terminal> | null =>
  mounted?.connected ? mounted.terminal : null;

/**
 * The connected tab's marks, if the page shows its terminal.
 */
const getMarks = async (): Promise<Marks | null> =>
  (await getConnected())?.marks ?? null;

/**
 * Answers what the background asks of the terminal.
 */
const handleCliModeAction = async (action: CliModeAction): Promise<unknown> => {
  switch (action.kind) {
    case 'on': {
      const { state } = await getTerminal(true, action.state);

      Object.assign(state, action.state);

      if (action.open) {
        state.expanded = true;
      }

      return null;
    }

    case 'invite': {
      if (dismissed || getConnected()) {
        return null;
      }

      const { state } = await getTerminal(false);

      state.invite = { connectedTo: action.connectedTo };
      return null;
    }

    case 'state': {
      const connected = getConnected();

      if (connected) {
        Object.assign((await connected).state, action.state);
      }

      return null;
    }

    case 'off':
      removeTerminal();
      return null;

    case 'startCapture': {
      if (!mounted) {
        return null;
      }

      const terminal = await mounted.terminal;

      await terminal.marks?.hide();
      return terminal.locate();
    }

    case 'endCapture':
      (await getMarks())?.show();
      return null;

    case 'selection':
      return (await getMarks())?.describe(action.css) ?? [];

    case 'frameMark':
      return (await getMarks())?.frame(action.n) ?? null;

    case 'restoreScroll':
      (await getMarks())?.restoreScroll();
      return null;
  }
};

const register = (): void => {
  Vue.mixin({ methods: { t } });
  (window as CliModeAppWindow).stylebotCliMode = handleCliModeAction;
};

register();
