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

import {
  getElementDimensions,
  getNestedBoundingClientRect,
  Rect,
  Dimensions,
} from './utils';

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

// Note that the Overlay components are not affected by the active Theme,
// because they highlight elements in the main Chrome window (outside of devtools).
// The colors below were chosen to roughly match those used by Chrome devtools.

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
    if (!property || property === 'margin') {
      boxWrap(dims, 'margin', this.node);
    }

    if (!property || property === 'border') {
      boxWrap(dims, 'border', this.border);
    }

    if (!property || property === 'padding') {
      boxWrap(dims, 'padding', this.padding);
    }

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

    if (property && property !== 'height' && property !== 'width') {
      this.content.style.backgroundColor = 'transparent';
    }

    Object.assign(this.node.style, {
      top: box.top - dims.marginTop + 'px',
      left: box.left - dims.marginLeft + 'px',
    });
  }
}

class OverlayTip {
  tip: HTMLElement;
  nameSpan: HTMLElement;
  dimSpan: HTMLElement;

  constructor(doc: Document, container: HTMLElement) {
    this.tip = doc.createElement('div');

    Object.assign(this.tip.style, {
      display: 'flex',
      flexFlow: 'row nowrap',
      backgroundColor: '#333740',
      borderRadius: '2px',
      fontFamily:
        '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
      fontWeight: 'bold',
      padding: '3px 5px',
      pointerEvents: 'none',
      position: 'fixed',
      fontSize: '12px',
      whiteSpace: 'nowrap',
    });

    this.nameSpan = doc.createElement('span');
    this.tip.appendChild(this.nameSpan);

    Object.assign(this.nameSpan.style, {
      color: '#ee78e6',
      borderRight: '1px solid #aaaaaa',
      paddingRight: '0.5rem',
      marginRight: '0.5rem',
    });

    this.dimSpan = doc.createElement('span');
    this.tip.appendChild(this.dimSpan);

    Object.assign(this.dimSpan.style, {
      color: '#d7d7d7',
    });

    this.tip.style.zIndex = '10000000';
    container.appendChild(this.tip);
  }

  remove() {
    if (this.tip.parentNode) {
      this.tip.parentNode.removeChild(this.tip);
    }
  }

  updateText(name: string, width: number, height: number) {
    this.nameSpan.textContent = name;
    this.dimSpan.textContent =
      Math.round(width) + 'px × ' + Math.round(height) + 'px';
  }

  updatePosition(dims: Box, bounds: Box) {
    const tipRect = this.tip.getBoundingClientRect();
    const tipPos = findTipPos(dims, bounds, {
      width: tipRect.width,
      height: tipRect.height,
    });

    Object.assign(this.tip.style, tipPos.style);
  }
}

export default class Overlay {
  container: HTMLElement;
  tip: OverlayTip;
  rects: Array<OverlayRect>;

  constructor() {
    const doc = window.document;

    this.container = doc.createElement('div');
    this.container.style.zIndex = '10000000';

    this.tip = new OverlayTip(doc, this.container);
    this.rects = [];

    doc.body.appendChild(this.container);
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
    property?: LayoutProperty
  ): void {
    // We can't get the size of text nodes or comment nodes.
    // todo: until we can performantly support displaying an overlay
    // for a large number of elements, set an upper bound
    const maxElements = 100;

    const elements = nodes
      .filter(node => node.nodeType === Node.ELEMENT_NODE)
      .slice(0, maxElements);

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

    const outerBox = {
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
    };

    elements.forEach((element, index) => {
      const box = getNestedBoundingClientRect(element, window);
      const dims = getElementDimensions(element);

      outerBox.top = Math.min(outerBox.top, box.top - dims.marginTop);
      outerBox.right = Math.max(
        outerBox.right,
        box.left + box.width + dims.marginRight
      );
      outerBox.bottom = Math.max(
        outerBox.bottom,
        box.top + box.height + dims.marginBottom
      );
      outerBox.left = Math.min(outerBox.left, box.left - dims.marginLeft);

      const rect = this.rects[index];
      rect.update(box, dims, property);
    });

    if (!property) {
      this.tip.updateText(
        cssSelector,
        outerBox.right - outerBox.left,
        outerBox.bottom - outerBox.top
      );

      const tipBounds = getNestedBoundingClientRect(
        window.document.documentElement,
        window
      );

      this.tip.updatePosition(
        {
          top: outerBox.top,
          left: outerBox.left,
          height: outerBox.bottom - outerBox.top,
          width: outerBox.right - outerBox.left,
        },
        {
          top: tipBounds.top + window.scrollY,
          left: tipBounds.left + window.scrollX,
          height: window.innerHeight,
          width: window.innerWidth,
        }
      );
    }
  }
}

function findTipPos(
  dims: Box,
  bounds: Box,
  tipSize: { width: number; height: number }
) {
  const tipHeight = Math.max(tipSize.height, 20);
  const tipWidth = Math.max(tipSize.width, 60);
  const margin = 5;

  let top;
  if (dims.top + dims.height + tipHeight <= bounds.top + bounds.height) {
    if (dims.top + dims.height < bounds.top + 0) {
      top = bounds.top + margin;
    } else {
      top = dims.top + dims.height + margin;
    }
  } else if (dims.top - tipHeight <= bounds.top + bounds.height) {
    if (dims.top - tipHeight - margin < bounds.top + margin) {
      top = bounds.top + margin;
    } else {
      top = dims.top - tipHeight - margin;
    }
  } else {
    top = bounds.top + bounds.height - tipHeight - margin;
  }

  let left = dims.left + margin;
  if (dims.left < bounds.left) {
    left = bounds.left + margin;
  }
  if (dims.left + tipWidth > bounds.left + bounds.width) {
    left = bounds.left + bounds.width - tipWidth - margin;
  }

  return {
    style: { top: `${top}px`, left: `${left}px` },
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
