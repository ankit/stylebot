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
      [
        'ul',
        '  li.row "x" [pad 0, margin 0]',
        '  li.row "x"',
        '  … ×4 more',
      ].join('\n')
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
        ...['[pad 0, margin 0]', ''].flatMap(spacing =>
          [
            `    tr.athing ${spacing}`,
            '      td.title "t"',
            `    tr ${spacing}`,
            '      td',
            '      td.subtext "s"',
            `    tr.spacer ${spacing}`,
          ].map(line => line.trimEnd())
        ),
        '    … ×6 more',
        '    tr',
        '      td',
        '      td.title',
        '        a.morelink "More"',
      ].join('\n')
    );
  });

  it('names the font an element sets for itself, first in its stack', () => {
    document.body.innerHTML = `
      <div class="post" style="font-family: Georgia, serif">
        <p class="body">text</p>
        <code class="snippet" style="font-family: 'SF Mono', monospace">x</code>
      </div>
    `;

    expect(getPageOutline().split('\n').slice(-3)).toEqual([
      'div.post [family Georgia]',
      '  p.body "text"',
      '  code.snippet "x" [family SF Mono]',
    ]);
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
        'div.box [pad 0, margin 0]',
        '  p "a"',
        'div.box',
        '  p "b"',
        'div#main.box',
        '  p "c"',
        'article#post-1 "x" [pad 0, margin 0]',
        'article#post-2 "x"',
        '… ×2 more',
      ].join('\n')
    );
  });

  it('names a bgcolor attribute, the only trait some cells have', () => {
    document.body.innerHTML = `<table><tbody><tr><td bgcolor="#ff6600">x</td></tr></tbody></table>`;

    expect(getPageOutline()).toContain('td[bgcolor="#ff6600"] "x"');
  });

  it('doesn’t repeat a bgcolor attribute as its background', () => {
    document.body.innerHTML = `<table><tbody><tr>
      <td bgcolor="#FF6600" style="background-color: rgb(255, 102, 0)">a</td>
      <td bgcolor="orange" style="background-color: rgb(255, 165, 0)">b</td>
    </tr></tbody></table>`;

    const outline = getPageOutline();

    expect(outline).toContain('td[bgcolor="#FF6600"] "a"');
    expect(outline).not.toContain('bg #ff6600');
    expect(outline).toContain('td[bgcolor="orange"] "b" [bg #ffa500]');
  });

  it('notes how the first of a run of repeated items is spaced', () => {
    const item =
      '<li class="story" style="padding: 4px 0; margin: 0 0 8px; font-size: 12px; line-height: 18px">x</li>';
    document.body.innerHTML = `<ul style="display: flex; row-gap: 6px; column-gap: 6px">${item.repeat(
      3
    )}</ul><p class="note" style="padding: 9px">y</p>`;

    expect(getPageOutline().split('\n')).toEqual([
      'ul [gap 6px]',
      '  li.story "x" [font 12px, pad 4px 0, margin 0 0 8px, lh 1.5]',
      '  li.story "x" [font 12px]',
      '  … ×1 more',
      'p.note "y"',
    ]);
  });

  it('spells out zero spacing on a repeated item', () => {
    document.body.innerHTML =
      '<ol><li class="row">a</li><li class="row">b</li></ol>';

    expect(getPageOutline().split('\n')[1]).toBe(
      '  li.row "a" [pad 0, margin 0]'
    );
  });

  it('leaves spacing off repeated inline text', () => {
    document.body.innerHTML =
      '<p><span class="by" style="display: inline">a</span><span class="by" style="display: inline">b</span></p>';

    expect(getPageOutline().split('\n')[1]).toBe('  span.by "a"');
  });

  it('cuts long text', () => {
    document.body.innerHTML = `<p>${'a'.repeat(60)}</p>`;

    expect(getPageOutline()).toBe(`p "${'a'.repeat(40)}…"`);
  });
});
