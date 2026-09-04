import * as postcss from 'postcss';
import { appendImportantToDeclarations } from './declaration';
import { extractImports, fetchImportCss } from './import';

const getStylesheetId = (id: string) => {
  return `stylebot-css-${id}`;
};

const setStylesheetContent = (id: string, css: string): void => {
  const stylesheetId = getStylesheetId(id);
  const el = document.getElementById(stylesheetId);

  if (el) {
    el.innerHTML = css;
    return;
  }

  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', stylesheetId);
  style.appendChild(document.createTextNode(css));

  document.documentElement.appendChild(style);
};

// Applies the non-`@import` CSS immediately and patches in any `@import`
// content once it's fetched, so a slow import fetch (e.g. a cold background
// service worker) never blocks the rest of the stylesheet from applying.
export const injectCSSIntoDocument = async (
  css: string,
  id: string
): Promise<void> => {
  const { css: withoutImports, importUrls } = extractImports(css);

  setStylesheetContent(id, withoutImports);

  if (importUrls.length === 0) {
    return;
  }

  Promise.all(importUrls.map(fetchImportCss)).then(values => {
    const merged = values.join('\n\n');

    if (merged) {
      setStylesheetContent(id, `${merged}\n\n${withoutImports}`);
    }
  });
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
