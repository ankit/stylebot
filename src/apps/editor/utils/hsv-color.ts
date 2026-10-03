import tinycolor from 'tinycolor2';

export type Hsva = {
  h: number;
  s: number;
  v: number;
  a: number;
};

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

const colorKey = (value: string): string => {
  const color = tinycolor(value);
  return color.isValid() ? color.toHex8String() : value.trim().toLowerCase();
};

// Treats any two spellings of one color as equal, e.g. #fff and rgb(255, 255, 255).
export const sameColor = (a: string, b: string): boolean => {
  return !!a && !!b && colorKey(a) === colorKey(b);
};

export const uniqueColors = (colors: Array<string>): Array<string> => {
  const seen = new Set<string>();

  return colors.filter(color => {
    const key = colorKey(color);
    if (!color || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

/**
 * The checkmark color for a selected swatch: white on all but the lightest
 * colors, where it switches to ink.
 */
export const checkMarkColor = (value: string): string => {
  const color = tinycolor(value);
  return color.isValid() && color.getBrightness() > 190 ? '#191b1f' : '#ffffff';
};
