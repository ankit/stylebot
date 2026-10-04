import { getPageOutline } from './page-outline';

describe('getPageOutline', () => {
  it('lists elements with their id, classes and own text, indented by depth', () => {
    document.body.innerHTML = `
      <header id="top" class="site-header">
        <a class="logo" href="/">Home</a>
      </header>
      <div><div><p class="intro">Welcome to the site</p></div></div>
      <script>ignored()</script>
      <div id="stylebot"><p>panel</p></div>
    `;

    expect(getPageOutline()).toBe(
      [
        'header#top.site-header',
        '  a.logo "Home"',
        'p.intro "Welcome to the site"',
      ].join('\n')
    );
  });

  it('summarises long runs of alike siblings', () => {
    document.body.innerHTML = `<ul>${'<li class="row">x</li>'.repeat(6)}</ul>`;

    expect(getPageOutline()).toBe(
      ['ul', '  li.row "x"', '  li.row "x"', '  … ×4 more'].join('\n')
    );
  });

  it('summarises alternating runs, keeping a different row after them', () => {
    const story =
      '<tr class="athing"><td class="title">t</td></tr><tr><td></td><td class="subtext">s</td></tr><tr class="spacer"></tr>';
    document.body.innerHTML = `<table><tbody>${story.repeat(
      4
    )}<tr><td></td><td class="title"><a class="morelink">More</a></td></tr></tbody></table>`;

    expect(getPageOutline()).toBe(
      [
        'table',
        '  tbody',
        ...[1, 2].flatMap(() => [
          '    tr.athing',
          '      td.title "t"',
          '    tr',
          '      td',
          '      td.subtext "s"',
          '    tr.spacer',
        ]),
        '    … ×6 more',
        '    tr',
        '      td',
        '      td.title',
        '        a.morelink "More"',
      ].join('\n')
    );
  });

  it('notes backgrounds, and colors and sizes that differ from the parent', () => {
    document.body.innerHTML = `
      <div class="card" style="background-color: rgb(255, 255, 255); color: rgb(17, 17, 17)">
        <a class="link" style="color: rgba(0, 0, 0, 0.5); font-size: 20px">More</a>
        <span class="same" style="color: rgb(17, 17, 17)">x</span>
      </div>
    `;

    expect(getPageOutline()).toBe(
      [
        'div.card [bg #ffffff, color #111111]',
        '  a.link "More" [color #00000080, font 20px]',
        '  span.same "x"',
      ].join('\n')
    );
  });

  it('keeps elements with their own id, and folds numbered ones', () => {
    document.body.innerHTML = `
      <div class="box"><p>a</p></div><div class="box"><p>b</p></div><div id="main" class="box"><p>c</p></div>
      ${[1, 2, 3, 4].map(n => `<article id="post-${n}">x</article>`).join('')}
    `;

    expect(getPageOutline()).toBe(
      [
        'div.box',
        '  p "a"',
        'div.box',
        '  p "b"',
        'div#main.box',
        '  p "c"',
        'article#post-1 "x"',
        'article#post-2 "x"',
        '… ×2 more',
      ].join('\n')
    );
  });

  it('names a bgcolor attribute, the only trait some cells have', () => {
    document.body.innerHTML = `<table><tbody><tr><td bgcolor="#ff6600">x</td></tr></tbody></table>`;

    expect(getPageOutline()).toContain('td[bgcolor="#ff6600"] "x"');
  });

  it('cuts long text', () => {
    document.body.innerHTML = `<p>${'a'.repeat(60)}</p>`;

    expect(getPageOutline()).toBe(`p "${'a'.repeat(40)}…"`);
  });
});
