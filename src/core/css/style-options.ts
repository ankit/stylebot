import type {
  PageStyleOptions,
  StyleColorScheme,
  StyleOptionChoices,
  StyleOptionDeclaration,
  StyleOptionDeclarations,
  StyleOptionValues,
} from '@stylebot/types';

const BLOCKS =
  /\/\*[\s*]*==(Stylebot|UserStyle)==([\s\S]*?)==\/\1==[\s*]*\*\//g;
const OPTION_LINE = /^@option\s+(\S+)\s+(\S+)\s+(.*)$/;
const VAR_LINE = /^@var\s+(\S+)\s+(\S+)\s+("[^"]*"|'[^']*'|\S+)\s+([\s\S]+)$/;
const OTHER_KEY_LINE = /^@(?!option\b|var\b)/;
const SELECT_ARGS = /^\[([^\]]*)\]\s+(\S+)$/;
const NAME = /^[\w-]+$/;

type Declared = [string, StyleOptionDeclaration];

const SCHEME_VALUES: Array<StyleColorScheme> = ['system', 'light', 'dark'];

/**
 * Reads what follows `@option scheme select`, `[a, b, c] b`, into its values
 * and default, or undefined when it isn't in that shape.
 */
const parseSchemeArgs = (
  args: string
): { values: Array<string>; default: string } | undefined => {
  const match = args.match(SELECT_ARGS);

  if (!match) {
    return undefined;
  }

  const values = match[1]
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return { values, default: match[2] };
};

const hasSameValues = (a: Array<string>, b: Array<string>): boolean =>
  a.length === b.length && a.every(value => b.includes(value));

/**
 * Warns that a line of the block is skipped and why, and returns undefined
 * so the caller can return it.
 */
const ignore = (line: string, reason: string): undefined => {
  console.warn(`Stylebot: ignoring "${line}" (${reason})`);
  return undefined;
};

/**
 * Reads an `@option` line. Only `scheme` exists, a select of exactly
 * system, light and dark, kept as it shipped before `@var`.
 */
const parseOptionLine = (line: string): Declared | undefined => {
  const match = line.match(OPTION_LINE);

  if (!match) {
    return ignore(line, 'not a valid @option line');
  }

  const [, name, type, args] = match;

  if (name !== 'scheme') {
    return ignore(line, `unknown option "${name}"`);
  }

  if (type !== 'select') {
    return ignore(line, `"${name}" must be a select`);
  }

  const parsed = parseSchemeArgs(args.trim());

  if (!parsed) {
    return ignore(line, 'expected [values] followed by a default');
  }

  if (!hasSameValues(parsed.values, SCHEME_VALUES)) {
    return ignore(line, `"${name}" takes ${SCHEME_VALUES.join(', ')}`);
  }

  if (!parsed.values.includes(parsed.default)) {
    return ignore(line, `default "${parsed.default}" isn't one of its values`);
  }

  return [name, { type: 'select', ...parsed }];
};

const unquote = (label: string): string =>
  /^(["']).*\1$/.test(label) ? label.slice(1, -1) : label;

/**
 * Splits a select entry, `value:Label*`, into its value, its label (the
 * value when it has none) and whether the `*` marks it the default.
 */
const parseEntry = (
  entry: string
): { value: string; label: string; starred: boolean } => {
  const starred = entry.endsWith('*');
  const text = starred ? entry.slice(0, -1) : entry;
  const colon = text.indexOf(':');

  return colon === -1
    ? { value: text, label: text, starred }
    : { value: text.slice(0, colon), label: text.slice(colon + 1), starred };
};

/**
 * Reads a `@var select` default, UserCSS's array of `"value:Label"` entries
 * or object of `"value:Label": "css"` pairs, with a `*` on the default.
 * Returns undefined when it's neither or lists no values.
 */
const parseSelectArgs = (
  args: string
):
  | { values: Array<string>; default: string; choices: StyleOptionChoices }
  | undefined => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(args);
  } catch {
    return undefined;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return undefined;
  }

  const pairs: Array<[unknown, unknown]> = Array.isArray(parsed)
    ? parsed.map(entry => [entry, undefined])
    : Object.entries(parsed);

  if (pairs.length === 0) {
    return undefined;
  }

  const choices: StyleOptionChoices = {};
  let fallback: string | undefined;

  for (const [key, css] of pairs) {
    if (
      typeof key !== 'string' ||
      !['undefined', 'string'].includes(typeof css)
    ) {
      return undefined;
    }

    const { value, label, starred } = parseEntry(key);

    if (!value || Object.hasOwn(choices, value)) {
      return undefined;
    }

    choices[value] = { label, css: typeof css === 'string' ? css : value };

    if (starred && fallback === undefined) {
      fallback = value;
    }
  }

  const values = Object.keys(choices);

  return { values, default: fallback ?? values[0], choices };
};

