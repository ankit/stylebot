export type UndoEntry = {
  css: string;
  // What made the change that replaced this css, so a run of changes from
  // one gesture (a slider drag, a burst of keystrokes) shares one step.
  source: string;
  // When the latest change in that run landed; 0 for a step that must
  // never absorb a later change.
  at: number;
};

export type UndoStack = {
  past: Array<UndoEntry>;
  future: Array<UndoEntry>;
};

export const UNDO_LIMIT = 100;
export const COALESCE_WINDOW_MS = 500;

export const emptyUndoStack = (): UndoStack => ({ past: [], future: [] });

/**
 * Records the css a change is about to replace, extending the latest step
 * when the same source repeats within the coalescing window.
 */
export const recordChange = (
  stack: UndoStack,
  css: string,
  source: string,
  at = Date.now()
): UndoStack => {
  const last = stack.past[stack.past.length - 1];

  if (last?.source === source && at - last.at < COALESCE_WINDOW_MS) {
    return {
      past: [...stack.past.slice(0, -1), { ...last, at }],
      future: [],
    };
  }

  return {
    past: [...stack.past, { css, source, at }].slice(-UNDO_LIMIT),
    future: [],
  };
};

export type UndoMove = {
  undoStack: UndoStack;
  css: string;
};

/**
 * Steps back to the css before the latest change, keeping the current css
 * around for redo. Null when there is nothing to undo.
 */
export const undoChange = (
  stack: UndoStack,
  current: string
): UndoMove | null => {
  const entry = stack.past[stack.past.length - 1];

  if (!entry) {
    return null;
  }

  return {
    undoStack: {
      past: stack.past.slice(0, -1),
      future: [...stack.future, { css: current, source: entry.source, at: 0 }],
    },
    css: entry.css,
  };
};

/**
 * Steps forward to the css an undo stepped back from. Null when there is
 * nothing to redo.
 */
export const redoChange = (
  stack: UndoStack,
  current: string
): UndoMove | null => {
  const entry = stack.future[stack.future.length - 1];

  if (!entry) {
    return null;
  }

  return {
    undoStack: {
      past: [...stack.past, { css: current, source: entry.source, at: 0 }],
      future: stack.future.slice(0, -1),
    },
    css: entry.css,
  };
};

/**
 * The fixed undo/redo combos, spelled for the platform the way the rest of
 * the shortcut UI is. Ctrl+Y also redoes off macOS; the label shows the
 * combo that works everywhere.
 */
export const undoShortcuts = (mac: boolean): { undo: string; redo: string } =>
  mac
    ? { undo: 'command+z', redo: 'command+shift+z' }
    : { undo: 'ctrl+z', redo: 'ctrl+shift+z' };

export type UndoKey = 'undo' | 'redo' | null;

/**
 * Which undo move a keydown asks for: ⌘Z / ⌘⇧Z on macOS, Ctrl+Z /
 * Ctrl+Shift+Z / Ctrl+Y elsewhere. Any other modifier mix is not ours.
 */
export const undoKeyFor = (event: KeyboardEvent, mac: boolean): UndoKey => {
  const modifier = mac ? event.metaKey : event.ctrlKey;
  const other = mac ? event.ctrlKey : event.metaKey;

  if (!modifier || other || event.altKey) {
    return null;
  }

  const key = event.key.toLowerCase();

  if (key === 'z') {
    return event.shiftKey ? 'redo' : 'undo';
  }

  if (key === 'y' && !mac && !event.shiftKey) {
    return 'redo';
  }

  return null;
};
