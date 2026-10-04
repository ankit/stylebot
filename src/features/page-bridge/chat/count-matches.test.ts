import { countMatches } from './count-matches';

describe('countMatches', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <p class="note">a</p><p class="note">b</p>
      <div id="stylebot"><p class="note">panel</p></div>
    `;
  });

  it('counts the page’s matches, leaving out Stylebot’s own UI', () => {
    expect(countMatches(['.note', 'h1'])).toEqual([2, 0]);
  });

  it('returns null for a selector the page can’t parse', () => {
    expect(countMatches(['p[', '.note'])).toEqual([null, 2]);
  });
});
