import Overlay from './Overlay';
import { getSelector } from '@stylebot/css';

class Highlighter {
  overlay: Overlay | null;
  onSelect: (selector: string) => void;

  constructor({ onSelect }: { onSelect: (selector: string) => void }) {
    this.overlay = null;
    this.onSelect = onSelect;
  }

  startInspecting = (): void => {
    this.addWindowListeners();
  };

  stopInspecting = (): void => {
    this.hideOverlay();
    this.removeWindowListeners();
  };

  highlight = (selector: string): void => {
    if (!selector) {
      return;
    }

    if (!this.overlay) {
      this.overlay = new Overlay();
    }

    const elements = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    );

    // todo: until we can performantly support highlighting a large number of elements
    if (elements.length > 100) {
      return;
    }

    this.overlay.inspect(elements, selector);
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
  };

  removeWindowListeners = (): void => {
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('mousedown', this.onMouseEvent, true);
    window.removeEventListener('mouseover', this.onMouseEvent, true);
    window.removeEventListener('mouseup', this.onMouseEvent, true);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointerover', this.onPointerOver, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
  };

  onClick = (event: MouseEvent): void => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();

      const selector = getSelector(event.target as HTMLElement);
      this.onSelect(selector);
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
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();

      const el = event.target as HTMLElement;
      this.showOverlay(el);
    } else {
      this.hideOverlay();
    }
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

    this.overlay.inspect([el], getSelector(el));
  };

  hideOverlay = (): void => {
    this.overlay?.remove();
    this.overlay = null;
  };

  isStylebotElement = (el: EventTarget | null): boolean => {
    return (el as HTMLElement)?.id === 'stylebot';
  };
}

export default Highlighter;
