import { createMarks } from './marks';
import { createTerminalState } from './state';

// jsdom has no PointerEvent; a mouse event of a pointer type stands in.
const pointer = (type: string, x: number, y: number, init = {}) =>
  new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    button: 0,
    ...init,
  });

const setup = () => {
  const host = document.createElement('stylebot-cli-mode');
  const link = document.createElement('a');
  const state = createTerminalState();
  const onMark = jest.fn();
  const onUnmark = jest.fn();

  link.href = '#followed';
  document.body.append(host, link);

  const marks = createMarks({ host, state, onMark, onUnmark });

  /**
   * Drags from one point to another over the link, as the user would.
   */
  const drag = (from: [number, number], to: [number, number]) => {
    link.dispatchEvent(pointer('pointerdown', ...from));
    const dragStart = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(dragStart);
    link.dispatchEvent(pointer('pointermove', ...to));
    link.dispatchEvent(pointer('pointerup', ...to));
    const click = pointer('click', ...to);
    link.dispatchEvent(click);

    return { dragStart, click };
  };

  return { host, link, state, marks, onMark, onUnmark, drag };
};

let current: ReturnType<typeof setup>;

beforeEach(() => {
  window.scrollTo = jest.fn();
  Object.assign(window, { scrollX: 0, scrollY: 0 });
  current = setup();
});

afterEach(() => {
  current.marks.destroy();
  document.body.innerHTML = '';
});

describe('createMarks', () => {
  it('marks the area a drag covers, in page coordinates', () => {
    const { state, drag, onMark } = current;

    Object.assign(window, { scrollY: 300 });
    drag([100, 50], [40, 150]);

    expect(state.marks).toEqual([
      { n: 1, area: { x: 40, y: 350, width: 60, height: 100 } },
    ]);
    expect(state.drag).toBeNull();
    expect(onMark).toHaveBeenCalledWith({ n: 1, area: expect.any(Object) });
  });

  it('leaves an area in view where it is for a capture', () => {
    const { marks, drag } = current;

    drag([10, 10], [60, 60]);

    expect(marks.frame(1)).toEqual({
      rect: { x: 10, y: 10, width: 50, height: 50 },
      scrolled: false,
    });
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("keeps a drag from following a link or dragging it, and a click doesn't mark", () => {
    const { state, drag, link } = current;
    const followed = jest.fn();

    link.addEventListener('click', followed);

    const { dragStart, click } = drag([10, 10], [200, 200]);

    expect(dragStart.defaultPrevented).toBe(true);
    expect(click.defaultPrevented).toBe(true);
    expect(followed).not.toHaveBeenCalled();

    drag([10, 10], [12, 12]);
    expect(followed).toHaveBeenCalledTimes(1);
    expect(state.marks).toHaveLength(1);
  });

  it('leaves presses on its own terminal and badges alone', () => {
    const { host, state } = current;

    host.dispatchEvent(pointer('pointerdown', 10, 10));
    host.dispatchEvent(pointer('pointermove', 200, 200));
    host.dispatchEvent(pointer('pointerup', 200, 200));

    expect(state.marks).toEqual([]);
  });

  it('numbers marks on, never reusing a number, from the session’s next', () => {
    const { state, marks, drag, onUnmark } = current;

    state.nextMark = 4;
    drag([0, 0], [50, 50]);
    drag([0, 0], [50, 50]);
    marks.unmark(5);
    drag([0, 0], [50, 50]);

    expect(state.marks.map(({ n }) => n)).toEqual([4, 6]);
    expect(onUnmark).toHaveBeenCalledWith(5);
  });

  it('clears the outline of a mark when it goes', () => {
    const { state, marks, drag } = current;

    drag([0, 0], [50, 50]);
    state.highlighted = 1;
    marks.unmark(1);

    expect(state.highlighted).toBeNull();
  });

  it('clears every mark, answering whether there were any', () => {
    const { state, marks, drag } = current;

    expect(marks.clear()).toBe(false);
    drag([0, 0], [50, 50]);
    drag([0, 0], [50, 50]);
    expect(marks.clear()).toBe(true);
    expect(state.marks).toEqual([]);
  });

  it('hides the marks for a capture, until shown again', async () => {
    const { state, marks, drag } = current;

    await marks.hide();
    expect(state.capturing).toBe(false);

    drag([10, 10], [60, 60]);
    await marks.hide();
    expect(state.capturing).toBe(true);
    marks.show();
    expect(state.capturing).toBe(false);
  });

  it('scrolls an area out of view into it, and back', () => {
    const { marks, drag } = current;

    drag([10, 2000], [60, 2100]);

    expect(marks.frame(1)).toMatchObject({ scrolled: true });
    expect(window.scrollTo).toHaveBeenCalledWith({
      left: -6,
      top: 1984,
      behavior: 'instant',
    });

    marks.restoreScroll();
    expect(window.scrollTo).toHaveBeenLastCalledWith({
      left: 0,
      top: 0,
      behavior: 'instant',
    });
  });
});
