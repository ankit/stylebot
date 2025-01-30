import * as postcss from 'postcss';
import { appendImportantToDeclarations } from './declaration';
import { getCssWithExpandedImports } from './import';

const getStylesheetId = (id: string, iframeIdx?: number) => {
  return iframeIdx !== undefined
    ? `stylebot-css-${id}-iframe-${iframeIdx}`
    : `stylebot-css-${id}`;
};

export const injectCSSIntoDocument = async (
  css: string,
  id: string
): Promise<void> => {
  const cssWithExpandedImports = await getCssWithExpandedImports(css);

  // inject CSS into all iframes
  const iframeElems = document.getElementsByTagName('iframe');
  for (const [iframeIdx, iframeElem] of Array.from(iframeElems).entries()) {
    const iframeStylesheetId = getStylesheetId(id, iframeIdx);
    const el = document.getElementById(iframeStylesheetId);
    if (el) {
      el.innerHTML = cssWithExpandedImports;
      return;
    }
    const iframeDoc = (iframeElem as any).contentWindow.document;
    const iframeStyle = iframeDoc.createElement('style');
    iframeStyle.type = 'text/css';
    iframeStyle.setAttribute('id', iframeStylesheetId);
    iframeStyle.appendChild(iframeDoc.createTextNode(cssWithExpandedImports));
    iframeDoc.head.appendChild(iframeStyle);
  }

  // then inject CSS into top document
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
