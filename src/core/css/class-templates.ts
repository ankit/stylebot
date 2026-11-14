import {
  hasDigitAmongLetters,
  isCamelWord,
  isDashedHash,
  isHashSegment,
  isSplitHash,
} from './hash-shape';

type Names = Record<string, string>;

/**
 * How a build tool names a class, as text around a `{hash}`: `{file}` and
 * `{local}` are authored names, `{rest}` any authored remainder, `{n}` a
 * counter or line number, and `{_}` an optional underscore.
 */
export type NamingTemplate = {
  pattern: string;
  hash: RegExp;
  length: [number, number];
  check?: (hash: string, names: Names) => boolean;
};

export const NAMING_TEMPLATES: Array<NamingTemplate> = [
  // styled-components: `Header-sc-1x2y3z-0`.
  { pattern: '{file}-sc-{hash}-{n}', hash: /^[a-z0-9]+$/i, length: [1, 20] },
  // Next.js and Primer: `NavDropdown-module__button__PEHWX`, whatever the
  // last 5 characters look like, unless it's Turbopack's `E0kJGG__title`.
  {
    pattern: '{file}module__{local}__{hash}',
    hash: /^[\w-]+$/,
    length: [5, 5],
    check: (hash, { file, local }) =>
      /[-_]$/.test(file) && !(hasDigitAmongLetters(local) && isCamelWord(hash)),
  },
  // GitHub: `SidebarAbout-module_eqNI3a_websiteLink`.
  {
    pattern: '{file}-module_{hash}_{local}',
    hash: /^[A-Za-z0-9][\w-]*$/,
    length: [6, 6],
    check: isSplitHash,
  },
  // React's useId: `button-label-_R_93ades_`.
  { pattern: '{file}-_R_{hash}_', hash: /^[0-9a-z]+$/, length: [1, 40] },
  // Vite: `_card_1wfme_1`.
  { pattern: '_{local}_{hash}_{n}', hash: /^[0-9a-z]+$/, length: [5, 5] },
  // Dash-separated CSS Modules: `prc-TopicTag-TopicTag-LS-jX`, told apart
  // from utilities like `col-md-12` by a PascalCase component name.
  {
    pattern: '{file}-{hash}',
    hash: /^[\w-]+$/,
    length: [5, 5],
    check: (hash, { file }) =>
      isDashedHash(hash) && /(^|-)[A-Z][a-z]/.test(file),
  },
  // CSS Modules' `Header_nav__a1B2c`, and Turbopack's `page-module__E0kJGG__main`.
  {
    pattern: '{file}__{hash}__{rest}',
    hash: /^(?!.*__)[\w-]+$/,
    length: [5, 10],
    check: isHashSegment,
  },
  {
    pattern: '{file}__{hash}',
    hash: /^(?!.*__)[\w-]+$/,
    length: [5, 10],
    check: isHashSegment,
  },
  // Lightning CSS, as on the New York Times, Linear and Notion:
  // `Wr7_RG_mastheadContainer`, `m-9-4W_timestamp`, `-Qs3Ha_section`.
  {
    pattern: '{_}{hash}_{local}',
    hash: /^-?[A-Za-z0-9][\w-]*[A-Za-z0-9]$/,
    length: [6, 6],
    check: (hash, { local }) => isSplitHash(hash) && local.length >= 3,
  },
];

const TOKENS: Record<string, string> = {
  file: '(?<file>.+)',
  local: '(?<local>[A-Za-z][\\w-]*)',
  rest: '(?<rest>.+)',
  n: '\\d+',
  _: '_?',
};

type CompiledTemplate = {
  before: RegExp;
  after: RegExp;
  keepBefore: boolean;
  keepAfter: boolean;
  template: NamingTemplate;
};

/**
 * One side of a template's `{hash}` as an anchored regex.
 */
function compileSide(pattern: string): RegExp {
  const source = pattern
    .split(/(\{\w+\})/)
    .map(piece => {
      const token = piece.match(/^\{(\w+)\}$/);

      return token
        ? TOKENS[token[1]]
        : piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');

  return new RegExp(`^${source}$`);
}

/**
 * A template ready to match, keeping each side of the hash only when it
 * holds an authored name.
 */
export function compileTemplate(template: NamingTemplate): CompiledTemplate {
  const [before, after] = template.pattern.split('{hash}');
  const authored = /\{(file|local|rest)\}/;

  return {
    before: compileSide(before),
    after: compileSide(after),
    keepBefore: authored.test(before),
    keepAfter: authored.test(after),
    template,
  };
}

/**
 * The authored parts of a class named by the template, trying each place the
 * hash could sit, from the left.
 */
export function matchTemplate(
  className: string,
  { before, after, keepBefore, keepAfter, template }: CompiledTemplate
): Array<string> | null {
  const [min, max] = template.length;

  for (let start = 0; start + min <= className.length; start++) {
    const head = className.slice(0, start);
    const headMatch = head.match(before);
    if (!headMatch) {
      continue;
    }

    for (let end = start + min; end <= start + max; end++) {
      if (end > className.length) {
        break;
      }

      const hash = className.slice(start, end);
      const tail = className.slice(end);
      const tailMatch = tail.match(after);
      if (!tailMatch || !template.hash.test(hash)) {
        continue;
      }

      const names = { ...headMatch.groups, ...tailMatch.groups };
      if (template.check && !template.check(hash, names)) {
        continue;
      }

      const parts = [
        ...(keepBefore && head ? [head] : []),
        ...(keepAfter && tail ? [tail] : []),
      ];

      return parts.length ? parts : null;
    }
  }

  return null;
}

let compiled: Array<CompiledTemplate> | null = null;

/**
 * The authored parts of a class named by one of the known build tools'
 * templates.
 */
export function getTemplateParts(className: string): Array<string> | null {
  compiled ??= NAMING_TEMPLATES.map(compileTemplate);

  for (const template of compiled) {
    const parts = matchTemplate(className, template);
    if (parts) {
      return parts;
    }
  }

  return null;
}
