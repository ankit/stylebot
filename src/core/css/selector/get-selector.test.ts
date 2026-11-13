import {
  getSelector,
  getSelectorCandidates,
  getBodyChildSelectors,
} from './get-selector';

describe('get-selector', () => {
  afterEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  describe('getSelector', () => {
    it('prefers a non-hashed class-based selector', () => {
      const el = document.createElement('div');
      el.setAttribute('id', 'foo');
      el.setAttribute('class', 'bar');

      expect(getSelector(el)).toBe('div.bar');
    });

    it('prefers an aria-label over a hashed class', () => {
      document.body.innerHTML =
        '<button class="css-1q2w3e" aria-label="Search">';

      expect(getSelector(document.body.firstElementChild as HTMLElement)).toBe(
        'button[aria-label="Search"]'
      );
    });

    it('prefers a real class over an aria-label', () => {
      const el = document.createElement('button');
      el.setAttribute('class', 'search');
      el.setAttribute('aria-label', 'Search');

      expect(getSelector(el)).toBe('button.search');
    });

    it('prefers a test-id over a hashed class', () => {
      const el = document.createElement('button');
      el.setAttribute('class', 'css-1q2w3e');
      el.setAttribute('data-testid', 'submit-button');

      expect(getSelector(el)).toBe('button[data-testid="submit-button"]');
    });

    it('prefers a name over a hashed class', () => {
      const el = document.createElement('input');
      el.setAttribute('class', 'css-1q2w3e');
      el.setAttribute('name', 'email');

      expect(getSelector(el)).toBe('input[name="email"]');
    });

    it('prefers a test-id over name', () => {
      const el = document.createElement('input');
      el.setAttribute('name', 'email');
      el.setAttribute('data-testid', 'email-field');

      expect(getSelector(el)).toBe('input[data-testid="email-field"]');
    });

    it('prefers an #id when most others with its class have none', () => {
      document.body.innerHTML = `
        <div class="flex" id="sidebar"></div>
        <div class="flex"></div>
        <div class="flex"></div>
      `;

      const el = document.getElementById('sidebar') as HTMLElement;
      expect(getSelector(el)).toBe('#sidebar');
    });

    it('prefers an #id when only a few others with its class have one', () => {
      document.body.innerHTML = `
        <div class="flex" id="header"></div>
        <div class="flex" id="sidebar"></div>
        <div class="flex"></div>
        <div class="flex"></div>
        <div class="flex"></div>
      `;

      const el = document.getElementById('sidebar') as HTMLElement;
      expect(getSelector(el)).toBe('#sidebar');
    });

    it('keeps the class when the others with it have ids too', () => {
      document.body.innerHTML = `
        <table>
          <tr class="athing" id="45678"></tr>
          <tr class="athing" id="45679"></tr>
        </table>
      `;

      const el = document.getElementById('45678') as HTMLElement;
      expect(getSelector(el)).toBe('tr.athing');
    });

    it('keeps the class when only this element has it', () => {
      document.body.innerHTML = '<nav class="site-nav" id="nav"></nav>';

      const el = document.getElementById('nav') as HTMLElement;
      expect(getSelector(el)).toBe('nav.site-nav');
    });

    it('prefers a test id over a real class', () => {
      const el = document.createElement('nav');
      el.setAttribute('class', 'flex');
      el.setAttribute('data-testid', 'sidebar');

      expect(getSelector(el)).toBe('nav[data-testid="sidebar"]');
    });

    it('prefers an #id that beats its class over a test id', () => {
      document.body.innerHTML = `
        <div class="flex" id="sidebar" data-testid="sidebar"></div>
        <div class="flex"></div>
        <div class="flex"></div>
      `;

      const el = document.getElementById('sidebar') as HTMLElement;
      expect(getSelector(el)).toBe('#sidebar');
    });

    it.each(['product-48213', 'row-7', 'item_3', 'post:12'])(
      'prefers a real class over the per-item test id %s',
      value => {
        const el = document.createElement('div');
        el.setAttribute('class', 'card');
        el.setAttribute('data-testid', value);

        expect(getSelector(el)).toBe('div.card');
      }
    );

    it('keeps a test id with a digit inside a word', () => {
      const el = document.createElement('h1');
      el.setAttribute('class', 'title');
      el.setAttribute('data-testid', 'h1-title');

      expect(getSelector(el)).toBe('h1[data-testid="h1-title"]');
    });

    it('prefers a test id when others with its class have test ids of their own', () => {
      document.body.innerHTML = `
        <button class="r-5zmot" data-testid="GrokDrawerHeader"></button>
        <button class="r-5zmot" data-testid="like"></button>
        <button class="r-5zmot" data-testid="reply"></button>
      `;

      const el = document.querySelector('button') as HTMLElement;
      expect(getSelector(el)).toBe('button[data-testid="GrokDrawerHeader"]');
    });

    it('skips an ancestor scope that sweeps most of the page', () => {
      document.body.innerHTML = `
        <div class="app">
          <div><div class="css-1q2w3e" data-target></div></div>
          ${'<div><div><div></div></div></div>'.repeat(30)}
        </div>
      `;

      const el = document.querySelector('[data-target]') as HTMLElement;
      expect(getSelector(el)).toBe('div.css-1q2w3e');
      expect(getSelectorCandidates(el)).not.toContain('div.app div div');
    });

    it('falls back to this element alone rather than a sweeping tag chain', () => {
      document.body.innerHTML = `
        <div>
          <div><div></div><div data-target></div></div>
          ${'<div><div><div></div></div></div>'.repeat(30)}
        </div>
      `;

      const el = document.querySelector('[data-target]') as HTMLElement;
      const selector = getSelector(el);

      expect(document.querySelectorAll(selector)).toHaveLength(1);
      expect(el.matches(selector)).toBe(true);
    });

    it('keeps body-child selectors as they were before partly hashed classes', () => {
      document.body.innerHTML = '<div class="Layout_root__a1B2c"></div>';

      expect(getBodyChildSelectors()).toEqual(['div.Layout_root__a1B2c']);
    });

    it('keeps the tag chain for body children, which saved page effects look up', () => {
      document.body.innerHTML = `
        <div><div></div></div>
        ${'<div><div><div></div></div></div>'.repeat(30)}
      `;

      expect(getBodyChildSelectors()[0]).toBe('html body div');
    });

    it('keeps a scope that matches most of a specific tag, like every date', () => {
      document.body.innerHTML = `
        ${'<div class="commit-age"><relative-time></relative-time></div>'.repeat(
          60
        )}
      `;

      const el = document.querySelector('relative-time') as HTMLElement;
      expect(getSelector(el)).toBe('div.commit-age relative-time');
    });

    it('keeps an ancestor scope on a page too small to sweep', () => {
      document.body.innerHTML = `
        <div class="app">
          <div><div class="css-1q2w3e" data-target></div></div>
        </div>
      `;

      const el = document.querySelector('[data-target]') as HTMLElement;
      expect(getSelector(el)).toBe('div.app div div');
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
        <section class="css-1q2w3e">
          <a id="target"></a>
        </section>
      `;

      const el = document.getElementById('target') as HTMLElement;
      expect(getSelector(el)).toBe('#target');
    });

    it('prefers its own #id over its own hashed class', () => {
      const el = document.createElement('a');
      el.setAttribute('class', 'css-1q2w3e');
      el.setAttribute('id', 'target');

      expect(getSelector(el)).toBe('#target');
    });

    it('falls back to its own hashed class when there is no id nearby either', () => {
      const el = document.createElement('a');
      el.setAttribute('class', 'css-1q2w3e');

      expect(getSelector(el)).toBe('a.css-1q2w3e');
    });

    it("falls back to an ancestor's hashed class when there is no id nearby either", () => {
      document.body.innerHTML = `
        <section class="css-1q2w3e">
          <a data-target></a>
        </section>
      `;

      const el = document.querySelector('[data-target]') as HTMLElement;
      expect(getSelector(el)).toBe('section.css-1q2w3e a');
    });

    it('skips an id the page generates on each load', () => {
      const el = document.createElement('h3');
      el.setAttribute('class', 'LC20lb MBeuO');
      el.setAttribute('id', '_3MTJavGCHNyKptQPt7ejqQI_120');

      expect(getSelector(el)).toBe('h3.LC20lb');
    });

    it("skips React Native Web's generated id and atomic classes", () => {
      document.head.innerHTML = '<style id="react-native-stylesheet"></style>';
      document.body.innerHTML = `
        <nav class="site-nav">
          <a id="id__g3bmvlaotyb" class="r-sdzlij r-dnmrzs" data-target></a>
        </nav>
      `;

      const el = document.querySelector('[data-target]') as HTMLElement;
      expect(getSelector(el)).toBe('nav.site-nav a');
    });

    it('uses its own minified class over an ancestor scope', () => {
      document.body.innerHTML = `
        <div class="result">
          <div class="VwiC3b yXK7lf">snippet</div>
        </div>
      `;

      const el = document.querySelector('.VwiC3b') as HTMLElement;
      expect(getSelector(el)).toBe('div.VwiC3b');
    });

    it('prefers an authored class over a minified one', () => {
      const el = document.createElement('div');
      el.setAttribute('class', 'WwrzSb card');

      expect(getSelector(el)).toBe('div.card');
    });

    it('prefers a minified class over an aria-label', () => {
      const el = document.createElement('button');
      el.setAttribute('class', 'WwrzSb');
      el.setAttribute('aria-label', 'Search');

      expect(getSelector(el)).toBe('button.WwrzSb');
    });

    it('skips a per-item test id altogether', () => {
      document.body.innerHTML = `
        <ul class="list"><li data-testid="row-7"></li></ul>
      `;

      const el = document.querySelector('li') as HTMLElement;
      expect(getSelector(el)).toBe('ul.list li');
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
});
