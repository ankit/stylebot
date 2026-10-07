import Overlay from './Overlay';
import { getSelector, splitSelectorList } from '@stylebot/css';
import { queryWithShadowRoots } from '@stylebot/stylesheets';

// What the inspector takes from the keyboard: climb, descend and pick.
export const INSPECT_KEYS = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
];

const WHOLE_PAGE_SELECTORS = ['*', 'body', 'html', ':root'];

const isWholePageSelector = (selector: string): boolean =>
  splitSelectorList(selector).some(part => WHOLE_PAGE_SELECTORS.includes(part));

/**
 * The element the pointer is really over. Window listeners see an event from
 * inside an open shadow tree retargeted to its host.
 */
const getComposedTarget = (event: Event): HTMLElement =>
  (event.composedPath()[0] ?? event.target) as HTMLElement;

/**
 * The parent to climb to, stepping out of a shadow tree onto its host.
 */
const getParentElement = (el: HTMLElement): HTMLElement | null => {
  if (el.parentElement) {
    return el.parentElement;
  }

  const root = el.getRootNode();

  return root instanceof ShadowRoot ? (root.host as HTMLElement) : null;
};

class Highlighter {
  overlay: Overlay | null;
  onSelect: (selector: string) => void;
  onHover?: (selector: string) => void;
  countRules?: (selector: string) => number;
  getExistingSelector?: (el: HTMLElement) => string | null;
  getMountRoot?: () => HTMLElement | undefined;
  currentElement: HTMLElement | null;
  /**
   * The element last found under the pointer, which drilling leaves behind.
   */
  pointerElement: HTMLElement | null;
  drillStack: Array<HTMLElement>;
  /**
   * Element/value currently suppressed by suppressTitle, if any.
   */
  titleSuppressedElement: HTMLElement | null;
  suppressedTitleValue: string | null;
  /**
   * The `<style>` forcing a plain cursor while inspecting, if any.
   */
  cursorStyleElement: HTMLStyleElement | null;

  constructor({
    onSelect,
    onHover,
    countRules,
    getExistingSelector,
    getMountRoot,
  }: {
    onSelect: (selector: string) => void;
    /**
     * Called as the inspector moves onto an element, before it's picked.
     */
    onHover?: (selector: string) => void;
    /**
     * How many declarations the user's style has for a selector, for the card.
     */
    countRules?: (selector: string) => number;
    getExistingSelector?: (el: HTMLElement) => string | null;
    /**
     * The editor's theme-provider element, for the on-page tip to mount into.
     */
    getMountRoot?: () => HTMLElement | undefined;
  }) {
    this.overlay = null;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.countRules = countRules;
    this.getExistingSelector = getExistingSelector;
    this.getMountRoot = getMountRoot;
    this.currentElement = null;
    this.pointerElement = null;
    this.drillStack = [];
    this.titleSuppressedElement = null;
    this.suppressedTitleValue = null;
    this.cursorStyleElement = null;
  }

  /**
   * Prefers a selector the user has already authored CSS against over
   * generating a fresh one, so editing continues an existing rule.
   */
  getSelectorFor = (el: HTMLElement): string => {
    return this.getExistingSelector?.(el) ?? getSelector(el);
  };

  startInspecting = (): void => {
    this.addWindowListeners();
    this.suppressCursor();
  };

  stopInspecting = (): void => {
    this.hideOverlay();
    this.removeWindowListeners();
    this.drillStack = [];
    this.currentElement = null;
    this.pointerElement = null;
    this.restoreSuppressedTitle();
    this.restoreCursor();
  };

  /**
   * Forces a plain cursor site-wide, so the page's own cursor styling
   * doesn't bleed through while inspecting.
   */
  suppressCursor = (): void => {
    if (this.cursorStyleElement) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'stylebot-inspect-cursor';
    style.textContent = '* { cursor: default !important; }';
    document.head.appendChild(style);
    this.cursorStyleElement = style;
  };

  restoreCursor = (): void => {
    this.cursorStyleElement?.remove();
    this.cursorStyleElement = null;
  };

  /**
   * Restores the element's native `title`, suppressed to keep the
   * browser's own tooltip from fighting with our overlay.
   */
  restoreSuppressedTitle = (): void => {
    if (this.titleSuppressedElement && this.suppressedTitleValue !== null) {
      this.titleSuppressedElement.setAttribute(
        'title',
        this.suppressedTitleValue
      );
    }

    this.titleSuppressedElement = null;
    this.suppressedTitleValue = null;
  };

  suppressTitle = (el: HTMLElement): void => {
    // The tooltip belongs to whichever ancestor (inclusive) has the
    // attribute, not necessarily el itself.
    const titledElement = el.closest('[title]') as HTMLElement | null;

    if (!titledElement) {
      return;
    }

    const title = titledElement.getAttribute('title');

    if (title !== null) {
      this.titleSuppressedElement = titledElement;
      this.suppressedTitleValue = title;
      titledElement.removeAttribute('title');
    }
  };

  /**
   * Restores the previous element's title and suppresses the new one's,
   * on hover or ArrowUp/Down drilling alike.
   */
  setCurrentElement = (el: HTMLElement): void => {
    if (el === this.currentElement) {
      return;
    }

    this.restoreSuppressedTitle();
    this.suppressTitle(el);
    this.currentElement = el;
  };

