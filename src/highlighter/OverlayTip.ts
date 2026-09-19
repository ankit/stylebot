import Vue from 'vue';

import InspectorCard from './InspectorCard.vue';
import { findTipPos, leftBesidePanel } from './tip-position';
import { Box, NextAncestorInfo, TipPlacement } from './types';
import { CssDeclaration } from '@stylebot/types';

/**
 * The instance shape InspectorCard.vue exposes (shims.vue.d.ts types
 * `.vue` imports generically), for what's driven imperatively here.
 */
type InspectorCardInstance = Vue & {
  name: string;
  showSelector: boolean;
  matchCount: number | undefined;
  styleCount: number;
  declarations: Array<CssDeclaration> | null;
  nextAncestor: NextAncestorInfo | null;
  top: number;
  left: number;
  placement: TipPlacement;
};

export type TipSummary = {
  name: string;
  showSelector: boolean;
  matchCount: number | undefined;
  nextAncestor: NextAncestorInfo | null | undefined;
  styleCount: number | undefined;
  declarations: Array<CssDeclaration> | null | undefined;
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
    this.vm.name = summary.name;
    this.vm.showSelector = summary.showSelector;
    this.vm.matchCount = summary.matchCount;
    this.vm.nextAncestor = summary.nextAncestor ?? null;
    this.vm.styleCount = summary.styleCount ?? 0;
    this.vm.declarations = summary.declarations ?? null;
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
      this.vm.placement = tipPos.placement;
    });
  }

  /**
   * For a selector preview rather than picking an element — sits beside the
   * panel instead of near matches that may be scattered or off-screen.
   */
  updatePositionNextToPanel(panelEl: HTMLElement | null): void {
    this.vm.$nextTick(() => {
      const tipRect = (this.vm.$el as HTMLElement).getBoundingClientRect();
      const panelRect = panelEl?.getBoundingClientRect();
      const margin = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left: number;
      let top: number;

      if (panelRect) {
        left = leftBesidePanel(panelRect, tipRect.width, margin, viewportWidth);
        top = panelRect.top;
      } else {
        // Panel not found (shouldn't normally happen) — a corner beats
        // leaving the card wherever it last was.
        left = Math.max(margin, viewportWidth - tipRect.width - margin);
        top = margin;
      }

      this.vm.left = left;
      this.vm.top = Math.max(
        margin,
        Math.min(top, viewportHeight - tipRect.height - margin)
      );
      this.vm.placement = null;
    });
  }
}
