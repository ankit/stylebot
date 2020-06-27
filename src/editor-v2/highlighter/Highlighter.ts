import Overlay from './Overlay';
import CSSSelectorGenerator from '../css-selector-generator/CSSSelectorGenerator';

class Highlighter {
  overlay: Overlay;
  cssSelectorGenerator: CSSSelectorGenerator;

  constructor() {
    this.overlay = new Overlay();
    this.cssSelectorGenerator = new CSSSelectorGenerator();
  }

  startInspecting = () => {
    this.addWindowListeners();
  };

  stopInspecting = () => {
    this.hideOverlay();
    this.removeWindowListeners();
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
    event.preventDefault();
    event.stopPropagation();

    this.stopInspecting();
  };

  onMouseEvent = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  onPointerDown = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  onPointerOver = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const el = event.target as HTMLElement;
    this.showOverlay(el);
  };

  onPointerUp = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  showOverlay = (el: HTMLElement) => {
    this.overlay.inspect([el], this.cssSelectorGenerator.inspect(el));
  };

  hideOverlay = () => {
    this.overlay.remove();
  };
}

export default Highlighter;
