import * as postcss from 'postcss';
import * as tinycolor from 'tinycolor2';

import CssSelectorGenerator from './CssSelectorGenerator';

const Theme = {
  color: tinycolor('#e8e6e3'),
  backgroundColor: tinycolor('#333'),
  borderColor: tinycolor('#736b5e'),
  placeholder: tinycolor('#b2aba1'),
  linkColor: tinycolor('#3391ff'),
  selectionColor: tinycolor('#fff'),
  selectionBackgroundColor: tinycolor('#68C2D0'),
};

const getDarkModeBackgroundColor = (
  color: tinycolor.Instance
): tinycolor.Instance | null => {
  if (color.getAlpha() === 0) {
    return null;
  }

  if (color.isDark()) {
    return color;
  }

  return color.darken(88);
};

const getDarkModeColor = (
  color: tinycolor.Instance
): tinycolor.Instance | null => {
  if (color.isLight()) {
    return color;
  }

  return color.lighten(50);
};

/**
 * Generate default boilerplate dark styling for the page
 */
const getDefaultRootNode = (): postcss.Root => {
  return postcss
    .root()
    .append(
      postcss
        .rule({
          selectors: ['html', 'body', 'input', 'textarea', 'select', 'button'],
        })
        .append(
          postcss.decl({ prop: 'color', value: Theme.color.toHexString() })
        )
        .append(
          postcss.decl({
            prop: 'border-color',
            value: Theme.borderColor.toHexString(),
          })
        )
        .append(
          postcss.decl({
            prop: 'background-color',
            value: Theme.backgroundColor.toHexString(),
          })
        )
    )
    .append(
      postcss
        .rule({
          selector: '::placeholder',
        })
        .append({
          prop: 'color',
          value: Theme.placeholder.toHexString(),
        }),

      postcss.rule({ selector: 'a' }).append(
        postcss.decl({
          prop: 'color',
          value: Theme.linkColor.toHexString(),
        })
      )
    )
    .append(
      postcss
        .rule({ selector: '::selection' })
        .append(
          postcss.decl({
            prop: 'color',
            value: Theme.selectionColor.toHexString(),
          })
        )
        .append(
          postcss.decl({
            prop: 'background',
            value: Theme.selectionBackgroundColor.toHexString(),
          })
        )
    );
};

/**
 * Analyze element and generate dark themed css for it
 */
const getElementRootNode = (
  el: HTMLElement,
  selector: string
): postcss.Root | null => {
  const rule = postcss.rule({ selector });
  const hoverRule = postcss.rule({ selector: `${selector}:hover` });

  const color = getDarkModeColor(tinycolor(getComputedStyle(el).color));
  if (color) {
    rule.append(postcss.decl({ prop: 'color', value: color.toHexString() }));

    if (el.matches('a, button')) {
      hoverRule.append(
        postcss.decl({ prop: 'color', value: color.lighten(30).toHexString() })
      );
    }
  }

  const borderColor = getDarkModeColor(
    tinycolor(getComputedStyle(el).borderColor)
  );
  if (borderColor) {
    rule.append(
      postcss.decl({ prop: 'border-color', value: borderColor.toHexString() })
    );
  }

  const backgroundColor = getDarkModeBackgroundColor(
    tinycolor(getComputedStyle(el).backgroundColor)
  );
  if (backgroundColor) {
    rule.append(
      postcss.decl({
        prop: 'background-color',
        value: backgroundColor.toHexString(),
      })
    );

    if (el.matches('a, button')) {
      hoverRule.append(
        postcss.decl({
          prop: 'background-color',
          value: backgroundColor.darken(30).toHexString(),
        })
      );
    }
  }

  if (rule.nodes?.length !== 0) {
    const root = postcss.root();
    root.append(rule);

    if (hoverRule.nodes?.length !== 0) {
      root.append(hoverRule);
    }

    return root;
  }

  return null;
};

export const getCss = (): string => {
  const root = getDefaultRootNode();

  const all = document.querySelectorAll('*');
  const selectorGenerator = new CssSelectorGenerator();
  const evaluatedSelectors: Array<string> = [];

  all.forEach(el => {
    if (!el.closest('.stylebot')) {
      const selector = selectorGenerator.inspect(el as HTMLElement);
      try {
        if (evaluatedSelectors.indexOf(selector) === -1) {
          const elementRoot = getElementRootNode(el as HTMLElement, selector);

          if (elementRoot) {
            root.append(elementRoot);
          }

          evaluatedSelectors.push(selector);
        }
      } catch (e) {
        console.log(`Error analyzing ${selector}`, e);
      }
    }
  });

  return root.toString();
};
