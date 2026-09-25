import type { RoleColorGroups } from '@stylebot/css';

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

export type PageBridgeEvents = {
  // The inspector picked an element on the page.
  select: (selector: string) => void;
  // The page came within reach or dropped away; always reachable in-page.
  connection: (connected: boolean) => void;
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
   * Asks the page to show its own panel again; a no-op for the in-page host.
   */
  openInPage(): void;

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
