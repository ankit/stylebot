import { dedupeByMatches, byReach } from './reach';
import {
  getUniqueSelector,
  getItemScopedSelector,
  getSelectorCandidates,
} from './alternatives';

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
    expect(selector).toBe('tr.athing:nth-of-type(2) td.title a:nth-of-type(1)');
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
    expect(candidates).toContain(
      'tr.athing:nth-of-type(2) td.title a:nth-of-type(1)'
    );
  });
});
