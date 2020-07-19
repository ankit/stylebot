import * as postcss from 'postcss';

const getStylesheetId = (url: string) => {
  return `stylebot-css-${url}`;
};

export const injectCSSIntoDocument = (css: string, url: string): void => {
  const id = getStylesheetId(url);
  const el = document.getElementById(id);

  if (el) {
    el.innerHTML = css;
    return;
  }

  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', id);
  style.appendChild(document.createTextNode(css));

  document.documentElement.appendChild(style);
};

export const injectRootIntoDocument = (
  root: postcss.Root,
  url: string
): void => {
  const rootWithImportant = root.clone();
  rootWithImportant.walkDecls(decl => (decl.important = true));

  const css = rootWithImportant.toString();
  injectCSSIntoDocument(css, url);
};

export const removeCSSFromDocument = (url: string): void => {
  const id = getStylesheetId(url);
  const el = document.getElementById(id);

  if (el) {
    el.innerHTML = '';
  }
};
