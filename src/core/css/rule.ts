import * as postcss from 'postcss';
import type { CssDeclaration } from '@stylebot/types';

import { getSelector } from './selector/get-selector';
import { elementMatches, matchesOf, sameElements } from './selector/reach';

/**
 * How many top-level rules a stylesheet has, or null when it doesn't parse.
 */
export const countRules = (css: string): number | null => {
  try {
    return postcss.parse(css).nodes?.length ?? 0;
  } catch {
    return null;
  }
};

/**
 * Whether the rule sits inside another rule (native CSS nesting). Its
 * selector is then relative to the parent — `.title` inside `.card` means
 * `.card .title` — so it can't be looked up or edited by selector alone.
 */
export const isNestedRule = (rule: postcss.Rule): boolean => {
  let parent = rule.parent;

  while (parent && parent.type !== 'root') {
    if (parent.type === 'rule') {
      return true;
    }
    parent = parent.parent;
  }

  return false;
};

/**
 * Like root.walkRules, but skips rules nested inside another rule.
 */
export const walkUnnestedRules = (
  root: postcss.Root,
  callback: (rule: postcss.Rule) => void
): void => {
  root.walkRules(rule => {
    if (!isNestedRule(rule)) {
      callback(rule);
    }
  });
};

/**
 * A copy of the rule holding only its own declarations, so readers that walk
 * it don't pick up declarations belonging to a nested rule or at-rule.
 */
export const withOwnDeclarationsOnly = (rule: postcss.Rule): postcss.Rule => {
  const copy = rule.clone();

  copy.each(node => {
    if (node.type !== 'decl') {
      node.remove();
    }
  });
  copy.raws.semicolon = true;

  return copy;
};

/**
 * The rule for this exact selector: the top-level one when there is one,
 * otherwise the first inside an at-rule (e.g. `@media`). Rules nested inside
 * another rule never count, whatever their selector.
 */
export const findRule = (
  root: postcss.Root,
  selector: string
): postcss.Rule | null => {
  const matches: Array<postcss.Rule> = [];

  walkUnnestedRules(root, rule => {
    if (rule.selector === selector) {
      matches.push(rule);
    }
  });

  return matches.find(rule => rule.parent === root) ?? matches[0] ?? null;
};

export const getRule = (css: string, selector: string): postcss.Rule | null =>
  findRule(postcss.parse(css), selector);

/**
 * Unlike getRule, also matches a selector grouped in a comma-separated rule.
 * Keeps the last match: at equal specificity, later rules win the cascade.
 */
export const getRuleForSelector = (
  css: string,
  selector: string
): postcss.Rule | null => {
  const root = postcss.parse(css);
  let found: postcss.Rule | null = null;

  walkUnnestedRules(root, rule => {
    if (rule.selectors.includes(selector)) {
      found = rule;
    }
  });

  return found;
};

/**
 * Collects the declarations of the rule for this selector, whether it is
 * a whole grouped selector or one member of a group. Returns null when
 * there is no rule or it is empty.
 */
export const getDeclarationsForSelector = (
  css: string,
  selector: string
): Array<CssDeclaration> | null => {
  const rule = getRule(css, selector) ?? getRuleForSelector(css, selector);

  if (!rule) {
    return null;
  }

  const declarations: Array<CssDeclaration> = [];
  withOwnDeclarationsOnly(rule).walkDecls(decl => {
    declarations.push({ property: decl.prop, value: decl.value });
  });

  return declarations.length > 0 ? declarations : null;
};

/**
 * Matching one of these only means the inspector's cursor/focus is on the
 * element right now, not that the selector targets its normal appearance.
 */
const STATE_PSEUDO_CLASSES = /:(hover|focus(-visible|-within)?|active)\b/i;

/**
 * Finds a saved selector that reaches exactly what the inspector's own pick
 * would, so picking keeps editing that rule. A wider one, like `*:not(.x)`,
 * is left for the user to choose.
 */
export const getExistingSelector = (
  el: HTMLElement,
  css: string
): string | null => {
  const saved: Array<string> = [];
  walkUnnestedRules(postcss.parse(css), rule => saved.push(...rule.selectors));

  const matching = saved.filter(
    selector =>
      !STATE_PSEUDO_CLASSES.test(selector) && elementMatches(el, selector)
  );

  if (!matching.length) {
    return null;
  }

  const picked = matchesOf(getSelector(el));
  const same = matching.find(selector =>
    sameElements(matchesOf(selector), picked)
  );

  return same ?? null;
};

/**
 * Moves `selector` out of a grouped rule (`.foo, .bar`) into its own rule right
 * after it, keeping its declarations so edits don't hit its groupmates.
 */
export const splitSelectorFromGroup = (
  css: string,
  selector: string
): string => {
  const root = postcss.parse(css);
  const matches: Array<postcss.Rule> = [];

  walkUnnestedRules(root, rule => {
    if (rule.selector !== selector && rule.selectors.includes(selector)) {
      matches.push(rule);
    }
  });

  const group = matches.length > 0 ? matches[matches.length - 1] : null;

  if (!group) {
    return css;
  }

  const split = group.clone();
  split.selectors = [selector];
  // The clone inherits the group's leading whitespace, which is empty when
  // the group opens the sheet and would print the new rule as `}.foo {`.
  split.raws.before = '\n\n';
  group.after(split);
  group.selectors = group.selectors.filter(part => part !== selector);

  return root.toString();
};

export const addEmptyRule = (css: string, selector: string): string => {
  const ruleCss = `${selector} {\n  \n}`;
  const cssWithNewLines = css.replace(/((.*)\})\n*$/, '$1\n\n');
  return `${cssWithNewLines}${ruleCss}`;
};

export const removeEmptyRules = (css: string): string => {
  const root = postcss.parse(css);
  const rules: Array<postcss.Rule> = [];

  root.walkRules(rule => rules.push(rule));

  // Innermost first, so a rule left holding nothing but an empty nested
  // rule is itself removed in the same pass.
  rules.reverse().forEach(rule => {
    if (!rule.first) {
      rule.remove();
    }
  });

  return root.toString();
};

export const removeRule = (css: string, selector: string): string => {
  const root = postcss.parse(css);

  walkUnnestedRules(root, rule => {
    if (rule.selector === selector) {
      rule.remove();
    }
  });

  return root.toString();
};

/**
 * The selectors in `css` that match `el`, skipping ones for interaction
 * states like :hover, in the order the style lists them.
 */
export const getMatchingSelectors = (
  el: HTMLElement,
  css: string
): Array<string> => {
  const matches = new Set<string>();

  walkUnnestedRules(postcss.parse(css), rule => {
    for (const selector of rule.selectors) {
      if (STATE_PSEUDO_CLASSES.test(selector)) {
        continue;
      }

      try {
        if (el.matches(selector)) {
          matches.add(selector);
        }
      } catch {
        //
      }
    }
  });

  return Array.from(matches);
};
