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

// A translucent fill is useful for a normal-sized element, but once the
// highlighted box covers most of the viewport (e.g. a container the size
// of the whole page) it just tints everything and reads as broken rather
// than as a highlight — drop the fill and keep only the outline.
function coversViewport(box: { width: number; height: number }): boolean {
  const viewportArea = window.innerWidth * window.innerHeight;
  return viewportArea > 0 && (box.width * box.height) / viewportArea > 0.6;
}

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

    this.content.style.backgroundColor = coversViewport(box)
      ? 'transparent'
      : overlayStyles.background;

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


type AncestorInfo = {
  label: string;
  matchCount: number;
  styled: boolean;
};

type StylebotDeclaration = { property: string; value: string };

// Colors and type scale lifted from the "Inspect Readout" design (variant
// 8a, "more than one ancestor") — claude.ai/design project
// e089904e-9efa-456b-80df-0139baf91935.
const READOUT = {
  accent: '#2a5fd6', // the "styled" dot only
  ink: '#191b1f', // class/id parts, detail values
  muted: '#5f6672', // tag parts, detail labels, "styled" text, ancestor counts
  faint: '#8b919c', // ANCESTORS section label
  hollowDot: '#d3d6dd', // dot outline for an unstyled ancestor
  border: '#e4e6ea',
  rule: '#ecedf0',
  keycapBorder: '#dfe1e6',
  keycapBg: '#f7f8fa',
};

// Friendlier labels for the declaration rows, matching Stylebot's own
// property-group naming (Text/Color/Layout/Border) where one exists —
// anything not listed here just falls back to its raw CSS property name.
const PROPERTY_LABELS: Record<string, string> = {
  color: 'Color',
  'background-color': 'Background',
  'font-family': 'Font',
  'font-size': 'Size',
  'font-weight': 'Weight',
  'font-style': 'Style',
  'line-height': 'Line height',
  'text-align': 'Alignment',
  'text-decoration': 'Decoration',
  'text-transform': 'Transform',
  width: 'Width',
  height: 'Height',
  margin: 'Margin',
  padding: 'Padding',
  border: 'Border',
  display: 'Display',
  visibility: 'Visibility',
};

type SelectorPart = { text: string; kind: 'tag' | 'class' | 'id' };

