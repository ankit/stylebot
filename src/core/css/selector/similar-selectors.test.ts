import {
  getHookScopedSelector,
  getNamedScopeSelector,
  getSameSpotSelector,
  getTagInScopeSelector,
} from './similar-selectors';

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

const tweet = (handle: string) => `
  <article role="article" data-testid="tweet" class="css-175oi2r r-18u37iz">
    <div class="css-175oi2r r-1iusvr4">
      <div class="css-175oi2r" data-testid="Tweet-User-Avatar">
        <div class="css-175oi2r r-1adg3ll" data-testid="UserAvatar-Container-${handle}">
          <div class="css-175oi2r r-1p0dtai"><img class="css-9pa8cd" src="${handle}.jpg"></div>
        </div>
      </div>
    </div>
    <div class="css-175oi2r r-1iusvr4 r-16y2uox">
      <div class="css-175oi2r" data-testid="User-Name"><a href="/${handle}"><span class="css-1jxf684">${handle}</span></a></div>
      <div class="css-146c3p1 r-bcqeeo" data-testid="tweetText" lang="en"><span class="css-1jxf684">Hello from ${handle}</span></div>
    </div>
  </article>
`;

describe('getHookScopedSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it("names every tweet's avatar, not one account's", () => {
    document.body.innerHTML = `<main><img class="css-9pa8cd" src="logo.png">${[
      'nasa',
      'esa',
      'nasa',
    ]
      .map(tweet)
      .join('')}</main>`;
    const avatar = document.querySelectorAll('article img')[1] as HTMLElement;

    const selector = getHookScopedSelector(avatar) as string;

    expect(selector).toContain('[data-testid^="UserAvatar-Container-"]');
    expect(Array.from(document.querySelectorAll(selector))).toEqual(
      Array.from(document.querySelectorAll('article img'))
    );
  });

  it('names the text of every tweet by its test id', () => {
    document.body.innerHTML = `<main>${['nasa', 'esa', 'jaxa']
      .map(tweet)
      .join('')}<span class="css-1jxf684">Footer</span></main>`;
    const text = document.querySelectorAll(
      '[data-testid="tweetText"] span'
    )[2] as HTMLElement;

    const selector = getHookScopedSelector(text) as string;

    expect(selector).toBe('div[data-testid="tweetText"] > span');
    expect(document.querySelectorAll(selector)).toHaveLength(3);
  });

  it('scopes by a meaningful role when there is no test id', () => {
    document.body.innerHTML = `
      <div role="list">
        <div role="listitem"><div><span>One</span></div><div><a href="#">Open</a></div></div>
        <div role="listitem"><div><span>Two</span></div><div><a href="#">Open</a></div></div>
        <div role="listitem"><div><span>Three</span></div><div><a href="#">Open</a></div></div>
      </div>
      <p><a href="#">elsewhere</a></p>
    `;
    const link = document.querySelectorAll(
      '[role="listitem"] a'
    )[1] as HTMLElement;

    const selector = getHookScopedSelector(link) as string;

    expect(selector.startsWith('div[role="listitem"]')).toBe(true);
    expect(Array.from(document.querySelectorAll(selector))).toEqual(
      Array.from(document.querySelectorAll('[role="listitem"] a'))
    );
  });

  it('skips roles that say nothing about what an element is', () => {
    document.body.innerHTML = `
      <div role="presentation"><span>a</span></div>
      <div role="presentation"><span>b</span></div>
    `;
    const span = document.querySelectorAll('span')[1] as HTMLElement;

    expect(getHookScopedSelector(span)).toBeNull();
  });

  it('widens a per-item test id only when every item is the same component', () => {
    document.body.innerHTML = `
      <div class="card" data-testid="item-alpha"><b>a</b></div>
      <div class="card" data-testid="item-beta"><b>b</b></div>
    `;
    const bold = document.querySelectorAll('b')[1] as HTMLElement;

    expect(getHookScopedSelector(bold)).toBe('div[data-testid^="item-"] > b');

    document.body.innerHTML = `
      <div class="card" data-testid="item-alpha"><b>a</b></div>
      <section class="panel" data-testid="item-beta"><b>b</b></section>
    `;

    expect(
      getHookScopedSelector(document.querySelector('b') as HTMLElement)
    ).toBeNull();
  });

  it('gives up when the path down from the hook stays complex', () => {
    const card = `
      <div data-testid="card">
        <div><div><div><span>a</span><span>b</span></div></div></div>
        <div><div><div><span>c</span><span>d</span></div></div></div>
      </div>
    `;
    document.body.innerHTML = `<section>${card}${card}</section>`;
    const el = document.querySelectorAll('span')[1] as HTMLElement;

    expect(getHookScopedSelector(el)).toBeNull();
  });
});

