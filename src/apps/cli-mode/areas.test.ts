import {
  BADGE_SIZE,
  boxBetween,
  formatSize,
  isDrag,
  isInViewport,
  overlaps,
  placeBadge,
  toPageArea,
  toViewportRect,
} from './areas';

const VIEWPORT = { width: 1000, height: 800 };

describe('areas', () => {
  it('takes a drag only past a few pixels', () => {
    expect(isDrag({ x: 10, y: 10 }, { x: 14, y: 13 })).toBe(false);
    expect(isDrag({ x: 10, y: 10 }, { x: 20, y: 10 })).toBe(true);
  });

  it('boxes the points a drag went between, whichever way it went', () => {
    expect(boxBetween({ x: 300, y: 200 }, { x: 100, y: 250 })).toEqual({
      x: 100,
      y: 200,
      width: 200,
      height: 50,
    });
  });

  it('keeps an area in page coordinates, so it follows the page as it scrolls', () => {
    const area = toPageArea(
      { x: 100, y: 50, width: 200, height: 80 },
      { x: 0, y: 400 }
    );

    expect(area).toEqual({ x: 100, y: 450, width: 200, height: 80 });
    expect(toViewportRect(area, { x: 0, y: 400 })).toMatchObject({ y: 50 });
    expect(toViewportRect(area, { x: 30, y: 600 })).toMatchObject({
      x: 70,
      y: -150,
    });
  });

  it('puts a badge on its area, pinned in view while any of the area shows', () => {
    expect(
      placeBadge({ x: 100, y: 100, width: 200, height: 80 }, VIEWPORT)
    ).toMatchObject({ x: 100 - BADGE_SIZE / 2, y: 100 - BADGE_SIZE / 2 });

    expect(
      placeBadge({ x: 100, y: -40, width: 200, height: 80 }, VIEWPORT)
    ).toMatchObject({ y: 2 });

    expect(
      placeBadge({ x: 100, y: -400, width: 200, height: 80 }, VIEWPORT).y
    ).toBeLessThan(-BADGE_SIZE);
  });

  it('tells overlapping boxes and ones in view', () => {
    const box = { x: 100, y: 100, width: 100, height: 100 };

    expect(overlaps(box, { x: 150, y: 150, width: 10, height: 10 })).toBe(true);
    expect(overlaps(box, { x: 200, y: 100, width: 10, height: 10 })).toBe(
      false
    );
    expect(isInViewport(box, VIEWPORT)).toBe(true);
    expect(isInViewport({ ...box, y: 750 }, VIEWPORT)).toBe(false);
  });

  it('writes a size as the page shows it', () => {
    expect(formatSize({ x: 0, y: 0, width: 320.4, height: 179.6 })).toBe(
      '320×180'
    );
  });
});
