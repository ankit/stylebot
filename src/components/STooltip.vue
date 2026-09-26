<template>
  <span
    class="s-tooltip"
    :class="{ grow }"
    @mouseenter="scheduleShow"
    @mouseleave="hide"
    @focusin="onFocusIn"
    @focusout="hide"
    @mousedown="hide"
    @click.capture="hide"
  >
    <slot />

    <div
      v-if="visible"
      ref="bubble"
      role="tooltip"
      class="s-tooltip-bubble"
      :class="{ 'placement-bottom': isBottom }"
      :style="{
        visibility: positioned ? 'visible' : 'hidden',
        transform: bubbleTransform,
      }"
    >
      <span class="tooltip-text">{{ text }}</span>
      <shortcut-kbd
        v-if="shortcut"
        small
        class="tooltip-shortcut"
        :value="shortcut"
      />
    </div>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import ShortcutKbd from './ShortcutKbd.vue';

// Delay before showing, to avoid flashing a tooltip on every incidental
// mouse pass; hiding is instant so it never lingers.
const SHOW_DELAY_MS = 500;
const EDGE_MARGIN = 8;

// Shared across every instance so showing one tooltip always dismisses
// whichever other one is currently open.
let activeInstance: { hide(): void } | null = null;

// :focus-visible isn't precise enough — Chrome marks a programmatic
// .focus() call as visible too. Track an actual Tab press instead.
let lastKeyWasTab = false;
let trackingTab = false;

/**
 * Starts tracking Tab presses, once, when the first tooltip mounts.
 */
const trackTabKey = (): void => {
  if (trackingTab) {
    return;
  }
  trackingTab = true;

  document.addEventListener(
    'keydown',
    event => (lastKeyWasTab = event.key === 'Tab'),
    true
  );
};