const infobox = `
  <table class="infobox"><tbody>
    <tr><th class="infobox-above" colspan="2">Alan Turing</th></tr>
    <tr><th class="infobox-label">Born</th><td class="infobox-data"><a href="#">London</a></td></tr>
    <tr><th class="infobox-label">Died</th><td class="infobox-data"><a href="#">Wilmslow</a></td></tr>
    <tr><th class="infobox-label">Known for</th><td class="infobox-data">Computing</td></tr>
  </tbody></table>
`;

describe('getNamedScopeSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('names every label of an infobox whose rows are bare', () => {
    document.body.innerHTML = `<main>${infobox}<p><a href="#">elsewhere</a></p></main>`;
    const label = document.querySelectorAll(
      'th.infobox-label'
    )[1] as HTMLElement;

    const selector = getNamedScopeSelector(label) as string;

    expect(selector.startsWith('table.infobox')).toBe(true);
    expect(Array.from(document.querySelectorAll(selector))).toEqual(
      Array.from(document.querySelectorAll('th.infobox-label'))
    );
  });

  it('names the links in every value of the infobox, not the page', () => {
    document.body.innerHTML = `<main>${infobox}<p><a href="#">elsewhere</a></p></main>`;
    const link = document.querySelectorAll('td a')[1] as HTMLElement;

    const selector = getNamedScopeSelector(link) as string;

    expect(Array.from(document.querySelectorAll(selector))).toEqual(
      Array.from(document.querySelectorAll('td a'))
    );
  });

  it('finds nothing without a named ancestor', () => {
    document.body.innerHTML = `
      <table><tbody>
        <tr><th>Born</th><td>1912</td></tr>
        <tr><th>Died</th><td>1954</td></tr>
      </tbody></table>
    `;
    const label = document.querySelectorAll('th')[1] as HTMLElement;

    expect(getNamedScopeSelector(label)).toBeNull();
  });

  it('keeps the parent when leaving it out would reach more', () => {
    document.body.innerHTML = `
      <article class="post">
        <p><a href="#">a</a></p><p><a href="#">b</a></p><ul><li><a href="#">c</a></li></ul>
      </article>
    `;
    const link = document.querySelectorAll('p a')[1] as HTMLElement;

    expect(getNamedScopeSelector(link)).toBe('article.post p a');
  });

  it('leaves a bare div or span out', () => {
    document.body.innerHTML = `
      <section class="area"><p><span>a</span></p><p><span>b</span></p></section>
    `;
    const span = document.querySelectorAll('span')[1] as HTMLElement;

    expect(getNamedScopeSelector(span)).toBeNull();
  });
});

describe('getTagInScopeSelector', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('names every element of the tag in the nearest named area', () => {
    document.body.innerHTML = `<main>${infobox}<p><a href="#">elsewhere</a></p></main>`;
    const label = document.querySelectorAll(
      'th.infobox-label'
    )[1] as HTMLElement;

    expect(getTagInScopeSelector(label)).toBe('table.infobox th');
  });

  it('finds nothing outside a named area, or for a bare div', () => {
    document.body.innerHTML = `
      <main><p><a href="#">a</a></p></main>
      <section class="area"><div>b</div></section>
    `;

    expect(
      getTagInScopeSelector(document.querySelector('a') as HTMLElement)
    ).toBeNull();
    expect(
      getTagInScopeSelector(document.querySelector('.area div') as HTMLElement)
    ).toBeNull();
  });
});
