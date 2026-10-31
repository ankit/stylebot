import type { ViewportRect } from '@stylebot/types';

export type Point = { x: number; y: number };

// A box in page coordinates, which stays put as the page scrolls.
export type PageArea = ViewportRect;

// How far a press moves before it becomes a drag that marks an area.
const DRAG_THRESHOLD = 6;

export const BADGE_SIZE = 22;

// The closest a badge comes to the viewport's edges.
const BADGE_INSET = 2;

/**
 * Whether a press has moved far enough to be a drag rather than a click.
 */
export const isDrag = (from: Point, to: Point): boolean =>
  Math.hypot(to.x - from.x, to.y - from.y) > DRAG_THRESHOLD;

/**
 * The box between two points of the viewport.
 */
export const boxBetween = (from: Point, to: Point): ViewportRect => ({
  x: Math.min(from.x, to.x),
  y: Math.min(from.y, to.y),
  width: Math.abs(to.x - from.x),
  height: Math.abs(to.y - from.y),
});

/**
 * A box in the viewport as an area of the page, at a scroll position.
 */
export const toPageArea = (box: ViewportRect, scroll: Point): PageArea => ({
  ...box,
  x: box.x + scroll.x,
  y: box.y + scroll.y,
});

/**
 * Where an area of the page is in the viewport, at a scroll position.
 */
export const toViewportRect = (
  area: PageArea,
  scroll: Point
): ViewportRect => ({
  ...area,
  x: area.x - scroll.x,
  y: area.y - scroll.y,
});

/**
 * Whether two boxes overlap.
 */
export const overlaps = (a: ViewportRect, b: ViewportRect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

/**
 * Whether a box is wholly inside the viewport.
 */
export const isInViewport = (
  rect: ViewportRect,
  viewport: { width: number; height: number }
): boolean =>
  rect.x >= 0 &&
  rect.y >= 0 &&
  rect.x + rect.width <= viewport.width &&
  rect.y + rect.height <= viewport.height;

/**
 * Where a badge goes along one axis: centered on its area's start, pinned
 * inside the viewport while the area shows there, and gone with it after.
 */
const placeAlong = (start: number, size: number, max: number): number => {
  const low = Math.min(BADGE_INSET, start + size - BADGE_SIZE);
  const high = Math.max(max - BADGE_SIZE - BADGE_INSET, start);

  return Math.min(Math.max(start - BADGE_SIZE / 2, low), high);
};

/**
 * Where a mark's badge goes: on its area's top left corner.
 */
export const placeBadge = (
  rect: ViewportRect,
  viewport: { width: number; height: number }
): ViewportRect => ({
  x: placeAlong(rect.x, rect.width, viewport.width),
  y: placeAlong(rect.y, rect.height, viewport.height),
  width: BADGE_SIZE,
  height: BADGE_SIZE,
});

/**
 * A rect with its edges rounded to whole css pixels.
 */
export const roundRect = ({
  x,
  y,
  width,
  height,
}: ViewportRect): ViewportRect => ({
  x: Math.round(x),
  y: Math.round(y),
  width: Math.round(width),
  height: Math.round(height),
});

/**
 * A box's size as the page shows it, such as 320×180.
 */
export const formatSize = ({ width, height }: ViewportRect): string =>
  `${Math.round(width)}×${Math.round(height)}`;
