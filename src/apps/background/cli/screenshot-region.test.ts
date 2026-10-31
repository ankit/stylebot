import {
  ELEMENT_PADDING,
  getClipRegion,
  getElementRegion,
  parseClip,
  parseScale,
  planCrop,
  toImageRect,
} from './screenshot-region';

const VIEWPORT = { width: 1280, height: 720 };

describe('parseScale', () => {
  it('is 1 when left out', () => {
    expect(parseScale(undefined)).toBe(1);
    expect(parseScale('')).toBe(1);
  });

  it('reads a number', () => {
    expect(parseScale('2')).toBe(2);
    expect(parseScale('0.5')).toBe(0.5);
  });

  it('rejects zero, negatives, huge scales and words', () => {
    for (const scale of ['0', '-1', '5', 'big']) {
      expect(() => parseScale(scale)).toThrow('--scale takes a number');
    }
  });
});

describe('parseClip', () => {
  it('reads x,y,width,height', () => {
    expect(parseClip('10,20,300,40.5')).toEqual({
      x: 10,
      y: 20,
      width: 300,
      height: 40.5,
    });
  });

  it('rejects the wrong count, negatives and empty sizes', () => {
    for (const clip of ['10,20,300', '-1,0,10,10', '0,0,0,10', 'a,b,c,d']) {
      expect(() => parseClip(clip)).toThrow('--clip takes x,y,width,height');
    }
  });
});

describe('getClipRegion', () => {
  it('keeps a clip inside the viewport as it is', () => {
    expect(
      getClipRegion({ x: 10, y: 20, width: 300, height: 40 }, VIEWPORT)
    ).toEqual({
      rect: { x: 10, y: 20, width: 300, height: 40 },
      cutOff: false,
    });
  });

  it('cuts a clip that goes past the viewport', () => {
    expect(
      getClipRegion({ x: 1200, y: 700, width: 300, height: 40 }, VIEWPORT)
    ).toEqual({
      rect: { x: 1200, y: 700, width: 80, height: 20 },
      cutOff: true,
    });
  });

  it('rejects a clip outside the viewport', () => {
    expect(() =>
      getClipRegion({ x: 2000, y: 0, width: 10, height: 10 }, VIEWPORT)
    ).toThrow('The clip is outside the viewport, which is 1280×720');
  });
});

describe('getElementRegion', () => {
  it('pads an element', () => {
    expect(
      getElementRegion({ x: 100, y: 200, width: 50, height: 20 }, VIEWPORT)
    ).toEqual({
      rect: {
        x: 100 - ELEMENT_PADDING,
        y: 200 - ELEMENT_PADDING,
        width: 50 + ELEMENT_PADDING * 2,
        height: 20 + ELEMENT_PADDING * 2,
      },
      cutOff: false,
    });
  });

  it("doesn't call an element at the viewport's edge cut off", () => {
    expect(
      getElementRegion({ x: 0, y: 0, width: 1280, height: 60 }, VIEWPORT)
    ).toEqual({
      rect: { x: 0, y: 0, width: 1280, height: 60 + ELEMENT_PADDING },
      cutOff: false,
    });
  });

  it('cuts an element taller than the viewport to what fits', () => {
    expect(
      getElementRegion({ x: 0, y: 0, width: 600, height: 3000 }, VIEWPORT)
    ).toEqual({
      rect: { x: 0, y: 0, width: 600 + ELEMENT_PADDING, height: 720 },
      cutOff: true,
    });
  });

  it('rejects an element outside the viewport', () => {
    expect(() =>
      getElementRegion({ x: 0, y: -500, width: 100, height: 100 }, VIEWPORT)
    ).toThrow("The element isn't in the viewport");
  });
});

describe('planCrop', () => {
  const retina = { width: 2560, height: 1440 };

  it('draws a 2× capture at 1 css pixel per image pixel', () => {
    expect(planCrop(retina, VIEWPORT, undefined, 1)).toEqual({
      source: { x: 0, y: 0, width: 2560, height: 1440 },
      output: { width: 1280, height: 720 },
    });
  });

  it('keeps full resolution at scale 2', () => {
    expect(planCrop(retina, VIEWPORT, undefined, 2).output).toEqual(retina);
  });

  it('crops a region in device pixels and sizes it by the scale', () => {
    const region = { x: 10, y: 20, width: 300, height: 40 };

    expect(planCrop(retina, VIEWPORT, region, 1)).toEqual({
      source: { x: 20, y: 40, width: 600, height: 80 },
      output: { width: 300, height: 40 },
    });
    expect(planCrop(retina, VIEWPORT, region, 2).output).toEqual({
      width: 600,
      height: 80,
    });
  });

  it('rounds a fractional region to the nearest pixels, within the image', () => {
    expect(
      planCrop(
        VIEWPORT,
        VIEWPORT,
        { x: 10.5, y: 0.6, width: 200, height: 719.6 },
        1
      )
    ).toEqual({
      source: { x: 11, y: 1, width: 200, height: 719 },
      output: { width: 200, height: 719 },
    });
  });

  it('reads the ratio from the capture, so page zoom and 1× screens work', () => {
    expect(
      planCrop(VIEWPORT, { width: 640, height: 360 }, undefined, 1).output
    ).toEqual({ width: 640, height: 360 });
    expect(planCrop(VIEWPORT, VIEWPORT, undefined, 0.5).output).toEqual({
      width: 640,
      height: 360,
    });
  });
});

describe('toImageRect', () => {
  const bar = { x: 900, y: 600, width: 300, height: 80 };

  it('scales a box in the viewport to image pixels', () => {
    expect(toImageRect(bar, undefined, 2)).toEqual({
      x: 1800,
      y: 1200,
      width: 600,
      height: 160,
    });
  });

  it("clips the box to a region's image, measured from its corner", () => {
    expect(
      toImageRect(bar, { x: 800, y: 500, width: 200, height: 150 }, 1)
    ).toEqual({ x: 100, y: 100, width: 100, height: 50 });
  });

  it('is undefined for a box outside the region', () => {
    expect(
      toImageRect(bar, { x: 0, y: 0, width: 400, height: 300 }, 1)
    ).toBeUndefined();
  });
});
