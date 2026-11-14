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
import type { Rect, Dimensions } from './utils';
import { getElementDimensions, getNestedBoundingClientRect } from './utils';
import type { Box, LayoutProperty } from './types';

type Edges = { top: number; right: number; bottom: number; left: number };

type PickingOptions = {
  primary?: HTMLElement;
  size?: string;
};

// A safety net against pathological cases, not a design choice.
const MAX_ELEMENTS = 1000;

// How strongly a previewed selector's matches are boxed, next to a hovered
// element's full-strength box.
const MATCHES_OPACITY = '0.6';

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
  tip: OverlayTip | null;
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
    this.container.style.direction = 'ltr';
    doc.body.appendChild(this.container);

    this.mountRoot = mountRoot;
    this.tip = null;
    this.rects = [];
  }

  remove(): void {
    this.tip?.remove();
    this.rects.forEach(rect => {
      rect.remove();
    });

    this.rects.length = 0;
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Created on first use, so an outline-only overlay never mounts a card.
   */
  ensureTip(): OverlayTip {
    if (!this.tip) {
      this.tip = new OverlayTip(this.mountRoot ?? this.container);
    }

    return this.tip;
  }

  /**
   * Boxes every match of a selector previewed from the panel, with no card,
   * fainter than a hovered element's so the matches' content shows through.
   */
  outline(nodes: Array<HTMLElement>): void {
    this.drawRects(nodes.slice(0, MAX_ELEMENTS));
    this.rects.forEach(rect => {
      rect.node.style.opacity = MATCHES_OPACITY;
    });
  }

  inspect(
    nodes: Array<HTMLElement>,
    label: Array<string>,
    property?: LayoutProperty,
    picking?: PickingOptions
  ): void {
    const primary = picking?.primary;

    const candidates = nodes.filter(
      node => node.nodeType === Node.ELEMENT_NODE
    ) as Array<HTMLElement>;

    // A hovered element is boxed alone, not with the selector's other matches.
    const elements = primary ? [primary] : candidates.slice(0, MAX_ELEMENTS);

    if (elements.length === 0) {
      this.drawRects([], property);
      return;
    }

    const { outer, primaryEdges } = this.drawRects(elements, property, primary);
    this.rects.forEach(rect => {
      rect.node.style.opacity = '';
    });

    if (property) {
      return;
    }

    const tip = this.ensureTip();

    tip.showSummary({
      nameParts: label,
      size: picking?.size ?? '',
    });

    const panelEl =
      this.mountRoot?.querySelector<HTMLElement>('.stylebot') ?? null;

    // Anchors to the primary element itself, not the union of every
    // match, so scattered matches don't fling the tooltip around.
    const anchor =
      primaryEdges && !isEmpty(primaryEdges) ? primaryEdges : outer;

    const docRect = getNestedBoundingClientRect(
      window.document.documentElement,
      window
    );

    const panelRect = panelEl?.getBoundingClientRect() ?? null;
    // The visual viewport leaves out the page's scrollbars, which clip a
    // fixed card that runs under them.
    const viewport = window.visualViewport;

    tip.updatePosition(
      toBox(anchor),
      {
        top: docRect.top + window.scrollY,
        left: docRect.left + window.scrollX,
        height: viewport?.height ?? window.innerHeight,
        width: viewport?.width ?? window.innerWidth,
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
