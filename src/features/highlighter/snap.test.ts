import { getPathUpTo, snapPastWrappers, wraps } from './snap';

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  } as DOMRect);

const setBox = (el: Element, box: DOMRect): void => {
  el.getBoundingClientRect = () => box;
};

/**
 * Builds `html` into the body and gives each element with a `data-box`
 * attribute that box, as "left top width height".
 */
const render = (html: string): void => {
  document.body.innerHTML = html;
  setBox(document.body, rect(0, 0, 1000, 1000));

  document.querySelectorAll<HTMLElement>('[data-box]').forEach(el => {
    const [left, top, width, height] = el.dataset.box!.split(' ').map(Number);
    setBox(el, rect(left, top, width, height));
  });
};

const $ = (selector: string): HTMLElement =>
  document.querySelector<HTMLElement>(selector)!;

describe('wraps', () => {
  it('holds a box of the same size', () => {
    expect(wraps(rect(10, 10, 40, 40), rect(10, 10, 40, 40))).toBe(true);
  });

  it('holds a box with up to 4px to spare per side', () => {
    expect(wraps(rect(6, 6, 48, 48), rect(10, 10, 40, 40))).toBe(true);
  });

  it('does not hold a box with more than 4px to spare on a side', () => {
    expect(wraps(rect(10, 10, 45, 40), rect(10, 10, 40, 40))).toBe(false);
  });

  it('tolerates a subpixel overhang', () => {
    expect(wraps(rect(10.5, 10, 40, 40), rect(10, 10, 40, 40))).toBe(true);
  });

  it('does not hold a box that reaches past it', () => {
    expect(wraps(rect(12, 10, 40, 40), rect(10, 10, 40, 40))).toBe(false);
  });
});

describe('snapPastWrappers', () => {
  it('snaps from the divs drawing an avatar to its link', () => {
    render(`
      <div data-box="0 0 600 80">
        <a href="/jack" data-box="10 10 44 44">
          <div data-box="12 12 40 40">
            <div data-box="12 12 40 40"><div id="image" data-box="12 12 40 40"></div></div>
          </div>
        </a>
      </div>
    `);

    expect(snapPastWrappers($('#image'))).toBe($('a'));
  });

  it('stays on a div that only fills part of its parent', () => {
    render(`
      <article data-box="0 0 600 200">
        <div id="text" data-box="60 40 500 60">Hello</div>
      </article>
    `);

    expect(snapPastWrappers($('#text'))).toBe($('#text'));
  });

  it('stays on a div when a wrapper on the way only partly fills', () => {
    render(`
      <a href="/" data-box="0 0 300 40">
        <div data-box="0 0 100 40"><span id="label" data-box="0 0 100 40">Home</span></div>
      </a>
    `);

    expect(snapPastWrappers($('#label'))).toBe($('#label'));
  });

  it('stays on an element with a test id', () => {
    render(`
      <button data-box="0 0 40 40">
        <div id="icon" data-testid="like-icon" data-box="0 0 40 40"></div>
      </button>
    `);

    expect(snapPastWrappers($('#icon'))).toBe($('#icon'));
  });

  it('stays on media and other named elements', () => {
    render(`
      <a href="/" data-box="0 0 40 40"><img id="photo" data-box="0 0 40 40"></a>
    `);

    expect(snapPastWrappers($('#photo'))).toBe($('#photo'));
  });

  it('stays put when only plain wrappers fill the box up to the body', () => {
    render(`
      <div data-box="0 0 1000 1000"><div id="page" data-box="0 0 1000 1000"></div></div>
    `);

    expect(snapPastWrappers($('#page'))).toBe($('#page'));
  });

  it('climbs out of a shadow tree onto its host', () => {
    render(`<my-avatar data-box="0 0 40 40"></my-avatar>`);
    const host = $('my-avatar');
    const inner = document.createElement('div');
    host.attachShadow({ mode: 'open' }).appendChild(inner);
    setBox(inner, rect(0, 0, 40, 40));

    expect(snapPastWrappers(inner)).toBe(host);
  });
});

describe('getPathUpTo', () => {
  it('lists the elements up to the ancestor, innermost first', () => {
    render(`<a><div id="outer"><div id="inner"></div></div></a>`);

    expect(getPathUpTo($('#inner'), $('a'))).toEqual([
      $('#inner'),
      $('#outer'),
    ]);
  });

  it('is empty for the ancestor itself', () => {
    render(`<a></a>`);

    expect(getPathUpTo($('a'), $('a'))).toEqual([]);
  });
});
