import type { TerminalState } from './state';

// What the keys do besides opening and closing the terminal. Clearing
// answers whether there were marks to clear.
export type KeyActions = {
  undo: () => void;
  clearMarks: () => boolean;
};

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * Runs a key's shortcut on the terminal, returning whether it had one.
 */
export const runKey = (
  key: string,
  state: TerminalState,
  { undo, clearMarks }: KeyActions
): boolean => {
  switch (key) {
    case '.':
      state.expanded = !state.expanded;
      return true;

    case 'z':
    case 'Z':
      undo();
      return true;

    case 'x':
    case 'X':
      return clearMarks();

    case 'Escape':
      if (!state.expanded) {
        return false;
      }

      state.expanded = false;
      return true;

    default:
      return false;
  }
};

/**
 * Listens for the terminal's plain-key shortcuts, which work anywhere on
 * the page but its fields, ahead of the page's own listeners. Returns a
 * function that stops listening.
 */
export const listenForKeys = (
  state: TerminalState,
  actions: KeyActions
): (() => void) => {
  const onKey = (event: KeyboardEvent): void => {
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.isComposing ||
      isTyping(event.composedPath()[0] ?? null)
    ) {
      return;
    }

    if (runKey(event.key, state, actions)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  window.addEventListener('keydown', onKey, true);
  return () => window.removeEventListener('keydown', onKey, true);
};
