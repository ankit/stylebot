import type {
  GetCommands,
  RunPageCommand,
  StylebotCommands,
} from '@stylebot/types';
import {
  COMMAND_NAMES,
  detectChromiumVariant,
  doShortcutsWorkInChromiumVariant,
} from '@stylebot/utils';

import { whenDomReady } from './utils/dom-ready';

const NAMED_CODES: Record<string, string> = {
  Comma: ',',
  Period: '.',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Space: 'space',
  Home: 'home',
  End: 'end',
  Insert: 'insert',
  Delete: 'delete',
};

/**
 * The key a keydown is for, as a Stylebot combo names it. Read from the
 * physical key, since Option on macOS turns the typed character into another.
 */
const keyOf = (code: string): string | undefined => {
  const letter = /^Key([A-Z])$/.exec(code);
  if (letter) {
    return letter[1].toLowerCase();
  }

  const digit = /^Digit([0-9])$/.exec(code);
  if (digit) {
    return digit[1];
  }

  if (/^F([1-9]|1[0-2])$/.test(code)) {
    return code.toLowerCase();
  }

  return NAMED_CODES[code];
};

/**
 * Turns a keydown into a Stylebot combo ("alt+shift+m"), in the modifier
 * order fromBrowserShortcut writes.
 */
export const toCombo = (event: KeyboardEvent): string => {
  const key = keyOf(event.code);
  if (!key) {
    return '';
  }

  return [
    event.ctrlKey && 'ctrl',
    event.altKey && 'alt',
    event.shiftKey && 'shift',
    event.metaKey && 'command',
    key,
  ]
    .filter(Boolean)
    .join('+');
};

/**
 * Catches Stylebot's global shortcuts in the page where the browser doesn't
 * pass them on, and has the background carry them out as it would a
 * browser's.
 */
export const initPageShortcuts = (): void => {
  whenDomReady(async () => {
    if (doShortcutsWorkInChromiumVariant(await detectChromiumVariant())) {
      return;
    }

    const getCommands: GetCommands = { name: 'GetCommands' };
    const commands: StylebotCommands = await chrome.runtime.sendMessage(
      getCommands
    );

    window.addEventListener(
      'keydown',
      event => {
        const combo = toCombo(event);
        const command = COMMAND_NAMES.find(
          name => combo && commands[name] === combo
        );
        if (!command) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const message: RunPageCommand = { name: 'RunPageCommand', command };
        chrome.runtime.sendMessage(message);
      },
      true
    );
  });
};
