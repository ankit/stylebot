import { parseToHsva, toCssColor, needsHairline } from '../hsv-color';

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

describe('needsHairline', () => {
  it('is true for white', () => {
    expect(needsHairline('#ffffff')).toBe(true);
  });

  it('is true for colors lighter than #e8e8e8', () => {
    expect(needsHairline('#f8f8f2')).toBe(true);
  });

  it('is false for colors at or darker than #e8e8e8', () => {
    expect(needsHairline('#e8e8e8')).toBe(false);
    expect(needsHairline('#282a36')).toBe(false);
    expect(needsHairline('#000000')).toBe(false);
  });

  it('is false for an invalid color', () => {
    expect(needsHairline('not-a-color')).toBe(false);
  });
});
