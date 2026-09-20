import {
  COALESCE_WINDOW_MS,
  UNDO_LIMIT,
  emptyUndoStack,
  undoKeyFor,
  undoShortcuts,
  recordChange,
  redoChange,
  undoChange,
} from '../undo-stack';

const key = (init: KeyboardEventInit): KeyboardEvent =>
  new KeyboardEvent('keydown', init);

describe('undo stack', () => {
  describe('recordChange', () => {
    it('pushes the css being replaced as a new step', () => {
      const stack = recordChange(emptyUndoStack(), 'a', 'edit', 1000);

      expect(stack).toEqual({
        past: [{ css: 'a', source: 'edit', at: 1000 }],
        future: [],
      });
    });

    it('extends the latest step for a quick change from the same source', () => {
      const first = recordChange(emptyUndoStack(), 'a', 'slider', 1000);
      const second = recordChange(
        first,
        'b',
        'slider',
        1000 + COALESCE_WINDOW_MS - 1
      );

      expect(second.past).toEqual([
        { css: 'a', source: 'slider', at: 1000 + COALESCE_WINDOW_MS - 1 },
      ]);
    });

    it('measures the window from the latest change, so a long drag stays one step', () => {
      let stack = emptyUndoStack();

      for (let i = 0; i < 10; i++) {
        stack = recordChange(stack, `v${i}`, 'slider', 1000 + i * 100);
      }

      expect(stack.past).toHaveLength(1);
      expect(stack.past[0].css).toBe('v0');
    });

    it('starts a new step once the window has passed', () => {
      const first = recordChange(emptyUndoStack(), 'a', 'slider', 1000);
      const second = recordChange(
        first,
        'b',
        'slider',
        1000 + COALESCE_WINDOW_MS
      );

      expect(second.past.map(entry => entry.css)).toEqual(['a', 'b']);
    });

    it('starts a new step for a different source, however quick', () => {
      const first = recordChange(emptyUndoStack(), 'a', 'color', 1000);
      const second = recordChange(first, 'b', 'opacity', 1001);

      expect(second.past.map(entry => entry.css)).toEqual(['a', 'b']);
    });

    it('drops the redo trail', () => {
      const stack = {
        past: [],
        future: [{ css: 'z', source: 'edit', at: 0 }],
      };

      expect(recordChange(stack, 'a', 'edit', 1000).future).toEqual([]);
    });

    it('forgets the oldest steps past the limit', () => {
      let stack = emptyUndoStack();

      for (let i = 0; i <= UNDO_LIMIT; i++) {
        stack = recordChange(stack, `v${i}`, 'edit', i * 10_000);
      }

      expect(stack.past).toHaveLength(UNDO_LIMIT);
      expect(stack.past[0].css).toBe('v1');
    });
  });

  describe('undoChange', () => {
    it('returns null with nothing to undo', () => {
      expect(undoChange(emptyUndoStack(), 'current')).toBeNull();
    });

    it('steps back and keeps the current css for redo', () => {
      const stack = recordChange(emptyUndoStack(), 'a', 'edit', 1000);

      expect(undoChange(stack, 'b')).toEqual({
        undoStack: {
          past: [],
          future: [{ css: 'b', source: 'edit', at: 0 }],
        },
        css: 'a',
      });
    });
  });

  describe('redoChange', () => {
    it('returns null with nothing undone', () => {
      expect(redoChange(emptyUndoStack(), 'current')).toBeNull();
    });

    it('steps forward and keeps the current css for undo', () => {
      const undone = undoChange(
        recordChange(emptyUndoStack(), 'a', 'edit', 1000),
        'b'
      );

      expect(redoChange(undone!.undoStack, 'a')).toEqual({
        undoStack: {
          past: [{ css: 'a', source: 'edit', at: 0 }],
          future: [],
        },
        css: 'b',
      });
    });

    it('never merges a later change into a step restored by redo', () => {
      const undone = undoChange(
        recordChange(emptyUndoStack(), 'a', 'edit', 1000),
        'b'
      );
      const redone = redoChange(undone!.undoStack, 'a');
      const next = recordChange(redone!.undoStack, 'b', 'edit', Date.now());

      expect(next.past.map(entry => entry.css)).toEqual(['a', 'b']);
    });
  });

  describe('undoShortcuts', () => {
    it('spells the combos for the platform', () => {
      expect(undoShortcuts(true)).toEqual({
        undo: 'command+z',
        redo: 'command+shift+z',
      });
      expect(undoShortcuts(false)).toEqual({
        undo: 'ctrl+z',
        redo: 'ctrl+shift+z',
      });
    });
  });

  describe('undoKeyFor', () => {
    it('reads Cmd+Z and Cmd+Shift+Z on macOS', () => {
      expect(undoKeyFor(key({ key: 'z', metaKey: true }), true)).toBe('undo');
      expect(
        undoKeyFor(key({ key: 'Z', metaKey: true, shiftKey: true }), true)
      ).toBe('redo');
    });

    it('reads Ctrl+Z, Ctrl+Shift+Z and Ctrl+Y elsewhere', () => {
      expect(undoKeyFor(key({ key: 'z', ctrlKey: true }), false)).toBe('undo');
      expect(
        undoKeyFor(key({ key: 'Z', ctrlKey: true, shiftKey: true }), false)
      ).toBe('redo');
      expect(undoKeyFor(key({ key: 'y', ctrlKey: true }), false)).toBe('redo');
    });

    it('ignores the other platform’s modifier and Ctrl+Y on macOS', () => {
      expect(undoKeyFor(key({ key: 'z', ctrlKey: true }), true)).toBeNull();
      expect(undoKeyFor(key({ key: 'z', metaKey: true }), false)).toBeNull();
      expect(undoKeyFor(key({ key: 'y', metaKey: true }), true)).toBeNull();
    });

    it('ignores combos with extra modifiers or other keys', () => {
      expect(
        undoKeyFor(key({ key: 'z', metaKey: true, altKey: true }), true)
      ).toBeNull();
      expect(
        undoKeyFor(key({ key: 'z', metaKey: true, ctrlKey: true }), true)
      ).toBeNull();
      expect(undoKeyFor(key({ key: 'x', metaKey: true }), true)).toBeNull();
      expect(undoKeyFor(key({ key: 'z' }), true)).toBeNull();
    });
  });
});
