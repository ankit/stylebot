import {
  countSelectorSteps,
  splitSelectorSteps,
  isSimpleSelector,
  validateSelector,
} from './selector-text';

describe('selector-text', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('validateSelector', () => {
    it('returns false for an empty selector', () => {
      expect(validateSelector('')).toBe(false);
    });

    it('returns true for a valid selector', () => {
      expect(validateSelector('div.foo')).toBe(true);
    });

    it('returns false for an invalid selector', () => {
      expect(validateSelector('div.foo:bar(')).toBe(false);
    });
  });

  describe('countSelectorSteps', () => {
    it.each([
      ['a', 1],
      ['#menu li > a', 3],
      ['div.radio:has(> input[value="2"]) span', 2],
      ['button[aria-label="Search posts"]', 1],
      ['tr td.subtext a:nth-of-type(2)', 3],
    ])('counts %s as %d steps', (selector, steps) => {
      expect(countSelectorSteps(selector)).toBe(steps);
    });
  });

  describe('splitSelectorSteps', () => {
    it.each([
      ['a', ['a']],
      ['#menu li > a', ['#menu', ' li', ' > a']],
      ['td.title>span.titleline', ['td.title', '>span.titleline']],
      ['h2 + p ~ ul', ['h2', ' + p', ' ~ ul']],
      [
        'div.radio:has(> input[value="2"]) span',
        ['div.radio:has(> input[value="2"])', ' span'],
      ],
      ['a[title="Top stories"] b', ['a[title="Top stories"]', ' b']],
      ['.a\\ b c', ['.a\\ b', ' c']],
      ['  a  b  ', ['  a', '  b  ']],
      ['', []],
      ['   ', []],
    ])('splits %s into its steps', (selector, steps) => {
      expect(splitSelectorSteps(selector)).toEqual(steps);
      expect(splitSelectorSteps(selector).join('')).toBe(
        selector.trim() ? selector : ''
      );
    });
  });

  describe('isSimpleSelector', () => {
    it.each([
      ['#menu li > a', true],
      ['button[aria-label="Search posts"]', true],
      ['main article div > p', false],
      ['ul > li:nth-of-type(2)', false],
    ])('treats %s as simple: %s', (selector, simple) => {
      expect(isSimpleSelector(selector)).toBe(simple);
    });
  });
});
