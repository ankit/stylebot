import Overlay from './Overlay';
import { getSelector, splitSelectorList } from '@stylebot/css';
import { queryWithShadowRoots } from '@stylebot/stylesheets';
import { describeElement } from './describe-element';
import { getParentElement, getPathUpTo, snapPastWrappers } from './snap';
import { canCoverOthers, getVisibleElementAt } from './visible-element';

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
 * Whether the element is, or sits inside, a disabled form control. A disabled
 * fieldset alone doesn't count: clicks still reach its non-control content.
 */
const isInsideDisabledControl = (el: HTMLElement): boolean =>
  !!el.closest(
    'button:disabled, input:disabled, select:disabled, textarea:disabled'
  );

class Highlighter {
  overlay: Overlay | null;
  onSelect: (selector: string) => void;
  onHover?: (selector: string) => void;
  getExistingSelector?: (el: HTMLElement) => string | null;
  getMountRoot?: () => HTMLElement | undefined;
  currentElement: HTMLElement | null;
  /**
   * The element last found under the pointer, which drilling leaves behind.
   */
  pointerElement: HTMLElement | null;
  /**
   * What the pointer showed through the element under it, when that element
   * may cover others, so it can change without the pointer leaving it.
   */
  seenElement: HTMLElement | null;
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
    getExistingSelector,
    getMountRoot,
  }: {
    onSelect: (selector: string) => void;
    /**
     * Called as the inspector moves onto an element, before it's picked.
     */
    onHover?: (selector: string) => void;
    getExistingSelector?: (el: HTMLElement) => string | null;
    /**
     * The editor's theme-provider element, for the on-page tip to mount into.
     */
    getMountRoot?: () => HTMLElement | undefined;
  }) {
    this.overlay = null;
    this.onSelect = onSelect;
    this.onHover = onHover;
    this.getExistingSelector = getExistingSelector;
    this.getMountRoot = getMountRoot;
    this.currentElement = null;
    this.pointerElement = null;
    this.seenElement = null;
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
    this.listenOnWindow(true);
    this.suppressCursor();
  };

  stopInspecting = (): void => {
    this.hideOverlay();
    this.listenOnWindow(false);
    this.drillStack = [];
    this.currentElement = null;
    this.pointerElement = null;
    this.seenElement = null;
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

  // Skips unrendered and visibility: hidden elements, but not transparent
  // ones, which are often a button's click target.
  queryMatches = (selector: string): Array<HTMLElement> => {
    return queryWithShadowRoots<HTMLElement>(selector).filter(el =>
      el.checkVisibility({ visibilityProperty: true })
    );
  };

  highlight = (selector: string): void => {
    if (!selector) {
      return;
    }

    // Boxing a whole-page selector just floods the page.
    this.ensureOverlay().outline(
      isWholePageSelector(selector) ? [] : this.queryMatches(selector)
    );
  };

  unhighlight = (): void => {
    this.hideOverlay();
  };

  /**
   * The window listeners inspecting adds. Every mouse and pointer event stops
   * there, so the page's own hover menus hold still while picking.
   */
  getWindowListeners = (): Array<[string, (event: never) => void]> => [
    ['click', this.onClick],
    ['mousedown', this.onMouseEvent],
    ['mouseover', this.onMouseEvent],
    ['mouseup', this.onMouseEvent],
    ['mousemove', this.onMouseEvent],
    ['mouseout', this.onMouseEvent],
    ['mouseenter', this.onMouseEvent],
    ['mouseleave', this.onMouseEvent],
    ['pointerenter', this.onMouseEvent],
    ['pointerleave', this.onMouseEvent],
    ['pointerdown', this.onPointerDown],
    ['pointerover', this.onPointerOver],
    ['pointermove', this.onPointerMove],
    ['pointerout', this.onPointerOut],
    ['pointerup', this.onPointerUp],
    ['keydown', this.onKeyDown],
  ];

  listenOnWindow = (on: boolean): void => {
    const method = on ? 'addEventListener' : 'removeEventListener';

    for (const [type, listener] of this.getWindowListeners()) {
      window[method](type, listener as EventListener, true);
    }
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

    this.hoverElement(getComposedTarget(event), event);
  };

  /**
   * Moving from a shadow host onto something in its shadow tree fires no
   * pointerover outside that tree, so only the move shows the pointer arrived.
   */
  onPointerMove = (event: MouseEvent): void => {
    if (this.isStylebotElement(event.target)) {
      return;
    }

    event.stopPropagation();
    const el = getComposedTarget(event);

    if (el !== this.pointerElement) {
      this.hoverElement(el, event);
      return;
    }

    if (!this.seenElement) {
      return;
    }

    const seen = this.getVisibleElementAt(el, event);

    if (seen !== this.seenElement) {
      this.seenElement = seen;
      this.showSeen(seen);
    }
  };

  /**
   * Hides the overlay once the pointer leaves the page, e.g. for a side panel
   * or pop-out window. The element stays current so keys typed there still work.
   */
  onPointerOut = (event: PointerEvent): void => {
    if (!this.isStylebotElement(event.target)) {
      event.stopPropagation();
    }

    // Moving into an iframe's own document has no related target either.
    if (event.relatedTarget || event.target instanceof HTMLIFrameElement) {
      return;
    }

    this.pointerElement = null;
    this.seenElement = null;
    this.hideOverlay();
  };

  hoverElement = (el: HTMLElement, point?: MouseEvent): void => {
    this.pointerElement = el;
    this.seenElement = null;

    if (point && canCoverOthers(el)) {
      this.seenElement = this.getVisibleElementAt(el, point);
    }

    this.showSeen(this.seenElement ?? el);
  };

  getVisibleElementAt = (el: HTMLElement, point: MouseEvent): HTMLElement =>
    getVisibleElementAt(
      el,
      point.clientX,
      point.clientY,
      this.isStylebotElement
    );

  /**
   * Inspects what the pointer shows, snapped past plain wrappers.
   */
  showSeen = (seen: HTMLElement): void => {
    const target = snapPastWrappers(seen);

    // Drilling down from a snapped pick leads back to what's under the pointer.
    if (target !== this.currentElement || this.drillStack.length === 0) {
      this.drillStack = getPathUpTo(seen, target);
    }

    this.setCurrentElement(target);
    this.showOverlay(target);
  };

  onPointerUp = (event: MouseEvent): void => {
    if (this.isStylebotElement(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Browsers fire no click on a disabled control or anything inside one.
    const target = getComposedTarget(event);

    if (event.button === 0 && isInsideDisabledControl(target)) {
      this.selectElement(this.currentElement ?? target);
    }
  };

  showOverlay = (el: HTMLElement): void => {
    const selector = this.getSelectorFor(el);

    this.ensureOverlay().inspect([el], describeElement(el), undefined, {
      primary: el,
    });

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
