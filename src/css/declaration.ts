import * as postcss from 'postcss';
import { splitSelectorFromGroup } from './rule';

/**
 * Add declaration for given selector and css
 */
export const addDeclaration = (
  property: string,
  value: string,
  selector: string,
  rawCss: string
): string => {
  // If `selector` is only styled today via a grouped rule (`.foo, .bar`),
  // split it into its own rule first — otherwise the exact-match walk
  // below finds nothing and starts a second, disconnected `.foo` rule
  // instead of editing the declarations it already has. A no-op when
  // `selector` already has its own rule or none at all.
  const css = splitSelectorFromGroup(rawCss, selector);
  const root = postcss.parse(css);
  const rules: Array<postcss.Rule> = [];

  root.walkRules(selector, rule => rules.push(rule));
  const rule = rules.length > 0 ? rules[0] : null;

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
    rule.walkDecls(property, (decl: postcss.Declaration) => {
      if (value) {
        decl.value = value;
      } else {
        decl.remove();
      }
    });

    if (!rule.some(decl => !!decl)) {
      rule.remove();
    }

    return root.toString();
  }

  if (value) {
    rule.append(`\n  ${property}: ${value};`);
    return root.toString();
  }

  return css;
};

export const appendImportantToDeclarations = (css: string): string => {
  const root = postcss.parse(css);

  const isAncestorAnAtRule = (node: postcss.Node): boolean => {
    if (node.type === 'atrule') {
      return true;
    }
    if (node.type === 'decl' || node.type === 'rule') {
      return isAncestorAnAtRule(node.parent);
    }
    return false;
  };

  root.walkDecls(decl => {
    if (!isAncestorAnAtRule(decl)) {
      decl.important = true;
    }
  });

  return root.toString();
};
