import { getPageSignals } from './page-signals';

const box = (width: number, height: number, top = 0) =>
  ({ top, width, height } as DOMRect);

describe('getPageSignals', () => {
  beforeEach(() => {
    document.body.removeAttribute('style');
    document.elementsFromPoint = () => [];
  });

  it('finds nothing on a short plain page', () => {
    document.body.innerHTML = '<p>Hello</p>';

    expect(getPageSignals()).toEqual({
      dark: false,
      list: false,
      sidebar: false,
      pinnedHeader: false,
      ads: false,
    });
  });

  it('reads a dark page from its base background', () => {
    document.body.style.backgroundColor = 'rgb(20, 22, 26)';
    document.body.innerHTML = '<p>Hello</p>';

    expect(getPageSignals().dark).toBe(true);
  });

  it('counts alike siblings, alternating ones too, as a long list', () => {
    const story =
      '<tr class="athing"><td class="title">t</td></tr><tr><td class="subtext">s</td></tr>';
    document.body.innerHTML = `<table><tbody>${story.repeat(
      10
    )}</tbody></table>`;
    expect(getPageSignals().list).toBe(true);

    document.body.innerHTML = `<ul>${'<li class="row">x</li>'.repeat(9)}</ul>`;
    expect(getPageSignals().list).toBe(false);
  });

  it('takes a narrow, tall aside as a sidebar, not Stylebot’s panel', () => {
    document.body.innerHTML =
      '<aside>Links</aside><div id="stylebot"><div class="sidebar">x</div></div>';
    const [aside, panel] = Array.from(
      document.querySelectorAll('aside, .sidebar')
    );
    aside.getBoundingClientRect = () => box(240, 600);
    panel.getBoundingClientRect = () => box(240, 600);

    expect(getPageSignals().sidebar).toBe(true);

    aside.getBoundingClientRect = () => box(240, 40);
    expect(getPageSignals().sidebar).toBe(false);
  });

  it('takes a fixed bar across the top as a header that follows', () => {
    document.body.innerHTML =
      '<header style="position: fixed"><a>Home</a></header>';
    const header = document.querySelector('header') as HTMLElement;
    header.getBoundingClientRect = () => box(window.innerWidth, 56);
    document.elementsFromPoint = () => [
      header.firstElementChild as Element,
      header,
      document.body,
    ];

    expect(getPageSignals().pinnedHeader).toBe(true);

    header.style.position = 'static';
    expect(getPageSignals().pinnedHeader).toBe(false);
  });

  it('finds a visible ad slot of some size, not a tiny one or a lookalike class', () => {
    document.body.innerHTML =
      '<div data-testid="ad-unit">Advertisement</div><div class="header-load">x</div>';
    const [ad, lookalike] = Array.from(document.body.children);
    ad.getBoundingClientRect = () => box(970, 250);
    lookalike.getBoundingClientRect = () => box(970, 250);

    expect(getPageSignals().ads).toBe(true);

    ad.getBoundingClientRect = () => box(20, 20);
    expect(getPageSignals().ads).toBe(false);
  });
});
