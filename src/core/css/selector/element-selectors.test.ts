/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateSelector } from './selector-text';
import {
  getTestIdBasedSelector,
  getNameBasedSelector,
  getLabelBasedSelector,
  getNonHashedClassBasedSelector,
  getClassBasedSelector,
  getStableClassPartsSelector,
  getIdBasedSelector,
} from './element-selectors';
import { getSelector } from './get-selector';

describe('element-selectors', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getTestIdBasedSelector', () => {
    it('returns null when no test-id-style attribute is present', () => {
      const el = document.createElement('div');
      expect(getTestIdBasedSelector(el)).toBeNull();
    });

    it('uses data-testid', () => {
      const el = document.createElement('button');
      el.setAttribute('data-testid', 'submit-button');

      expect(getTestIdBasedSelector(el)).toBe(
        'button[data-testid="submit-button"]'
      );
    });

    it.each(['data-testid', 'data-test-id', 'data-test', 'data-cy', 'data-qa'])(
      'recognizes %s',
      attribute => {
        const el = document.createElement('div');
        el.setAttribute(attribute, 'foo');

        expect(getTestIdBasedSelector(el)).toBe(`div[${attribute}="foo"]`);
      }
    );

    it('prefers data-testid over other conventions when several are present', () => {
      const el = document.createElement('div');
      el.setAttribute('data-cy', 'from-cypress');
      el.setAttribute('data-testid', 'from-testid');

      expect(getTestIdBasedSelector(el)).toBe('div[data-testid="from-testid"]');
    });

    it('escapes double quotes and backslashes in the value', () => {
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'say "hi" \\ bye');

      const selector = getTestIdBasedSelector(el);
      expect(selector).toBe('div[data-testid="say \\"hi\\" \\\\ bye"]');
      expect(validateSelector(selector as string)).toBe(true);
    });
  });

  it('escapes control characters in attribute values', () => {
    document.body.innerHTML = '<div></div>';
    const el = document.body.firstElementChild as HTMLElement;
    el.setAttribute('data-testid', 'a\nb\t"c"');
    const selector = getTestIdBasedSelector(el) as string;

    expect(selector).toBe('div[data-testid="a\\a b\\9 \\"c\\""]');
    expect(el.matches(selector)).toBe(true);
  });

  describe('getNameBasedSelector', () => {
    it('returns null when the element has no name attribute', () => {
      const el = document.createElement('input');
      expect(getNameBasedSelector(el)).toBeNull();
    });

    it('uses the name attribute', () => {
      const el = document.createElement('input');
      el.setAttribute('name', 'email');

      expect(getNameBasedSelector(el)).toBe('input[name="email"]');
    });

    it('escapes double quotes and backslashes in the value', () => {
      const el = document.createElement('input');
      el.setAttribute('name', 'say "hi" \\ bye');

      const selector = getNameBasedSelector(el);
      expect(selector).toBe('input[name="say \\"hi\\" \\\\ bye"]');
      expect(validateSelector(selector as string)).toBe(true);
    });
  });

  describe('getNonHashedClassBasedSelector', () => {
    it('returns null when the element has no class attribute', () => {
      const el = document.createElement('div');
      expect(getNonHashedClassBasedSelector(el)).toBeNull();
    });

    it('uses only the first class when the element has several', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'foo bar');

      expect(getNonHashedClassBasedSelector(el)).toBe('div.foo');
    });

    it('collapses repeated whitespace before picking the first class', () => {
      const el = document.createElement('div');
      el.setAttribute('class', '   foo    bar');

      expect(getNonHashedClassBasedSelector(el)).toBe('div.foo');
    });

    it('escapes tailwind-style colons in the class name (#820)', () => {
      const el = document.createElement('p');
      el.setAttribute('class', 'sm:text-xl text-gray-200');

      expect(getNonHashedClassBasedSelector(el)).toBe('p.sm\\:text-xl');
      expect(
        validateSelector(getNonHashedClassBasedSelector(el) as string)
      ).toBe(true);
    });

    it('escapes other tailwind-style special characters, like slashes and brackets', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'bg-black/50 top-[10px]');

      const selector = getNonHashedClassBasedSelector(el);
      expect(selector).toBe('div.bg-black\\/50');
      expect(validateSelector(selector as string)).toBe(true);
    });

    it('uses the native CSS.escape implementation when available', () => {
      const escape = jest.fn((value: string) => `escaped-${value}`);
      (global as any).CSS = { escape };

      const el = document.createElement('div');
      el.setAttribute('class', 'sm:text-xl');

      expect(getNonHashedClassBasedSelector(el)).toBe('div.escaped-sm:text-xl');
      expect(escape).toHaveBeenCalledWith('sm:text-xl');

      delete (global as any).CSS;
    });

    it('returns null when the only class looks build-tool-generated', () => {
      const el = document.createElement('a');
      el.setAttribute('class', 'WwrzSb');

      expect(getNonHashedClassBasedSelector(el)).toBeNull();
    });

    it('skips a hashed class and uses the next usable one', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'XlKvRb primary-nav');

      expect(getNonHashedClassBasedSelector(el)).toBe('div.primary-nav');
    });

    it('treats a hex-like hash as build-tool-generated too', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'a1b2c3');

      expect(getNonHashedClassBasedSelector(el)).toBeNull();
    });

    it('treats a common CSS-in-JS prefix as build-tool-generated', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'css-1a2b3c');

      expect(getNonHashedClassBasedSelector(el)).toBeNull();
    });

    it('does not mistake an authored camelCase class for a hash', () => {
      const el = document.createElement('button');
      el.setAttribute('class', 'primaryButton');

      expect(getNonHashedClassBasedSelector(el)).toBe('button.primaryButton');
    });
  });

  describe('getStableClassPartsSelector', () => {
    it('matches a partly hashed class by its authored parts', () => {
      const el = document.createElement('nav');
      el.setAttribute('class', 'page-module__E0kJGG__main');

      expect(getStableClassPartsSelector(el)).toBe(
        'nav[class*="page-module__"][class*="__main"]'
      );
    });

    it('prefers an authored class over a partly hashed one', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'Card_body__a1B2c card-body');

      expect(getNonHashedClassBasedSelector(el)).toBe('div.card-body');
    });

    it('skips the stable parts when they match more than the full class', () => {
      document.body.innerHTML = `
        <div class="Header_nav__a1B2c" id="target"></div>
        <div class="SubHeader_nav__z9Y8x"></div>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getStableClassPartsSelector(el)).toBeNull();
    });

    it("scopes by an ancestor's partly hashed class", () => {
      document.body.innerHTML = `
        <section class="Card_body__a1B2c">
          <p id="target"></p>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getSelector(el)).toBe('section[class*="Card_body__"] p');
    });

    it('ranks below a test id and above an #id', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'Card_body__a1B2c');
      el.setAttribute('id', 'card');

      expect(getSelector(el)).toBe('div[class*="Card_body__"]');

      el.setAttribute('data-testid', 'card');
      expect(getSelector(el)).toBe('div[data-testid="card"]');
    });
  });

  describe('getClassBasedSelector', () => {
    it('returns null when the element has no class attribute', () => {
      const el = document.createElement('div');
      expect(getClassBasedSelector(el)).toBeNull();
    });

    it('uses the first class even when it looks build-tool-generated', () => {
      const el = document.createElement('a');
      el.setAttribute('class', 'WwrzSb');

      expect(getClassBasedSelector(el)).toBe('a.WwrzSb');
    });

    it('escapes special characters in the class name', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'bg-black/50');

      const selector = getClassBasedSelector(el);
      expect(selector).toBe('div.bg-black\\/50');
      expect(validateSelector(selector as string)).toBe(true);
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

  describe('getLabelBasedSelector', () => {
    const page = (html: string) => {
      document.body.innerHTML = html;
      return document.body.firstElementChild as HTMLElement;
    };

    it('selects a link by its path', () => {
      const el = page('<a class="css-abc12d" href="/section/world">');

      expect(getLabelBasedSelector(el)).toBe('a[href="/section/world"]');
    });

    it('skips a link with a query or hash', () => {
      expect(getLabelBasedSelector(page('<a href="/s?x=1">'))).toBeNull();
      expect(getLabelBasedSelector(page('<a href="/s#top">'))).toBeNull();
    });

    it('skips a link path with an id or date in it', () => {
      const el = page('<a href="/2026/10/08/story.html">');

      expect(getLabelBasedSelector(el)).toBeNull();
    });

    it('skips the home link and non-page schemes', () => {
      expect(getLabelBasedSelector(page('<a href="/">'))).toBeNull();
      expect(getLabelBasedSelector(page('<a href="mailto:a@b.c">'))).toBeNull();
    });

    it('selects an element by its aria-label', () => {
      const el = page('<button class="css-abc12d" aria-label="Search">');

      expect(getLabelBasedSelector(el)).toBe('button[aria-label="Search"]');
    });

    it('skips an aria-label with a line break or an email in it', () => {
      const el = page('<a class="css-abc12d">');

      el.setAttribute('aria-label', 'Google Account: Ann\n(ann@example.com)');
      expect(getLabelBasedSelector(el)).toBeNull();
      el.setAttribute('aria-label', 'Account ann@example.com');
      expect(getLabelBasedSelector(el)).toBeNull();
    });

    it('is null while it would match more than the own class does', () => {
      document.body.innerHTML =
        '<button class="css-abc12d" aria-label="Next"></button>' +
        '<button class="css-other1" aria-label="Next"></button>';

      expect(
        getLabelBasedSelector(document.body.firstElementChild as HTMLElement)
      ).toBeNull();
    });
  });
});