export default Vue.extend({
  name: 'STooltip',

  components: {
    ShortcutKbd,
  },

  props: {
    text: {
      type: String,
      default: '',
    },

    // Keyboard shortcut shown as its own chip (e.g. 'esc', 'alt+shift+r').
    shortcut: {
      type: String,
      default: '',
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    // Preferred side; flips to the other one when there isn't room.
    placement: {
      type: String as PropType<'top' | 'bottom'>,
      default: 'bottom',
    },

    // Lets the anchor fill a flex row (e.g. a segmented-control option)
    // instead of hugging its own content.
    grow: {
      type: Boolean,
      default: false,
    },
  },

  data(): {
    visible: boolean;
    positioned: boolean;
    flipped: boolean;
    shiftX: number;
    showTimeout: ReturnType<typeof setTimeout> | null;
    resizeObserver: ResizeObserver | null;
  } {
    return {
      visible: false,
      positioned: false,
      flipped: false,
      shiftX: 0,
      showTimeout: null,
      resizeObserver: null,
    };
  },

  computed: {
    // Renders on the opposite side from `placement` when flipped for space.
    isBottom(): boolean {
      return (this.placement === 'bottom') !== this.flipped;
    },

    bubbleTransform(): string {
      return `translateX(calc(-50% + ${this.shiftX}px))`;
    },
  },

  mounted() {
    trackTabKey();
  },

  beforeDestroy() {
    this.hide();
  },

  methods: {
    // Only show for focus that just arrived via Tab — not a programmatic
    // .focus() call (e.g. the panel seeding keyboard focus on open).
    onFocusIn(): void {
      if (lastKeyWasTab) {
        lastKeyWasTab = false;
        this.show();
      }
    },

    scheduleShow(): void {
      if (this.disabled || !this.text || this.showTimeout) {
        return;
      }

      this.showTimeout = setTimeout(() => {
        this.showTimeout = null;
        this.show();
      }, SHOW_DELAY_MS);
    },

    clearShowTimeout(): void {
      if (this.showTimeout) {
        clearTimeout(this.showTimeout);
        this.showTimeout = null;
      }
    },

    show(): void {
      this.clearShowTimeout();

      if (this.disabled || !this.text || this.visible) {
        return;
      }

      if (activeInstance && activeInstance !== this) {
        activeInstance.hide();
      }

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      activeInstance = this;
      this.visible = true;
      document.addEventListener('keydown', this.onKeydown);
      this.$nextTick(() => {
        this.reposition();

        // A self-hosted font can still be swapping in here — re-measure on
        // any later reflow so the shift doesn't go stale.
        const bubble = this.$refs.bubble as HTMLElement | undefined;

        if (bubble) {
          this.resizeObserver = new ResizeObserver(() => this.reposition());
          this.resizeObserver.observe(bubble);
        }
      });
    },

    hide(): void {
      this.clearShowTimeout();
      this.visible = false;
      this.positioned = false;
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      document.removeEventListener('keydown', this.onKeydown);

      if (activeInstance === this) {
        activeInstance = null;
      }
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.hide();
      }
    },

    // A tooltip can overflow its nearest clipping ancestor (e.g. the panel's
    // own rounded-corner overflow) while still inside the viewport.
    clipRect(): { top: number; right: number; bottom: number; left: number } {
      const rect = {
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
        left: 0,
      };
      let node = (this.$el as HTMLElement).parentElement;

      while (node) {
        const style = getComputedStyle(node);

        if (
          style.overflow !== 'visible' ||
          style.overflowX !== 'visible' ||
          style.overflowY !== 'visible'
        ) {
          const nodeRect = node.getBoundingClientRect();
          rect.top = Math.max(rect.top, nodeRect.top);
          rect.right = Math.min(rect.right, nodeRect.right);
          rect.bottom = Math.min(rect.bottom, nodeRect.bottom);
          rect.left = Math.max(rect.left, nodeRect.left);
        }

        node = node.parentElement;
      }

      return rect;
    },

    reposition(): void {
      const anchor = this.$el as HTMLElement;
      const bubble = this.$refs.bubble as HTMLElement | undefined;

      if (!anchor || !bubble) {
        return;
      }

      const clip = this.clipRect();
      const anchorRect = anchor.getBoundingClientRect();
      const spaceAbove = anchorRect.top - clip.top;
      const spaceBelow = clip.bottom - anchorRect.bottom;
      const needed = bubble.offsetHeight + EDGE_MARGIN;

      this.flipped =
        this.placement === 'top'
          ? spaceAbove < needed && spaceBelow > spaceAbove
          : spaceBelow < needed && spaceAbove > spaceBelow;

      // The measured rect already reflects any prior shiftX — subtract it
      // back out so repeated calls don't compound on themselves.
      const bubbleRect = bubble.getBoundingClientRect();
      const baselineLeft = bubbleRect.left - this.shiftX;
      const baselineRight = bubbleRect.right - this.shiftX;

      if (baselineLeft < clip.left + EDGE_MARGIN) {
        this.shiftX = clip.left + EDGE_MARGIN - baselineLeft;
      } else if (baselineRight > clip.right - EDGE_MARGIN) {
        this.shiftX = clip.right - EDGE_MARGIN - baselineRight;
      } else {
        this.shiftX = 0;
      }

      this.positioned = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.s-tooltip {
  position: relative;
  display: inline-flex;
  min-width: 0;

  &.grow {
    display: flex;
    flex: 1;

    ::v-deep {
      > :first-child {
        flex: 1;
        min-width: 0;
      }
    }
  }
}

.s-tooltip-bubble {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  z-index: 60;
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 3px 7px;
  border-radius: 6px;
  background: var(--tooltip-bg, var(--menu-surface, #23262b));
  color: var(--tooltip-fg, var(--text-primary, #f2f4f7));
  border: 1px solid var(--tooltip-border, var(--menu-border, #3a3e46));
  box-shadow: 0 2px 6px rgb(0 0 0 / 8%);
  font-size: 11.5px;
  font-weight: 400;
  line-height: 1.3;
  white-space: nowrap;
  pointer-events: none;

  &.placement-bottom {
    bottom: auto;
    top: calc(100% + 6px);
  }
}

.tooltip-shortcut {
  opacity: 0.6;
}
</style>
