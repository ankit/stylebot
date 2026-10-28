import { requestImportCss } from '@stylebot/stylesheets';

import { copyStateRules } from './state-rules';

export type Scope = Document | ShadowRoot;

const COPIES_ID = 'stylebot-forced-states';
const MAY_NAME_STATE = /:(?:hover|active|focus)/i;

const copies = new Map<
  Scope,
  { css: string; sheet: CSSStyleSheet | HTMLStyleElement }
>();

// Copies of a <style> or <link> sheet, kept while its rule count holds.
const sheetCopies = new WeakMap<
  CSSStyleSheet,
  { count: number; css: string }
>();

// Null for a sheet the background couldn't fetch either.
const fetchedCopies = new Map<string, Promise<string | null>>();

let unreadable = new Set<string>();

const canAdopt = (): boolean =>
  typeof CSSStyleSheet.prototype.replaceSync === 'function' &&
  'adoptedStyleSheets' in Document.prototype;

const isOwnSheet = (sheet: CSSStyleSheet): boolean =>
  Array.from(copies.values()).some(copy => copy.sheet === sheet) ||
  (sheet.ownerNode instanceof Element && sheet.ownerNode.id === COPIES_ID);

/**
 * Whether a node is the <style> the copies go in where a page can't adopt
 * sheets, which a page's own style changes are watched apart from.
 */
export const isStateSheetNode = (node: Node): boolean =>
  node instanceof HTMLStyleElement && node.id === COPIES_ID;

/**
 * A cross-origin sheet's state rules, from its css fetched by the
 * background, since the page can't read its rules.
 */
const fetchCopies = (href: string): Promise<string | null> => {
  if (!fetchedCopies.has(href)) {
    fetchedCopies.set(
      href,
      requestImportCss(href).then(css =>
        css ? copyStateRules(css, href) : null
      )
    );
  }

  return fetchedCopies.get(href) as Promise<string | null>;
};

const wrap = (css: string, prelude: string | null | undefined): string =>
  css && prelude ? `${prelude} {\n${css}\n}` : css;

/**
 * The copies of a sheet's rules that name a state, and of the sheets it
 * imports, inside the media its owner or @import gives.
 */
const copySheet = async (sheet: CSSStyleSheet): Promise<string> => {
  let rules: CSSRuleList;

  try {
    rules = sheet.cssRules;
  } catch {
    if (!sheet.href) {
      return '';
    }

    const css = await fetchCopies(sheet.href);

    if (css === null) {
      unreadable.add(sheet.href);
    }

    return wrap(
      css ?? '',
      sheet.media.mediaText && `@media ${sheet.media.mediaText}`
    );
  }

  const cached = sheetCopies.get(sheet);

  if (cached?.count === rules.length) {
    return cached.css;
  }

  const stateRules: Array<string> = [];
  const imported: Array<string> = [];

  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSImportRule) {
      const css = rule.styleSheet ? await copySheet(rule.styleSheet) : '';
      const layer = rule.layerName;

      imported.push(
        wrap(
          wrap(css, rule.media.mediaText && `@media ${rule.media.mediaText}`),
          layer === null || layer === undefined ? null : `@layer ${layer}`
        )
      );
    } else if (MAY_NAME_STATE.test(rule.cssText)) {
      stateRules.push(rule.cssText);
    }
  }

  const css = wrap(
    [
      ...imported,
      copyStateRules(stateRules.join('\n'), sheet.href ?? undefined),
    ]
      .filter(Boolean)
      .join('\n'),
    sheet.ownerNode && sheet.media.mediaText
      ? `@media ${sheet.media.mediaText}`
      : null
  );

  // Adopted sheets change in place with replaceSync, so they're read each time.
  if (sheet.ownerNode) {
    sheetCopies.set(sheet, { count: rules.length, css });
  }

  return css;
};

const removeCopies = (scope: Scope): void => {
  const existing = copies.get(scope);

  if (existing?.sheet instanceof CSSStyleSheet) {
    const sheet = existing.sheet;
    scope.adoptedStyleSheets = scope.adoptedStyleSheets.filter(
      other => other !== sheet
    );
  } else {
    existing?.sheet.remove();
  }

  copies.delete(scope);
};

/**
 * Puts a scope's copies after all of its own sheets, so they win the ties
 * the real state's rules would.
 */
const writeCopies = (scope: Scope, css: string): void => {
  const existing = copies.get(scope);

  if (existing?.css === css) {
    return;
  }

  if (!css) {
    removeCopies(scope);
    return;
  }

  if (canAdopt()) {
    const sheet =
      existing?.sheet instanceof CSSStyleSheet
        ? existing.sheet
        : new CSSStyleSheet();

    sheet.replaceSync(css);

    const others = scope.adoptedStyleSheets.filter(other => other !== sheet);
    scope.adoptedStyleSheets = [...others, sheet];
    copies.set(scope, { css, sheet });
    return;
  }

  const style =
    existing?.sheet instanceof HTMLStyleElement
      ? existing.sheet
      : document.createElement('style');

  style.id = COPIES_ID;
  style.textContent = css;
  (scope instanceof Document ? scope.documentElement : scope).append(style);
  copies.set(scope, { css, sheet: style });
};

/**
 * Copies each scope's state rules into a sheet of its own, and takes the
 * copies out of scopes no longer given.
 */
export const copyStateSheets = async (scopes: Array<Scope>): Promise<void> => {
  unreadable = new Set();

  for (const scope of scopes) {
    const sheets = [
      ...Array.from(scope.styleSheets),
      ...scope.adoptedStyleSheets,
    ].filter(sheet => !sheet.disabled && !isOwnSheet(sheet));
    const css = (await Promise.all(sheets.map(copySheet)))
      .filter(Boolean)
      .join('\n');

    writeCopies(scope, css);
  }

  copies.forEach((_, scope) => {
    if (!scopes.includes(scope)) {
      removeCopies(scope);
    }
  });
};

/**
 * Takes every copy off the page and forgets the fetched ones.
 */
export const removeStateSheets = (): void => {
  Array.from(copies.keys()).forEach(removeCopies);
  fetchedCopies.clear();
  unreadable = new Set();
};

export const getUnreadableSheets = (): Array<string> => Array.from(unreadable);
