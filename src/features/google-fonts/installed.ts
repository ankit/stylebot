const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'math',
  'emoji',
  'fangsong',
  'inherit',
  'initial',
  'unset',
  'revert',
]);

/**
 * Whether a name is one of CSS's generic families or global keywords
 * ("serif", "system-ui", "inherit"), which every browser renders.
 */
export const isGenericFamily = (name: string): boolean =>
  GENERIC_FAMILIES.has(name.trim().toLowerCase());

const FALLBACKS = ['monospace', 'serif', 'sans-serif'];
const SAMPLE = 'mmmmmmmmmmlli1WQ@#';

let context: CanvasRenderingContext2D | null = null;

const measure = (font: string): number => {
  context ??= document.createElement('canvas').getContext('2d');

  if (!context) {
    return 0;
  }

  context.font = `72px ${font}`;
  return context.measureText(SAMPLE).width;
};

/**
 * Whether the browser can render a font family, either installed on this
 * computer or loaded by the document. It renders the family against each
 * generic fallback: a missing font measures the same as the fallback.
 */
export const isFontAvailable = (family: string): boolean => {
  const name = family.trim();

  if (!name || isGenericFamily(name)) {
    return true;
  }

  const quoted = `"${name.replace(/"/g, '\\"')}"`;

  return FALLBACKS.some(
    fallback => measure(`${quoted}, ${fallback}`) !== measure(fallback)
  );
};
