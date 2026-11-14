import type Vue from 'vue';

import InspectorCard from './InspectorCard.vue';
import { findArrowLeft, findTipPos, leftBesidePanel } from './tip-position';
import type { Box, TipPlacement } from './types';

/**
 * The instance shape InspectorCard.vue exposes (shims-vue.d.ts types
 * `.vue` imports generically), for what's driven imperatively here.
 */
type InspectorCardInstance = Vue & {
  nameParts: Array<string>;
  size: string;
  top: number;
  left: number;
  arrowLeft: number;
  placement: TipPlacement;
};

export type TipSummary = {
  nameParts: Array<string>;
  size: string;
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
    this.vm.size = summary.size;
  }

  /**
   * avoidHorizontal (the editor panel's left/right) shifts the card to
   * whichever side has more room when it would land on top of the panel.
   */
  updatePosition(
    dims: Box,
    bounds: Box,
    avoidHorizontal?: { left: number; right: number } | null
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

      if (avoidHorizontal) {
        const overlaps =
          left < avoidHorizontal.right &&
          left + tipRect.width > avoidHorizontal.left;

        if (overlaps) {
          left = leftBesidePanel(
            avoidHorizontal,
            tipRect.width,
            8,
            window.innerWidth
          );
        }
      }

      this.vm.top = tipPos.top;
      this.vm.left = left;
      this.vm.arrowLeft = findArrowLeft(dims, left, tipRect.width);
      this.vm.placement = tipPos.placement;
    });
  }
}
