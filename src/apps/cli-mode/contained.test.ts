import { describeArea, findAtMiddle, findContained } from './contained';

type Rect = { x: number; y: number; width: number; height: number };

/**
 * Gives elements the boxes the page would lay them out in, by id.
 */
const layOut = (boxes: Record<string, Rect>): void => {
  Object.entries(boxes).forEach(([id, { x, y, width, height }]) => {
    const el = document.getElementById(id) as HTMLElement;

    el.getBoundingClientRect = () =>
      ({
        x,
        y,
        left: x,
        top: y,
        width,
        height,
        right: x + width,
        bottom: y + height,
      } as DOMRect);
  });
};

// jsdom has no CSS.escape; the ids here need no escaping.
beforeAll(() => {
  window.CSS ??= { escape: (value: string) => value } as typeof CSS;
});

beforeEach(() => {
  document.body.innerHTML = `
    <main id="main">
      <section id="cards">
        <div id="one" class="card"><h2 id="title">One</h2></div>
        <div id="two" class="card"></div>
      </section>
      <aside id="floating"></aside>
    </main>
    <stylebot-cli-mode id="ours"></stylebot-cli-mode>
  `;

  layOut({
    main: { x: 0, y: 0, width: 1000, height: 2000 },
    cards: { x: 0, y: 100, width: 1000, height: 300 },
    one: { x: 20, y: 120, width: 300, height: 200 },
    title: { x: 30, y: 130, width: 280, height: 30 },
    two: { x: 340, y: 120, width: 300, height: 200 },
    // Positioned well away from its parent's box.
    floating: { x: 700, y: 140, width: 100, height: 100 },
    ours: { x: 0, y: 0, width: 1000, height: 800 },
  });
});

describe('findContained', () => {
  it('finds the outermost elements wholly inside an area', () => {
    const found = findContained({ x: 10, y: 110, width: 640, height: 220 });

    expect(found.map(el => el.id)).toEqual(['one', 'two']);
  });

  it('allows an element to overhang the area by a little', () => {
    const found = findContained({ x: 22, y: 122, width: 296, height: 196 });

    expect(found.map(el => el.id)).toEqual(['one']);
  });

  it('finds positioned elements outside their parent, never its own marks', () => {
    const found = findContained({ x: 690, y: 130, width: 120, height: 120 });

    expect(found.map(el => el.id)).toEqual(['floating']);
  });

  it('skips elements that take no room', () => {
    layOut({ two: { x: 340, y: 120, width: 0, height: 0 } });

    expect(findContained({ x: 330, y: 110, width: 320, height: 220 })).toEqual(
      []
    );
  });
});

describe('findAtMiddle', () => {
  it('names the innermost element at the middle of an area', () => {
    expect(findAtMiddle({ x: 100, y: 135, width: 20, height: 20 })?.id).toBe(
      'title'
    );
  });
});

describe('describeArea', () => {
  it('lists what an area wholly holds, with match counts and a selector for each alone', () => {
    const { elements, whole, more } = describeArea(
      { x: 10, y: 110, width: 640, height: 220 },
      ''
    );

    expect(whole).toBe(true);
    expect(more).toBe(0);
    expect(elements).toEqual([
      { selector: 'div.card', matches: 2, unique: '#one' },
      { selector: 'div.card', matches: 2, unique: '#two' },
    ]);
  });

  it('falls back to the element at its middle when none fits wholly', () => {
    const { elements, whole } = describeArea(
      { x: 100, y: 135, width: 20, height: 20 },
      ''
    );

    expect(whole).toBe(false);
    expect(elements).toEqual([{ selector: 'div.card h2', matches: 1 }]);
  });
});
