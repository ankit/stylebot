import * as postcss from 'postcss';
import mutations from '../mutations';
import mockState from '../__mocks__/state';

describe('mutations', () => {
  describe('setSelectors', () => {
    it('selectors sorted by number of declared styles', () => {
      const root = postcss.parse(
        'b { color: red; } a { color: green; background: blue; } c { }'
      );

      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { id: 2, value: 'a', styleCount: 2 },
        { id: 1, value: 'b', styleCount: 1 },
        { id: 3, value: 'c', styleCount: 0 },
      ]);
    });

    it('selectors sorted alphabetically when style count is the same', () => {
      const root = postcss.parse(
        'b { color: red; } a { color: green; } c { color: blue; }'
      );
      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { id: 2, value: 'a', styleCount: 1 },
        { id: 1, value: 'b', styleCount: 1 },
        { id: 3, value: 'c', styleCount: 1 },
      ]);
    });

    it('lists only top-level selectors, not rules nested inside them', () => {
      const root = postcss.parse(
        'a { color: red; & + & { margin: 0; } b { color: blue; } } c { color: green; }'
      );
      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { id: 1, value: 'a', styleCount: 3 },
        { id: 2, value: 'c', styleCount: 1 },
      ]);
    });
  });
});
