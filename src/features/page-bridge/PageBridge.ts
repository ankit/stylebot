import type { RoleColorGroups } from '@stylebot/css';
import type {
  ChatCssEdit,
  ChatStyleProblem,
  CssDeclaration,
} from '@stylebot/types';
import type { AppliedDeclaration } from './applied-declarations';

/**
 * Facts about the page that the editor needs without touching its DOM.
 */
export type PageSnapshot = {
  // What a new style for this page is keyed on.
  domain: string;
  href: string;
  title: string;
  // Whether the reader can run on this page right now.
  readerable: boolean;
  // Selectors for body's direct children; the filter presets attach to them.
  bodyChildSelectors: Array<string>;
};

/**
 * Other ways to select an element: the style's selectors that already
 * match it, then selectors built for it, narrowest first. No two match the
 * same set of elements.
 */
export type SelectorAlternatives = {
  existing: Array<string>;
  candidates: Array<string>;
};

export type PageBridgeEvents = {
  // The inspector picked an element on the page.
  select: (selector: string) => void;
  // The inspector moved onto an element, before picking it.
  hover: (selector: string) => void;
  // The page came within reach or dropped away; always reachable in-page.
  connection: (connected: boolean) => void;
  // The element last read for computed styles was read mid-:hover, and the
  // pointer has since left it.
  computedStylesChanged: () => void;
};

/**
 * Everything the editor does to the page it styles. The in-page editor
 * talks to the document directly; other hosts route through a tab port.
 */
export type PageBridge = {
  /**
   * Reads the page facts the store mirrors.
   */
  getSnapshot(): Promise<PageSnapshot>;

  /**
   * The same facts read right now, for hosts that share the page's document;
   * absent when the page is only reachable asynchronously.
   */
  getSnapshotSync?(): PageSnapshot;

  /**
   * Injects the style into the page and keeps the page's load-time cache in
   * step. Persisting it is the caller's job.
   */
  applyCss(args: {
    url: string;
    css: string;
    enabled: boolean;
    forceImportant: boolean;
  }): void;

  /**
   * Shows css in a scratch stylesheet that is never saved (font previews),
   * forced like the style it previews so it shows what saving would; null
   * removes it.
   */
  setPreviewCss(preview: { css: string; forceImportant: boolean } | null): void;

  /**
   * Turns the reader on or off for the page.
   */
  applyReadability(value: boolean): void;

  /**
   * Starts element picking on the page; a pick arrives as a `select` event.
   */
  startInspecting(): void;

  /**
   * Ends element picking and removes its overlay.
   */
  stopInspecting(): void;

  /**
   * Takes an inspecting key typed outside the page, as if typed on it:
   * arrows climb and descend, Enter picks.
   */
  handleInspectKey(key: string): void;

  /**
   * Outlines what a selector matches on the page; an invalid selector
   * clears the outline instead.
   */
  highlight(selector: string): void;

  /**
   * Removes the selector outline.
   */
  unhighlight(): void;

  /**
   * Samples the text and background colors in use on the page.
   */
  getPageColors(): Promise<RoleColorGroups>;

  /**
   * Reads computed values of the given properties on the first element the
   * selector matches; empty when nothing matches.
   */
  getComputedStyles(
    selector: string,
    properties: Array<string>
  ): Promise<Record<string, string>>;

  /**
   * An indented outline of the page's visible elements, for describing the
   * page to a language model.
   */
  getPageOutline(): Promise<string>;

  /**
   * How many of the page's elements each selector matches, or null for a
   * selector the page can't parse.
   */
  countMatches(selectors: Array<string>): Promise<Array<number | null>>;

  /**
   * The selectors with each partly hashed class swapped for its stable
   * matcher, checked against the page.
   */
  getStableSelectors(selectors: Array<string>): Promise<Array<string>>;

  /**
   * Notes what the page looks like before the edits are applied, for
   * checkStyle to compare against.
   */
  startStyleCheck(edits: Array<ChatCssEdit>): Promise<void>;

  /**
   * Once the edits noted by startStyleCheck have applied: text they made
   * hard to read, surfaces a theme change missed, and declarations that
   * changed nothing.
   */
  checkStyle(): Promise<Array<ChatStyleProblem>>;

  /**
   * The user's Stylebot declarations in effect on the element the selector
   * is about, each with the selector it comes from.
   */
  getAppliedDeclarations(selector: string): Promise<Array<AppliedDeclaration>>;

  /**
   * What the page's own CSS applies to the element the selector is about,
   * as if Stylebot weren't there, less what changes nothing on its own.
   */
  getPageDeclarations(selector: string): Promise<Array<CssDeclaration>>;

  /**
   * Other selectors for the element last picked with this selector, or the
   * selector's first match when that element no longer fits.
   */
  getSelectorAlternatives(selector: string): Promise<SelectorAlternatives>;

  /**
   * The page's CSS as context for restyling it: its variables, and its
   * own rules for the elements matching the selector.
   */
  getPageCssContext(selector: string): Promise<string>;

  /**
   * Asks the page to show its own panel again, docked on the given side;
   * a no-op for the in-page host.
   */
  openInPage(dockLocation: 'left' | 'right'): void;

  /**
   * Brings the page's tab and window to the front; a no-op in-page.
   */
  focusPage(): void;

  /**
   * Subscribes to a bridge event; returns the unsubscribe function.
   */
  on<E extends keyof PageBridgeEvents>(
    event: E,
    listener: PageBridgeEvents[E]
  ): () => void;
};
