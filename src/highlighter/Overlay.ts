/**
 * Forked from
 * https://github.com/facebook/react/blob/e706721490e50d0bd6af2cd933dbf857fd8b61ed/packages/react-devtools-shared/src/backend/views/Highlighter/Overlay.js
 */

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Vue from 'vue';

import {
  getElementDimensions,
  getNestedBoundingClientRect,
  Rect,
  Dimensions,
} from './utils';
import InspectorCard from './InspectorCard.vue';

type Box = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type LayoutProperty = 'margin' | 'border' | 'padding' | 'height' | 'width';

// https://dev.to/kingdaro/indexing-objects-in-typescript-1cgi
function hasKey<O>(obj: O, key: string | number | symbol): key is keyof O {
  return key in obj;
}

// OverlayRect's colors are fixed to roughly match Chrome devtools,
// deliberately independent of Stylebot's own active theme.

class OverlayRect {
  node: HTMLElement;
  border: HTMLElement;
  padding: HTMLElement;
  content: HTMLElement;

  constructor(doc: Document, container: HTMLElement) {
    this.node = doc.createElement('div');
    this.border = doc.createElement('div');
    this.padding = doc.createElement('div');
    this.content = doc.createElement('div');

    this.border.style.borderColor = overlayStyles.border;
    this.padding.style.borderColor = overlayStyles.padding;
    this.content.style.backgroundColor = overlayStyles.background;

    Object.assign(this.node.style, {
      borderColor: overlayStyles.margin,
      pointerEvents: 'none',
      position: 'fixed',
    });

    this.node.style.zIndex = '10000000';

    this.node.appendChild(this.border);
    this.border.appendChild(this.padding);
    this.padding.appendChild(this.content);

    container.appendChild(this.node);
  }

  remove() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
  }

  update(box: Rect, dims: Dimensions, property?: LayoutProperty) {
    boxWrap(dims, 'margin', this.node);
    boxWrap(dims, 'border', this.border);
    boxWrap(dims, 'padding', this.padding);

    Object.assign(this.content.style, {
      height:
        box.height -
        dims.borderTop -
        dims.borderBottom -
        dims.paddingTop -
        dims.paddingBottom +
        'px',
      width:
        box.width -
        dims.borderLeft -
        dims.borderRight -
        dims.paddingLeft -
        dims.paddingRight +
        'px',
    });

    this.content.style.backgroundColor = overlayStyles.background;

    if (property) {
      if (property !== 'height' && property !== 'width') {
        this.content.style.backgroundColor = 'transparent';
      }

      if (property !== 'margin') {
        this.node.style.borderColor = 'transparent';
      }

      if (property !== 'padding') {
        this.padding.style.borderColor = 'transparent';
      }

      if (property !== 'border') {
        this.border.style.borderColor = 'transparent';
      }
    }

    Object.assign(this.node.style, {
      top: box.top - dims.marginTop + 'px',
      left: box.left - dims.marginLeft + 'px',
    });
  }
}

type NextAncestorInfo = {
  label: string;
  styleCount: number;
};

type StylebotDeclaration = { property: string; value: string };

/**
 * The instance shape InspectorCard.vue exposes (shims.vue.d.ts types
 * `.vue` imports generically), for what's driven imperatively here.
 */
type InspectorCardInstance = Vue & {
  name: string;
  matchCount: number | undefined;
  styleCount: number;
  declarations: Array<StylebotDeclaration> | null;
  nextAncestor: NextAncestorInfo | null;
  top: number;
  left: number;
  placement: 'above' | 'below' | null;
};

/**
 * A thin bridge to InspectorCard.vue, mounted into the editor's own
 * theme-provider subtree so it inherits real theme CSS/fonts — unlike
 * OverlayRect, which stays native in document.body.
 */
class OverlayTip {
  vm: InspectorCardInstance;

  constructor(container: HTMLElement) {
    const mountEl = document.createElement('div');
    container.appendChild(mountEl);

    this.vm = new InspectorCard().$mount(mountEl) as InspectorCardInstance;
  }

  remove() {
    this.vm.$destroy();
    this.vm.$el.parentNode?.removeChild(this.vm.$el);
  }

  showSummary(
    name: string,
    matchCount: number | undefined,
    nextAncestor: NextAncestorInfo | null | undefined,
    styleCount: number | undefined,
    declarations: Array<StylebotDeclaration> | null | undefined
  ) {
    this.vm.name = name;
    this.vm.matchCount = matchCount;
    this.vm.nextAncestor = nextAncestor ?? null;
    this.vm.styleCount = styleCount ?? 0;
    this.vm.declarations = declarations ?? null;
  }

