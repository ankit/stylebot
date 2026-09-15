/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAll, add, MAX_RECENT_COLORS } from '../color-history';

describe('color-history', () => {
  let stored: Record<string, unknown>;

  beforeEach(() => {
    stored = {};

    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn((key: string, callback: (items: unknown) => void) => {
            callback({ [key]: stored[key] });
          }),
          set: jest.fn((items: Record<string, unknown>, callback?: () => void) => {
            Object.assign(stored, items);
            callback?.();
          }),
        },
      },
    };
  });

  describe('getAll', () => {
    it('resolves an empty array when nothing is stored', async () => {
      expect(await getAll()).toEqual([]);
    });

    it('resolves the stored list', async () => {
      stored.recentColors = ['#ff0000'];

      expect(await getAll()).toEqual(['#ff0000']);
    });
  });

  describe('add', () => {
    it('unshifts a new color and persists it', async () => {
      const result = await add('#ff0000');

      expect(result).toEqual(['#ff0000']);
      expect(await getAll()).toEqual(['#ff0000']);
    });

    it('dedupes case-insensitively and moves the color to the front', async () => {
      await add('#FF0000');
      await add('#00ff00');
      const result = await add('#ff0000');

      expect(result).toEqual(['#ff0000', '#00ff00']);
    });

    it('caps the list at MAX_RECENT_COLORS', async () => {
      for (let i = 0; i < MAX_RECENT_COLORS + 3; i++) {
        await add(`#${i.toString(16).padStart(6, '0')}`);
      }

      const result = await getAll();

      expect(result).toHaveLength(MAX_RECENT_COLORS);
      expect(result[0]).toBe(
        `#${(MAX_RECENT_COLORS + 2).toString(16).padStart(6, '0')}`
      );
    });
  });
});
