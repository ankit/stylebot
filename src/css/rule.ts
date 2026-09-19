import * as postcss from 'postcss';

export const getRule = (css: string, selector: string): postcss.Rule | null => {
  const root = postcss.parse(css);
  const matchingRules: Array<postcss.Rule> = [];

  root.walkRules(selector, rule => matchingRules.push(rule));
  return matchingRules.length > 0 ? matchingRules[0] : null;
};

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

  root.walkRules(rule => {
    if (rule.selectors.includes(selector)) {
      found = rule;
    }
  });

  return found;
};

/**
 * Matching one of these only means the inspector's cursor/focus is on the
 * element right now, not that the selector targets its normal appearance.
 */
const STATE_PSEUDO_CLASSES = /:(hover|focus(-visible|-within)?|active)\b/i;

/**
 * Finds an authored selector matching this element via el.matches(), so
 * picking it keeps editing that rule instead of starting an unrelated one.
 */
export const getExistingSelector = (
  el: HTMLElement,
  css: string
): string | null => {
  const root = postcss.parse(css);
  let match: string | null = null;

  root.walkRules(rule => {
    if (match) {
      return;
    }

    for (const candidate of rule.selectors) {
      if (STATE_PSEUDO_CLASSES.test(candidate)) {
        continue;
      }

      try {
        if (el.matches(candidate)) {
          match = candidate;
          return;
        }
      } catch {
        // Parsed by postcss but not valid/supported as a live selector —
        // skip it rather than letting el.matches throw.
      }
    }
  });

  return match;
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

  root.walkRules(rule => {
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
  root.walkRules(rule => {
    if (!rule.first) {
      rule.remove();
    }
  });
  return root.toString();
};

export const removeRule = (css: string, selector: string): string => {
  const root = postcss.parse(css);
  root.walkRules(selector, rule => rule.remove());
  return root.toString();
};
