/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getSelector,
  getTestIdBasedSelector,
  getNameBasedSelector,
  getNonHashedClassBasedSelector,
  getClassBasedSelector,
  getIdBasedSelector,
  getTagNameBasedSelector,
  getAncestorBasedSelector,
  validateSelector,
  getSelectorCandidates,
  getUniqueSelector,
  getItemScopedSelector,
  dedupeByMatches,
  byReach,
} from './selector';

describe('selector', () => {
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

  describe('getAncestorBasedSelector', () => {
    it('returns null when nothing usable is nearby', () => {
      document.body.innerHTML = `
        <section>
          <article>
            <span id="target"></span>
          </article>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getAncestorBasedSelector(el)).toBeNull();
    });

    it("uses an ancestor's class instead of its tag name", () => {
      document.body.innerHTML = `
        <section class="card">
          <article>
            <span id="target"></span>
          </article>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getAncestorBasedSelector(el)).toBe('section.card article span');
    });

    it("uses an ancestor's test-id over a hashed class", () => {
      document.body.innerHTML = `
        <section class="WwrzSb" data-testid="card">
          <article>
            <span id="target"></span>
          </article>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getAncestorBasedSelector(el)).toBe(
        'section[data-testid="card"] article span'
      );
    });

    it('returns null when the nearest ancestor only has a hashed class', () => {
      document.body.innerHTML = `
        <section class="WwrzSb">
          <article>
            <span id="target"></span>
          </article>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getAncestorBasedSelector(el)).toBeNull();
    });

    it('does not go beyond two levels up the DOM', () => {
      document.body.innerHTML = `
        <main class="page">
          <section>
            <article>
              <span id="target"></span>
            </article>
          </section>
        </main>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getAncestorBasedSelector(el)).toBeNull();
    });

    it('stops at the nearest usable ancestor instead of always climbing two levels', () => {
      document.body.innerHTML = `
        <section>
          <div class="mw-heading">
            <h2 id="target"></h2>
          </div>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getAncestorBasedSelector(el)).toBe('div.mw-heading h2');
    });
  });

  describe('getSelector', () => {
    it('prefers a non-hashed class-based selector', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo');
      el.setAttribute('class', 'bar');

      expect(getSelector(el)).toBe('div.bar');
    });

    it('prefers a test-id over a hashed class', () => {
      const el = document.createElement('button');
      el.setAttribute('class', 'WwrzSb');
      el.setAttribute('data-testid', 'submit-button');

      expect(getSelector(el)).toBe('button[data-testid="submit-button"]');
    });

    it('prefers a name over a hashed class', () => {
      const el = document.createElement('input');
      el.setAttribute('class', 'WwrzSb');
      el.setAttribute('name', 'email');

      expect(getSelector(el)).toBe('input[name="email"]');
    });

    it('prefers a test-id over name', () => {
      const el = document.createElement('input');
      el.setAttribute('name', 'email');
      el.setAttribute('data-testid', 'email-field');

      expect(getSelector(el)).toBe('input[data-testid="email-field"]');
    });

    it("prefers an ancestor's class over its own id", () => {
      document.body.innerHTML = `
        <section class="card">
          <article>
            <span id="target"></span>
          </article>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getSelector(el)).toBe('section.card article span');
    });

    it("prefers its own #id over an ancestor's hashed class", () => {
      document.body.innerHTML = `
        <section class="WwrzSb">
          <a id="target"></a>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getSelector(el)).toBe('#target');
    });

    it('prefers its own #id over its own hashed class', () => {
      const el = document.createElement('a');
      el.setAttribute('class', 'WwrzSb');
      el.setAttribute('id', 'target');

      expect(getSelector(el)).toBe('#target');
    });

    it('falls back to its own hashed class when there is no id nearby either', () => {
      const el = document.createElement('a');
      el.setAttribute('class', 'WwrzSb');

      expect(getSelector(el)).toBe('a.WwrzSb');
    });

    it("falls back to an ancestor's hashed class when there is no id nearby either", () => {
      document.body.innerHTML = `
        <section class="WwrzSb">
          <a data-target></a>
        </section>
      `;

      const el = document.querySelector('[data-target]') as HTMLElement;
      expect(getSelector(el)).toBe('section.WwrzSb a');
    });

    it('falls back to an id-based selector when nothing nearby is usable', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo');

      expect(getSelector(el)).toBe('#foo');
    });

    it('falls back to a tag-name-based selector when nothing at all is available', () => {
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

describe('getSelectorCandidates, dedupeByMatches and byReach', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('offers wider and narrower selectors, keeping one per reach', () => {
    document.body.innerHTML = `
      <table><tr><td class="subtext">
        <span class="subline"><span class="age"><a id="first">1</a></span></span>
      </td></tr></table>
      <a>other</a>
    `;
    const el = document.getElementById('first') as HTMLElement;
    const candidates = getSelectorCandidates(el);

    expect(candidates).toEqual(
      expect.arrayContaining(['span.age a', 'td.subtext a', 'a'])
    );
    candidates.forEach(selector => expect(el.matches(selector)).toBe(true));

    // span span a matches exactly what span.age a does.
    const kept = dedupeByMatches(['span.age a', ...candidates]);
    expect(kept).toContain('span.age a');
    expect(kept).not.toContain('span span a');

    expect(byReach(kept).at(-1)).toBe('a');
  });

  it("skips bare container tags and scopes by the element's own class", () => {
    document.body.innerHTML = `
      <table><tr><td class="title">
        <span class="sitestr" id="site">site</span>
      </td></tr></table>
    `;
    const candidates = getSelectorCandidates(
      document.getElementById('site') as HTMLElement
    );

    expect(candidates).not.toContain('span');
    expect(candidates).toContain('td.title span.sitestr');
  });
});

describe('getUniqueSelector and getItemScopedSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const rows = () => {
    document.body.innerHTML = `
      <table>
        <tr class="athing"><td class="title"><a>one</a> <a>site</a></td></tr>
        <tr class="athing"><td class="title"><a id="pick">two</a> <a>site</a></td></tr>
        <tr class="athing"><td class="title"><a>three</a> <a>site</a></td></tr>
      </table>
    `;
    return document.getElementById('pick') as HTMLElement;
  };

  it('uses a unique id as is', () => {
    expect(getUniqueSelector(rows())).toBe('#pick');
  });

  it('positions the element among its repeated ancestors when it has no id', () => {
    const el = rows();
    el.removeAttribute('id');
    const selector = getUniqueSelector(el) as string;

    expect(document.querySelectorAll(selector)).toHaveLength(1);
    expect(el.matches(selector)).toBe(true);
    expect(selector).toBe('tr.athing:nth-of-type(2) a:nth-of-type(1)');
  });

  it('anchors at a unique ancestor id', () => {
    document.body.innerHTML = `
      <ul id="nav"><li><a>one</a></li><li><a>two</a></li></ul>
      <ul><li><a>three</a></li><li><a>four</a></li></ul>
    `;
    const el = document.querySelectorAll('#nav a')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('#nav li:nth-of-type(2) a');
  });

  it('scopes the element to the repeated item it sits in', () => {
    const el = rows();
    const selector = getItemScopedSelector(el) as string;

    expect(selector).toBe('tr.athing:nth-of-type(2) a');
    expect(document.querySelectorAll(selector)).toHaveLength(2);
  });

  it('offers both among the candidates', () => {
    const el = rows();
    el.removeAttribute('id');
    const candidates = dedupeByMatches(getSelectorCandidates(el));

    expect(candidates).toContain('tr.athing:nth-of-type(2) a');
    expect(candidates).toContain('tr.athing:nth-of-type(2) a:nth-of-type(1)');
  });
});
