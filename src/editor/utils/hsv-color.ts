import tinycolor from 'tinycolor2';

export type Hsva = {
  h: number;
  s: number;
  v: number;
  a: number;
};

const HAIRLINE_BRIGHTNESS_THRESHOLD = tinycolor('#e8e8e8').getBrightness();

export const parseToHsva = (value: string): Hsva => {
  const hsv = tinycolor(value || '#000000').toHsv();
  return { h: hsv.h, s: hsv.s, v: hsv.v, a: hsv.a };
};

export const toCssColor = (hsva: Hsva): string => {
  const color = tinycolor({ h: hsva.h, s: hsva.s, v: hsva.v, a: hsva.a });
  return hsva.a < 1 ? color.toRgbString() : color.toHexString();
};

// Matches the design spec's swatch rule: colors lighter than #e8e8e8 get a
// hairline border so a near-white swatch still reads against a white popup.
export const needsHairline = (value: string): boolean => {
  const color = tinycolor(value);
  return color.isValid() && color.getBrightness() > HAIRLINE_BRIGHTNESS_THRESHOLD;
};
