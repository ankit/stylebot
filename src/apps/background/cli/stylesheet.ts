import * as postcss from 'postcss';

/*
 * The css operations the CLI's style commands share: parsing, walking a
 * stylesheet's style rules, and listing them in a form two stylesheets can be
 * compared by.
 */

/**
 * A style rule as two stylesheets compare it.
 */
export type StyleRule = {
  selector: string;
  context: string;
  declarations: Array<string>;
};

const KEYFRAMES = /keyframes$/i;

/**
 * Whether an at-rule holds keyframe steps, which aren't selectors.
 */
export const isKeyframes = (atRule: postcss.AtRule): boolean =>
  KEYFRAMES.test(atRule.name);

/**
 * Whether a node is an import rule.
 */
export const isImport = (node: postcss.ChildNode): boolean =>
  node.type === 'atrule' && node.name.toLowerCase() === 'import';

/**
 * Text with each run of whitespace made one space, as a selector reads on one
 * line.
 */
export const collapseWhitespace = (text: string): string =>
  text.replace(/\s+/g, ' ').trim();

/**
 * A declaration written out as one line, `!important` and all.
 */
export const writeDeclaration = (decl: postcss.Declaration): string =>
  `${decl.prop}: ${decl.value}${decl.important ? ' !important' : ''}`;
/**
 * Visits each style rule in the css with the at-rules it sits in, skipping
 * keyframes, whose steps aren't selectors.
 */
export const walkStyleRules = (
  root: postcss.Root,
  visit: (rule: postcss.Rule, context: string) => void
): void =>
  root.walkRules(rule => {
    const context: Array<string> = [];
    let node = rule.parent;

    while (node && node.type !== 'root') {
      if (node.type === 'atrule') {
        const atRule = node as postcss.AtRule;

        if (isKeyframes(atRule)) {
          return;
        }

        context.unshift(`@${atRule.name} ${atRule.params}`);
      }

      node = node.parent;
    }

    visit(rule, context.join(' '));
  });

/**
 * Parses css, throwing an error that says where it stops parsing.
 */
export const parseCss = (css: string): postcss.Root => {
  try {
    return postcss.parse(css);
  } catch (e) {
    const error = e as postcss.CssSyntaxError;
    const where = error.line ? ` at line ${error.line}` : '';

    throw new Error(
      `The css doesn't parse${where}: ${error.reason ?? error.message}`
    );
  }
};

/**
 * Parses css saved earlier, which the editor may have saved mid-edit, as
 * empty when it doesn't parse.
 */
export const parseSavedCss = (css: string): postcss.Root => {
  try {
    return postcss.parse(css);
  } catch {
    return postcss.root();
  }
};

/**
 * The css's style rules in order, each with its at-rule context, its
 * selector on one line and its declarations written out, so two rules
 * compare as strings.
 */
export const listStyleRules = (root: postcss.Root): Array<StyleRule> => {
  const rules: Array<StyleRule> = [];

  walkStyleRules(root, (rule, context) =>
    rules.push({
      selector: collapseWhitespace(rule.selector),
      context,
      declarations: (rule.nodes ?? [])
        .filter((node): node is postcss.Declaration => node.type === 'decl')
        .map(writeDeclaration),
    })
  );

  return rules;
};

/**
 * Which rule it is: its selector in its at-rule context, the same before and
 * after its declarations change.
 */
export const getRuleIdentity = ({ selector, context }: StyleRule) =>
  `${context}|${selector}`;

/**
 * The declarations a rule lost and gained since its old version.
 */
export const diffDeclarations = (
  old: StyleRule,
  rule: StyleRule
): { removed: Array<string>; added: Array<string> } => ({
  removed: old.declarations.filter(decl => !rule.declarations.includes(decl)),
  added: rule.declarations.filter(decl => !old.declarations.includes(decl)),
});

/**
 * Matches each rule in `after` with its old version in `before`: the first
 * rule there with the same selector and at-rule context that no earlier rule
 * matched. The rules in `before` that nothing matched were removed.
 */
export const matchRules = (
  before: Array<StyleRule>,
  after: Array<StyleRule>
): {
  matches: Array<{ rule: StyleRule; old?: StyleRule }>;
  removed: Array<StyleRule>;
} => {
  const unmatched = [...before];

  const matches = after.map(rule => {
    const index = unmatched.findIndex(
      old => getRuleIdentity(old) === getRuleIdentity(rule)
    );
    const [old] = index === -1 ? [] : unmatched.splice(index, 1);

    return { rule, old };
  });

  return { matches, removed: unmatched };
};
