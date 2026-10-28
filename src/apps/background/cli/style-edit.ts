import * as postcss from 'postcss';

import { getStableSelector } from '@stylebot/css';

import { describeRule } from './style-report';
import {
  type StyleRule,
  collapseWhitespace,
  diffDeclarations,
  getRuleIdentity,
  isImport,
  isKeyframes,
  listStyleRules,
  matchRules,
  parseCss,
  writeDeclaration,
} from './stylesheet';

type RuleEdit = {
  selector: string;
  media?: string;
  set?: Array<{ property: string; value: string }>;
  unset?: Array<string>;
  delete?: boolean;
};

type RuleEditResult = {
  css: string;
  created: boolean;
  deleted: boolean;
  notFound: Array<string>;
};

type RuleDiff = {
  diff: string;
  added: number;
  changed: number;
  removed: number;
};

/**
 * A selector as saving writes it, with partly generated class names swapped
 * for their stable part, on one line.
 */
const getSavedSelector = (selector: string): string =>
  collapseWhitespace(getStableSelector(selector));

/**
 * The first style rule directly inside a container with this selector, as
 * saving would write either of them, so a rule saved with a generated class
 * name's stable part is found by the name as the page has it.
 */
const findRule = (
  container: postcss.Container,
  selector: string
): postcss.Rule | undefined => {
  const saved = getSavedSelector(selector);

  return (container.nodes ?? []).find(
    (node): node is postcss.Rule =>
      node.type === 'rule' && getSavedSelector(node.selector) === saved
  );
};

/**
 * The first top-level @media with this query.
 */
const findMedia = (
  root: postcss.Root,
  query: string
): postcss.AtRule | undefined =>
  (root.nodes ?? []).find(
    (node): node is postcss.AtRule =>
      node.type === 'atrule' &&
      node.name.toLowerCase() === 'media' &&
      collapseWhitespace(node.params) === collapseWhitespace(query)
  );

/**
 * The css's only declaration, when it is one rule holding just that.
 */
const getSoleDeclaration = (
  root: postcss.Root
): postcss.Declaration | undefined => {
  const rule = root.nodes?.length === 1 ? root.first : undefined;

  if (rule?.type !== 'rule' || rule.nodes?.length !== 1) {
    return undefined;
  }

  return rule.first?.type === 'decl' ? rule.first : undefined;
};

/**
 * Parses a `--set property=value` into the declaration to set, refusing a
 * value that would close the rule and start another.
 */
const parseDeclaration = ({
  property,
  value,
}: {
  property: string;
  value: string;
}): postcss.Declaration => {
  const decl = getSoleDeclaration(parseCss(`x{${property}:${value}}`));

  if (decl?.prop !== property.trim() || !decl.value) {
    throw new Error(`Not one declaration: ${property}: ${value}`);
  }

  // Fresh, so the stylesheet's own formatting fills in its spacing.
  const fresh = postcss.decl({ prop: decl.prop, value: decl.value });
  fresh.important = decl.important;

  return fresh;
};

/**
 * The rule an edit names, created at the end of the stylesheet, or of its
 * media query, when it has none and the edit sets declarations.
 */
const findOrCreateRule = (
  root: postcss.Root,
  edit: RuleEdit
): { rule: postcss.Rule; created: boolean } => {
  const container = edit.media ? findMedia(root, edit.media) : root;
  const rule = container && findRule(container, edit.selector);

  if (rule) {
    return { rule, created: false };
  }

  if (edit.delete || !edit.set?.length) {
    const where = edit.media ? ` in @media ${edit.media}` : '';
    throw new Error(`No rule for ${edit.selector}${where}`);
  }

  const created = postcss.rule({ selector: edit.selector });

  if (container) {
    container.append(created);
  } else {
    root.append(
      postcss.atRule({ name: 'media', params: edit.media }).append(created)
    );
  }

  return { rule: created, created: true };
};

/**
 * Removes a rule, and the media query it was in when that is left empty.
 */
const removeRule = (rule: postcss.Rule): void => {
  const parent = rule.parent;
  rule.remove();

  if (parent?.type === 'atrule' && !parent.nodes?.length) {
    parent.remove();
  }
};

/**
 * A rule's declarations of a property, ignoring case.
 */
const findDeclarations = (
  rule: postcss.Rule,
  property: string
): Array<postcss.Declaration> =>
  (rule.nodes ?? []).filter(
    (node): node is postcss.Declaration =>
      node.type === 'decl' &&
      node.prop.toLowerCase() === property.trim().toLowerCase()
  );

/**
 * Removes every declaration of each property from a rule, and lists the
 * properties it had none of.
 */
const unsetDeclarations = (
  rule: postcss.Rule,
  properties: Array<string>
): Array<string> =>
  properties.filter(property => {
    const matching = findDeclarations(rule, property);
    matching.forEach(decl => decl.remove());
    return !matching.length;
  });

/**
 * Sets each declaration in a rule: changes the property's last declaration,
 * the one that applies, or adds it at the end.
 */
const setDeclarations = (
  rule: postcss.Rule,
  declarations: Array<postcss.Declaration>
): void =>
  declarations.forEach(next => {
    const existing = findDeclarations(rule, next.prop).pop();

    if (existing) {
      existing.value = next.value;
      existing.important = next.important;
    } else {
      rule.append(next);
    }
  });

/**
 * Edits the first top-level rule with exactly this selector, or the first
 * inside the top-level @media with this query: sets and unsets declarations,
 * or deletes the rule. Setting creates the rule at the end when none
 * matches. Everything else keeps its formatting and comments.
 */