/**
 * Reads a `@var` line, UserCSS's `@var <type> <name> <label> <default>`.
 * Only `select` and `checkbox` are supported so far.
 */
const parseVarLine = (line: string): Declared | undefined => {
  const match = line.match(VAR_LINE);

  if (!match) {
    return ignore(line, 'not a valid @var line');
  }

  const [, type, name, rawLabel, rawArgs] = match;
  const label = unquote(rawLabel);
  const args = rawArgs.trim();

  if (!NAME.test(name)) {
    return ignore(line, `"${name}" isn't a valid name`);
  }

  if (name === 'scheme') {
    return ignore(line, 'scheme is declared with @option');
  }

  if (type === 'checkbox') {
    if (args !== '0' && args !== '1') {
      return ignore(line, 'a checkbox defaults to 0 or 1');
    }

    return [name, { type, label, values: ['0', '1'], default: args }];
  }

  if (type !== 'select') {
    return ignore(line, `unsupported type "${type}"`);
  }

  const parsed = parseSelectArgs(args);

  if (!parsed) {
    return ignore(line, 'expected an array or object of values');
  }

  return [name, { type, label, ...parsed }];
};

/**
 * How many brackets a line leaves open, outside quoted strings, so a `@var`
 * whose values span several lines can be read as one.
 */
const openBrackets = (text: string): number => {
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (quote) {
      if (char === '\\') {
        i++;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '[' || char === '{') {
      depth++;
    } else if (char === ']' || char === '}') {
      depth--;
    }
  }

  return depth;
};

/**
 * The block's lines without comment decoration, with a `@var` whose values
 * continue onto the following lines joined back into one.
 */
const getLines = (block: string): Array<string> => {
  const lines = block
    .split('\n')
    .map(line => line.replace(/^\s*\*?\s*/, '').trim())
    .filter(Boolean);
  const joined: Array<string> = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.startsWith('@var')) {
      while (openBrackets(line) > 0 && i + 1 < lines.length) {
        line += ` ${lines[++i]}`;
      }
    }

    joined.push(line);
  }

  return joined;
};

/**
 * Reads one line of a block into an option's name and declaration, or warns
 * and returns undefined when Stylebot can't use it.
 */
const parseLine = (line: string): Declared | undefined => {
  // Other keys, such as @author, are left to later versions and other tools.
  if (OTHER_KEY_LINE.test(line)) {
    return undefined;
  }

  if (line.startsWith('@var')) {
    return parseVarLine(line);
  }

  return parseOptionLine(line);
};

/**
 * The options a style's css declares in its `==Stylebot==` or `==UserStyle==`
 * blocks, keyed by name. Lines Stylebot can't use are skipped with a warning,
 * so bad metadata never stops a style from applying.
 */
export const parseStyleOptions = (css: string): StyleOptionDeclarations => {
  const options: StyleOptionDeclarations = {};

  if (!css.includes('==Stylebot==') && !css.includes('==UserStyle==')) {
    return options;
  }

  for (const block of css.matchAll(BLOCKS)) {
    for (const line of getLines(block[2])) {
      const option = parseLine(line);

      if (!option) {
        continue;
      }

      const [name, declaration] = option;

      if (Object.hasOwn(options, name)) {
        ignore(line, `"${name}" is already declared`);
        continue;
      }

      options[name] = declaration;
    }
  }

  return options;
};

/**
 * The value in effect for a declared option: the stored one while it's still
 * one of the declared values, else the declared default.
 */
export const getStyleOptionValue = (
  declaration: StyleOptionDeclaration,
  stored?: string
): string =>
  stored !== undefined && declaration.values.includes(stored)
    ? stored
    : declaration.default;

/**
 * What the page gets for each option a style's css declares, or undefined
 * when it declares none.
 */
export const getPageStyleOptions = (
  css: string,
  values: StyleOptionValues = {}
): PageStyleOptions | undefined => {
  const declared = Object.entries(parseStyleOptions(css));

  if (declared.length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    declared.map(([name, declaration]) => {
      const value = getStyleOptionValue(declaration, values[name]);
      const choice =
        declaration.type === 'select'
          ? declaration.choices?.[value]
          : undefined;

      return [name, { value, css: choice?.css ?? value }];
    })
  );
};

/**
 * The color scheme a style's css asks the page for, or undefined when it
 * doesn't declare the scheme option.
 */
export const getColorScheme = (
  css: string,
  values: StyleOptionValues = {}
): StyleColorScheme | undefined => {
  const { scheme } = parseStyleOptions(css);

  return scheme
    ? (getStyleOptionValue(scheme, values.scheme) as StyleColorScheme)
    : undefined;
};
