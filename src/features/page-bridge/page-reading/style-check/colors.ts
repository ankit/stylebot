export type Rgba = [number, number, number, number];

/**
 * A computed color as channels 0–255 and alpha 0–1, or null for one in a
 * color space this doesn't read.
 */
export const parseColor = (value: string): Rgba | null => {
  const rgb =
    /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/.exec(value);

  if (rgb) {
    return [
      Number(rgb[1]),
      Number(rgb[2]),
      Number(rgb[3]),
      rgb[4] === undefined ? 1 : Number(rgb[4]),
    ];
  }

  const srgb =
    /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(value);

  if (srgb) {
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      srgb[4] === undefined ? 1 : Number(srgb[4]),
    ];
  }

  return null;
};

export const blend = (top: Rgba, bottom: Rgba): Rgba => {
  const alpha = top[3];
  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
    1,
  ];
};

const luminance = ([r, g, b]: Rgba): number => {
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

export const contrastRatio = (a: Rgba, b: Rgba): number => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

/**
 * Whether a color reads as dark or light; null for the mid-tones between.
 */
export const isDark = (color: Rgba): boolean | null => {
  const value = luminance(color);

  if (value < 0.18) {
    return true;
  }

  return value > 0.4 ? false : null;
};

export const toHex = ([r, g, b]: Rgba): string =>
  `#${[r, g, b]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;

export const WHITE: Rgba = [255, 255, 255, 1];

/**
 * Resolves what's painted behind each element, through its translucent
 * ancestors down to the canvas; null under a background image, where the
 * color can't be known. Memoised for one pass over the page.
 */
export const backgroundResolver = () => {
  const cache = new Map<Element, Rgba | null>();

  const resolve = (element: Element | null): Rgba | null => {
    if (!element) {
      return WHITE;
    }

    if (cache.has(element)) {
      return cache.get(element) as Rgba | null;
    }

    const style = getComputedStyle(element);
    let result: Rgba | null;

    if (style.backgroundImage && style.backgroundImage !== 'none') {
      result = null;
    } else {
      const own = parseColor(style.backgroundColor);

      if (own && own[3] >= 1) {
        result = own;
      } else {
        const behind = resolve(element.parentElement);
        result = behind && own && own[3] > 0 ? blend(own, behind) : behind;
      }
    }

    cache.set(element, result);
    return result;
  };

  return resolve;
};

export const textContrast = (
  element: Element,
  resolveBackground: (element: Element) => Rgba | null
): { ratio: number; color: Rgba; background: Rgba } | null => {
  const color = parseColor(getComputedStyle(element).color);
  const background = resolveBackground(element);

  if (!color || !background || color[3] === 0) {
    return null;
  }

  const shown = color[3] < 1 ? blend(color, background) : color;
  return {
    ratio: contrastRatio(shown, background),
    color: shown,
    background,
  };
};

// WCAG's thresholds: 3:1 is enough for large text, 4.5:1 for the rest.
export const minimumContrast = (element: Element): number => {
  const style = getComputedStyle(element);
  const size = parseFloat(style.fontSize);
  const bold = Number(style.fontWeight) >= 700;
  return size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
};
