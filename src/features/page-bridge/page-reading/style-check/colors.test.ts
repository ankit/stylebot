import {
  blend,
  contrastRatio,
  isDark,
  parseColor,
  toHex,
  WHITE,
} from './colors';
import type { Rgba } from './colors';

const BLACK: Rgba = [0, 0, 0, 1];

describe('parseColor', () => {
  it('reads rgb and rgba', () => {
    expect(parseColor('rgb(18, 52, 86)')).toEqual([18, 52, 86, 1]);
    expect(parseColor('rgba(18, 52, 86, 0.5)')).toEqual([18, 52, 86, 0.5]);
  });

  it('reads srgb in the color() form', () => {
    expect(parseColor('color(srgb 1 0 0.5 / 0.25)')).toEqual([
      255, 0, 127.5, 0.25,
    ]);
  });

  it('is null for a color space it does not read', () => {
    expect(parseColor('oklch(0.7 0.1 200)')).toBeNull();
  });
});

describe('blend', () => {
  it('lays a translucent color over the one behind it', () => {
    expect(blend([0, 0, 0, 0.5], WHITE)).toEqual([127.5, 127.5, 127.5, 1]);
  });
});

describe('contrastRatio', () => {
  it('is 21:1 for black on white, either way round', () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21);
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21);
  });

  it('is 1:1 for a color on itself', () => {
    expect(contrastRatio([98, 114, 164, 1], [98, 114, 164, 1])).toBe(1);
  });

  it("matches WCAG for Dracula's comment color on its background", () => {
    expect(contrastRatio([98, 114, 164, 1], [40, 42, 54, 1])).toBeCloseTo(
      3.03,
      2
    );
  });
});

describe('isDark', () => {
  it('tells dark from light, and leaves mid-tones undecided', () => {
    expect(isDark([40, 42, 54, 1])).toBe(true);
    expect(isDark(WHITE)).toBe(false);
    expect(isDark([128, 128, 128, 1])).toBeNull();
  });
});

describe('toHex', () => {
  it('rounds each channel to two hex digits', () => {
    expect(toHex([98.4, 114, 164.6, 1])).toBe('#6272a5');
  });
});
