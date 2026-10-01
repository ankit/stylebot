import { getDeclarationValue } from '@stylebot/css';

import getters from './getters';
import mockState from './state.fixtures';

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

      getters
        .activeRule(state, {
          inspectedSelector: state.activeSelector,
        })
        ?.walkDecls(decl => {
          declarations.push([decl.prop, decl.value]);
        });

      expect(declarations).toEqual([['color', 'red']]);
    });

    it('resolves to the top-level rule, not a nested one with the same selector', () => {
      const state = { ...mockState, css, activeSelector: '.title' };
      const declarations: Array<[string, string]> = [];

      getters
        .activeRule(state, {
          inspectedSelector: state.activeSelector,
        })
        ?.walkDecls(decl => {
          declarations.push([decl.prop, decl.value]);
        });

      expect(declarations).toEqual([['color', 'pink']]);
    });

    it('falls back to a grouped rule the selector belongs to', () => {
      const state = {
        ...mockState,
        css: 'a, b { opacity: 0.5; }',
        activeSelector: 'b',
      };
      expect(
        getDeclarationValue(
          getters.activeRule(state, {
            inspectedSelector: state.activeSelector,
          }),
          'opacity'
        )
      ).toBe('0.5');
    });
  });

  describe('inspectedSelector', () => {
    it('is the previewed selector while picking, else the active one', () => {
      const state = {
        ...mockState,
        activeSelector: 'h1',
        previewSelector: 'p.note',
      };

      expect(getters.inspectedSelector(state)).toBe('h1');
      expect(getters.inspectedSelector({ ...state, inspecting: true })).toBe(
        'p.note'
      );
    });
  });

  describe('setByOtherSelector and overriddenByOtherSelector', () => {
    const state = {
      ...mockState,
      css: 'h1 { color: red; }',
      activeSelector: 'h1',
      appliedDeclarations: [
        { property: 'color', value: 'rgb(0, 0, 255)', selector: '.title' },
        { property: 'font-size', value: '20px', selector: '*' },
      ],
    };

    const rulesFor = (inspected: typeof state, inspectedSelector: string) => {
      const deps = {
        activeRule: getters.activeRule(inspected, { inspectedSelector }),
        otherSelectorValues: getters.otherSelectorValues(inspected, {
          inspectedSelector,
        }),
      };

      return {
        other: getters.setByOtherSelector(inspected, deps),
        overriding: getters.overriddenByOtherSelector(inspected, deps),
      };
    };

    it('names the selector that sets a property the rule leaves unset', () => {
      const { other, overriding } = rulesFor(state, 'h1');

      expect(other).toEqual({ 'font-size': { selector: '*', value: '20px' } });
      expect(overriding['font-size']).toBeUndefined();
    });

    it('names the selector that wins over a property the rule sets', () => {
      const { other, overriding } = rulesFor(state, 'h1');

      expect(overriding).toEqual({
        color: { selector: '.title', value: '#0000ff' },
      });
      expect(other.color).toBeUndefined();
    });

    it('says nothing about other selectors while editing a page-wide rule', () => {
      const pageWide = {
        ...state,
        css: '* { color: red; }',
        activeSelector: '*',
      };
      const { other, overriding } = rulesFor(pageWide, '*');

      expect(other).toEqual({});
      expect(overriding).toEqual({});
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
