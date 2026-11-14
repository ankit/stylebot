import { DRAG_THRESHOLD } from './floating-bounds';

const CONTROL_DRAG_THRESHOLD = 6;
const HANDLE = '.stylebot-drag-handle';
const NOT_DRAGGABLE =
  'input, select, textarea, [contenteditable], [role="menu"], [role="menuitem"], [role="listbox"], [role="option"]';
const CONTROLS = 'button, a, [role="button"], [role="tab"]';

type Callbacks = {
  start(): void;
  move(dx: number, dy: number, x: number): void;
  end(dragged: boolean): void;
};

type Press = {
  pointerId: number;
  x: number;
  y: number;
  threshold: number;
  dragging: boolean;
};

const swallow = (event: Event): void => {
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Moves the panel by anything in its header but a field or menu. Buttons
 * and tabs still click unless the pointer travels a little further first.
 */
export class HeaderDrag {
  panel: HTMLElement;
  callbacks: Callbacks;
  press: Press | null = null;

  constructor(panel: HTMLElement, callbacks: Callbacks) {
    this.panel = panel;
    this.callbacks = callbacks;
    panel.addEventListener('pointerdown', this.onPointerDown);
    panel.addEventListener('lostpointercapture', this.onPointerUp);
  }

  destroy(): void {
    this.panel.removeEventListener('pointerdown', this.onPointerDown);
    this.panel.removeEventListener('lostpointercapture', this.onPointerUp);
    this.listen(false);
  }

  // Not prevented: menus close on the mousedown it would cancel.
  onPointerDown = (event: PointerEvent): void => {
    const target = event.composedPath()[0];

    if (
      event.button !== 0 ||
      !(target instanceof Element) ||
      !target.closest(HANDLE) ||
      target.closest(NOT_DRAGGABLE)
    ) {
      return;
    }

    const onControl = target.closest(CONTROLS) !== null;
    this.press = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      threshold: onControl ? CONTROL_DRAG_THRESHOLD : DRAG_THRESHOLD,
      dragging: false,
    };
    this.listen(true);
  };

  onPointerMove = (event: PointerEvent): void => {
    const { press } = this;
    if (press?.pointerId !== event.pointerId) {
      return;
    }

    if (!(event.buttons & 1)) {
      this.onPointerUp();

      return;
    }

    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;

    if (!press.dragging) {
      if (Math.hypot(dx, dy) < press.threshold) {
        return;
      }

      // Captured from here on, so the moves keep coming over iframes and the
      // release doesn't click the control the drag started on.
      this.panel.setPointerCapture(event.pointerId);
      press.dragging = true;
      this.callbacks.start();
    }

    event.preventDefault();
    this.callbacks.move(dx, dy, event.clientX);
  };

  onPointerUp = (): void => {
    const { press } = this;
    if (!press) {
      return;
    }

    this.press = null;
    this.listen(false);

    if (press.dragging) {
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 0);
    }

    this.callbacks.end(press.dragging);
  };

  listen(on: boolean): void {
    const method = on ? 'addEventListener' : 'removeEventListener';

    window[method]('pointermove', this.onPointerMove as EventListener, true);
    window[method]('pointerup', this.onPointerUp, true);
    window[method]('pointercancel', this.onPointerUp, true);
    window[method]('dragstart', swallow, true);
    window[method]('selectstart', swallow, true);
  }
}
