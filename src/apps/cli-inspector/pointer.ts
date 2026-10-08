import { getExistingSelector, getSelector } from '@stylebot/css';
import { countMatches, getSelectorAlternatives } from '@stylebot/page-bridge';
import { queryWithShadowRoots } from '@stylebot/stylesheets';
import type { PointerAction, PointerResult } from '@stylebot/types';

let hovered: Element | null = null;

/**
 * The deepest element at a point, looking inside open shadow roots.
 */
const elementAt = (x: number, y: number): Element | null => {
  let el = document.elementFromPoint(x, y);

  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);

    if (!inner || inner === el) {
      break;
    }

    el = inner;
  }

  return el;
};

/**
 * Whether el is target or inside it, crossing shadow boundaries.
 */
const isWithin = (el: Element, target: Element): boolean => {
  let node: Node | null = el;

  while (node) {
    if (node === target) {
      return true;
    }

    node =
      node.parentNode instanceof ShadowRoot
        ? node.parentNode.host
        : node.parentNode;
  }

  return false;
};

/**
 * The point and element an action aims at. A selector aims at the middle of
 * its first visible match, scrolled into view, unless something covers it.
 */
const resolveTarget = (
  action: PointerAction
): { x: number; y: number; el: Element } => {
  if (action.selector === undefined) {
    const x = (action.x ?? 0) / devicePixelRatio;
    const y = (action.y ?? 0) / devicePixelRatio;
    const el = elementAt(x, y);

    if (!el) {
      throw new Error(`Nothing at ${action.x},${action.y}`);
    }

    return { x, y, el };
  }

  const target = queryWithShadowRoots<HTMLElement>(action.selector).find(el =>
    el.checkVisibility()
  );

  if (!target) {
    throw new Error(`No visible element matches ${action.selector}`);
  }

  let rect = target.getBoundingClientRect();

  if (
    rect.bottom < 0 ||
    rect.top > innerHeight ||
    rect.right < 0 ||
    rect.left > innerWidth
  ) {
    target.scrollIntoView({ block: 'center', inline: 'center' });
    rect = target.getBoundingClientRect();
  }

  const x = Math.round(
    Math.min(Math.max(rect.left + rect.width / 2, 0), innerWidth - 1)
  );
  const y = Math.round(
    Math.min(Math.max(rect.top + rect.height / 2, 0), innerHeight - 1)
  );
  const hit = elementAt(x, y);

  return { x, y, el: hit && isWithin(hit, target) ? hit : target };
};

const fire = (
  el: Element,
  type: string,
  x: number,
  y: number,
  init: MouseEventInit = {}
): void => {
  const options: PointerEventInit = {
    bubbles: !type.endsWith('enter') && !type.endsWith('leave'),
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    view: window,
    ...init,
  };

  el.dispatchEvent(
    type.startsWith('pointer')
      ? new PointerEvent(type, {
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          ...options,
        })
      : new MouseEvent(type, options)
  );
};

const hover = (el: Element, x: number, y: number): void => {
  if (hovered && hovered !== el && hovered.isConnected) {
    fire(hovered, 'pointerout', x, y, { relatedTarget: el });
    fire(hovered, 'pointerleave', x, y, { relatedTarget: el });
    fire(hovered, 'mouseout', x, y, { relatedTarget: el });
    fire(hovered, 'mouseleave', x, y, { relatedTarget: el });
  }

  if (hovered !== el) {
    fire(el, 'pointerover', x, y, { relatedTarget: hovered });
    fire(el, 'pointerenter', x, y, { relatedTarget: hovered });
    fire(el, 'mouseover', x, y, { relatedTarget: hovered });
    fire(el, 'mouseenter', x, y, { relatedTarget: hovered });
  }

  fire(el, 'pointermove', x, y);
  fire(el, 'mousemove', x, y);
  hovered = el;
};

/**
 * The selector the inspector would pick for an element, preferring one the
 * style's css has, with the alternatives the editor's selector menu offers.
 */
const inspectElement = (
  el: HTMLElement,
  css: string
): Pick<PointerResult, 'selector' | 'matches' | 'alternatives'> => {
  const selector = getExistingSelector(el, css) ?? getSelector(el);
  const { existing, candidates } = getSelectorAlternatives(el, selector, css);
  const others = Array.from(new Set([...existing, ...candidates])).filter(
    other => other !== selector
  );
  const [matches, ...counts] = countMatches([selector, ...others]);

  return {
    selector,
    matches,
    alternatives: others.map((other, i) => ({
      selector: other,
      matches: counts[i],
      saved: existing.includes(other),
    })),
  };
};

/**
 * Points at an element or point. A hover sends the events a mouse would,
 * which are synthetic, so CSS :hover doesn't apply. An inspect sends none and
 * reports the selector the inspector would pick. Points are in screenshot pixels.
 */
export const usePointer = (action: PointerAction): PointerResult => {
  const { x, y, el } = resolveTarget(action);
  const point = {
    x: Math.round(x * devicePixelRatio),
    y: Math.round(y * devicePixelRatio),
  };

  if (action.kind === 'inspect') {
    return { ...point, ...inspectElement(el as HTMLElement, action.css ?? '') };
  }

  hover(el, x, y);
  return { ...point, selector: getSelector(el as HTMLElement) };
};
