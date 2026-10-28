import * as postcss from 'postcss';

import { getStableSelector } from '@stylebot/css';
import type { CssEdit } from '@stylebot/types';

import {
  type StyleRule,
  diffDeclarations,
  listStyleRules,
  matchRules,
  walkStyleRules,
} from './stylesheet';

export type RuleChanges = {
  changed: Array<{ index: number; context: string }>;
  removed: Array<{ selector: string; context: string }>;
};

const GOOGLE_FONT_FAMILY = /fonts\.googleapis\.com\/css2\?family=([^:&"')]+)/;

/**
 * The declarations `after` adds or changes over `before`, as edits by
 * selector, for the page check to note before they apply.
 */
export const changedDeclarations = (
  before: postcss.Root,
  after: postcss.Root
): Array<CssEdit> => {
  const previous = new Set<string>();
  const key = (
    context: string,
    rule: postcss.Rule,
    decl: postcss.Declaration
  ) => [context, rule.selector, decl.prop, decl.value].join('|');

  walkStyleRules(before, (rule, context) =>
    rule.walkDecls(decl => previous.add(key(context, rule, decl)))
  );

  const edits: Array<CssEdit> = [];

  walkStyleRules(after, (rule, context) => {
    const declarations: CssEdit['declarations'] = [];

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
export const allDeclarations = (root: postcss.Root): Array<CssEdit> =>
  changedDeclarations(postcss.root(), root);

/**
 * Whether a rule lost or gained a declaration since its old version.
 */
const hasChanged = (old: StyleRule, rule: StyleRule): boolean => {
  const { removed, added } = diffDeclarations(old, rule);
  return removed.length > 0 || added.length > 0;
};

/**
 * Compares two stylesheets rule by rule: the rules in `after` that are new or
 * changed, by their index there, and the rules in `before` that are gone.
 * Null when `before` has no rules, as on a style's first save.
 */
export const compareRules = (
  before: postcss.Root,
  after: postcss.Root
): RuleChanges | null => {
  const rulesBefore = listStyleRules(before);

  if (!rulesBefore.length) {
    return null;
  }

  const { matches, removed } = matchRules(rulesBefore, listStyleRules(after));
  const changed: RuleChanges['changed'] = [];

  matches.forEach(({ rule, old }, index) => {
    if (!old || hasChanged(old, rule)) {
      changed.push({ index, context: rule.context });
    }
  });

  return { changed, removed };
};

/**
 * Every style rule's selector in the css, in order.
 */
export const ruleSelectors = (root: postcss.Root): Array<string> => {
  const selectors: Array<string> = [];
  walkStyleRules(root, rule => selectors.push(rule.selector));
  return selectors;
};

/**
 * Swaps each partly hashed class in the css's style rules for its stable
 * matcher, so its rules outlive a rebuild, and lists the selectors it
 * changed.
 */
export const useStableSelectors = (
  root: postcss.Root
): Array<{ from: string; to: string }> => {
  const swapped: Array<{ from: string; to: string }> = [];

  walkStyleRules(root, rule => {
    const to = getStableSelector(rule.selector);

    if (to !== rule.selector) {
      swapped.push({ from: rule.selector, to });
      rule.selector = to;
    }
  });

  return swapped;
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
