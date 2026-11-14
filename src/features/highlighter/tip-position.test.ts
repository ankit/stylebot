import { findArrowLeft, findTipPos, leftBesidePanel } from './tip-position';

describe('findTipPos', () => {
  const bounds = { top: 0, left: 0, width: 1000, height: 800 };
  const tip = { width: 300, height: 100 };

  it('places the tip below the element when there is room', () => {
    const el = { top: 100, left: 50, width: 200, height: 40 };

    expect(findTipPos(el, bounds, tip)).toEqual({
      top: 148,
      left: 50,
      placement: 'below',
    });
  });

  it('places the tip above the element when there is no room below', () => {
    const el = { top: 720, left: 50, width: 200, height: 40 };

    expect(findTipPos(el, bounds, tip)).toEqual({
      top: 612,
      left: 50,
      placement: 'above',
    });
  });

  it('pins the tip to the top edge when it fits neither side', () => {
    const el = { top: 50, left: 50, width: 200, height: 700 };

    expect(findTipPos(el, bounds, tip)).toEqual({
      top: 8,
      left: 50,
      placement: null,
    });
  });

  it('keeps the tip inside the left edge', () => {
    const el = { top: 100, left: -20, width: 200, height: 40 };

    expect(findTipPos(el, bounds, tip).left).toEqual(12);
  });

  it('keeps the tip inside the right edge', () => {
    const el = { top: 100, left: 900, width: 50, height: 40 };

    expect(findTipPos(el, bounds, tip).left).toEqual(688);
  });
});

describe('leftBesidePanel', () => {
  const viewportWidth = 1000;

  it('sits left of a panel docked on the right', () => {
    const panel = { left: 600, right: 1000 };

    expect(leftBesidePanel(panel, 300, 16, viewportWidth)).toEqual(284);
  });

  it('sits right of a panel docked on the left', () => {
    const panel = { left: 0, right: 400 };

    expect(leftBesidePanel(panel, 300, 16, viewportWidth)).toEqual(416);
  });

  it('prefers the roomier side when neither fits', () => {
    const panel = { left: 250, right: 900 };

    expect(leftBesidePanel(panel, 300, 16, viewportWidth)).toEqual(16);
  });

  it('clamps to the viewport on the right', () => {
    const panel = { left: 0, right: 900 };

    expect(leftBesidePanel(panel, 300, 16, viewportWidth)).toEqual(684);
  });
});

describe('findArrowLeft', () => {
  const box = (left: number, width: number) => ({
    top: 0,
    left,
    width,
    height: 20,
  });

  it('sits near the tip start when the tip is flush with a wide element', () => {
    expect(findArrowLeft(box(100, 300), 100, 200)).toBe(12);
  });

  it('follows the element when the tip shifted left', () => {
    expect(findArrowLeft(box(500, 300), 400, 200)).toBe(112);
  });

  it('points at the middle of a narrow element', () => {
    expect(findArrowLeft(box(500, 20), 300, 300)).toBe(203);
  });

  it('stays clear of the tip corners', () => {
    expect(findArrowLeft(box(900, 300), 400, 200)).toBe(174);
    expect(findArrowLeft(box(0, 300), 100, 200)).toBe(12);
  });
});
