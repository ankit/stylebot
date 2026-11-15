import type Vue from 'vue';

import InspectorCard from './InspectorCard.vue';
import { findArrowLeft, findTipPos, leftBesidePanel } from './tip-position';
import type { NamePart } from './describe-element';
import type { Box, TipPlacement } from './types';

/**
 * The instance shape InspectorCard.vue exposes (shims-vue.d.ts types
 * `.vue` imports generically), for what's driven imperatively here.
 */
type InspectorCardInstance = Vue & {
  nameParts: Array<NamePart>;
  top: number;
  left: number;
  arrowLeft: number;
  placement: TipPlacement;
};

export type TipSummary = {
  nameParts: Array<NamePart>;
};

/**
 * A thin bridge to InspectorCard.vue, mounted into the editor's own
 * theme-provider subtree so it inherits the real theme CSS/fonts.
 */
export default class OverlayTip {
  vm: InspectorCardInstance;

  constructor(container: HTMLElement) {
    const mountEl = document.createElement('div');
    container.appendChild(mountEl);

    this.vm = new InspectorCard().$mount(mountEl) as InspectorCardInstance;
  }

  remove(): void {
    this.vm.$destroy();
    this.vm.$el.parentNode?.removeChild(this.vm.$el);
  }

  showSummary(summary: TipSummary): void {
    this.vm.nameParts = summary.nameParts;
  }

  /**
   * avoid (the editor panel's rect) shifts the card to whichever side has
   * more room when it would land on top of the panel.
   */
  updatePosition(
    dims: Box,
    bounds: Box,
    avoid?: { left: number; right: number; top: number; bottom: number } | null
  ): void {
    // Vue patches the content set above asynchronously — wait a tick so
    // the size measured below reflects it, not the previous hover.
    this.vm.$nextTick(() => {
      const tipRect = (this.vm.$el as HTMLElement).getBoundingClientRect();
      const tipPos = findTipPos(dims, bounds, {
        width: tipRect.width,
        height: tipRect.height,
      });

      let left = tipPos.left;

      if (avoid) {
        const overlaps =
          left < avoid.right &&
          left + tipRect.width > avoid.left &&
          tipPos.top < avoid.bottom &&
          tipPos.top + tipRect.height > avoid.top;

        if (overlaps) {
          left = leftBesidePanel(avoid, tipRect.width, 8, bounds.width);
        }
      }

      this.vm.top = tipPos.top;
      this.vm.left = left;
      this.vm.arrowLeft = findArrowLeft(dims, left, tipRect.width);
      this.vm.placement = tipPos.placement;
    });
  }
}
