import { validateSelector } from './selector-text';

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
});
