import type { RoleColorGroups } from '@stylebot/css';
import {
  compileStyle,
  injectCSSIntoDocument,
  removeCSSFromDocument,
  removeEmptyRules,
  validateSelector,
  getDeclarationsForSelector,
  getExistingSelector,
  getBodyChildSelectors,
} from '@stylebot/css';
import { Highlighter } from '@stylebot/highlighter';
import {
  applyReadability,
  removeReadability,
  isReaderable,
} from '@stylebot/readability';

import type {
  ChatCssEdit,
  ChatStyleProblem,
  CssDeclaration,
} from '@stylebot/types';
import { injectStylesheet, readCache, writeCache } from '@stylebot/stylesheets';

import type {
  PageBridge,
  PageSnapshot,
  SelectorAlternatives,
} from './PageBridge';
import { PageBridgeEmitter } from './PageBridgeEmitter';
import { getPageColors } from './page-colors';
import { getComputedStyles } from './computed-styles';
import {
  checkStyle,
  countMatches,
  getPageCssContext,
  getPageOutline,
  getStableSelectors,
  startStyleCheck,
  extendStyleCheck,
} from './chat';
import { getAppliedDeclarations } from './applied-declarations';
import type { AppliedDeclaration } from './applied-declarations';
import { getPageDeclarations } from './page-declarations';
import { getSelectorAlternatives } from './selector-alternatives';

const PREVIEW_ID = 'font-preview';

/**
 * The style as the page gets it, compiled from the css as it's saved, or null
 * when it doesn't parse yet (mid-edit). Compiled once per edit, since the
 * save is only sent after applyCss returns.
 */
const compileForPage = (
  css: string,
  forceImportant: boolean
): { css: string; importUrls: Array<string> } | null => {
  try {
    return compileStyle(removeEmptyRules(css), { forceImportant });
  } catch {
    return null;
  }
};

/**
 * The editor's theme-provider element, for the highlighter's tip to inherit
 * the theme. Storybook renders it in the light DOM under the same host id.
 */
const getMountRoot = (): HTMLElement | undefined => {
  const host = document.getElementById('stylebot');
  const root = host?.shadowRoot ?? host;

  return root?.querySelector<HTMLElement>('.stylebot-app') ?? undefined;
};

/**
 * Talks to the document the editor script runs in. Previews and inspecting
 * use separate highlighters so clearing one can't tear down the other.
 */
export class LocalPageBridge extends PageBridgeEmitter implements PageBridge {
  private inspector: Highlighter;
  private previewer: Highlighter;
  private unwatchHover: (() => void) | null = null;
  private getStylebotCss: () => string;
  // The element behind the last pick, which a broad selector's first match
  // may not be.
  private pickedElement: HTMLElement | null = null;
  // The element under the inspector while picking.
  private hoveredElement: HTMLElement | null = null;

  constructor({ getStylebotCss }: { getStylebotCss: () => string }) {
    super();

    this.getStylebotCss = getStylebotCss;

    this.inspector = new Highlighter({
      onSelect: selector => {
        this.pickedElement = this.inspector.currentElement;
        this.emit('select', selector);
      },
      onHover: selector => {
        this.hoveredElement = this.inspector.currentElement;
        this.emit('hover', selector);
      },
      countRules: selector =>
        getDeclarationsForSelector(getStylebotCss(), selector)?.length ?? 0,
      getExistingSelector: el => getExistingSelector(el, getStylebotCss()),
      getMountRoot,
    });

    this.previewer = new Highlighter({
      onSelect: () => undefined,
      getMountRoot,
    });
  }

  getSnapshotSync(): PageSnapshot {
    return {
      domain: document.domain,
      href: window.location.href,
      title: document.title,
      readerable: isReaderable(),
      bodyChildSelectors: getBodyChildSelectors(),
    };
  }

  getSnapshot(): Promise<PageSnapshot> {
    return Promise.resolve(this.getSnapshotSync());
  }

  applyCss({
    url,
    css,
    enabled,
    forceImportant,
  }: {
    url: string;
    css: string;
    enabled: boolean;
    forceImportant: boolean;
  }): void {
    const compiled = compileForPage(css, forceImportant);

    if (!compiled) {
      return;
    }

    injectStylesheet(url, compiled.css, compiled.importUrls);

    // The localStorage cache is applied on the next load before storage
    // resolves; keep it current so a quick reload doesn't flash old CSS.
    const cached = readCache();

    if (cached) {
      const entry = { url, ...compiled, enabled };
      const exists = cached.styles.some(style => style.url === url);

      writeCache({
        ...cached,
        styles: exists
          ? cached.styles.map(style => (style.url === url ? entry : style))
          : [...cached.styles, entry],
      });
    }
  }

