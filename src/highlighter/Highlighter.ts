import Overlay from './Overlay';
import { getComputedDeclarations } from './utils';
import { getSelector } from '@stylebot/css';

type LayoutProperty = 'margin' | 'border' | 'padding' | 'height' | 'width';

type StylebotDeclaration = { property: string; value: string };

class Highlighter {
  overlay: Overlay | null;
  onSelect: (selector: string) => void;
  getStylebotDeclarations?: (
    selector: string
  ) => Array<StylebotDeclaration> | null;
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
    ) => Array<StylebotDeclaration> | null;
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

  highlight = (selector: string, property?: LayoutProperty): void => {
    if (!selector) {
      return;
    }

    if (!this.overlay) {
      this.overlay = new Overlay(this.getMountRoot?.());
    }

    const elements = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    ) as Array<HTMLElement>;

    const authoredDeclarations =
      this.getStylebotDeclarations?.(selector) ?? null;

    this.overlay.inspect(elements, selector, property, {
      // A selector preview, not picking one specific element — anchor
      // beside the panel rather than near wherever it matches.
      anchorToPanel: true,
      styleCount: authoredDeclarations?.length ?? 0,
      declarations:
        authoredDeclarations && authoredDeclarations.length > 0
          ? authoredDeclarations
          : elements[0]
          ? getComputedDeclarations(elements[0])
          : null,
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
  getNextAncestorInfo = (
    el: HTMLElement
  ): { label: string; styleCount: number } | null => {
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
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();

      this.selectElement(this.currentElement ?? (event.target as HTMLElement));
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
    if (!this.overlay) {
      this.overlay = new Overlay(this.getMountRoot?.());
    }

    const selector = this.getSelectorFor(el);
    const matches = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    ) as Array<HTMLElement>;

    const authoredDeclarations =
      this.getStylebotDeclarations?.(selector) ?? null;

    this.overlay.inspect(matches, selector, undefined, {
      primary: el,
      nextAncestor: this.getNextAncestorInfo(el),
      // Falls back to a computed-style preview when nothing's authored,
      // rather than showing an empty card.
      styleCount: authoredDeclarations?.length ?? 0,
      declarations:
        authoredDeclarations && authoredDeclarations.length > 0
          ? authoredDeclarations
          : getComputedDeclarations(el),
    });
  };

  hideOverlay = (): void => {
    this.overlay?.remove();
    this.overlay = null;
  };

  isStylebotPanel = (el: EventTarget | null): boolean => {
    return (el as HTMLElement | null)?.id === 'stylebot';
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
