/**
 * findTipPos forked from
 * https://github.com/facebook/react/blob/e706721490e50d0bd6af2cd933dbf857fd8b61ed/packages/react-devtools-shared/src/backend/views/Highlighter/Overlay.js
 */

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Box, TipPlacement } from './types';

type Size = { width: number; height: number };

/**
 * The tip's left edge when placed beside the panel, on whichever side has
 * more room, clamped to the viewport.
 */
export function leftBesidePanel(
  panel: { left: number; right: number },
  tipWidth: number,
  margin: number,
  viewportWidth: number
): number {
  const spaceLeft = panel.left;
  const spaceRight = viewportWidth - panel.right;

  const left =
    spaceLeft >= tipWidth + margin || spaceLeft > spaceRight
      ? panel.left - tipWidth - margin
      : panel.right + margin;

  return Math.max(margin, Math.min(left, viewportWidth - tipWidth - margin));
}

/**
 * Prefers placing the tip below the element, above only if there's no
 * room below, matching the reference design.
 */
export function findTipPos(
  dims: Box,
  bounds: Box,
  tipSize: Size
): { top: number; left: number; placement: TipPlacement } {
  const tipHeight = Math.max(tipSize.height, 20);
  const tipWidth = Math.max(tipSize.width, 60);
  const margin = 8;

  let top;
  let placement: TipPlacement;

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

  return { top, left, placement };
}

const ARROW_WIDTH = 14;
const ARROW_INSET = 12;

/**
 * The arrow's left edge within the tip, so it points into the element from
 * wherever the tip ended up: near the element's left edge, or at its middle
 * when it's narrow, kept clear of the tip's rounded corners.
 */
export function findArrowLeft(
  anchor: Box,
  tipLeft: number,
  tipWidth: number
): number {
  const target =
    anchor.left + Math.min(ARROW_INSET + ARROW_WIDTH / 2, anchor.width / 2);
  const left = target - ARROW_WIDTH / 2 - tipLeft;
  const max = Math.max(ARROW_INSET, tipWidth - ARROW_INSET - ARROW_WIDTH);

  return Math.max(ARROW_INSET, Math.min(left, max));
}
