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

// Interaction-state pseudo-classes: matching one of these only means "the
// inspector's own cursor/focus happens to be on this element right now"
// (hovering it *is* what triggered the match), not "this selector targets
// the element's normal appearance" — so they're never a selector worth
// reusing, even though el.matches() would happily return true for them.
const STATE_PSEUDO_CLASSES = /:(hover|focus(-visible|-within)?|active)\b/i;

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

// Splits `selector` out of whatever grouped, comma-separated rule it
// belongs to (e.g. `.foo, .bar { ... }`) into its own standalone rule
// directly after the original, carrying over the declarations the group
// already gave it — so editing an element styled only via a shared rule
// doesn't silently affect its groupmates, and doesn't lose what it
// already had either. No-ops if `selector` already has its own rule, or
// isn't part of any rule at all. Mirrors getRuleForSelector's "last match
// wins" choice when a selector is grouped in more than one place.
export const splitSelectorFromGroup = (css: string, selector: string): string => {
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
