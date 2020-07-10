import { JSDOM } from 'jsdom';
import * as postcss from 'postcss';
import mutations from '../mutations';
import mockState from '../__mocks__/state';

const dom = new JSDOM();
global.document = dom.window.document;

describe('mutations', () => {
  describe('setSelectors', () => {
    it('selectors sorted by number of matching DOM elements', () => {
      global.document.body
        .appendChild(document.createElement('a'))
        .appendChild(document.createElement('a'))
        .appendChild(document.createElement('b'))
        .appendChild(document.createElement('c'))
        .appendChild(document.createElement('c'))
        .appendChild(document.createElement('c'));

      const root = postcss.parse('b { color: red; } a { color: green; } c { }');

      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { value: 'c', count: 3 },
        { value: 'a', count: 2 },
        { value: 'b', count: 1 },
      ]);
    });

    it('selectors sorted alphabetically when DOM elements count is the same', () => {
      global.document.body.innerHTML = '';

      const root = postcss.parse('b { color: red; } a { color: green; } c { }');
      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { value: 'a', count: 0 },
        { value: 'b', count: 0 },
        { value: 'c', count: 0 },
      ]);
    });
  });
});
