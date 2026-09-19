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

import { Rect, Dimensions } from './utils';
import { LayoutProperty } from './types';

// https://dev.to/kingdaro/indexing-objects-in-typescript-1cgi
function hasKey<O extends Record<string, unknown>>(
  obj: O,
  key: string | number | symbol
): key is keyof O {
  return key in obj;
}

// Fixed to roughly match Chrome devtools, deliberately independent of
// Stylebot's own active theme.
const overlayStyles = {
  background: 'rgba(120, 170, 210, 0.7)',
  padding: 'rgba(77, 200, 0, 0.3)',
  margin: 'rgba(255, 155, 0, 0.3)',
  border: 'rgba(255, 200, 50, 0.3)',
};

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

/**
 * The devtools-style box drawn over one element: nested margin, border,
 * padding and content layers.
 */
export default class OverlayRect {
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

  remove(): void {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
  }

  /**
   * Makes the rect swallow the pointer instead of letting it through to
   * the element beneath, so clicks stay in this document rather than
   * reaching content (e.g. an iframe's ad) the highlighter can't intercept.
   */
  shield(on: boolean): void {
    this.node.style.pointerEvents = on ? 'auto' : 'none';
  }

  update(box: Rect, dims: Dimensions, property?: LayoutProperty): void {
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
