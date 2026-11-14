import type { FloatingPanelBounds } from '@stylebot/types';

export const MARGIN = 12;
export const MIN_WIDTH = 360;
export const MIN_HEIGHT = 280;
export const DRAG_THRESHOLD = 4;
const POINTER_SNAP_DISTANCE = 32;
const PUSH_DISTANCE = 24;

export type Viewport = { width: number; height: number };
export type Snap = { side: 'left' | 'right'; armed: boolean };
export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const RESIZE_DIRECTIONS: Array<ResizeDirection> = [
  'n',
  's',
  'e',
  'w',
  'ne',
  'nw',
  'se',
  'sw',
];

export const DOCKED_RESIZE_DIRECTIONS: Array<ResizeDirection> = ['n', 's'];

const fit = (value: number, min: number, max: number): number =>
  Math.round(Math.max(min, Math.min(value, max)));

export const boundsOf = (element: Element): FloatingPanelBounds => {
  const { left, top, width, height } = element.getBoundingClientRect();

  return { left, top, width, height };
};

/**
 * Where a panel that has never floated starts: where it docks on the right.
 */
export const defaultFloatingBounds = (
  width: number,
  viewport: Viewport
): FloatingPanelBounds => ({
  width,
  height: viewport.height - MARGIN * 2,
  left: viewport.width - width - MARGIN,
  top: MARGIN,
});

/**
 * Shrinks and shifts the bounds until the whole panel is in the viewport.
 */
export const fitBounds = (
  bounds: FloatingPanelBounds,
  viewport: Viewport
): FloatingPanelBounds => {
  const maxWidth = viewport.width - MARGIN * 2;
  const maxHeight = viewport.height - MARGIN * 2;
  const width = fit(bounds.width, Math.min(MIN_WIDTH, maxWidth), maxWidth);
  const height = fit(bounds.height, Math.min(MIN_HEIGHT, maxHeight), maxHeight);

  return {
    width,
    height,
    left: fit(bounds.left, MARGIN, viewport.width - width - MARGIN),
    top: fit(bounds.top, MARGIN, viewport.height - height - MARGIN),
  };
};

/**
 * Moves the edges a handle grabs by the pointer's offset, stopping at the
 * minimum size and the viewport margin while the opposite edges stay put.
 */
export const resizeBounds = (
  start: FloatingPanelBounds,
  direction: ResizeDirection,
  dx: number,
  dy: number,
  viewport: Viewport
): FloatingPanelBounds => {
  let { left, top } = start;
  let right = left + start.width;
  let bottom = top + start.height;

  if (direction.includes('e')) {
    right = fit(right + dx, left + MIN_WIDTH, viewport.width - MARGIN);
  }

  if (direction.includes('w')) {
    left = fit(left + dx, MARGIN, right - MIN_WIDTH);
  }

  if (direction.includes('s')) {
    bottom = fit(bottom + dy, top + MIN_HEIGHT, viewport.height - MARGIN);
  }

  if (direction.includes('n')) {
    top = fit(top + dy, MARGIN, bottom - MIN_HEIGHT);
  }

  return { left, top, width: right - left, height: bottom - top };
};

/**
 * Which side a panel being moved to bounds would dock to, and whether
 * letting go now docks it: once it's pushed past the margin far enough, or
 * the pointer reaches the window's edge. Touching the margin only hints.
 */
export const snapFor = (
  bounds: FloatingPanelBounds,
  x: number,
  viewport: Viewport
): Snap | null => {
  const pastLeft = MARGIN - bounds.left;
  const pastRight = bounds.left + bounds.width - (viewport.width - MARGIN);

  if (pastLeft >= 0 || x <= POINTER_SNAP_DISTANCE) {
    return {
      side: 'left',
      armed: pastLeft >= PUSH_DISTANCE || x <= POINTER_SNAP_DISTANCE,
    };
  }

  if (pastRight >= 0 || x >= viewport.width - POINTER_SNAP_DISTANCE) {
    return {
      side: 'right',
      armed:
        pastRight >= PUSH_DISTANCE ||
        x >= viewport.width - POINTER_SNAP_DISTANCE,
    };
  }

  return null;
};
