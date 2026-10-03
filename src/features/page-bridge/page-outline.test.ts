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

  it('cuts long text', () => {
    document.body.innerHTML = `<p>${'a'.repeat(60)}</p>`;

    expect(getPageOutline()).toBe(`p "${'a'.repeat(40)}…"`);
  });
});
