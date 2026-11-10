import {
  getTagNameBasedSelector,
  getAncestorBasedSelector,
} from './ancestor-selectors';

describe('ancestor-selectors', () => {
  afterEach(() => {
    document.body.innerHTML = '';
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
        <section class="css-1q2w3e" data-testid="card">
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
        <section class="css-1q2w3e">
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
});