// Splits a single compound selector ("span.titleline", "td.title#row")
// into tag/class/id parts so the tag can be de-emphasized relative to the
// class/id, which is usually the part worth scanning for. A multi-token
// descendant selector ("td span a", from the tag-chain fallback) isn't one
// element's parts, so it's left as plain text rather than guessed at.
function parseSelectorParts(selector: string): Array<SelectorPart> | null {
  if (/\s/.test(selector)) {
    return null;
  }

  const parts: Array<SelectorPart> = [];
  const regex = /(^[a-zA-Z][\w-]*)|(\.[\w-]+)|(#[\w-]+)/g;
  let match: RegExpExecArray | null;
  let consumed = 0;

  while ((match = regex.exec(selector))) {
    const text = match[0];
    const kind = text.startsWith('#') ? 'id' : text.startsWith('.') ? 'class' : 'tag';
    parts.push({ text, kind });
    consumed += text.length;
  }

  return consumed === selector.length && parts.length > 0 ? parts : null;
}

// Weight/color per part, not a hue per part — class and id both read as
// "the specific bit", the tag as background context.
const PART_COLORS: Record<SelectorPart['kind'], string> = {
  tag: READOUT.muted,
  class: READOUT.ink,
  id: READOUT.ink,
};

const ARROW_SIZE = 11;

class OverlayTip {
  tip: HTMLElement;
  arrow: HTMLElement;

  currentRow: HTMLElement;
  currentDot: HTMLElement;
  nameSpan: HTMLElement;
  styledBadge: HTMLElement;
  declarationsContainer: HTMLElement;

  matchesRow: HTMLElement;
  matchesValueSpan: HTMLElement;

  ancestorsDivider: HTMLElement;
  ancestorsContainer: HTMLElement;

  constructor(doc: Document, container: HTMLElement) {
    this.tip = doc.createElement('div');

    Object.assign(this.tip.style, {
      display: 'flex',
      flexFlow: 'column nowrap',
      backgroundColor: '#fff',
      border: `1px solid ${READOUT.border}`,
      borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
      fontFamily:
        '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
      padding: '12px 14px 13px',
      // The whole card follows the cursor while inspecting, so nothing in
      // it can be hovered or clicked — climbing to the parent is done with
      // the keyboard (ArrowUp/ArrowLeft), not by clicking a row here.
      pointerEvents: 'none',
      position: 'fixed',
      fontSize: '11px',
      lineHeight: '1.35',
      whiteSpace: 'nowrap',
      color: READOUT.ink,
    });

    this.arrow = doc.createElement('div');
    Object.assign(this.arrow.style, {
      position: 'absolute',
      width: `${ARROW_SIZE}px`,
      height: `${ARROW_SIZE}px`,
      left: '16px',
      display: 'none',
      backgroundColor: '#fff',
      borderRadius: '2px',
      transform: 'rotate(45deg)',
    });
    this.tip.appendChild(this.arrow);

    const current = this.buildIdentityRow();
    this.currentRow = current.row;
    this.currentDot = current.dot;
    this.nameSpan = current.name;
    Object.assign(this.nameSpan.style, {
      fontWeight: 'bold',
      fontSize: '12.5px',
      lineHeight: '1.25',
    });
    this.tip.appendChild(this.currentRow);

    this.styledBadge = doc.createElement('span');
    this.styledBadge.textContent = 'styled';
    Object.assign(this.styledBadge.style, {
      display: 'none',
      flex: 'none',
      fontSize: '10px',
      lineHeight: '1.25',
      color: READOUT.muted,
    });
    this.currentRow.appendChild(this.styledBadge);

    const details = doc.createElement('div');
    Object.assign(details.style, {
      display: 'flex',
      flexFlow: 'column nowrap',
      gap: '4px',
      marginTop: '9px',
    });
    this.tip.appendChild(details);

    this.declarationsContainer = doc.createElement('div');
    Object.assign(this.declarationsContainer.style, {
      display: 'flex',
      flexFlow: 'column nowrap',
      gap: '4px',
    });
    details.appendChild(this.declarationsContainer);

    const matches = this.buildDetailRow('Matches');
    this.matchesRow = matches.row;
    this.matchesValueSpan = matches.value;
    Object.assign(this.matchesRow.style, { display: 'none' });
    details.appendChild(this.matchesRow);

    // A labeled hairline, not a peer row — ancestors are their own section,
    // not more detail about the element above it. The "↑" is a keycap
    // hint (press ArrowUp to climb), not a clickable control.
    this.ancestorsDivider = doc.createElement('div');
    Object.assign(this.ancestorsDivider.style, {
      display: 'none',
      flexFlow: 'row nowrap',
      alignItems: 'center',
      gap: '9px',
      margin: '13px 0 8px',
    });
    this.tip.appendChild(this.ancestorsDivider);

    const ancestorsLabel = doc.createElement('div');
    ancestorsLabel.textContent = 'ANCESTORS';
    Object.assign(ancestorsLabel.style, {
      fontSize: '10px',
      lineHeight: '1.4',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: READOUT.faint,
    });
    this.ancestorsDivider.appendChild(ancestorsLabel);

    const ancestorsKeycap = doc.createElement('div');
    ancestorsKeycap.textContent = '↑';
    Object.assign(ancestorsKeycap.style, {
      flex: 'none',
      padding: '1px 5px 2px',
      borderRadius: '4px',
      border: `1px solid ${READOUT.keycapBorder}`,
      backgroundColor: READOUT.keycapBg,
      fontSize: '10px',
      lineHeight: '1.4',
      color: READOUT.muted,
    });
    this.ancestorsDivider.appendChild(ancestorsKeycap);

    const ancestorsRule = doc.createElement('div');
    Object.assign(ancestorsRule.style, {
      flex: '1',
      height: '1px',
      backgroundColor: READOUT.rule,
    });
    this.ancestorsDivider.appendChild(ancestorsRule);

    // Rebuilt on every hover — length varies (0 to a few levels), and each
    // row steps out one more indent than the last, nearest ancestor first.
    this.ancestorsContainer = doc.createElement('div');
    Object.assign(this.ancestorsContainer.style, {
      display: 'none',
      flexFlow: 'column nowrap',
      gap: '5px',
    });
    this.tip.appendChild(this.ancestorsContainer);

    // Above OverlayRect's z-index (10000000) — both are appended to the
    // same container and OverlayRect instances are added later (per
    // hover), so without a higher z-index here the highlight box's own
    // translucent fill would paint over the tip and tint it.
    this.tip.style.zIndex = '10000001';
    container.appendChild(this.tip);
  }

  // A bulleted selector name that takes up the remaining row width (with
  // ellipsis for long selectors) — the shape shared by the current
  // element's row and the parent's row. The dot is a "styled" indicator,
  // not decoration — hidden unless the caller turns it on.
  private buildIdentityRow(): {
    row: HTMLElement;
    dot: HTMLElement;
    name: HTMLElement;
  } {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      flexFlow: 'row nowrap',
      alignItems: 'center',
      gap: '8px',
    });

    const dot = document.createElement('span');
    Object.assign(dot.style, {
      display: 'none',
      width: '7px',
      height: '7px',
      borderRadius: '3.5px',
      backgroundColor: READOUT.accent,
      flexShrink: '0',
    });
    row.appendChild(dot);

    const name = document.createElement('span');
    Object.assign(name.style, {
      flex: '1',
      minWidth: '0',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
    row.appendChild(name);

    return { row, dot, name };
  }

  // A label/value pair — "Font", "Matches", and every parsed declaration
  // share this shape.
  private buildDetailRow(label: string): { row: HTMLElement; value: HTMLElement } {
    const row = document.createElement('div');
    Object.assign(row.style, {
      display: 'flex',
      flexFlow: 'row nowrap',
      alignItems: 'baseline',
      gap: '12px',
    });

    const labelEl = document.createElement('div');
    labelEl.textContent = label;
    Object.assign(labelEl.style, { flex: '1', color: READOUT.muted });
    row.appendChild(labelEl);

    const value = document.createElement('div');
    Object.assign(value.style, { color: READOUT.ink });
    row.appendChild(value);

    return { row, value };
  }

  // Colors each tag/class/id part of a compound selector on its own hue;
  // falls back to plain text for anything parseSelectorParts can't split.
  private renderSelectorName(target: HTMLElement, selector: string) {
    target.innerHTML = '';
    const parts = parseSelectorParts(selector);

    if (!parts) {
      target.textContent = selector;
      return;
    }

    parts.forEach(part => {
      const span = document.createElement('span');
      span.textContent = part.text;
      span.style.color = PART_COLORS[part.kind];
      target.appendChild(span);
    });
  }

  remove() {
    if (this.tip.parentNode) {
      this.tip.parentNode.removeChild(this.tip);
    }
  }

  showSummary(
    name: string,
    matchCount?: number,
    ancestors?: Array<AncestorInfo>,
    declarations?: Array<StylebotDeclaration> | null
  ) {
    this.renderSelectorName(this.nameSpan, name);

    const isStyled = !!declarations && declarations.length > 0;
    this.currentDot.style.display = isStyled ? 'inline-block' : 'none';
    this.styledBadge.style.display = isStyled ? 'inline' : 'none';

    this.declarationsContainer.innerHTML = '';
    if (declarations && declarations.length > 0) {
      this.renderDeclarations(declarations);
    }

    if (matchCount !== undefined && matchCount > 1) {
      this.matchesRow.style.display = 'flex';
      this.matchesValueSpan.textContent = `${matchCount} elements`;
    } else {
      this.matchesRow.style.display = 'none';
    }

    if (ancestors && ancestors.length > 0) {
      this.ancestorsDivider.style.display = 'flex';
      this.ancestorsContainer.style.display = 'flex';
      this.renderAncestors(ancestors);
    } else {
      this.ancestorsDivider.style.display = 'none';
      this.ancestorsContainer.style.display = 'none';
    }
  }

  // One row per ancestor, nearest first, each indented one step further
  // than the last so the list reads as containment. A solid dot means
  // Stylebot has rules there; a hollow one means it doesn't.
  private renderAncestors(ancestors: Array<AncestorInfo>) {
    this.ancestorsContainer.innerHTML = '';

    ancestors.forEach((ancestor, index) => {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex',
        flexFlow: 'row nowrap',
        alignItems: 'center',
        gap: '8px',
        paddingLeft: `${index * 11}px`,
      });

      const dot = document.createElement('span');
      Object.assign(dot.style, {
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '3.5px',
        flexShrink: '0',
        boxSizing: 'border-box',
        backgroundColor: ancestor.styled ? READOUT.accent : 'transparent',
        border: ancestor.styled ? 'none' : `1px solid ${READOUT.hollowDot}`,
      });
      row.appendChild(dot);

      const name = document.createElement('span');
      Object.assign(name.style, {
        flex: '1',
        minWidth: '0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      });
      row.appendChild(name);
      this.renderSelectorName(name, ancestor.label);

      const count = document.createElement('span');
      count.textContent =
        ancestor.matchCount > 1 ? String(ancestor.matchCount) : '';
      Object.assign(count.style, {
        flex: 'none',
        marginLeft: '12px',
        color: READOUT.muted,
      });
      row.appendChild(count);

      this.ancestorsContainer.appendChild(row);
    });
  }

  private renderDeclarations(declarations: Array<StylebotDeclaration>) {
    declarations.forEach(({ property, value }) => {
      const { row, value: valueEl } = this.buildDetailRow(
        PROPERTY_LABELS[property] ?? property
      );

      if (property.toLowerCase().includes('color')) {
        const swatch = document.createElement('span');
        Object.assign(swatch.style, {
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '2px',
          border: '1px solid #ccc',
          backgroundColor: value,
          marginRight: '4px',
          verticalAlign: 'middle',
        });
        valueEl.appendChild(swatch);
      }

      valueEl.appendChild(document.createTextNode(value));
      this.declarationsContainer.appendChild(row);
    });
  }

  updatePosition(dims: Box, bounds: Box) {
    const tipRect = this.tip.getBoundingClientRect();
    const tipPos = findTipPos(dims, bounds, {
      width: tipRect.width,
      height: tipRect.height,
    });

    Object.assign(this.tip.style, tipPos.style);

    // A rotated square, not a CSS-border triangle — its border only on
    // the two edges facing the element it points at, so it reads as a
    // notch continuous with the card's own border.
    if (tipPos.placement === 'below') {
      Object.assign(this.arrow.style, {
        display: 'block',
        top: `${-ARROW_SIZE / 2}px`,
        bottom: '',
        borderLeft: `1px solid ${READOUT.border}`,
        borderTop: `1px solid ${READOUT.border}`,
        borderRight: '',
        borderBottom: '',
      });
    } else if (tipPos.placement === 'above') {
      Object.assign(this.arrow.style, {
        display: 'block',
        bottom: `${-ARROW_SIZE / 2}px`,
        top: '',
        borderRight: `1px solid ${READOUT.border}`,
        borderBottom: `1px solid ${READOUT.border}`,
        borderLeft: '',
        borderTop: '',
      });
    } else {
      this.arrow.style.display = 'none';
    }
  }
}

export default class Overlay {
  container: HTMLElement;
  tip: OverlayTip;
  rects: Array<OverlayRect>;

  constructor() {
    const doc = window.document;

    this.container = doc.createElement('div');
    this.container.id = 'stylebot-overlay';
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
    property?: LayoutProperty,
    picking?: {
      primary: HTMLElement;
      ancestors?: Array<AncestorInfo>;
      declarations?: Array<StylebotDeclaration> | null;
    }
  ): void {
    const primary = picking?.primary;
    const ancestors = picking?.ancestors;
    const declarations = picking?.declarations;

    // A pure technical safety net against pathological cases (thousands of
    // DOM nodes rebuilt on every hover) — not a design choice.
    const maxElements = 1000;

    const candidates = nodes.filter(
      node => node.nodeType === Node.ELEMENT_NODE
    ) as Array<HTMLElement>;

    const rawMatchCount = candidates.length;

    // While picking, only the element under the cursor gets highlighted —
    // other matches are reported via the "Matches" count in the tooltip,
    // not drawn on the page. Outside picking (BoxModel hover, selector
    // preview), every matched element gets the full treatment, as before.
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
      // A primary element (interactive picking) anchors the tooltip to
      // itself, not the union of every matched element — otherwise a
      // selector matching scattered elements would fling the tooltip
      // toward whatever their combined bounding box happens to cover.
      const tipBox =
        primaryBox && primaryBox.left !== Number.POSITIVE_INFINITY
          ? primaryBox
          : outerBox;

      this.tip.showSummary(
        cssSelector,
        primary ? rawMatchCount : undefined,
        ancestors,
        declarations
      );

      const tipBounds = getNestedBoundingClientRect(
        window.document.documentElement,
        window
      );

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
  const margin = 8;

  // Prefer sitting below the element, falling back to above only when
  // there isn't room below (matches the reference design, which always
  // places the card below).
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

  // Align flush with the element's left edge rather than offsetting by
  // `margin` (that's meant as a vertical gap, not a horizontal one).
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