  ensureOverlay = (): Overlay => {
    if (!this.overlay) {
      this.overlay = new Overlay(this.getMountRoot?.());
    }

    return this.overlay;
  };

  // Elements that aren't rendered (display: none) have nothing to outline
  // and don't count as matches. Styles reach open shadow roots, so do matches.
  queryMatches = (selector: string): Array<HTMLElement> => {
    return queryWithShadowRoots<HTMLElement>(selector).filter(el =>
      el.checkVisibility()
    );
  };

  highlight = (selector: string): void => {
    if (!selector) {
      return;
    }

    // Tinting a whole-page selector just floods the page.
    this.ensureOverlay().outline(
      isWholePageSelector(selector) ? [] : this.queryMatches(selector)
    );
  };

  unhighlight = (): void => {
    this.hideOverlay();
  };

  addWindowListeners = (): void => {
    window.addEventListener('click', this.onClick, true);
    window.addEventListener('mousedown', this.onMouseEvent, true);
    window.addEventListener('mouseover', this.onMouseEvent, true);
    window.addEventListener('mouseup', this.onMouseEvent, true);
    window.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('pointerover', this.onPointerOver, true);
    window.addEventListener('pointermove', this.onPointerMove, true);
    window.addEventListener('pointerup', this.onPointerUp, true);
    window.addEventListener('keydown', this.onKeyDown, true);
  };

  removeWindowListeners = (): void => {
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('mousedown', this.onMouseEvent, true);
    window.removeEventListener('mouseover', this.onMouseEvent, true);
    window.removeEventListener('mouseup', this.onMouseEvent, true);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointerover', this.onPointerOver, true);
    window.removeEventListener('pointermove', this.onPointerMove, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
  };

  selectElement = (el: HTMLElement): void => {
    this.onSelect(this.getSelectorFor(el));
  };

  onKeyDown = (event: KeyboardEvent): void => {
    if (this.handleKey(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  /**
   * Climbs, descends or picks for an inspecting key, wherever it was typed.
   * Returns whether the key did anything.
   */
  handleKey = (key: string): boolean => {
    if (!this.currentElement) {
      return false;
    }

    // Left/Right mirror Up/Down as alternate keys for the same climb/descend.
    if (key === 'ArrowUp' || key === 'ArrowLeft') {
      const parent = getParentElement(this.currentElement);

      if (!parent || this.isStylebotElement(parent)) {
        return false;
      }

      this.drillStack.push(this.currentElement);
      this.setCurrentElement(parent);
      this.showOverlay(parent);
      return true;
    }

    if (key === 'ArrowDown' || key === 'ArrowRight') {
      const child = this.drillStack.pop();

      if (!child) {
        return false;
      }

      this.setCurrentElement(child);
      this.showOverlay(child);
      return true;
    }

    if (key === 'Enter') {
      this.selectElement(this.currentElement);
      return true;
    }

    return false;
  };

  onClick = (event: MouseEvent): void => {
    if (this.isStylebotPanel(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // A click on our own overlay (shielding an iframe) still means "this
    // one" — the hovered element, never the overlay itself.
    const el = this.isStylebotElement(event.target)
      ? this.currentElement
      : this.currentElement ?? getComposedTarget(event);

    if (el) {
      this.selectElement(el);
    }
  };

  onMouseEvent = (event: MouseEvent): void => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  onPointerDown = (event: MouseEvent): void => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  onPointerOver = (event: MouseEvent): void => {
    if (this.isStylebotPanel(event.target)) {
      this.hideOverlay();
      return;
    }

    // Hovering our own overlay/breadcrumb: leave it be so a click can reach it.
    if (this.isStylebotElement(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.hoverElement(getComposedTarget(event));
  };

  /**
   * Moving from a shadow host onto something in its shadow tree fires no
   * pointerover outside that tree, so only the move shows the pointer arrived.
   */
  onPointerMove = (event: MouseEvent): void => {
    if (this.isStylebotElement(event.target)) {
      return;
    }

    const el = getComposedTarget(event);

    if (el !== this.pointerElement) {
      this.hoverElement(el);
    }
  };

  hoverElement = (el: HTMLElement): void => {
    this.pointerElement = el;

    if (el !== this.currentElement) {
      this.drillStack = [];
    }

    this.setCurrentElement(el);
    this.showOverlay(el);
  };

  onPointerUp = (event: MouseEvent): void => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  showOverlay = (el: HTMLElement): void => {
    const selector = this.getSelectorFor(el);

    this.ensureOverlay().inspect(
      this.queryMatches(selector),
      selector,
      undefined,
      {
        primary: el,
        ruleCount: this.countRules?.(selector) ?? 0,
      }
    );

    this.onHover?.(selector);
  };

  hideOverlay = (): void => {
    this.overlay?.remove();
    this.overlay = null;
  };

  // In the extension the panel's shadow root retargets events to the
  // #stylebot host itself; anywhere it renders inline, the host is an
  // ancestor instead. Checked on the retargeted event.target on purpose:
  // closest() can't climb out of the panel's shadow tree.
  isStylebotPanel = (el: EventTarget | null): boolean => {
    return (el as HTMLElement | null)?.closest?.('#stylebot') != null;
  };

  isStylebotElement = (el: EventTarget | null): boolean => {
    const element = el as HTMLElement | null;

    if (!element) {
      return false;
    }

    return (
      this.isStylebotPanel(element) ||
      element.closest('#stylebot-overlay') !== null
    );
  };
}

export default Highlighter;
