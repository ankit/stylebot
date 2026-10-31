import { getNoteRegion } from './notes';

jest.mock('../../capture-tab', () => ({}));
jest.mock('../screenshot', () => ({}));
jest.mock('../pointer', () => ({}));
jest.mock('./terminal', () => ({}));

const VIEWPORT = { width: 1000, height: 800 };

describe('getNoteRegion', () => {
  it('pads the box around every mark', () => {
    expect(
      getNoteRegion(
        [
          { x: 100, y: 100, width: 50, height: 50 },
          { x: 300, y: 200, width: 100, height: 40 },
        ],
        VIEWPORT
      )
    ).toEqual({ x: 76, y: 76, width: 348, height: 188 });
  });

  it('keeps it inside the viewport, and leaves out marks outside it', () => {
    expect(
      getNoteRegion(
        [
          { x: 900, y: 750, width: 200, height: 200 },
          { x: 10, y: 2000, width: 50, height: 50 },
        ],
        VIEWPORT
      )
    ).toEqual({ x: 876, y: 726, width: 124, height: 74 });
  });

  it('is undefined when no mark is in view', () => {
    expect(
      getNoteRegion([{ x: 10, y: -200, width: 50, height: 50 }], VIEWPORT)
    ).toBeUndefined();
  });
});
