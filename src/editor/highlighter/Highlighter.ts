import Overlay from './Overlay';
import CssSelectorGenerator from '../../css/CssSelectorGenerator';

class Highlighter {
  overlay: Overlay | null;
  onSelect: (selector: string) => void;
  cssSelectorGenerator: CssSelectorGenerator;

  constructor({ onSelect }: { onSelect: (selector: string) => void }) {
    this.overlay = null;
    this.onSelect = onSelect;
    this.cssSelectorGenerator = new CssSelectorGenerator();
  }

  startInspecting = () => {
    this.addWindowListeners();
  };

  stopInspecting = () => {
    this.hideOverlay();
    this.removeWindowListeners();
  };

  highlight = (selector: string) => {
    if (!selector) {
      return;
    }

    if (!this.overlay) {
      this.overlay = new Overlay();
    }

    const elements = Array.prototype.slice.call(
      document.querySelectorAll(selector)
    );

    this.overlay.inspect(elements, selector);
  };

  unhighlight = () => {
    this.hideOverlay();
  };

  addWindowListeners = () => {
    window.addEventListener('click', this.onClick, true);
    window.addEventListener('mousedown', this.onMouseEvent, true);
    window.addEventListener('mouseover', this.onMouseEvent, true);
    window.addEventListener('mouseup', this.onMouseEvent, true);
    window.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('pointerover', this.onPointerOver, true);
    window.addEventListener('pointerup', this.onPointerUp, true);
  };

  removeWindowListeners = () => {
    window.removeEventListener('click', this.onClick, true);
    window.removeEventListener('mousedown', this.onMouseEvent, true);
    window.removeEventListener('mouseover', this.onMouseEvent, true);
    window.removeEventListener('mouseup', this.onMouseEvent, true);
    window.removeEventListener('pointerdown', this.onPointerDown, true);
    window.removeEventListener('pointerover', this.onPointerOver, true);
    window.removeEventListener('pointerup', this.onPointerUp, true);
  };

  onClick = (event: MouseEvent) => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();

      const selector = this.cssSelectorGenerator.inspect(
        event.target as HTMLElement
      );

      this.onSelect(selector);
    }
  };

  onMouseEvent = (event: MouseEvent) => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  onPointerDown = (event: MouseEvent) => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  onPointerOver = (event: MouseEvent) => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();

      const el = event.target as HTMLElement;
      this.showOverlay(el);
    }
  };

  onPointerUp = (event: MouseEvent) => {
    if (!this.isStylebotElement(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  showOverlay = (el: HTMLElement) => {
    if (!this.overlay) {
      this.overlay = new Overlay();
    }

    this.overlay.inspect([el], this.cssSelectorGenerator.inspect(el));
  };

  hideOverlay = () => {
    this.overlay?.remove();
    this.overlay = null;
  };

  isStylebotElement = (el: EventTarget | null) => {
    return !!el && !!(el as HTMLElement).closest('.stylebot');
  };
}

export default Highlighter;
