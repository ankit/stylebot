import type { Rect } from './utils';

/**
 * The faint tint drawn over another element the hovered one's selector
 * would also style, lighter than OverlayRect so the hovered fill still leads.
 */
export default class OverlayHint {
  node: HTMLElement;

  constructor(doc: Document, container: HTMLElement) {
    this.node = doc.createElement('div');
    this.node.className = 'stylebot-overlay-hint';

    Object.assign(this.node.style, {
      position: 'fixed',
      pointerEvents: 'none',
      boxSizing: 'border-box',
      background: 'rgba(80, 145, 205, 0.14)',
      borderRadius: '2px',
      zIndex: '10000000',
    });

    container.appendChild(this.node);
  }

  remove(): void {
    this.node.parentNode?.removeChild(this.node);
  }

  update(box: Rect): void {
    Object.assign(this.node.style, {
      top: `${box.top}px`,
      left: `${box.left}px`,
      width: `${box.width}px`,
      height: `${box.height}px`,
    });
  }
}