  setPreviewCss(
    preview: { css: string; forceImportant: boolean } | null
  ): void {
    if (preview === null) {
      removeCSSFromDocument(PREVIEW_ID);
    } else {
      injectCSSIntoDocument(preview.css, PREVIEW_ID, {
        forceImportant: preview.forceImportant,
      });
    }
  }

  applyReadability(value: boolean): void {
    if (value) {
      applyReadability(true);
    } else {
      removeReadability();
    }

    // Keep the localStorage cache in sync so a refresh right after
    // toggling doesn't apply the stale readability state.
    const cached = readCache();
    if (cached) {
      writeCache({ ...cached, readability: value });
    }
  }

  startInspecting(): void {
    this.inspector.startInspecting();
  }

  stopInspecting(): void {
    this.inspector.stopInspecting();
  }

  handleInspectKey(key: string): void {
    this.inspector.handleKey(key);
  }

  highlight(selector: string): void {
    if (validateSelector(selector)) {
      this.previewer.highlight(selector);
    } else {
      this.previewer.unhighlight();
    }
  }

  unhighlight(): void {
    this.previewer.unhighlight();
  }

  getPageColors(): Promise<RoleColorGroups> {
    return Promise.resolve(getPageColors());
  }

  getComputedStyles(
    selector: string,
    properties: Array<string>
  ): Promise<Record<string, string>> {
    this.unwatchHover?.();
    const { styles, unwatch } = getComputedStyles(
      selector,
      properties,
      () => {
        this.unwatchHover = null;
        this.emit('computedStylesChanged');
      },
      this.elementFor(selector)
    );
    this.unwatchHover = unwatch;

    return Promise.resolve(styles);
  }

  getPageOutline(): Promise<string> {
    return Promise.resolve(getPageOutline());
  }

  countMatches(selectors: Array<string>): Promise<Array<number | null>> {
    return Promise.resolve(countMatches(selectors));
  }

  getStableSelectors(selectors: Array<string>): Promise<Array<string>> {
    return Promise.resolve(getStableSelectors(selectors));
  }

  startStyleCheck(edits: Array<ChatCssEdit>): Promise<void> {
    startStyleCheck(edits);
    return Promise.resolve();
  }

  extendStyleCheck(edits: Array<ChatCssEdit>): Promise<void> {
    extendStyleCheck(edits);
    return Promise.resolve();
  }

  checkStyle(): Promise<Array<ChatStyleProblem>> {
    return checkStyle();
  }

  getSelectorAlternatives(selector: string): Promise<SelectorAlternatives> {
    const el = this.elementFor(selector);

    return Promise.resolve(
      el
        ? getSelectorAlternatives(el, selector, this.getStylebotCss())
        : { existing: [], candidates: [] }
    );
  }

  /**
   * The element the panel is about: the one under the inspector or the one
   * last picked, while it still fits the selector, else the first match. A
   * broad selector's first match can be a different element entirely.
   */
  private elementFor(selector: string): HTMLElement | null {
    if (!validateSelector(selector)) {
      return null;
    }

    const known = [this.hoveredElement, this.pickedElement].find(
      el => el?.isConnected && el.matches(selector)
    );

    return known ?? document.querySelector<HTMLElement>(selector);
  }

  getAppliedDeclarations(selector: string): Promise<Array<AppliedDeclaration>> {
    const el = this.elementFor(selector);

    return Promise.resolve(
      el
        ? getAppliedDeclarations(
            el,
            this.getStylebotCss(),
            Array.from(document.querySelectorAll(selector))
          )
        : []
    );
  }

  getPageDeclarations(selector: string): Promise<Array<CssDeclaration>> {
    const el = this.elementFor(selector);

    return Promise.resolve(el ? getPageDeclarations(el) : []);
  }

  getPageCssContext(selector: string): Promise<string> {
    return Promise.resolve(getPageCssContext(selector));
  }

  openInPage(): void {
    return;
  }

  focusPage(): void {
    return;
  }
}
