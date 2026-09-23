import * as postcss from 'postcss';
import { findRule, splitSelectorFromGroup } from './rule';

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
    return root.toString();
  }

  return css;
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
