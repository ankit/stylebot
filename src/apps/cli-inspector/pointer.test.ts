import type { usePointer as UsePointer } from './pointer';

let usePointer: typeof UsePointer;
let events: Array<string>;

const EVENT_TYPES = ['pointerover', 'mouseover', 'pointermove', 'mouseout'];

const record = (event: Event): void => {
  events.push(`${event.type}:${(event.target as Element).id}`);
};

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  } as DOMRect);

beforeAll(() => {
  // jsdom has no PointerEvent.
  (globalThis as { PointerEvent?: unknown }).PointerEvent ??= class extends (
    MouseEvent
  ) {};
  HTMLElement.prototype.checkVisibility = () => true;
  HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  jest.resetModules();
  ({ usePointer } = require('./pointer'));
  document.body.innerHTML =
    '<nav id="menu"><a id="link" href="#x">Docs</a></nav><p id="intro">Hi</p>';
  document.getElementById('menu')!.getBoundingClientRect = () =>
    rect(0, 0, 200, 40);
  document.getElementById('link')!.getBoundingClientRect = () =>
    rect(10, 10, 40, 20);
  document.getElementById('intro')!.getBoundingClientRect = () =>
    rect(0, 100, 300, 20);
  document.elementFromPoint = (x: number, y: number) =>
    document.getElementById(y < 40 ? 'link' : 'intro');

  events = [];
  EVENT_TYPES.forEach(type => window.addEventListener(type, record, true));
});

afterEach(() => {
  EVENT_TYPES.forEach(type => window.removeEventListener(type, record, true));
});

describe('usePointer', () => {
  it("hovers the middle of a selector's first match", () => {
    const result = usePointer({ kind: 'hover', selector: '#link' });

    expect(result).toEqual({ x: 30, y: 20, selector: '#link' });
    expect(events).toEqual([
      'pointerover:link',
      'mouseover:link',
      'pointermove:link',
    ]);
  });

  it('leaves the previous element when the pointer moves on', () => {
    usePointer({ kind: 'hover', selector: '#link' });
    events = [];
    usePointer({ kind: 'hover', x: 5, y: 110 });

    expect(events).toEqual([
      'mouseout:link',
      'pointerover:intro',
      'mouseover:intro',
      'pointermove:intro',
    ]);
  });

  it('inspects an element without sending the page events', () => {
    const result = usePointer({ kind: 'inspect', x: 20, y: 15 });

    expect(result.selector).toBe('#link');
    expect(events).toEqual([]);
  });

  it("prefers a selector the style's css already has", () => {
    document.getElementById('link')!.className = 'docs';

    const result = usePointer({
      kind: 'inspect',
      selector: '#link',
      css: '.docs { color: red; }',
    });

    expect(result.selector).toBe('.docs');
  });

  it('lists other selectors for the element with their match counts', () => {
    document.getElementById('link')!.className = 'docs';

    const result = usePointer({
      kind: 'inspect',
      selector: '#link',
      css: '.docs { color: red; } nav > a { color: blue; }',
    });

    expect(result.matches).toBe(1);
    expect(result.alternatives).toContainEqual({
      selector: 'nav > a',
      matches: 1,
      saved: true,
    });
    expect(result.alternatives!.map(a => a.selector)).not.toContain('.docs');
  });

  it('aims at the element under the middle when it sits inside the match', () => {
    document.elementFromPoint = () => document.getElementById('link');

    const result = usePointer({ kind: 'hover', selector: '#menu' });

    expect(result.selector).toBe('#link');
  });

  it('aims at the match itself when something else covers it', () => {
    document.elementFromPoint = () => document.getElementById('intro');

    const result = usePointer({ kind: 'hover', selector: '#menu' });

    expect(result).toEqual({ x: 100, y: 20, selector: '#menu' });
  });

  it('reads and reports points in screenshot pixels', () => {
    const points: Array<[number, number]> = [];
    document.elementFromPoint = (x: number, y: number) => {
      points.push([x, y]);
      return document.getElementById('intro');
    };
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 2,
      configurable: true,
    });

    try {
      const result = usePointer({ kind: 'hover', x: 40, y: 220 });

      expect(points[0]).toEqual([20, 110]);
      expect(result).toEqual({ x: 40, y: 220, selector: '#intro' });
    } finally {
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 1,
        configurable: true,
      });
    }
  });

  it('rejects a selector that matches nothing visible', () => {
    expect(() => usePointer({ kind: 'hover', selector: '.missing' })).toThrow(
      'No visible element matches .missing'
    );
  });
});
