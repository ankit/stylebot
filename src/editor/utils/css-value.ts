const LENGTH_REGEX = /-?\d*\.?\d+px/;
const COLOR_FUNCTION_REGEX = /\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/i;
const HEX_COLOR_REGEX = /#[0-9a-fA-F]{3,8}\b/;

const BORDER_STYLE_KEYWORDS = [
  'none',
  'solid',
  'dotted',
  'dashed',
  'double',
  'groove',
  'ridge',
  'inset',
  'outset',
];

// Pulls a px length out of a shorthand value (e.g. 'border: 1px solid red'),
// for displaying a shorthand-only declaration in a longhand-specific field.
export const extractLength = (value: string): string => {
  const match = value.match(LENGTH_REGEX);
  return match ? match[0] : '';
};

// Pulls a color (hex or an rgb/rgba/hsl/hsla function) out of a shorthand
// value, for displaying a shorthand-only declaration in a color field.
export const extractColor = (value: string): string => {
  const fn = value.match(COLOR_FUNCTION_REGEX);
  if (fn) {
    return fn[0];
  }

  const hex = value.match(HEX_COLOR_REGEX);
  return hex ? hex[0] : '';
};

// Pulls a border-style keyword out of a shorthand value (e.g. the border
// shorthand), for displaying a shorthand-only declaration in a style field.
export const extractBorderStyle = (value: string): string => {
  const tokens = value.split(/\s+/);
  return tokens.find(token => BORDER_STYLE_KEYWORDS.includes(token)) || '';
};
