import * as postcss from 'postcss';

import { getCssVariables } from './css-variables';

const MAX_VARIABLE_CHARS = 4000;
const MAX_RULE_CHARS = 8000;
const MAX_ELEMENTS = 5;

// Stylebot's own sheets would only echo the stylesheet it already sends.
const ownSheets = (): Set<StyleSheet | null> =>
  new Set(
    Array.from(
      document.querySelectorAll<HTMLStyleElement>('style[id^="stylebot"]'),
      style => style.sheet
    )
  );

/**
 * Declarations of a rule as written: CSSOM would split a shorthand that
 * uses var() into empty longhands.
 */
const declarationsOf = (rule: CSSStyleRule): Array<postcss.Declaration> => {
  try {
    const declarations: Array<postcss.Declaration> = [];
    postcss.parse(`a{${rule.style.cssText}}`).walkDecls(decl => {
      declarations.push(decl);
    });
    return declarations;
  } catch {
    return [];
  }
};

const print = (
  selector: string,
  declarations: Array<postcss.Declaration>,
  wrappers: Array<string>
): string => {
  const body = declarations
    .map(
      decl =>
        `${decl.prop}: ${decl.value}${decl.important ? ' !important' : ''}`
    )
    .join('; ');
  const rule = `${selector} { ${body} }`;

  return wrappers.reduceRight(
    (inner, wrapper) => `${wrapper} { ${inner} }`,
    rule
  );
};

const matchesAny = (selector: string, elements: Array<Element>): boolean => {
  try {
    return elements.some(element => element.matches(selector));
  } catch {
    return false;
  }
};

/**
 * Collects the rules matching any of the elements, with the conditions
 * (`@media`, `@supports`) they sit under.
 */
const walk = (
  rules: CSSRuleList,
  wrappers: Array<string>,
  elements: Array<Element>,
  found: Array<string>
): void => {
  Array.from(rules).forEach(rule => {
    if (rule instanceof CSSStyleRule) {
      if (matchesAny(rule.selectorText, elements)) {
        found.push(print(rule.selectorText, declarationsOf(rule), wrappers));
      }

      // Native nesting: children of a style rule are rules of their own.
      if (rule.cssRules?.length) {
        walk(rule.cssRules, wrappers, elements, found);
      }
      return;
    }

    if (rule instanceof CSSMediaRule) {
      walk(
        rule.cssRules,
        [...wrappers, `@media ${rule.conditionText}`],
        elements,
        found
      );
    } else if (rule instanceof CSSSupportsRule) {
      walk(
        rule.cssRules,
        [...wrappers, `@supports ${rule.conditionText}`],
        elements,
        found
      );
    } else if ('cssRules' in rule && (rule as CSSGroupingRule).cssRules) {
      // @layer, @container, @scope: their rules apply as written.
      walk((rule as CSSGroupingRule).cssRules, wrappers, elements, found);
    }
  });
};

const section = (title: string, rules: Array<string>, budget: number) => {
  const lines: Array<string> = [];
  let used = title.length;

  for (const rule of new Set(rules)) {
    if (used + rule.length + 1 > budget) {
      lines.push(`/* … ${rules.length - lines.length} more */`);
      break;
    }
    lines.push(rule);
    used += rule.length + 1;
  }

  return lines.length ? [title, ...lines].join('\n') : '';
};

/**
 * The page's CSS variables, written as the rules that would override them
 * (`:root { … }`, `body { … }`), within their own budget.
 */
const variablesSection = (): string => {
  const lines: Array<string> = [];
  const variables = getCssVariables();
  let used = 0;
  let shown = 0;

  (['html', 'body'] as const).forEach(on => {
    const declarations: Array<string> = [];

    variables
      .filter(variable => variable.on === on)
      .forEach(({ name, value }) => {
        const declaration = `${name}: ${value}`;

        if (used + declaration.length + 2 <= MAX_VARIABLE_CHARS) {
          declarations.push(declaration);
          used += declaration.length + 2;
          shown++;
        }
      });

    if (declarations.length) {
      lines.push(
        `${on === 'html' ? ':root' : 'body'} { ${declarations.join('; ')} }`
      );
    }
  });

  if (shown < variables.length) {
    lines.push(`/* … ${variables.length - shown} more */`);
  }

  return lines.length ? ['/* Variables */', ...lines].join('\n') : '';
};

/**
 * The page's rules for the elements matching the selector, from the
 * stylesheets the page lets scripts read (inline and same-origin); the
 * rest are counted.
 */
const pickedSection = (selector: string): string => {
  let elements: Array<Element> = [];

  try {
    elements = Array.from(document.querySelectorAll(selector))
      .filter(element => !element.closest('#stylebot'))
      .slice(0, MAX_ELEMENTS);
  } catch {
    return '';
  }

  if (!elements.length) {
    return '';
  }

  const found: Array<string> = [];
  const own = ownSheets();
  let unreadable = 0;

  Array.from(document.styleSheets).forEach(sheet => {
    if (own.has(sheet)) {
      return;
    }

    try {
      walk(sheet.cssRules, [], elements, found);
    } catch {
      unreadable++;
    }
  });

  return [
    section('/* Rules matching the picked element */', found, MAX_RULE_CHARS),
    unreadable
      ? `/* ${unreadable} cross-origin stylesheet(s) couldn't be read */`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * The page's CSS as context for restyling it: its variables (colors
 * first), and the page's own rules for the picked element, if any.
 */
export const getPageCssContext = (selector = ''): string =>
  [variablesSection(), selector ? pickedSection(selector) : '']
    .filter(Boolean)
    .join('\n\n');
