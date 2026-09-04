/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getSelector,
  getIdBasedSelector,
  getClassBasedSelector,
  getTagNameBasedSelector,
  validateSelector,
} from '../selector';

describe('selector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getClassBasedSelector', () => {
    it('returns null when the element has no class attribute', () => {
      const el = document.createElement('div');
      expect(getClassBasedSelector(el)).toBeNull();
    });

    it('builds a dot-separated selector from the class list', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'foo bar');

      expect(getClassBasedSelector(el)).toBe('div.foo.bar');
    });

    it('collapses repeated whitespace between class names', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'foo    bar');

      expect(getClassBasedSelector(el)).toBe('div.foo.bar');
    });

    it('escapes tailwind-style colons in class names (#820)', () => {
      const el = document.createElement('p');
      el.setAttribute('class', 'text-lg sm:text-xl text-gray-200');

      expect(getClassBasedSelector(el)).toBe(
        'p.text-lg.sm\\:text-xl.text-gray-200'
      );
      expect(validateSelector(getClassBasedSelector(el) as string)).toBe(
        true
      );
    });

    it('escapes other tailwind-style special characters, like slashes and brackets', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'bg-black/50 top-[10px]');

      const selector = getClassBasedSelector(el);
      expect(selector).toBe('div.bg-black\\/50.top-\\[10px\\]');
      expect(validateSelector(selector as string)).toBe(true);
    });

    it('uses the native CSS.escape implementation when available', () => {
      const escape = jest.fn((value: string) => `escaped-${value}`);
      (global as any).CSS = { escape };

      const el = document.createElement('div');
      el.setAttribute('class', 'sm:text-xl');

      expect(getClassBasedSelector(el)).toBe('div.escaped-sm:text-xl');
      expect(escape).toHaveBeenCalledWith('sm:text-xl');

      delete (global as any).CSS;
    });
  });

  describe('getIdBasedSelector', () => {
    it('returns null when the element has no id attribute', () => {
      const el = document.createElement('div');
      expect(getIdBasedSelector(el)).toBeNull();
    });

    it('returns an id-based selector', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo');

      expect(getIdBasedSelector(el)).toBe('#foo');
    });

    it('escapes special characters in the id', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo:bar');

      expect(getIdBasedSelector(el)).toBe('#foo\\:bar');
      expect(validateSelector(getIdBasedSelector(el) as string)).toBe(true);
    });
  });

  describe('getTagNameBasedSelector', () => {
    it('returns just the tag name when there is no parent', () => {
      const el = document.createElement('div');
      expect(getTagNameBasedSelector(el)).toBe('div');
    });

    it('walks up to two levels of parents', () => {
      document.body.innerHTML = `
        <section>
          <article>
            <span id="target"></span>
          </article>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getTagNameBasedSelector(el)).toBe('section article span');
    });

    it('does not go beyond two levels up the DOM', () => {
      document.body.innerHTML = `
        <main>
          <section>
            <article>
              <span id="target"></span>
            </article>
          </section>
        </main>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getTagNameBasedSelector(el)).toBe('section article span');
    });
  });

  describe('getSelector', () => {
    it('prefers a class-based selector', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo');
      el.setAttribute('class', 'bar');

      expect(getSelector(el)).toBe('div.bar');
    });

    it('falls back to an id-based selector when there is no class', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo');

      expect(getSelector(el)).toBe('#foo');
    });

    it('falls back to a tag-name-based selector when there is no class or id', () => {
      const el = document.createElement('div');
      expect(getSelector(el)).toBe('div');
    });
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
