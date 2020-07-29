import * as postcss from 'postcss';
import { appendImportantToDeclarations } from './declaration';
import { getCssWithExpandedImports } from './import';

const getStylesheetId = (id: string) => {
  return `stylebot-css-${id}`;
};

export const injectCSSIntoDocument = async (
  css: string,
  id: string
): Promise<void> => {
  const cssWithExpandedImports = await getCssWithExpandedImports(css);

  const stylesheetId = getStylesheetId(id);
  const el = document.getElementById(stylesheetId);

  if (el) {
    el.innerHTML = cssWithExpandedImports;
    return;
  }

  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', stylesheetId);
  style.appendChild(document.createTextNode(cssWithExpandedImports));

  document.documentElement.appendChild(style);
};

export const injectRootIntoDocument = (
  root: postcss.Root,
  id: string
): void => {
  const css = appendImportantToDeclarations(root.toString());
  injectCSSIntoDocument(css, id);
};

export const removeCSSFromDocument = (id: string): void => {
  const stylesheetId = getStylesheetId(id);
  const el = document.getElementById(stylesheetId);

  if (el) {
    el.innerHTML = '';
  }
};
