import {
  countSelectorSteps,
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
