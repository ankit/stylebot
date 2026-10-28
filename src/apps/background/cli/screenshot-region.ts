import type { ViewportRect } from '@stylebot/types';

export type Size = { width: number; height: number };

// Room around an element, so its border and shadow show.
export const ELEMENT_PADDING = 4;

const MAX_SCALE = 4;

/**
 * The part of the viewport to keep, and whether it had to be cut to fit.
 */
export type Region = { rect: ViewportRect; cutOff: boolean };

/**
 * A screenshot's output scale, in image pixels per css pixel: 1 when left out.
 */
export const parseScale = (scale: unknown): number => {
  if (scale === undefined || scale === null || scale === '') {
    return 1;
  }

  const value = Number(scale);

  if (!Number.isFinite(value) || value <= 0 || value > MAX_SCALE) {
    throw new Error(
      `--scale takes a number above 0, up to ${MAX_SCALE}: ${scale}`
    );
  }

  return value;
};

/**
 * A clip written as x,y,width,height in css pixels of the viewport.
 */
export const parseClip = (clip: unknown): ViewportRect => {
  const parts = String(clip).split(',').map(Number);

  if (
    parts.length !== 4 ||
    parts.some(part => !Number.isFinite(part)) ||
    parts[0] < 0 ||
    parts[1] < 0 ||
    parts[2] <= 0 ||
    parts[3] <= 0
  ) {
    throw new Error(
      `--clip takes x,y,width,height in css pixels, such as 0,0,600,400: ${clip}`
    );
  }

  const [x, y, width, height] = parts;
  return { x, y, width, height };
};

/**
 * The part of a rect inside the viewport, or undefined when none is.
 */
const fitToViewport = (
  rect: ViewportRect,
  viewport: Size
): ViewportRect | undefined => {
  const left = Math.max(rect.x, 0);
  const top = Math.max(rect.y, 0);
  const right = Math.min(rect.x + rect.width, viewport.width);
  const bottom = Math.min(rect.y + rect.height, viewport.height);

  if (right <= left || bottom <= top) {
    return undefined;
  }

  return { x: left, y: top, width: right - left, height: bottom - top };
};

/**
 * What to keep of a clip: the part of it inside the viewport.
 */
export const getClipRegion = (clip: ViewportRect, viewport: Size): Region => {
  const rect = fitToViewport(clip, viewport);

  if (!rect) {
    throw new Error(
      `The clip is outside the viewport, which is ${viewport.width}×${viewport.height}`
    );
  }

  return {
    rect,
    cutOff: rect.width < clip.width || rect.height < clip.height,
  };
};

/**
 * What to keep of an element: its box with some padding, cut to the viewport.
 * It's cut off when the element itself doesn't fit, not just its padding.
 */
export const getElementRegion = (box: ViewportRect, viewport: Size): Region => {
  const visible = fitToViewport(box, viewport);
  const rect = fitToViewport(
    {
      x: box.x - ELEMENT_PADDING,
      y: box.y - ELEMENT_PADDING,
      width: box.width + ELEMENT_PADDING * 2,
      height: box.height + ELEMENT_PADDING * 2,
    },
    viewport
  );

  if (!visible || !rect) {
    throw new Error("The element isn't in the viewport, even scrolled to");
  }

  return {
    rect,
    cutOff: visible.width < box.width - 1 || visible.height < box.height - 1,
  };
};

/**
 * Which pixels of a capture to draw, and at what size, for a region of the
 * viewport (the whole of it when left out) at a scale in image px per css px.
 * Edges round to the nearest pixel, so a fractional box keeps its size.
 */
export const planCrop = (
  image: Size,
  viewport: Size,
  region: ViewportRect | undefined,
  scale: number
): { source: ViewportRect; output: Size } => {
  const ratio = image.width / viewport.width;
  const area = region ?? { x: 0, y: 0, ...viewport };
  const left = Math.max(Math.round(area.x * ratio), 0);
  const top = Math.max(Math.round(area.y * ratio), 0);
  const right = Math.min(
    Math.round((area.x + area.width) * ratio),
    image.width
  );
  const bottom = Math.min(
    Math.round((area.y + area.height) * ratio),
    image.height
  );
  const source = { x: left, y: top, width: right - left, height: bottom - top };

  return {
    source,
    output: {
      width: Math.max(Math.round((source.width / ratio) * scale), 1),
      height: Math.max(Math.round((source.height / ratio) * scale), 1),
    },
  };
};