export const editRule = (css: string, edit: RuleEdit): RuleEditResult => {
  const root = parseCss(css);
  const toSet = (edit.set ?? []).map(parseDeclaration);
  const { rule, created } = findOrCreateRule(root, edit);

  // Deleting never creates: a rule that isn't there is refused.
  if (edit.delete) {
    removeRule(rule);
    return {
      css: root.toString(),
      created: false,
      deleted: true,
      notFound: [],
    };
  }

  const notFound = unsetDeclarations(rule, edit.unset ?? []);
  setDeclarations(rule, toSet);

  // A rule left with nothing in it goes too.
  const deleted = !rule.nodes?.length;

  if (deleted) {
    removeRule(rule);
  }

  return { css: root.toString(), created, deleted, notFound };
};

/**
 * Adds css to the end of a stylesheet, keeping both as written, with its
 * imports moved to the top, where imports must go. Lists the rules it adds
 * whose selector already has a rule there.
 */
export const appendRules = (
  css: string,
  addition: string
): {
  css: string;
  duplicates: Array<{ selector: string; context: string }>;
} => {
  const root = parseCss(css);
  const added = parseCss(addition);
  const existing = new Set(listStyleRules(root).map(getRuleIdentity));
  const duplicates = listStyleRules(added)
    .filter(rule => existing.has(getRuleIdentity(rule)))
    .map(({ selector, context }) => ({ selector, context }));

  const imports = (added.nodes ?? []).filter(isImport);
  imports.forEach(node => node.remove());

  const top = [...imports.map(node => `${node};`), root.toString().trim()];
  const sheets = [top.filter(Boolean).join('\n'), added.toString().trim()];

  return { css: `${sheets.filter(Boolean).join('\n\n')}\n`, duplicates };
};

/**
 * Whether the value contains the text, ignoring case.
 */
const includesText = (value: string, text: string): boolean =>
  value.toLowerCase().includes(text.toLowerCase());

/**
 * Whether any of a rule's or at-rule's own declarations contains the text.
 */
const hasDeclarationWith = (
  container: postcss.Container,
  text: string
): boolean =>
  (container.nodes ?? []).some(
    node => node.type === 'decl' && includesText(writeDeclaration(node), text)
  );

/**
 * Whether a rule's selector, an at-rule's name and params, or either's own
 * declarations contain the text. Comments and stray declarations never do.
 */
const matchesText = (node: postcss.ChildNode, text: string): boolean => {
  if (node.type === 'rule') {
    return includesText(node.selector, text) || hasDeclarationWith(node, text);
  }

  if (node.type === 'atrule') {
    const name = `@${node.name} ${node.params}`;

    return includesText(name, text) || hasDeclarationWith(node, text);
  }

  return false;
};

/**
 * Whether a node is an at-rule that groups rules, such as a media query,
 * rather than one that matches as a whole, such as keyframes.
 */
const holdsRules = (node: postcss.ChildNode): node is postcss.AtRule => {
  if (node.type !== 'atrule' || isKeyframes(node)) {
    return false;
  }

  const children = node.nodes ?? [];

  return children.some(
    child => child.type === 'rule' || child.type === 'atrule'
  );
};

/**
 * Only the parts of a stylesheet whose selector, declarations or at-rule
 * match the text, ignoring case, inside the at-rules they sit in and as
 * written. Imports, font faces and keyframes match as a whole; comments are
 * left out. Empty when nothing matches.
 */
export const grepRules = (css: string, text: string): string => {
  const root = parseCss(css);

  const keepMatches = (container: postcss.Container) =>
    container.each(node => {
      if (!holdsRules(node)) {
        if (!matchesText(node, text)) {
          node.remove();
        }
        return;
      }

      keepMatches(node);

      if (!node.nodes?.length) {
        node.remove();
      }
    });

  keepMatches(root);
  root.raws.semicolon = true;

  return root.toString().trim();
};

/**
 * A rule as a diff shows it, every line marked with the sign given.
 */
const writeRuleHunk = (
  rule: StyleRule,
  sign: string,
  declarations = rule.declarations.map(decl => `${sign}   ${decl};`)
): string =>
  [
    `${sign} ${describeRule(rule.selector, rule.context)} {`,
    ...declarations,
    `${sign} }`,
  ].join('\n');

/**
 * A diff of two stylesheets by rule, in the style of a unified diff: the
 * rules added, the declarations changed in a rule, and the rules removed.
 * Rules pair up by selector and at-rule context, in order.
 */
export const diffRules = (
  before: postcss.Root,
  after: postcss.Root
): RuleDiff => {
  const { matches, removed } = matchRules(
    listStyleRules(before),
    listStyleRules(after)
  );
  const hunks = matches.flatMap(({ rule, old }) => {
    if (!old) {
      return [writeRuleHunk(rule, '+')];
    }

    const { removed: lost, added: gained } = diffDeclarations(old, rule);

    if (!lost.length && !gained.length) {
      return [];
    }

    return [
      writeRuleHunk(rule, ' ', [
        ...lost.map(decl => `-   ${decl};`),
        ...gained.map(decl => `+   ${decl};`),
      ]),
    ];
  });
  const added = matches.filter(({ old }) => !old).length;

  return {
    diff: [...hunks, ...removed.map(rule => writeRuleHunk(rule, '-'))].join(
      '\n\n'
    ),
    added,
    changed: hunks.length - added,
    removed: removed.length,
  };
};
