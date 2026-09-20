import Overlay from './Overlay';
import { LayoutProperty, NextAncestorInfo } from './types';
import { getSelector, splitSelectorList } from '@stylebot/css';
import { CssDeclaration } from '@stylebot/types';

const WHOLE_PAGE_SELECTORS = ['*', 'body', 'html', ':root'];

const isWholePageSelector = (selector: string): boolean =>
  splitSelectorList(selector).some(part => WHOLE_PAGE_SELECTORS.includes(part));

class Highlighter {
  overlay: Overlay | null;
  onSelect: (selector: string) => void;
  getStylebotDeclarations?: (selector: string) => Array<CssDeclaration> | null;
  getExistingSelector?: (el: HTMLElement) => string | null;
  getMountRoot?: () => HTMLElement;
  currentElement: HTMLElement | null;
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
    getStylebotDeclarations,
    getExistingSelector,
    getMountRoot,
  }: {
    onSelect: (selector: string) => void;
    getStylebotDeclarations?: (
      selector: string
    ) => Array<CssDeclaration> | null;
    getExistingSelector?: (el: HTMLElement) => string | null;
    /**
     * The editor's theme-provider element, for the on-page tip to mount into.
     */
    getMountRoot?: () => HTMLElement;
  }) {
    this.overlay = null;
    this.onSelect = onSelect;
    this.getStylebotDeclarations = getStylebotDeclarations;
    this.getExistingSelector = getExistingSelector;
    this.getMountRoot = getMountRoot;
    this.currentElement = null;
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
  // and don't count as matches.
  queryMatches = (selector: string): Array<HTMLElement> => {
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(
      el => el.checkVisibility()
    );
  };

  getCardDeclarations = (
    selector: string
  ): { styleCount: number; declarations: Array<CssDeclaration> | null } => {
    const declarations = this.getStylebotDeclarations?.(selector) ?? null;

    return {
      styleCount: declarations?.length ?? 0,
      declarations,
    };
  };

  highlight = (selector: string, property?: LayoutProperty): void => {
    if (!selector) {
      return;
    }

    // Boxing a whole-page selector just floods the page; the card alone
    // still says what it styles.
    const elements = isWholePageSelector(selector)
      ? []
      : this.queryMatches(selector);

    this.ensureOverlay().inspect(elements, selector, property, {
      // A selector preview, not picking one specific element — anchor
      // beside the panel rather than near wherever it matches.
      anchorToPanel: true,
      ...this.getCardDeclarations(selector),
    });
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
    window.removeEventListener('pointerup', this.onPointerUp, true);
    window.removeEventListener('keydown', this.onKeyDown, true);
  };

  selectElement = (el: HTMLElement): void => {
    this.onSelect(this.getSelectorFor(el));
  };

  /**
   * Info about the immediate parent, offered as the single next step
   * upward rather than listing several levels at once.
   */
  getNextAncestorInfo = (el: HTMLElement): NextAncestorInfo | null => {
    const parent = el.parentElement;

    if (!parent || this.isStylebotElement(parent)) {
      return null;
    }

    const selector = this.getSelectorFor(parent);

    return {
      label: selector,
      styleCount: this.getStylebotDeclarations?.(selector)?.length ?? 0,
    };
  };

  onKeyDown = (event: KeyboardEvent): void => {
    if (!this.currentElement) {
      return;
    }

    // Left/Right mirror Up/Down as alternate keys for the same climb/descend.
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      const parent = this.currentElement.parentElement;

      if (parent && !this.isStylebotElement(parent)) {
        event.preventDefault();
        event.stopPropagation();

        this.drillStack.push(this.currentElement);
        this.setCurrentElement(parent);
        this.showOverlay(parent);
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      const child = this.drillStack.pop();

      if (child) {
        event.preventDefault();
        event.stopPropagation();

        this.setCurrentElement(child);
        this.showOverlay(child);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      this.selectElement(this.currentElement);
    }
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
      : this.currentElement ?? (event.target as HTMLElement);

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

    const el = event.target as HTMLElement;

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
        nextAncestor: this.getNextAncestorInfo(el),
        ...this.getCardDeclarations(selector),
      }
    );
  };

  hideOverlay = (): void => {
    this.overlay?.remove();
    this.overlay = null;
  };

  // In the extension the panel's shadow root retargets events to the
  // #stylebot host itself; anywhere it renders inline, the host is an
  // ancestor instead.
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
