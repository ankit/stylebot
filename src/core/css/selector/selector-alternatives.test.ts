import { getSelector } from './get-selector';
import {
  buildSelectorAlternatives,
  getDefaultSelector,
} from './selector-alternatives';

describe('getDefaultSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  const matchCount = (selector: string) =>
    document.querySelectorAll(selector).length;

  it('names a story title by the scope covering every title', () => {
    document.body.innerHTML = `
      <table>
        <tr class="athing"><td class="title">
          <span class="titleline"><a id="link">one</a></span>
        </td></tr>
        <tr class="athing"><td class="title">
          <span class="titleline"><a>two</a></span>
        </td></tr>
      </table>
    `;
    const el = document.getElementById('link') as HTMLElement;
    const selector = getDefaultSelector(el);

    expect(matchCount(selector)).toBe(2);
    expect(buildSelectorAlternatives(el).descriptions?.[selector]?.role).toBe(
      'similar'
    );
  });

  it('names an element with nothing like it by a selector for it alone', () => {
    document.body.innerHTML = `<nav><a class="home">Home</a></nav><p>Hi</p>`;
    const selector = getDefaultSelector(
      document.querySelector('a') as HTMLElement
    );

    expect(matchCount(selector)).toBe(1);
  });

  it('falls back to the most stable candidate, the old pick, when no scope fits', () => {
    document.body.innerHTML = `<div><span></span></div>`;
    const el = document.querySelector('span') as HTMLElement;

    expect(
      getDefaultSelector(el, { existing: [], candidates: ['div span'] })
    ).toBe('div span');
    expect(getDefaultSelector(el, { existing: [], candidates: [] })).toBe(
      'span'
    );
    expect(buildSelectorAlternatives(el).candidates[0]).toBe(getSelector(el));
  });
});
