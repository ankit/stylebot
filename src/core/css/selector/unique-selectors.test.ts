import { dedupeByMatches, byReach } from './reach';
import { getUniqueSelector, getItemScopedSelector } from './unique-selectors';
import { getSelectorCandidates } from './get-selector';

describe('getSelectorCandidates, dedupeByMatches and byReach', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('offers each strategy that matches, keeping one per reach', () => {
    document.body.innerHTML = `
      <table><tr><td class="subtext">
        <span class="age"><a class="css-1q2w3e">1</a></span>
      </td></tr></table>
      <a class="css-1q2w3e">other</a>
    `;
    const el = document.querySelector('span.age a') as HTMLElement;
    const candidates = getSelectorCandidates(el);

    expect(candidates).toEqual(
      expect.arrayContaining(['span.age a', 'a.css-1q2w3e'])
    );
    candidates.forEach(selector => expect(el.matches(selector)).toBe(true));

    const kept = dedupeByMatches(candidates);
    expect(kept).toHaveLength(new Set(kept).size);
    expect(byReach(kept).at(-1)).toBe('a.css-1q2w3e');
  });

  it('leaves out bare tags and tag chains', () => {
    document.body.innerHTML = `
      <table><tr><td class="title">
        <span class="sitestr">site</span>
      </td></tr></table>
    `;
    const candidates = getSelectorCandidates(
      document.querySelector('.sitestr') as HTMLElement
    );

    expect(candidates).not.toContain('span');
    expect(candidates).not.toContain('tr td span');
    expect(candidates).toContain('span.sitestr');
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

  it('passes over an id the page generates on each load', () => {
    document.body.innerHTML = `
      <div><span id="tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91"></span></div>
    `;

    const el = document.querySelector('span') as HTMLElement;
    expect(getUniqueSelector(el)).toBe('span');
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

  it('tells a label apart from its siblings by what it is for', () => {
    document.body.innerHTML = `
      <fieldset><legend>Size</legend>
        <input type="radio" id="size-1" />
        <label for="size-1">Small</label>
        <input type="radio" id="size-2" />
        <label for="size-2">Large</label>
      </fieldset>
      <fieldset><label>Note</label><label>Other</label></fieldset>
    `;
    const el = document.querySelector('[for="size-2"]') as HTMLElement;

    expect(getUniqueSelector(el)).toBe('label[for="size-2"]');
  });

  it("tells a wrapper apart by a child's value", () => {
    document.body.innerHTML = `
      <form>
        <div class="radio"><input type="radio" value="1" /> One</div>
        <div class="radio"><input type="radio" value="2" /> Two</div>
      </form>
      <form>
        <div class="radio"><input type="radio" /> Other</div>
        <div class="radio"><input type="radio" /> Else</div>
      </form>
    `;
    const el = document.querySelectorAll('div.radio')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('div.radio:has(> input[value="2"])');
  });

  it('passes over an attribute value the page generated', () => {
    document.body.innerHTML = `
      <ul class="menu">
        <li><button name="tsuid_hsLJaqLJBPu9ruEP7uOYkAo_91">one</button></li>
        <li><button name="tsuid_hsLJaqLJBPu9ruEP7uOYkAo_92">two</button></li>
      </ul>
    `;
    const el = document.querySelectorAll('li')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('li:nth-of-type(2)');
  });

  it("doesn't tell a content link apart by its address", () => {
    document.body.innerHTML = `
      <article>
        <p><a href="/story/dvy0t3mvh1lg">one</a> <a href="/story/k2j9x8">two</a></p>
      </article>
    `;
    const el = document.querySelectorAll('a')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('a:nth-of-type(2)');
  });

  it('tells a site link apart by its address', () => {
    document.body.innerHTML = `
      <p><a href="/news">news</a> <a href="/newcomments">comments</a></p>
    `;
    const el = document.querySelectorAll('a')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('a[href="/newcomments"]');
  });

  it("leaves out a step that doesn't narrow the match", () => {
    document.body.innerHTML = `
      <section class="feed">
        <div class="list"><p class="lede">one</p><p class="lede">two</p></div>
      </section>
      <section class="side">
        <div class="list"><p class="lede">three</p><p class="lede">four</p></div>
      </section>
    `;
    const el = document.querySelectorAll('p.lede')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('section.feed p.lede:nth-of-type(2)');
  });

  it('keeps the #id the path is anchored at', () => {
    document.body.innerHTML = `
      <div id="menu"><ul><li>one</li><li>two</li></ul></div>
      <ul><li>three</li><li>four</li></ul>
    `;
    const el = document.querySelectorAll('#menu li')[1] as HTMLElement;

    expect(getUniqueSelector(el)).toBe('#menu li:nth-of-type(2)');
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
