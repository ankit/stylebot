import type {
  StyleColorScheme,
  SupportedStyleOptions,
  StyleOptionDeclaration,
  StyleOptionDeclarations,
  StyleOptionName,
  StyleOptionValues,
} from '@stylebot/types';

const BLOCK = /\/\*[\s*]*==Stylebot==([\s\S]*?)==\/Stylebot==[\s*]*\*\//;
const OPTION_LINE = /^@option\s+(\S+)\s+(\S+)\s+(.*)$/;
const OTHER_KEY_LINE = /^@(?!option\b)/;
const SELECT_ARGS = /^\[([^\]]*)\]\s+(\S+)$/;

type OptionType = StyleOptionDeclaration['type'];

/**
 * The options Stylebot supports, each with the type and values a style must
 * declare it with. Supporting another option means adding it here.
 */
const SUPPORTED_OPTIONS: {
  [name in StyleOptionName]: {
    type: OptionType;
    values: Array<SupportedStyleOptions[name]>;
  };
} = {
  scheme: { type: 'select', values: ['system', 'light', 'dark'] },
};

/**
 * Reads what follows a select's type, `[a, b, c] b`, into its values and
 * default, or undefined when it isn't in that shape.
 */
const parseSelect = (
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

/**
 * How to read what follows each type. Supporting another type means adding
 * its reader here.
 */
const PARSE_ARGS: { [type in OptionType]: typeof parseSelect } = {
  select: parseSelect,
};

const isSupported = (name: string): name is StyleOptionName =>
  Object.hasOwn(SUPPORTED_OPTIONS, name);

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
 * Reads one line of the block into an option's name and declaration, or
 * warns and returns undefined when Stylebot can't use it.
 */
const parseLine = (
  line: string
): [StyleOptionName, StyleOptionDeclaration] | undefined => {
  // Other keys, such as @author, are left to later versions and other tools.
  if (OTHER_KEY_LINE.test(line)) {
    return undefined;
  }

  const match = line.match(OPTION_LINE);

  if (!match) {
    return ignore(line, 'not a valid @option line');
  }

  const [, name, type, args] = match;

  if (!isSupported(name)) {
    return ignore(line, `unknown option "${name}"`);
  }

  const supported = SUPPORTED_OPTIONS[name];

  if (type !== supported.type) {
    return ignore(line, `"${name}" must be a ${supported.type}`);
  }

  const parsed = PARSE_ARGS[supported.type](args.trim());

  if (!parsed) {
    return ignore(line, 'expected [values] followed by a default');
  }

  if (!hasSameValues(parsed.values, supported.values)) {
    return ignore(line, `"${name}" takes ${supported.values.join(', ')}`);
  }

  if (!parsed.values.includes(parsed.default)) {
    return ignore(line, `default "${parsed.default}" isn't one of its values`);
  }

  return [name, { type: supported.type, ...parsed }];
};

/**
 * The options a style's css declares in its `==Stylebot==` block, keyed by
 * name. Lines Stylebot can't use are skipped with a warning, so bad metadata
 * never stops a style from applying.
 */
export const parseStyleOptions = (css: string): StyleOptionDeclarations => {
  const block = css.includes('==Stylebot==') ? css.match(BLOCK) : null;
  const options: StyleOptionDeclarations = {};

  if (!block) {
    return options;
  }

  const lines = block[1]
    .split('\n')
    .map(line => line.replace(/^\s*\*?\s*/, '').trim())
    .filter(Boolean);

  for (const line of lines) {
    const option = parseLine(line);

    if (!option) {
      continue;
    }

    const [name, declaration] = option;

    if (name in options) {
      ignore(line, `"${name}" is already declared`);
      continue;
    }

    options[name] = declaration;
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
