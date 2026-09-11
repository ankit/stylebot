import * as postcss from 'postcss';

export const getRule = (css: string, selector: string): postcss.Rule | null => {
  const root = postcss.parse(css);
  const matchingRules: Array<postcss.Rule> = [];

  root.walkRules(selector, rule => matchingRules.push(rule));
  return matchingRules.length > 0 ? matchingRules[0] : null;
};

// Unlike getRule, this also matches a selector grouped with others in a
// comma-separated rule (e.g. `td.title, td.subtext { ... }` styles both
// `td.title` and `td.subtext`, even though neither is the rule's full
// selector text). Keeps the *last* match, not the first — for equal
// specificity, later rules win the cascade, so that's the one whose
// declarations are actually in effect.
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

// Finds an already-authored selector that happens to match this specific
// element — via the browser's own selector matching, not string equality —
// so picking an element that's already targeted by a hand-written selector
// (a descendant combinator, :nth-child, one member of a grouped selector,
// etc.) reuses that selector instead of generating an unrelated new one
// that would start a second, disconnected rule for the same element.
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
