import * as postcss from 'postcss';

/**
 * Utility methods for CSS injection/removal, selector validation.
 */
const STYLE_ELEMENT_ID = 'stylebot-css';

const getGoogleFontUrlAndParams = (
  value: string
): { url: string; params: string } => {
  const arg = value.replace(' ', '+');
  const url = `//fonts.googleapis.com/css?family=${arg}`;
  const params = `url(${url})`;

  return { url, params };
};

const CSSUtils = {
  addGoogleWebFont: async (value: string, css: string): Promise<string> => {
    const root = postcss.parse(css);
    const { url, params } = getGoogleFontUrlAndParams(value);

    return new Promise(resolve => {
      fetch(url)
        .then(response => {
          if (response.status === 400) {
            resolve(css);
            return;
          }

          // check if @import already exists
          let importExists = false;
          root.walkAtRules('import', (atRule: postcss.AtRule) => {
            if (atRule.params === params) {
              importExists = true;
            }
          });

          if (!importExists) {
            const rule = postcss.parse(`@import ${params};`);
            root.prepend(rule);

            const next = root.first?.next();
            if (next) {
              next.raws.before = '\n\n';
            }
          }

          resolve(root.toString());
        })
        .catch(() => {
          resolve(css);
        });
    });
  },

  /**
   * Remove unused google web fonts from given css.
   */
  cleanGoogleWebFonts: (css: string): string => {
    const root = postcss.parse(css);
    const fonts: Array<string> = [];

    root.walkDecls('font-family', decl => {
      const declFonts = decl.value.split(',');

      declFonts.forEach(value => {
        const trimmedValue = value.trim();

        if (trimmedValue && fonts.indexOf(trimmedValue) === -1) {
          fonts.push(trimmedValue);
        }
      });
    });

    const fontParams = fonts.map(
      font => getGoogleFontUrlAndParams(font).params
    );

    root.walkAtRules('import', (atRule: postcss.AtRule) => {
      if (fontParams.indexOf(atRule.params) === -1) {
        atRule.remove();
      }
    });

    return root.toString();
  },

  validateSelector: (selector: string): boolean => {
    if (!selector) {
      return false;
    }

    try {
      document.querySelector(selector);
      return true;
    } catch (e) {
      return false;
    }
  },

  injectCSSIntoDocument: (css: string): void => {
    const el = document.getElementById(STYLE_ELEMENT_ID);

    if (el) {
      el.innerHTML = css;
      return;
    }

    const style = document.createElement('style');

    style.type = 'text/css';
    style.setAttribute('id', STYLE_ELEMENT_ID);
    style.appendChild(document.createTextNode(css));

    document.documentElement.appendChild(style);
  },

  injectRootIntoDocument: (root: postcss.Root): void => {
    const rootWithImportant = root.clone();
    rootWithImportant.walkDecls(decl => (decl.important = true));

    const css = rootWithImportant.toString();
    CSSUtils.injectCSSIntoDocument(css);
  },

  removeCSSFromDocument: (): void => {
    const el = document.getElementById(STYLE_ELEMENT_ID);

    if (el) {
      el.innerHTML = '';
    }
  },
};

export default CSSUtils;
