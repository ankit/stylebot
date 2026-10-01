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

import OverlayHint from './OverlayHint';
import OverlayRect from './OverlayRect';
import OverlayTip from './OverlayTip';
import type { Rect, Dimensions } from './utils';
import { getElementDimensions, getNestedBoundingClientRect } from './utils';
import type { Box, LayoutProperty } from './types';

type Edges = { top: number; right: number; bottom: number; left: number };

type PickingOptions = {
  primary?: HTMLElement;
  ruleCount?: number;
};

// A safety net against pathological cases, not a design choice.
const MAX_ELEMENTS = 1000;

const emptyEdges = (): Edges => ({
  top: Number.POSITIVE_INFINITY,
  right: Number.NEGATIVE_INFINITY,
  bottom: Number.NEGATIVE_INFINITY,
  left: Number.POSITIVE_INFINITY,
});

const TILED_THRESHOLD = 8;

const visibleBoxes = (elements: Array<HTMLElement>): Array<Rect> =>
  elements
    .map(element => getNestedBoundingClientRect(element, window))
    .filter(
      box =>
        box.top + box.height > 0 &&
        box.top < window.innerHeight &&
        box.left + box.width > 0 &&
        box.left < window.innerWidth
    );

const touches = (a: Rect, b: Rect): boolean =>
  a.left <= b.left + b.width + 1 &&
  b.left <= a.left + a.width + 1 &&
  a.top <= b.top + b.height + 1 &&
  b.top <= a.top + a.height + 1;

/**
 * How many boxes touch or overlap at least one other.
 */
const countTouching = (boxes: Array<Rect>): number =>
  boxes.filter((box, i) =>
    boxes.some((other, j) => i !== j && touches(box, other))
  ).length;

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
  hints: Array<OverlayHint>;

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
    this.hints = [];
  }

  remove(): void {
    this.tip?.remove();
    this.rects.forEach(rect => {
      rect.remove();
    });

    this.rects.length = 0;
    this.hints.forEach(hint => hint.remove());
    this.hints.length = 0;
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
   * Tints every match of a selector previewed from the panel, with no card.
   */
  outline(nodes: Array<HTMLElement>): void {
    this.drawRects([]);
    this.drawHints(nodes.slice(0, MAX_ELEMENTS), true);
  }

  inspect(
    nodes: Array<HTMLElement>,
    cssSelector: string,
    property?: LayoutProperty,
    picking?: PickingOptions
  ): void {
    const primary = picking?.primary;

    const candidates = nodes.filter(
      node => node.nodeType === Node.ELEMENT_NODE
    ) as Array<HTMLElement>;

    // Only a hovered element gets the full box; every other match gets a
    // faint tint.
    const hinting = !property && primary !== undefined;
    let elements: Array<HTMLElement> = [];
    if (primary) {
      elements = [primary];
    } else if (!hinting) {
      elements = candidates.slice(0, MAX_ELEMENTS);
    }
    const others = hinting
      ? candidates.filter(node => node !== primary).slice(0, MAX_ELEMENTS)
      : [];
    // Matches that tile together (stacked rows) would tint the page into one
    // sheet, so only the hovered one is highlighted.
    const tiled =
      primary !== undefined &&
      countTouching(visibleBoxes([primary, ...others])) > TILED_THRESHOLD;
    this.drawHints(tiled ? [] : others);

    if (elements.length === 0) {
      this.drawRects([], property);
      return;
    }

    const { outer, primaryEdges } = this.drawRects(elements, property, primary);

    if (property) {
      return;
    }

    const tip = this.ensureTip();

    tip.showSummary({
      name: cssSelector,
      ruleCount: picking?.ruleCount ?? 0,
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

    tip.updatePosition(
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
   * Tints each element that's in the viewport, reusing existing hints;
   * off-screen matches aren't drawn at all.
   */
  drawHints(elements: Array<HTMLElement>, strong = false): void {
    const boxes = visibleBoxes(elements);

    while (this.hints.length > boxes.length) {
      this.hints.pop()?.remove();
    }

    while (this.hints.length < boxes.length) {
      this.hints.push(new OverlayHint(window.document, this.container));
    }

    boxes.forEach((box, index) => this.hints[index].update(box, strong));
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
