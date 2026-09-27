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

// Opaque colors read as hex, transparent ones as rgb() (hex has no alpha).
export const tinycolorToCssColor = (color: tinycolor.Instance): string => {
  return color.getAlpha() < 1 ? color.toRgbString() : color.toHexString();
};

export const toCssColor = (hsva: Hsva): string => {
  return tinycolorToCssColor(
    tinycolor({ h: hsva.h, s: hsva.s, v: hsva.v, a: hsva.a })
  );
};

// Matches the design spec's swatch rule: colors lighter than #e8e8e8 get a
// hairline border so a near-white swatch still reads against a white popup.
export const needsHairline = (value: string): boolean => {
  const color = tinycolor(value);
  return (
    color.isValid() && color.getBrightness() > HAIRLINE_BRIGHTNESS_THRESHOLD
  );
};

// Selection checkmark color for a swatch — picks whichever of white/ink
// actually has readable contrast against this specific color, rather than
// needsHairline's coarser threshold (tuned for a border, not an icon).
export const checkMarkColor = (value: string): string => {
  const color = tinycolor(value);
  if (!color.isValid()) {
    return '#fff';
  }

  return tinycolor.mostReadable(color, ['#ffffff', '#191b1f']).toHexString();
};
