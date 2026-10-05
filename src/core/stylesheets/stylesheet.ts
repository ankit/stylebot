import { watchBlockedFonts } from './blocked-fonts';
import { fetchImportCss } from './import-cache';

const getStylesheetId = (id: string) => {
  return `stylebot-css-${id}`;
};

const getImportsStylesheetId = (id: string) => {
  return `stylebot-css-imports-${id}`;
};

// document_start injection can land ahead of the page's own <head>; keep our
// stylesheet last so an equally-`!important` page rule can't win the tie.
const stylebotElements: Array<HTMLStyleElement> = [];
let reorderObserver: MutationObserver | null = null;

const keepStylebotStylesLast = (style: HTMLStyleElement): void => {
  stylebotElements.push(style);

  if (document.readyState !== 'loading' || reorderObserver) {
    return;
  }

  const reorder = () => {
    const lastStylebotElement = stylebotElements[stylebotElements.length - 1];

    if (document.documentElement.lastChild === lastStylebotElement) {
      return;
    }

    stylebotElements.forEach(el => document.documentElement.appendChild(el));
  };

  reorderObserver = new MutationObserver(reorder);
  reorderObserver.observe(document.documentElement, { childList: true });

  // Fires first for 'interactive', i.e. once parsing is done. Observer records are
  // delivered as a microtask, which may not have run yet when the parser finishes
  // in one go — and disconnect() discards them — so reorder explicitly.
  document.addEventListener(
    'readystatechange',
    () => {
      reorder();
      reorderObserver?.disconnect();
      reorderObserver = null;
    },
    { once: true }
  );
};

const appendStyle = (
  stylesheetId: string,
  before?: HTMLStyleElement
): HTMLStyleElement => {
  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', stylesheetId);

  if (before) {
    before.parentNode?.insertBefore(style, before);
    stylebotElements.splice(stylebotElements.indexOf(before), 0, style);
  } else {
    document.documentElement.appendChild(style);
    keepStylebotStylesLast(style);
  }

  return style;
};

// Rewriting a <style> recreates its @font-face rules unloaded, so text falls
// back until the font reloads; unchanged content is never written.
const setContent = (style: HTMLStyleElement, css: string): void => {
  if (style.textContent !== css) {
    style.textContent = css;
  }
};

const setStylesheetContent = (id: string, css: string): void => {
  const el = document.getElementById(getStylesheetId(id));

  setContent(
    el instanceof HTMLStyleElement ? el : appendStyle(getStylesheetId(id)),
    css
  );
};

/**
 * Fetched `@import` content lives in its own stylesheet just ahead of the
 * style's, so editing the style leaves the imported @font-face rules alone.
 */
const setImportsContent = (id: string, css: string): void => {
  const el = document.getElementById(getImportsStylesheetId(id));

  if (el instanceof HTMLStyleElement) {
    setContent(el, css);
    return;
  }

  const style = document.getElementById(getStylesheetId(id));

  if (css && style instanceof HTMLStyleElement) {
    setContent(appendStyle(getImportsStylesheetId(id), style), css);
  }
};

// Bumped on every injection or removal per stylesheet, so an `@import` fetch
// that resolves after the stylesheet changed again doesn't write stale css.
const injectionVersions = new Map<string, number>();

const bumpInjectionVersion = (id: string): number => {
  const version = (injectionVersions.get(id) ?? 0) + 1;
  injectionVersions.set(id, version);
  return version;
};

/**
 * Applies css that has already had its `@import` rules taken out, then
 * patches in their content once it's fetched, so a slow import fetch (e.g. a
 * cold background service worker) never blocks the rest of the stylesheet.
 */
export const injectStylesheet = (
  id: string,
  css: string,
  importUrls: Array<string>
): void => {
  const version = bumpInjectionVersion(id);

  setStylesheetContent(id, css);

  if (importUrls.length === 0) {
    setImportsContent(id, '');
    return;
  }

  watchBlockedFonts();

  Promise.all(importUrls.map(fetchImportCss)).then(values => {
    if (injectionVersions.get(id) === version) {
      setImportsContent(id, values.join('\n\n'));
    }
  });
};

export const removeStylesheet = (id: string): void => {
  bumpInjectionVersion(id);

  [getStylesheetId(id), getImportsStylesheetId(id)].forEach(stylesheetId => {
    const el = document.getElementById(stylesheetId);

    if (el) {
      el.textContent = '';
    }
  });
};
