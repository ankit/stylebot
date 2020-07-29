import * as postcss from 'postcss';

/**
 * Add declaration for given selector and css
 */
export const addDeclaration = (
  property: string,
  value: string,
  selector: string,
  css: string
): string => {
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
    } else if (node.type === 'decl' || node.type === 'rule') {
      return isAncestorAnAtRule(node.parent);
    } else {
      return false;
    }
  };

  root.walkDecls(decl => {
    if (!isAncestorAnAtRule(decl)) {
      decl.important = true;
    }
  });

  return root.toString();
};
