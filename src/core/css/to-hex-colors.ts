const hexByte = (n: number): string =>
  Math.round(Math.min(255, Math.max(0, n)))
    .toString(16)
    .padStart(2, '0');

/**
 * Rewrites rgb()/rgba() colors in a value as hex, since browsers serialize
 * page colors as rgb() whatever the stylesheet said.
 */
export const toHexColors = (value: string): string =>
  value.replace(
    /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)/gi,
    (match, r, g, b, alpha?: string) => {
      const a = alpha?.endsWith('%')
        ? parseFloat(alpha) / 100
        : parseFloat(alpha ?? '1');
      const hex = `#${[r, g, b].map(c => hexByte(parseFloat(c))).join('')}`;

      return a < 1 ? `${hex}${hexByte(a * 255)}` : hex;
    }
  );
