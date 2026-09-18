/* eslint-disable @typescript-eslint/no-var-requires */
const dedent = require('dedent');
import { getAlreadyUsedColors } from '../already-used-colors';

describe('already-used-colors', () => {
  describe('getAlreadyUsedColors', () => {
    it('returns all-empty result for empty css', () => {
      expect(getAlreadyUsedColors('')).toEqual({
        text: [],
        surface: [],
        total: 0,
      });
    });

    it('buckets color into text and background-color/border-color into surface', () => {
      const css = dedent`
        .mock-selector-1 {
          color: #191b1f;
          background-color: #ffffff;
          border-color: #d8dbe1;
        }
      `;

      expect(getAlreadyUsedColors(css)).toEqual({
        text: ['#191b1f'],
        surface: ['#ffffff', '#d8dbe1'],
        total: 3,
      });
    });

    it('captures named colors for non-shorthand properties', () => {
      const css = dedent`
        .mock-selector-1 {
          color: red;
        }
      `;

      expect(getAlreadyUsedColors(css)).toEqual({
        text: ['red'],
        surface: [],
        total: 1,
      });
    });

    it('extracts a color out of the border/background shorthand', () => {
      const css = dedent`
        .mock-selector-1 {
          border: 1px solid #ffffff;
        }

        .mock-selector-2 {
          background: rgba(0, 0, 0, 0.5);
        }
      `;

      expect(getAlreadyUsedColors(css)).toEqual({
        text: [],
        surface: ['#ffffff', 'rgba(0, 0, 0, 0.5)'],
        total: 2,
      });
    });

    it('dedupes case-insensitively within a role', () => {
      const css = dedent`
        .mock-selector-1 {
          color: #FFFFFF;
        }

        .mock-selector-2 {
          color: #ffffff;
        }
      `;

      expect(getAlreadyUsedColors(css)).toEqual({
        text: ['#FFFFFF'],
        surface: [],
        total: 1,
      });
    });

    it('caps each role at 4 colors', () => {
      const css = dedent`
        .mock-selector-1 { color: #111111; }
        .mock-selector-2 { color: #222222; }
        .mock-selector-3 { color: #333333; }
        .mock-selector-4 { color: #444444; }
        .mock-selector-5 { color: #555555; }
      `;

      const result = getAlreadyUsedColors(css);
      expect(result.text).toEqual(['#111111', '#222222', '#333333', '#444444']);
      expect(result.total).toEqual(5);
    });

    it('ignores declarations for unrelated properties', () => {
      const css = dedent`
        .mock-selector-1 {
          font-size: 14px;
          padding: 4px;
        }
      `;

      expect(getAlreadyUsedColors(css)).toEqual({
        text: [],
        surface: [],
        total: 0,
      });
    });
  });
});
