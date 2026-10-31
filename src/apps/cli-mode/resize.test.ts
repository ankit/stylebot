import { MIN_HEIGHT, MIN_WIDTH, resizeFrom } from './resize';

const VIEWPORT = { width: 1000, height: 800 };
const FROM = {
  size: { width: 440, height: 420 },
  position: { right: 16, bottom: 16 },
};

describe('resizeFrom', () => {
  it('grows from the top left, keeping the right and bottom put', () => {
    expect(resizeFrom('nw', FROM, { x: -100, y: -50 }, VIEWPORT)).toEqual({
      size: { width: 540, height: 470 },
      position: { right: 16, bottom: 16 },
    });
  });

  it('grows from the bottom right, moving those sides with it', () => {
    const from = { ...FROM, position: { right: 200, bottom: 100 } };

    expect(resizeFrom('se', from, { x: 50, y: 30 }, VIEWPORT)).toEqual({
      size: { width: 490, height: 450 },
      position: { right: 150, bottom: 70 },
    });
  });

  it('keeps a minimum size', () => {
    expect(resizeFrom('nw', FROM, { x: 500, y: 500 }, VIEWPORT).size).toEqual({
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
    });
  });

  it('stops at the viewport', () => {
    expect(
      resizeFrom('nw', FROM, { x: -2000, y: -2000 }, VIEWPORT).size
    ).toEqual({ width: 976, height: 776 });
    expect(resizeFrom('e', FROM, { x: 100, y: 0 }, VIEWPORT)).toEqual({
      size: { width: 448, height: 420 },
      position: { right: 8, bottom: 16 },
    });
  });

  it('changes only the side an edge is on', () => {
    expect(resizeFrom('n', FROM, { x: -80, y: -20 }, VIEWPORT).size).toEqual({
      width: 440,
      height: 440,
    });
  });
});
