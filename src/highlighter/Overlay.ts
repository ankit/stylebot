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

import OverlayRect from './OverlayRect';
import OverlayTip from './OverlayTip';
import {
  getElementDimensions,
  getNestedBoundingClientRect,
  Rect,
  Dimensions,
} from './utils';
import { Box, LayoutProperty, NextAncestorInfo } from './types';
import { CssDeclaration } from '@stylebot/types';

type Edges = { top: number; right: number; bottom: number; left: number };

type PickingOptions = {
  primary?: HTMLElement;
  nextAncestor?: NextAncestorInfo | null;
  styleCount?: number;
  declarations?: Array<CssDeclaration> | null;
  /**
   * A selector preview rather than picking an element — see
   * OverlayTip.updatePositionNextToPanel.
   */
  anchorToPanel?: boolean;
};

// A safety net against pathological cases, not a design choice.
const MAX_ELEMENTS = 1000;

const emptyEdges = (): Edges => ({
  top: Number.POSITIVE_INFINITY,
  right: Number.NEGATIVE_INFINITY,
  bottom: Number.NEGATIVE_INFINITY,
  left: Number.POSITIVE_INFINITY,
});

const isEmpty = (edges: Edges) => edges.left === Number.POSITIVE_INFINITY;

const extend = (target: Edges, box: Rect, dims: Dimensions) => {
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

const toBox = (edges: Edges): Box => ({
  top: edges.top,
  left: edges.left,
  height: edges.bottom - edges.top,
  width: edges.right - edges.left,
});

export default class Overlay {
  container: HTMLElement;
  mountRoot?: HTMLElement;
  tip: OverlayTip;
  rects: Array<OverlayRect>;

  /**
   * The tip is Vue-rendered into mountRoot so it inherits the editor's theme;
   * mountRoot is also kept so inspect() can find the editor panel within it.
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
    picking?: PickingOptions
  ): void {
    const primary = picking?.primary;
    const anchorToPanel = picking?.anchorToPanel ?? false;

    // A match that isn't rendered (display: none) has no box to outline;
    // drawing it would put an empty margin-only rect at the origin.
    const candidates = nodes.filter(
      node =>
        node.nodeType === Node.ELEMENT_NODE && node.getClientRects().length > 0
    ) as Array<HTMLElement>;

    // While picking, only the hovered element is highlighted; other
    // matches are reported via the tooltip's match count instead.
    const elements = primary ? [primary] : candidates.slice(0, MAX_ELEMENTS);

    // Beside the panel the card stands on its own, e.g. for a selector
    // that matches nothing right now (:hover) or is deliberately unboxed.
    if (elements.length === 0 && !anchorToPanel) {
      this.drawRects([], property);
      return;
    }

    const { outer, primaryEdges } = this.drawRects(elements, property, primary);

    if (property) {
      return;
    }

    this.tip.showSummary({
      name: cssSelector,
      showSelector: !anchorToPanel,
      // Shown for any picking/preview payload, not just active picking.
      matchCount: picking ? candidates.length : undefined,
      nextAncestor: picking?.nextAncestor,
      styleCount: picking?.styleCount,
      declarations: picking?.declarations,
    });

    const panelEl =
      this.mountRoot?.querySelector<HTMLElement>('.stylebot') ?? null;

    if (anchorToPanel) {
      this.tip.updatePositionNextToPanel(panelEl);
      return;
    }

    // Anchors to the primary element itself, not the union of every
    // match, so scattered matches don't fling the tooltip around.
    const anchor =
      primaryEdges && !isEmpty(primaryEdges) ? primaryEdges : outer;

    const docRect = getNestedBoundingClientRect(
      window.document.documentElement,
      window
    );

    const panelRect = panelEl?.getBoundingClientRect() ?? null;

    this.tip.updatePosition(
      toBox(anchor),
      {
        top: docRect.top + window.scrollY,
        left: docRect.left + window.scrollX,
        height: window.innerHeight,
        width: window.innerWidth,
      },
      panelRect && { left: panelRect.left, right: panelRect.right }
    );
  }

  /**
   * Draws one rect per element, reusing existing ones, and returns the
   * margin-inclusive edges of all of them and of `primary` alone.
   */
  drawRects(
    elements: Array<HTMLElement>,
    property?: LayoutProperty,
    primary?: HTMLElement
  ): { outer: Edges; primaryEdges: Edges | null } {
    while (this.rects.length > elements.length) {
      this.rects.pop()?.remove();
    }

    while (this.rects.length < elements.length) {
      this.rects.push(new OverlayRect(window.document, this.container));
    }

    const outer = emptyEdges();
    const primaryEdges = primary ? emptyEdges() : null;

    elements.forEach((element, index) => {
      const box = getNestedBoundingClientRect(element, window);
      const dims = getElementDimensions(element);

      extend(outer, box, dims);

      if (primaryEdges && element === primary) {
        extend(primaryEdges, box, dims);
      }

      this.rects[index].update(box, dims, property);
      this.rects[index].shield(element.tagName === 'IFRAME');
    });

    return { outer, primaryEdges };
  }
}
