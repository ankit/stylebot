import * as postcss from 'postcss';

import type { ChatCssEdit } from '@stylebot/types';

const KEYFRAMES = /keyframes$/i;
const GOOGLE_FONT_FAMILY = /fonts\.googleapis\.com\/css2\?family=([^:&"')]+)/;

/**
 * Visits each style rule in the css with the at-rules it sits in, skipping
 * keyframes, whose steps aren't selectors.
 */
const walkStyleRules = (
  root: postcss.Root,
  visit: (rule: postcss.Rule, context: string) => void
): void =>
  root.walkRules(rule => {
    const context: Array<string> = [];
    let node = rule.parent;

    while (node && node.type !== 'root') {
      if (node.type === 'atrule') {
        const atRule = node as postcss.AtRule;

        if (KEYFRAMES.test(atRule.name)) {
          return;
        }

        context.unshift(`@${atRule.name} ${atRule.params}`);
      }

      node = node.parent;
    }

    visit(rule, context.join(' '));
  });

/**
 * Parses css, throwing an error that says where it stops parsing.
 */
export const parseCss = (css: string): postcss.Root => {
  try {
    return postcss.parse(css);
  } catch (e) {
    const error = e as postcss.CssSyntaxError;
    const where = error.line ? ` at line ${error.line}` : '';

    throw new Error(
      `The css doesn't parse${where}: ${error.reason ?? error.message}`
    );
  }
};

/**
 * Parses css saved earlier, which the editor may have saved mid-edit, as
 * empty when it doesn't parse.
 */
export const parseSavedCss = (css: string): postcss.Root => {
  try {
    return postcss.parse(css);
  } catch {
    return postcss.root();
  }
};

/**
 * The declarations `after` adds or changes over `before`, as edits by
 * selector, for the page check to note before they apply.
 */
export const changedDeclarations = (
  before: postcss.Root,
  after: postcss.Root
): Array<ChatCssEdit> => {
  const previous = new Set<string>();
  const key = (
    context: string,
    rule: postcss.Rule,
    decl: postcss.Declaration
  ) => [context, rule.selector, decl.prop, decl.value].join('|');

  walkStyleRules(before, (rule, context) =>
    rule.walkDecls(decl => previous.add(key(context, rule, decl)))
  );

  const edits: Array<ChatCssEdit> = [];

  walkStyleRules(after, (rule, context) => {
    const declarations: ChatCssEdit['declarations'] = [];

    rule.walkDecls(decl => {
      if (!previous.has(key(context, rule, decl))) {
        declarations.push({ property: decl.prop, value: decl.value });
      }
    });

    if (declarations.length) {
      edits.push({ selector: rule.selector, declarations });
    }
  });

  return edits;
};

/**
 * Every declaration in the css, as edits by selector.
 */
export const allDeclarations = (root: postcss.Root): Array<ChatCssEdit> =>
  changedDeclarations(postcss.root(), root);

/**
 * Every style rule's selector in the css, in order.
 */
export const ruleSelectors = (root: postcss.Root): Array<string> => {
  const selectors: Array<string> = [];
  walkStyleRules(root, rule => selectors.push(rule.selector));
  return selectors;
};

/**
 * The families the css imports from Google Fonts.
 */
export const googleFontImports = (root: postcss.Root): Array<string> => {
  const families: Array<string> = [];

  root.walkAtRules('import', atRule => {
    const match = GOOGLE_FONT_FAMILY.exec(atRule.params);

    if (match) {
      families.push(match[1].replace(/\+/g, ' '));
    }
  });

  return families;
};
