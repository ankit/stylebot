import Vue from 'vue';
import type { CliMark, ElementFrame, ViewportRect } from '@stylebot/types';

import {
  type PageArea,
  type Point,
  boxBetween,
  isDrag,
  isInViewport,
  roundRect,
  toPageArea,
  toViewportRect,
} from './areas';
import { describeArea } from './contained';
import type { PageMark, TerminalState } from './state';

export type Marks = {
  unmark: (n: number) => void;
  clear: () => boolean;
  describe: (css: string) => Array<CliMark>;
  frame: (n: number) => ElementFrame | null;
  restoreScroll: () => void;
  hide: () => Promise<void>;
  show: () => void;
  destroy: () => void;
};

// Room left around an area scrolled into view for a capture.
const FRAME_MARGIN = 16;
const NO_SELECT_STYLE_ID = 'stylebot-cli-mode-no-select';

/**
 * Resolves once the page has painted a frame, which is when a capture of a
 * shown tab stops seeing what changed before it.
 */
const nextPaint = (): Promise<void> =>
  new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );

/**
 * While a drag marks an area, the page can't select its text.
 */
const setNoSelect = (on: boolean): void => {
  document.getElementById(NO_SELECT_STYLE_ID)?.remove();

  if (on) {
    const style = document.createElement('style');

    style.id = NO_SELECT_STYLE_ID;
    style.textContent = '* { user-select: none !important; }';
    document.documentElement.append(style);
  }
};

const inViewport = (area: PageArea): ViewportRect =>
  toViewportRect(area, { x: scrollX, y: scrollY });

/**
 * The areas the user marks on the page. A plain drag past a few pixels
 * marks the area it covers; a click still reaches the page, but the click
 * that ends a drag doesn't, nor does the drag select text or drag a link.
 * Marks are numbered in the order they're made, and numbers aren't reused.
 */
export const createMarks = ({
  host,
  state,
  onMark,
  onUnmark,
}: {
  host: HTMLElement;
  state: TerminalState;
  onMark: (mark: PageMark) => void;
  onUnmark: (n: number) => void;
}): Marks => {
  let next = 1;
  let pressed: Point | null = null;
  let dragging = false;
  let skipClick = false;
  let scrolledFrom: Point | null = null;

  const isOurs = (event: Event): boolean => event.composedPath().includes(host);

  const unmark = (n: number): void => {
    const index = state.marks.findIndex(mark => mark.n === n);

    if (index === -1) {
      return;
    }

    state.marks.splice(index, 1);

    // A removed chip never hears the pointer leave it.
    if (state.highlighted === n) {
      state.highlighted = null;
    }

    onUnmark(n);
  };

  const addMark = (box: ViewportRect): void => {
    const n = Math.max(next, state.nextMark);

    const mark = {
      n,
      area: roundRect(toPageArea(box, { x: scrollX, y: scrollY })),
    };

    next = n + 1;
    state.marks.push(mark);
    onMark(mark);
  };

  const onPointerDown = (event: PointerEvent): void => {
    skipClick = false;
    pressed =
      !isOurs(event) &&
      event.button === 0 &&
      event.pointerType !== 'touch' &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey
        ? { x: event.clientX, y: event.clientY }
        : null;
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (!pressed) {
      return;
    }

    const at = { x: event.clientX, y: event.clientY };

    if (!dragging && isDrag(pressed, at)) {
      dragging = true;
      // The text the press started selecting isn't what the user meant.
      getSelection()?.removeAllRanges();
      setNoSelect(true);
    }

    if (dragging) {
      state.drag = boxBetween(pressed, at);
    }
  };

  const endDrag = (): void => {
    if (dragging) {
      state.drag = null;
      setNoSelect(false);
    }

    pressed = null;
    dragging = false;
  };

  const onPointerUp = (event: PointerEvent): void => {
    if (dragging && pressed) {
      addMark(boxBetween(pressed, { x: event.clientX, y: event.clientY }));
      skipClick = true;
    }

    endDrag();
  };

  const onClick = (event: MouseEvent): void => {
    if (skipClick && !isOurs(event)) {
      skipClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  // A drag that marks an area mustn't drag a link or image away instead.
  const onDragStart = (event: DragEvent): void => {
    if (pressed && !isOurs(event)) {
      event.preventDefault();
    }
  };

  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', endDrag, true);
  window.addEventListener('click', onClick, true);
  window.addEventListener('dragstart', onDragStart, true);

  return {
    unmark,

    clear: () => {
      const had = state.marks.length > 0;

      state.marks.map(({ n }) => n).forEach(unmark);
      return had;
    },

    describe: css =>
      state.marks.map(({ n, area }) => {
        const rect = inViewport(area);

        return { n, rect: roundRect(rect), ...describeArea(rect, css) };
      }),

    /**
     * Scrolls a mark's area into view for a capture, when it isn't wholly
     * in view, remembering where the page first was for restoreScroll.
     */
    frame: n => {
      const mark = state.marks.find(entry => entry.n === n);

      if (!mark) {
        return null;
      }

      const viewport = { width: innerWidth, height: innerHeight };

      if (isInViewport(inViewport(mark.area), viewport)) {
        return { rect: roundRect(inViewport(mark.area)), scrolled: false };
      }

      scrolledFrom ??= { x: scrollX, y: scrollY };
      scrollTo({
        left: mark.area.x - FRAME_MARGIN,
        top: mark.area.y - FRAME_MARGIN,
        behavior: 'instant',
      });

      return { rect: roundRect(inViewport(mark.area)), scrolled: true };
    },

    restoreScroll: () => {
      if (scrolledFrom) {
        scrollTo({
          left: scrolledFrom.x,
          top: scrolledFrom.y,
          behavior: 'instant',
        });
        scrolledFrom = null;
      }
    },

    /**
     * Hides the marks for a capture, until show. A hidden tab paints them
     * away once it's shown for the capture, so only a shown one waits.
     */
    hide: async () => {
      if (!state.marks.length) {
        return;
      }

      state.capturing = true;
      await Vue.nextTick();

      if (document.visibilityState === 'visible') {
        await nextPaint();
      }
    },

    show: () => {
      state.capturing = false;
    },

    destroy: () => {
      endDrag();
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('pointermove', onPointerMove, true);
      window.removeEventListener('pointerup', onPointerUp, true);
      window.removeEventListener('pointercancel', endDrag, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('dragstart', onDragStart, true);
    },
  };
};
