import getters from '../getters';
import mockState from '../__mocks__/state';

describe('getters', () => {
  describe('readabilityActive', () => {
    it('is false when the style has readability off', () => {
      const state = {
        ...mockState,
        readability: false,
        page: { ...mockState.page, readerable: true },
      };

      expect(getters.readabilityActive(state)).toBe(false);
    });

    it('is false when the page itself is not readerable', () => {
      const state = {
        ...mockState,
        readability: true,
        page: { ...mockState.page, readerable: false },
      };

      expect(getters.readabilityActive(state)).toBe(false);
    });

    it('is true only when both hold', () => {
      const state = {
        ...mockState,
        readability: true,
        page: { ...mockState.page, readerable: true },
      };

      expect(getters.readabilityActive(state)).toBe(true);
    });
  });

  describe('activeRule', () => {
    const css = `.card {
  color: red;
  .title {
    color: blue;
  }
  @media (min-width: 600px) {
    padding: 1rem;
  }
}

.title {
  color: pink;
}`;

    it("carries only the rule's own declarations, not nested ones", () => {
      const state = { ...mockState, css, activeSelector: '.card' };
      const declarations: Array<[string, string]> = [];

      getters.activeRule(state)?.walkDecls(decl => {
        declarations.push([decl.prop, decl.value]);
      });

      expect(declarations).toEqual([['color', 'red']]);
    });

    it('resolves to the top-level rule, not a nested one with the same selector', () => {
      const state = { ...mockState, css, activeSelector: '.title' };
      const declarations: Array<[string, string]> = [];

      getters.activeRule(state)?.walkDecls(decl => {
        declarations.push([decl.prop, decl.value]);
      });

      expect(declarations).toEqual([['color', 'pink']]);
    });
  });

  describe('grayscale', () => {
    it('reads the percentage off the rules for the page snapshot selectors', () => {
      const state = {
        ...mockState,
        css: 'div.a { filter: grayscale(40%); }',
        page: { ...mockState.page, bodyChildSelectors: ['div.a'] },
      };

      expect(getters.grayscale(state)).toBe(40);
    });

    it('is 0 when no snapshot selector carries a filter', () => {
      const state = {
        ...mockState,
        css: 'div.b { filter: grayscale(40%); }',
        page: { ...mockState.page, bodyChildSelectors: ['div.a'] },
      };

      expect(getters.grayscale(state)).toBe(0);
    });
  });
});