  /**
   * avoidHorizontal (the editor panel's viewport-relative left/right, if
   * given) shifts the card to whichever side has more room when it would
   * otherwise land on top of the panel.
   */
  updatePosition(
    dims: Box,
    bounds: Box,
    avoidHorizontal?: { left: number; right: number } | null
  ) {
    // Vue patches the content set above asynchronously — wait a tick so
    // the size measured below reflects it, not the previous hover.
    this.vm.$nextTick(() => {
      const tipRect = (this.vm.$el as HTMLElement).getBoundingClientRect();
      const tipPos = findTipPos(dims, bounds, {
        width: tipRect.width,
        height: tipRect.height,
      });

      let left = parseFloat(tipPos.style.left);

      if (avoidHorizontal) {
        const overlaps =
          left < avoidHorizontal.right &&
          left + tipRect.width > avoidHorizontal.left;

        if (overlaps) {
          const margin = 8;
          const spaceLeft = avoidHorizontal.left;
          const spaceRight = window.innerWidth - avoidHorizontal.right;

          left =
            spaceLeft >= tipRect.width + margin || spaceLeft > spaceRight
              ? avoidHorizontal.left - tipRect.width - margin
              : avoidHorizontal.right + margin;

          left = Math.max(
            margin,
            Math.min(left, window.innerWidth - tipRect.width - margin)
          );
        }
      }

      this.vm.top = parseFloat(tipPos.style.top);
      this.vm.left = left;
      this.vm.placement = tipPos.placement;
    });
  }

  /**
   * For a selector preview (typing/hovering in the editor) rather than
   * picking an element — sits beside the panel instead of near wherever
   * the selector happens to match, which may be scattered or off-screen.
   */
  updatePositionNextToPanel(panelEl: HTMLElement | null) {
    this.vm.$nextTick(() => {
      const tipRect = (this.vm.$el as HTMLElement).getBoundingClientRect();
      const panelRect = panelEl?.getBoundingClientRect();
      const margin = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left: number;
      let top: number;

      if (panelRect) {
        // Prefer whichever side of the panel has more open space.
        const spaceLeft = panelRect.left;
        const spaceRight = viewportWidth - panelRect.right;

        left =
          spaceLeft >= tipRect.width + margin || spaceLeft > spaceRight
            ? panelRect.left - tipRect.width - margin
            : panelRect.right + margin;

        top = panelRect.top;
      } else {
        // Panel not found (shouldn't normally happen) — a corner beats
        // leaving the card wherever it last was.
        left = viewportWidth - tipRect.width - margin;
        top = margin;
      }

      this.vm.left = Math.max(
        margin,
        Math.min(left, viewportWidth - tipRect.width - margin)
      );
      this.vm.top = Math.max(
        margin,
        Math.min(top, viewportHeight - tipRect.height - margin)
      );
      this.vm.placement = null;
    });
  }
}

export default class Overlay {
  container: HTMLElement;
  mountRoot?: HTMLElement;
  tip: OverlayTip;
  rects: Array<OverlayRect>;

  /**
   * Highlight rects stay native in this.container; the tip is Vue-rendered
   * into mountRoot when given, so it inherits the editor's real theme.
   * mountRoot is kept (not just handed to OverlayTip) so inspect() can
   * also find the editor panel within it.
   */
  constructor(mountRoot?: HTMLElement) {
    const doc = window.document;

    this.container = doc.createElement('div');
    this.container.id = 'stylebot-overlay';
    this.container.style.zIndex = '10000000';
    doc.body.appendChild(this.container);

    this.mountRoot = mountRoot;
    this.tip = new OverlayTip(mountRoot ?? this.container);
    this.rects = [];
  }

