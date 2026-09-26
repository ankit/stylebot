import { getPageOutline } from '../page-outline';

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

  it('cuts long text', () => {
    document.body.innerHTML = `<p>${'a'.repeat(60)}</p>`;

    expect(getPageOutline()).toBe(`p "${'a'.repeat(40)}…"`);
  });
});
