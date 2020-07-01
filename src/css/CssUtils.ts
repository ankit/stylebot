/**
 * Utility methods for CSS injection/removal.
 */
const CSSUtils = {
  injectCSSIntoDocument: (css: string, elementId: string) => {
    const el = document.getElementById(elementId);

    if (el) {
      el.innerHTML = css;
      return;
    }

    const style = document.createElement('style');

    style.type = 'text/css';
    style.setAttribute('id', elementId);
    style.appendChild(document.createTextNode(css));

    document.documentElement.appendChild(style);
  },

  removeCSSFromDocument: (elementId: string) => {
    const el = document.getElementById(elementId);

    if (el) {
      el.innerHTML = '';
    }
  },
};

export default CSSUtils;