  remove(): void {
    this.tip.remove();
    this.rects.forEach(rect => {
      rect.remove();
    });

    this.rects.length = 0;
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  inspect(
    nodes: Array<HTMLElement>,
    cssSelector: string,
    property?: LayoutProperty,
    picking?: {
      primary?: HTMLElement;
      nextAncestor?: NextAncestorInfo | null;
      styleCount?: number;
      declarations?: Array<StylebotDeclaration> | null;
      /**
       * A selector preview rather than picking an element — see
       * OverlayTip.updatePositionNextToPanel.
       */
      anchorToPanel?: boolean;
    }
  ): void {
    const primary = picking?.primary;
    const nextAncestor = picking?.nextAncestor;
    const styleCount = picking?.styleCount;
    const declarations = picking?.declarations;
    const anchorToPanel = picking?.anchorToPanel ?? false;

    // A safety net against pathological cases, not a design choice.
    const maxElements = 1000;

    const candidates = nodes.filter(
      node => node.nodeType === Node.ELEMENT_NODE
    ) as Array<HTMLElement>;

    const rawMatchCount = candidates.length;

    // While picking, only the hovered element is highlighted; other
    // matches are reported via the tooltip's match count instead.
    const elements = primary ? [primary] : candidates.slice(0, maxElements);

    while (this.rects.length > elements.length) {
      const rect = this.rects.pop();
      rect?.remove();
    }

    if (elements.length === 0) {
      return;
    }

    while (this.rects.length < elements.length) {
      this.rects.push(new OverlayRect(window.document, this.container));
    }

    const emptyBox = () => ({
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
    });

    const outerBox = emptyBox();
    const primaryBox = primary ? emptyBox() : null;

    const accumulate = (
      target: ReturnType<typeof emptyBox>,
      box: Rect,
      dims: Dimensions
    ) => {
      target.top = Math.min(target.top, box.top - dims.marginTop);
      target.right = Math.max(
        target.right,
        box.left + box.width + dims.marginRight
      );
      target.bottom = Math.max(
        target.bottom,
        box.top + box.height + dims.marginBottom
      );
      target.left = Math.min(target.left, box.left - dims.marginLeft);
    };

    elements.forEach((element, index) => {
      const box = getNestedBoundingClientRect(element, window);
      const dims = getElementDimensions(element);

      accumulate(outerBox, box, dims);

      if (primaryBox && element === primary) {
        accumulate(primaryBox, box, dims);
      }

      this.rects[index].update(box, dims, property);
    });

    if (!property) {
      this.tip.showSummary(
        cssSelector,
        // Shown for any picking/preview payload, not just active picking.
        picking ? rawMatchCount : undefined,
        nextAncestor,
        styleCount,
        declarations
      );

      const panelEl =
        this.mountRoot?.querySelector<HTMLElement>('.stylebot') ?? null;

      if (anchorToPanel) {
        this.tip.updatePositionNextToPanel(panelEl);
      } else {
        // Anchors to the primary element itself, not the union of every
        // match, so scattered matches don't fling the tooltip around.
        const tipBox =
          primaryBox && primaryBox.left !== Number.POSITIVE_INFINITY
            ? primaryBox
            : outerBox;

        const tipBounds = getNestedBoundingClientRect(
          window.document.documentElement,
          window
        );

        const panelRect = panelEl?.getBoundingClientRect() ?? null;

        this.tip.updatePosition(
          {
            top: tipBox.top,
            left: tipBox.left,
            height: tipBox.bottom - tipBox.top,
            width: tipBox.right - tipBox.left,
          },
          {
            top: tipBounds.top + window.scrollY,
            left: tipBounds.left + window.scrollX,
            height: window.innerHeight,
            width: window.innerWidth,
          },
          panelRect && { left: panelRect.left, right: panelRect.right }
        );
      }
    }
  }
}

/**
 * Prefers placing the tip below the element, above only if there's no
 * room below, matching the reference design.
 */
function findTipPos(
  dims: Box,
  bounds: Box,
  tipSize: { width: number; height: number }
) {
  const tipHeight = Math.max(tipSize.height, 20);
  const tipWidth = Math.max(tipSize.width, 60);
  const margin = 8;

  let top;
  let placement: 'above' | 'below' | null;

  if (
    dims.top + dims.height + tipHeight + margin <=
    bounds.top + bounds.height
  ) {
    top = dims.top + dims.height + margin;
    placement = 'below';
  } else if (dims.top - tipHeight - margin >= bounds.top) {
    top = dims.top - tipHeight - margin;
    placement = 'above';
  } else {
    top = bounds.top + margin;
    placement = null;
  }

  // Flush with the element's left edge, not offset by `margin` (that's a
  // vertical gap only).
  let left = dims.left;
  if (dims.left < bounds.left) {
    left = bounds.left + margin;
  }
  if (dims.left + tipWidth > bounds.left + bounds.width) {
    left = bounds.left + bounds.width - tipWidth - margin;
  }

  return {
    style: { top: `${top}px`, left: `${left}px` },
    placement,
  };
}

function boxWrap(dims: Dimensions, what: string, node: HTMLElement) {
  const topIndex = `${what}Top`;
  const leftIndex = `${what}Left`;
  const rightIndex = `${what}Right`;
  const bottomIndex = `${what}Bottom`;

  if (
    hasKey<Dimensions>(dims, topIndex) &&
    hasKey<Dimensions>(dims, leftIndex) &&
    hasKey<Dimensions>(dims, rightIndex) &&
    hasKey<Dimensions>(dims, bottomIndex)
  ) {
    Object.assign(node.style, {
      borderTopWidth: dims[topIndex] + 'px',
      borderLeftWidth: dims[leftIndex] + 'px',
      borderRightWidth: dims[rightIndex] + 'px',
      borderBottomWidth: dims[bottomIndex] + 'px',
      borderStyle: 'solid',
    });
  }
}

const overlayStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
};
