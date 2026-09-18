import * as postcss from 'postcss';

export type RoleColorGroups = {
  text: Array<string>;
  surface: Array<string>;
  total: number;
};

const TEXT_ROLE_PROPERTIES = ['color'];
const SURFACE_ROLE_PROPERTIES = ['background-color', 'border-color', 'background', 'border'];
const SHORTHAND_PROPERTIES = ['background', 'border'];
const ROLE_CAP = 4;

const COLOR_FUNCTION_REGEX = /\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/i;
const HEX_COLOR_REGEX = /#[0-9a-fA-F]{3,8}\b/;

// Mirrors editor/utils/css-value.ts's extractColor, duplicated to avoid a reverse dependency.
const extractColorFromShorthand = (value: string): string => {
  const fn = value.match(COLOR_FUNCTION_REGEX);
  if (fn) {
    return fn[0];
  }

  const hex = value.match(HEX_COLOR_REGEX);
  return hex ? hex[0] : '';
};

const addColor = (list: Array<string>, seen: Set<string>, color: string): void => {
  const key = color.toLowerCase();
  if (!color || seen.has(key)) {
    return;
  }

  seen.add(key);
  if (list.length < ROLE_CAP) {
    list.push(color);
  }
};

export const getAlreadyUsedColors = (css: string): RoleColorGroups => {
  const text: Array<string> = [];
  const surface: Array<string> = [];
  const seenText = new Set<string>();
  const seenSurface = new Set<string>();

  const root = postcss.parse(css);
  root.walkDecls(decl => {
    const isText = TEXT_ROLE_PROPERTIES.includes(decl.prop);
    const isSurface = SURFACE_ROLE_PROPERTIES.includes(decl.prop);

    if (!isText && !isSurface) {
      return;
    }

    const color = SHORTHAND_PROPERTIES.includes(decl.prop)
      ? extractColorFromShorthand(decl.value)
      : decl.value;

    if (!color) {
      return;
    }

    if (isText) {
      addColor(text, seenText, color);
    } else {
      addColor(surface, seenSurface, color);
    }
  });

  const total = new Set([...seenText, ...seenSurface]).size;

  return { text, surface, total };
};
