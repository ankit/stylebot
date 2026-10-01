import type { CssDeclaration } from '@stylebot/types';
import type { Specificity } from '@stylebot/css';
import {
  compareSpecificity,
  getSpecificity,
  splitSelectorList,
} from '@stylebot/css';

/**
 * A declaration from one of the user's Stylebot styles that wins the cascade
 * on an element, with the selector it comes from.
 */
export type AppliedDeclaration = CssDeclaration & { selector: string };

type Candidate = {
  value: string;
  important: boolean;
  specificity: Specificity;
  selector: string;
  stylebot: boolean;
};

type Match = { selector: string; specificity: Specificity };

const STYLE_RULE = 1;
const IMPORT_RULE = 3;
const MEDIA_RULE = 4;
const KEYFRAMES_RULE = 7;
const SUPPORTS_RULE = 12;

// The element under the inspector is hovered (and may be focused) only
// because it's being inspected, so rules for those states don't count.
const INTERACTION_STATE = /:(hover|active|focus|focus-visible|focus-within)\b/;

/**
 * The most specific member of a rule's selector list that matches `el`,
 * or null when none does.
 */
const findMatch = (el: Element, selectorText: string): Match | null => {
  try {
    if (!el.matches(selectorText)) {
      return null;
    }
  } catch {
    return null;
  }

  let best: Match | null = null;

  for (const selector of splitSelectorList(selectorText)) {
    if (INTERACTION_STATE.test(selector) || !el.matches(selector)) {
      continue;
    }

    const specificity = getSpecificity(selector);

    if (!best || compareSpecificity(specificity, best.specificity) > 0) {
      best = { selector, specificity };
    }
  }

  return best;
};

const mediaMatches = (media: MediaList | undefined): boolean =>
  !media?.mediaText || window.matchMedia(media.mediaText).matches;

const readRules = (sheet: CSSStyleSheet): CSSRuleList | null => {
  try {
    return sheet.cssRules;
  } catch {
    // Cross-origin stylesheets don't expose their rules.
    return null;
  }
};

/**
 * Whether `candidate` beats the current winner for a property: !important
 * first, then specificity, then the later of the two.
 */
export const wins = (
  candidate: Pick<Candidate, 'important' | 'specificity'>,
  current: Pick<Candidate, 'important' | 'specificity'> | undefined
): boolean =>
  !current ||
  (candidate.important && !current.important) ||
  (candidate.important === current.important &&
    compareSpecificity(candidate.specificity, current.specificity) >= 0);

/**
 * The computed value in place of one written with var() or calc(), which
 * says little on its own; other values stay as the stylesheet wrote them.
 */
const resolveValue = (
  computed: CSSStyleDeclaration,
  property: string,
  value: string
): string =>
  value === '' || /\b(var|calc)\(/.test(value)
    ? computed.getPropertyValue(property).trim() || value
    : value;

/**
 * The user's Stylebot declarations that win the cascade on `el`, one per
 * property. Page CSS takes part in the cascade; Stylebot's own UI
 * stylesheets and cross-origin stylesheets don't.
 */
export const getAppliedDeclarations = (
  el: Element
): Array<AppliedDeclaration> => {
  const winners = new Map<string, Candidate>();

  const consider = (
    style: CSSStyleDeclaration,
    { selector, specificity }: Match,
    stylebot: boolean
  ): void => {
    for (let i = 0; i < style.length; i++) {
      const property = style[i];
      const value = style.getPropertyValue(property).trim();

      // Longhands a shorthand resets implicitly serialize as "initial"; an
      // empty one is waiting on a var() in its shorthand (see resolveValue).
      if (value === 'initial' || property.startsWith('--')) {
        continue;
      }

      const candidate = {
        value,
        important: style.getPropertyPriority(property) === 'important',
        specificity,
        selector,
        stylebot,
      };

      if (wins(candidate, winners.get(property))) {
        winners.set(property, candidate);
      }
    }
  };

  const walk = (rules: CSSRuleList, stylebot: boolean): void => {
    for (const rule of Array.from(rules)) {
      if (rule.type === STYLE_RULE) {
        const styleRule = rule as CSSStyleRule;
        const match = findMatch(el, styleRule.selectorText);

        if (match) {
          consider(styleRule.style, match, stylebot);
        }
      } else if (rule.type === IMPORT_RULE) {
        const importRule = rule as CSSImportRule;
        const rules = importRule.styleSheet && readRules(importRule.styleSheet);

        if (rules && mediaMatches(importRule.media)) {
          walk(rules, stylebot);
        }
      } else if (rule.type === MEDIA_RULE) {
        if (mediaMatches((rule as CSSMediaRule).media)) {
          walk((rule as CSSMediaRule).cssRules, stylebot);
        }
      } else if (rule.type === SUPPORTS_RULE) {
        const supportsRule = rule as CSSSupportsRule;

        if (CSS.supports(supportsRule.conditionText)) {
          walk(supportsRule.cssRules, stylebot);
        }
      } else if (rule.type !== KEYFRAMES_RULE && 'cssRules' in rule) {
        walk((rule as CSSGroupingRule).cssRules, stylebot);
      }
    }
  };

  const sheets = [
    ...Array.from(document.styleSheets),
    ...(document.adoptedStyleSheets ?? []),
  ];
  const stylebotSheetIds = new Map<StyleSheet | null, string>(
    Array.from(
      document.querySelectorAll<HTMLStyleElement>('style[id^="stylebot"]'),
      style => [style.sheet, style.id]
    )
  );

  for (const sheet of sheets) {
    const id = stylebotSheetIds.get(sheet) ?? '';
    const stylebot = id.startsWith('stylebot-css-');
    // Any other Stylebot stylesheet is the editor's own UI.
    const editorUi = !stylebot && id.startsWith('stylebot');
    const rules = readRules(sheet);

    if (rules && !editorUi && !sheet.disabled && mediaMatches(sheet.media)) {
      walk(rules, stylebot);
    }
  }

  if (el instanceof HTMLElement || el instanceof SVGElement) {
    consider(el.style, { selector: '', specificity: [1, 0, 0, 0] }, false);
  }

  const computed = getComputedStyle(el);

  return Array.from(winners)
    .filter(([, candidate]) => candidate.stylebot)
    .map(([property, { value, selector }]) => ({
      property,
      value: resolveValue(computed, property, value),
      selector,
    }));
};
