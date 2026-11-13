import { getSameSpotSelector } from './similar-selectors';

const story = (rank: number) => `
  <tr class="athing" id="${rank}">
    <td class="title"><span class="rank">${rank}.</span></td>
    <td class="votelinks"><a id="up_${rank}" href="vote"></a></td>
    <td class="title">
      <span class="titleline">
        <a href="https://example.com/${rank}">Story ${rank}</a>
        <span class="sitebit comhead">(<a href="from?site=example.com">example.com</a>)</span>
      </span>
    </td>
  </tr>
  <tr><td class="subtext"><a href="item?id=${rank}">comments</a></td></tr>
`;

describe('getSameSpotSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('names the title in every Hacker News-style row', () => {
    document.body.innerHTML = `<table><tbody>${[1, 2, 3]
      .map(story)
      .join('')}</tbody></table>`;
    const title = document.querySelector(
      'tr.athing:nth-of-type(3) .titleline > a'
    ) as HTMLElement;

    const selector = getSameSpotSelector(title) as string;

    expect(selector).toBe('td.title > span.titleline > a');
    expect(document.querySelectorAll(selector)).toHaveLength(3);
  });

  it('leaves an infobox label alone when its rows have no name of their own', () => {
    document.body.innerHTML = `
      <table class="infobox"><tbody>
        <tr><th class="infobox-label">Born</th><td class="infobox-data">1912</td></tr>
        <tr><th class="infobox-label">Died</th><td class="infobox-data">1954</td></tr>
        <tr><th class="infobox-label">Known for</th><td class="infobox-data">Computing</td></tr>
      </tbody></table>
    `;
    const label = document.querySelectorAll('th')[1] as HTMLElement;

    expect(getSameSpotSelector(label)).toBeNull();
  });

  it('names the value in every row of an infobox whose rows are named', () => {
    document.body.innerHTML = `
      <table class="infobox"><tbody>
        <tr class="infobox-row"><th>Born</th><td><a href="#">London</a></td></tr>
        <tr class="infobox-row"><th>Died</th><td><a href="#">Wilmslow</a></td></tr>
        <tr class="infobox-row"><th>Known for</th><td><a href="#">Computing</a></td></tr>
      </tbody></table>
      <p><a href="#">elsewhere</a></p>
    `;
    const link = document.querySelectorAll('td a')[1] as HTMLElement;

    const selector = getSameSpotSelector(link) as string;

    expect(document.querySelectorAll(selector)).toHaveLength(3);
    expect(Array.from(document.querySelectorAll(selector))).toEqual(
      Array.from(document.querySelectorAll('td a'))
    );
  });

  it('gives up when the path down from the block stays complex', () => {
    const card = `
      <div class="card">
        <div><div><div><span>a</span><span>b</span></div></div></div>
        <div><div><div><span>c</span><span>d</span></div></div></div>
      </div>
    `;
    document.body.innerHTML = `<section>${card}${card}</section>`;
    const el = document.querySelectorAll('span')[1] as HTMLElement;

    expect(getSameSpotSelector(el)).toBeNull();
  });

  it('finds nothing when no ancestor repeats', () => {
    document.body.innerHTML = `
      <main class="article"><p class="lead"><a href="#">Read</a></p></main>
    `;
    const link = document.querySelector('a') as HTMLElement;

    expect(getSameSpotSelector(link)).toBeNull();
  });
});
