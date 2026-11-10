import { getStableSelector, getFragileSelector } from './fragile-selector';

describe('fragile-selector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getStableSelector', () => {
    it('swaps each partly hashed class for its stable matcher', () => {
      expect(getStableSelector('nav .Header_nav__a1B2c > a.link')).toBe(
        'nav [class*="Header_nav__"] > a.link'
      );
      expect(
        getStableSelector('div.Card_body__x9Y8z:not(.Card_muted__q1W2e) p')
      ).toBe('div[class*="Card_body__"]:not([class*="Card_muted__"]) p');
    });

    it('leaves authored classes, escapes and quoted values alone', () => {
      expect(getStableSelector('.lg\\:-mt-16 a#nav\\.main')).toBe(
        '.lg\\:-mt-16 a#nav\\.main'
      );
      expect(getStableSelector('a[href=".Header_nav__a1B2c"]')).toBe(
        'a[href=".Header_nav__a1B2c"]'
      );
    });

    it('keeps a class whose stable part would match more of the page', () => {
      document.body.innerHTML = `
        <div class="Header_nav__a1B2c"></div>
        <div class="SubHeader_nav__z9Y8x"></div>
      `;

      expect(getStableSelector('.Header_nav__a1B2c')).toBe(
        '.Header_nav__a1B2c'
      );
    });
  });

  describe('getFragileSelector', () => {
    it('offers a stable version and lists classes with no stable part', () => {
      expect(getFragileSelector('.Header_nav__a1B2c .css-1a0ymrn a')).toEqual({
        selector: '.Header_nav__a1B2c .css-1a0ymrn a',
        stable: '[class*="Header_nav__"] .css-1a0ymrn a',
        unstable: ['css-1a0ymrn'],
      });
    });

    it('returns null for minified classes, which outlast a rebuild', () => {
      expect(getFragileSelector('div.VwiC3b h3.LC20lb')).toBeNull();
    });

    it('returns null for a selector of authored classes', () => {
      expect(getFragileSelector('nav .menu > a.link')).toBeNull();
      expect(getFragileSelector('a[href=".css-1a0ymrn"]')).toBeNull();
    });
  });
});
