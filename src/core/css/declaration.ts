import * as postcss from 'postcss';
import { findRule, splitSelectorFromGroup } from './rule';

/**
 * Whether `shorthand` also sets `property`, as `background` does
 * `background-color`.
 */
const isShorthandOf = (shorthand: string, property: string): boolean =>
  property.startsWith(`${shorthand}-`);

/**
 * Removes the property from the selector's top-level rules after `rule`,
 * which would otherwise win the cascade over it, and drops rules this empties.
 */
const removeFromLaterRules = (
  root: postcss.Root,
  rule: postcss.Rule,
  selector: string,
  property: string
): void => {
  let after = false;

  root.each(node => {
    if (node === rule) {
      after = true;
      return;
    }

    if (!after || node.type !== 'rule' || node.selector !== selector) {
      return;
    }

    node.each(child => {
      if (child.type === 'decl' && child.prop === property) {
        child.remove();
      }
    });

    if (!node.some(child => !!child)) {
      node.remove();
    }
  });
};

/**
 * Add declaration for given selector and css. Only the rule's own
 * declarations are touched: nested rules keep theirs, and a rule left with
 * nothing but nested rules stays.
 */
export const addDeclaration = (
  property: string,
  value: string,
  selector: string,
  rawCss: string
): string => {
  // A selector styled only via a grouped rule (`.foo, .bar`) gets its own
  // rule first, so the walk below edits it instead of adding a second one.
  const css = splitSelectorFromGroup(rawCss, selector);
  const root = postcss.parse(css);
  const rule = findRule(root, selector);

  if (!rule) {
    if (value) {
      const ruleCss = `${selector} {\n  ${property}: ${value};\n}`;

      if (root.some(rule => !!rule)) {
        root.append(`\n\n${ruleCss}`);
      } else {
        root.append(ruleCss);
      }

      return root.toString();
    }

    return css;
  }

  removeFromLaterRules(root, rule, selector, property);

  const declarationExists = rule.some(
    decl => decl.type === 'decl' && decl.prop === property
  );

  if (declarationExists) {
    rule.each(node => {
      if (node.type !== 'decl' || node.prop !== property) {
        return;
      }

      if (value) {
        node.value = value;
      } else {
        node.remove();
      }
    });

    const declarations = (rule.nodes ?? []).filter(
      (node): node is postcss.Declaration => node.type === 'decl'
    );
    const last = declarations.filter(decl => decl.prop === property).pop();

    if (
      last &&
      declarations
        .slice(declarations.indexOf(last) + 1)
        .some(decl => isShorthandOf(decl.prop, property))
    ) {
      rule.append(last);
      rule.raws.semicolon = true;
    }

    if (!rule.some(decl => !!decl)) {
      rule.remove();
    }

    return root.toString();
  }

  if (value) {
    rule.append(`\n  ${property}: ${value};`);
    // A rule that ended in a nested block has no trailing-semicolon raw, so
    // the new last declaration would otherwise be printed without one.
    rule.raws.semicolon = true;
  }

  return root.toString();
};

/**
 * The value without a trailing `!important`, for values that come as text
 * (from a model): addDeclaration would keep it in the value, and marking the
 * declaration important as well would make it invalid.
 */
export const withoutImportant = (value: string): string =>
  value.replace(/\s*!\s*important\s*$/i, '');

/**
 * The rule's value for a property, or '' when it isn't declared.
 * The last declaration wins, matching how the browser resolves it.
 */
export const getDeclarationValue = (
  rule: postcss.Rule | null,
  property: string
): string => {
  let value = '';
  rule?.walkDecls(property, decl => {
    value = decl.value;
  });
  return value;
};

/**
 * At-rules that only group ordinary style rules, so `!important` applies
 * inside them as it would at the top level, nested in a rule or not.
 */
const GROUPING_AT_RULES = new Set([
  'media',
  'supports',
  'container',
  'layer',
  'scope',
  'starting-style',
  'document',
]);

/**
 * Whether the declaration sits, at any depth, inside an at-rule whose body
 * is descriptors rather than style rules (`@font-face`, `@keyframes`,
 * `@page`, `@property`, …), where `!important` is invalid and would drop
 * the whole declaration.
 */
const isInsideDescriptorAtRule = (decl: postcss.Declaration): boolean => {
  let parent = decl.parent;

  while (parent && parent.type !== 'root') {
    if (
      parent.type === 'atrule' &&
      !GROUPING_AT_RULES.has(parent.name.toLowerCase())
    ) {
      return true;
    }
    parent = parent.parent;
  }

  return false;
};

/**
 * Marks every declaration `!important`, except those inside descriptor
 * at-rules (see isInsideDescriptorAtRule). Grouping at-rules such as
 * `@media` are transparent, whether top-level or nested inside a rule.
 */
export const markDeclarationsImportant = (root: postcss.Root): void => {
  root.walkDecls(decl => {
    if (!isInsideDescriptorAtRule(decl)) {
      decl.important = true;
    }
  });
};
