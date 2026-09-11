import Overlay from './Overlay';
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
  currentElement: HTMLElement | null;
  drillStack: HTMLElement[];

  constructor({
    onSelect,
    getStylebotDeclarations,
    getExistingSelector,
  }: {
    onSelect: (selector: string) => void;
    getStylebotDeclarations?: (
      selector: string
    ) => Array<StylebotDeclaration> | null;
    getExistingSelector?: (el: HTMLElement) => string | null;
  }) {
    this.overlay = null;
    this.onSelect = onSelect;
    this.getStylebotDeclarations = getStylebotDeclarations;
    this.getExistingSelector = getExistingSelector;
    this.currentElement = null;
    this.drillStack = [];
  }

  // Prefers a selector the user has already authored CSS against — via the
  // browser's own matching, not just an exact-string check — over
  // generating a fresh one, so picking an already-styled element continues
  // editing its existing rule instead of starting an unrelated new one.
  getSelectorFor = (el: HTMLElement): string => {
    return this.getExistingSelector?.(el) ?? getSelector(el);
  };

  startInspecting = (): void => {
    this.addWindowListeners();
  };

  stopInspecting = (): void => {
    this.hideOverlay();
    this.removeWindowListeners();
    this.drillStack = [];
    this.currentElement = null;
  };

  highlight = (selector: string, property?: LayoutProperty): void => {
    if (!selector) {
      return;
    }

    if (!this.overlay) {
      this.overlay = new Overlay();
    }

    const elements = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    );

    this.overlay.inspect(elements, selector, property);
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

  // Nearest ancestor first. Capped at 3 levels — past that the card starts
  // competing with the subject for attention.
  getAncestorsInfo = (
    el: HTMLElement
  ): Array<{ label: string; matchCount: number; styled: boolean }> => {
    const ancestors: Array<{
      label: string;
      matchCount: number;
      styled: boolean;
    }> = [];

    let node = el.parentElement;

    while (node && !this.isStylebotElement(node) && ancestors.length < 3) {
      const selector = this.getSelectorFor(node);

      ancestors.push({
        label: selector,
        matchCount: document.querySelectorAll(selector).length,
        styled: !!this.getStylebotDeclarations?.(selector),
      });

      node = node.parentElement;
    }

    return ancestors;
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
        this.currentElement = parent;
        this.showOverlay(parent);
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      const child = this.drillStack.pop();

      if (child) {
        event.preventDefault();
        event.stopPropagation();

        this.currentElement = child;
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

    this.currentElement = el;
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
      this.overlay = new Overlay();
    }

    const selector = this.getSelectorFor(el);
    const matches = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    ) as HTMLElement[];

    this.overlay.inspect(matches, selector, undefined, {
      primary: el,
      ancestors: this.getAncestorsInfo(el),
      declarations: this.getStylebotDeclarations?.(selector) ?? null,
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

    return this.isStylebotPanel(element) || element.closest('#stylebot-overlay') !== null;
  };
}

export default Highlighter;
