import {
  checkMarkColor,
  parseToHsva,
  toCssColor,
  sameColor,
  uniqueColors,
} from './hsv-color';

describe('parseToHsva / toCssColor round-trip', () => {
  it('round-trips an opaque hex color', () => {
    const hsva = parseToHsva('#50fa7b');
    expect(toCssColor(hsva)).toBe('#50fa7b');
  });

  it('round-trips a translucent rgba color as rgba', () => {
    const hsva = parseToHsva('rgba(80, 250, 123, 0.5)');
    expect(hsva.a).toBeCloseTo(0.5);
    expect(toCssColor(hsva)).toBe('rgba(80, 250, 123, 0.5)');
  });

  it('falls back to black for an empty value', () => {
    const hsva = parseToHsva('');
    expect(toCssColor(hsva)).toBe('#000000');
  });

  it('reflects hue/saturation/value changes back into a hex string', () => {
    const hsva = parseToHsva('#ff0000');
    expect(hsva.h).toBe(0);

    const shifted = { ...hsva, h: 120 };
    expect(toCssColor(shifted)).toBe('#00ff00');
  });
});

describe('sameColor', () => {
  it('matches two spellings of one color', () => {
    expect(sameColor('#ffffff', 'rgb(255, 255, 255)')).toBe(true);
    expect(sameColor('#FFF', '#ffffff')).toBe(true);
  });

  it('tells colors and alphas apart', () => {
    expect(sameColor('#ffffff', '#fffffe')).toBe(false);
    expect(sameColor('#ffffff', 'rgba(255, 255, 255, 0.5)')).toBe(false);
  });

  it('never matches an empty value', () => {
    expect(sameColor('', '')).toBe(false);
  });
});

describe('uniqueColors', () => {
  it('keeps the first spelling of each color, in order', () => {
    expect(
      uniqueColors(['#112233', 'rgb(17, 34, 51)', 'red', '#ff0000', '#000'])
    ).toEqual(['#112233', 'red', '#000']);
  });
});

describe('checkMarkColor', () => {
  it('uses ink on light swatches and white on dark ones', () => {
    expect(checkMarkColor('#f4f3ef')).toBe('#191b1f');
    expect(checkMarkColor('#171a20')).toBe('#ffffff');
    expect(checkMarkColor('#4a90d9')).toBe('#ffffff');
  });
});
