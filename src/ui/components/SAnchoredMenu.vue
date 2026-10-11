<template>
  <!-- blur, captured: a trigger that re-renders on blur (chips ↔ input)
       has detached the field by the time focusout would bubble here. -->
  <div ref="root" class="anchored-menu" @blur.capture="onFocusOut">
    <slot
      name="trigger"
      :toggle="toggleOpen"
      :open="open"
      :show="show"
      :hide="close"
    />

    <div
      v-if="open"
      ref="panel"
      class="anchored-menu-panel"
      :class="[
        `align-${align}`,
        { 'flip-up': flipUp, 'keyboard-nav': keyboardNav },
      ]"
      :style="{
        visibility: positioned ? 'visible' : 'hidden',
        transform: shiftX ? `translateX(${shiftX}px)` : undefined,
      }"
    >
      <slot :close="close" />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

export default Vue.extend({
  name: 'SAnchoredMenu',

  props: {
    // Which edge of the panel lines up with the trigger's: its right edge
    // (end) or its left edge (start).
    align: {
      type: String as PropType<'start' | 'end'>,
      default: 'end',
    },

    // Returns an element the panel must stay inside; it's shifted sideways
    // when it would stick out.
    boundary: {
      type: Function as PropType<() => HTMLElement | null | undefined>,
      default: () => null,
    },

    // Emits escape instead of closing, for content that backs out of
    // something first, e.g. a field cancelling an edit in place.
    keepOpenOnEscape: {
      type: Boolean,
      default: false,
    },

    // For combobox-style triggers (a text input), keep focus in the trigger
    // when the menu opens instead of moving it to the first item.
    retainFocus: {
      type: Boolean,
      default: false,
    },

    // Returns that text field, so arrow keys cycle through it along with
    // the items.
    triggerField: {
      type: Function as PropType<() => HTMLElement | null | undefined>,
      default: () => null,
    },

    // The item standing for the current choice, if any: scrolled into view
    // on open, and where the arrow keys start from while focus is in the
    // trigger field.
    currentItem: {
      type: Function as PropType<() => HTMLElement | null | undefined>,
      default: () => null,
    },
  },

  data(): {
    open: boolean;
    previouslyFocused: HTMLElement | null;
    // Whether the panel didn't fit below the trigger and got flipped above it.
    flipUp: boolean;
    // Sideways shift that keeps the panel inside its boundary.
    shiftX: number;
    // Hides the panel until its position (flipUp) is resolved, to avoid a
    // visible jump from the default (below) placement to the flipped one.
    positioned: boolean;
    // Set right before closing due to focus already having moved elsewhere
    // (e.g. Tab) — restoring focus to the trigger there would fight it.
    skipRestoreFocus: boolean;
    keyboardNav: boolean;
  } {
    return {
      open: false,
      // So Escape/item-select/click-outside all return focus to the
      // trigger, rather than leaving it wherever it happened to land.
      previouslyFocused: null,
      flipUp: false,
      shiftX: 0,
      positioned: false,
      skipRestoreFocus: false,
      // Safari leaves focus moved by the arrow keys out of :focus-visible
      // after a click opened the menu, so rows highlight on this instead.
      keyboardNav: false,
    };
  },

  watch: {
    open(isOpen: boolean): void {
      if (isOpen) {
        this.previouslyFocused = this.activeElement();
        this.positioned = false;
        this.shiftX = 0;
        this.keyboardNav = false;
        document.addEventListener('mousedown', this.onDocMousedown);
        // window, not document: capture on window always fires before the
        // editor's own capture-phase document listener, regardless of attach order.
        window.addEventListener('keydown', this.onDocKeydown, true);
        this.$emit('open');
        this.$nextTick(() => {
          this.position();
          this.scrollToCurrent();
          if (!this.retainFocus) {
            this.focusableItems()[0]?.focus();
          }
        });
      } else {
        document.removeEventListener('mousedown', this.onDocMousedown);
        window.removeEventListener('keydown', this.onDocKeydown, true);
        this.$emit('close');

        if (!this.skipRestoreFocus) {
          this.previouslyFocused?.focus();
        }
        this.skipRestoreFocus = false;
      }
    },
  },

  beforeDestroy() {
    document.removeEventListener('mousedown', this.onDocMousedown);
    window.removeEventListener('keydown', this.onDocKeydown, true);
  },

  methods: {
    // Flips the panel above the trigger when it wouldn't fit below, but only
    // if there's actually more room above — a short panel just stays put.
    position(): void {
      const root = this.$refs.root as HTMLElement | undefined;
      const panel = this.$refs.panel as HTMLElement | undefined;

      if (root && panel) {
        const rootRect = root.getBoundingClientRect();
        const margin = 6;
        const spaceBelow = window.innerHeight - rootRect.bottom;
        const spaceAbove = rootRect.top;

        this.flipUp =
          panel.offsetHeight + margin > spaceBelow && spaceAbove > spaceBelow;
        this.shiftX = this.shiftIntoBoundary(panel);
      }

      this.positioned = true;
    },

    /**
     * How far to move the panel sideways so it stays at least a small gap
     * inside the boundary, or 0 without one.
     */
    shiftIntoBoundary(panel: HTMLElement): number {
      const bounds = this.boundary()?.getBoundingClientRect();

      if (!bounds) {
        return 0;
      }

      const gap = 8;
      const rect = panel.getBoundingClientRect();
      const overRight = rect.right - (bounds.right - gap);
      const overLeft = bounds.left + gap - rect.left;

      if (overRight > 0) {
        return Math.max(-overRight, overLeft);
      }

      return Math.max(0, overLeft);
    },

    toggleOpen(): void {
      this.open = !this.open;
    },

    show(): void {
      this.open = true;
    },

    close(options: { skipRestoreFocus?: boolean } = {}): void {
      this.skipRestoreFocus = !!options.skipRestoreFocus;
      this.open = false;
    },

    // Centres the current item in the scrolling list, leaving the rest of
    // the page where it is.
    scrollToCurrent(): void {
      const item = this.currentItem();
      const panel = this.$refs.panel as HTMLElement | undefined;
      let list = item?.parentElement;

      while (list && list !== panel && list.scrollHeight <= list.clientHeight) {
        list = list.parentElement;
      }

      if (!item || !list) {
        return;
      }

      const itemTop =
        item.getBoundingClientRect().top - list.getBoundingClientRect().top;
      list.scrollTop += itemTop - (list.clientHeight - item.offsetHeight) / 2;
    },

    /**
     * What Up and Down step through. A row's secondary button, marked
     * data-menu-secondary, is left out so each row is one stop.
     */
    focusableItems(): Array<HTMLElement> {
      const panel = this.$refs.panel as HTMLElement | undefined;
      return panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button, a[href], input, [tabindex]:not([tabindex="-1"])'
            )
          ).filter(item => !item.hasAttribute('data-menu-secondary'))
        : [];
    },

    field(): HTMLElement | null {
      return (this.retainFocus && this.triggerField()) || null;
    },

    // Closes on focus leaving via Tab — retainFocus closes on leaving the input itself, except into the panel (arrow-key nav) or back from it.
    onFocusOut(event: FocusEvent): void {
      const next = event.relatedTarget;
      const panel = this.$refs.panel as HTMLElement | undefined;
      const movedIntoPanel = next instanceof Node && !!panel?.contains(next);
      const field = this.field();

      // `leave`: focus went from anywhere in the widget (field, chevron or
      // a row) to outside it, or to nothing at all.
      if (!(next instanceof Node && this.$el.contains(next))) {
        this.$emit('leave');
      }

      if (!this.open) {
        return;
      }

      if (movedIntoPanel || (!!next && next === field)) {
        return;
      }

      if (
        this.retainFocus ||
        !(next instanceof Node && this.$el.contains(next))
      ) {
        this.close({ skipRestoreFocus: true });
      }
    },

    // The path is fixed when the event is dispatched, so a trigger that
    // re-rendered on this very mousedown (e.g. chips → input) still counts
    // as inside.
    onDocMousedown(event: MouseEvent): void {
      if (!event.composedPath().includes(this.$el)) {
        this.$emit('cancel', 'outside');
        this.close();
      }
    },

    activeElement(): HTMLElement | null {
      const root = this.$el.getRootNode();
      const active =
        root instanceof ShadowRoot
          ? root.activeElement
          : document.activeElement;
      return active instanceof HTMLElement ? active : null;
    },

    onDocKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();

        if (this.keepOpenOnEscape) {
          this.$emit('escape');
          return;
        }

        this.$emit('cancel', 'escape');
        this.close();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
        return;
      }

      const items = this.focusableItems();
      if (!items.length) {
        return;
      }

      event.preventDefault();
      this.keyboardNav = true;

      // A combobox's text field sits at the top of the cycle, so Up from the
      // first item (or Down past the last) returns to it.
      const field = this.field();
      const cycle = field ? [field, ...items] : items;

      const active = this.activeElement();
      let currentIndex = active ? cycle.indexOf(active) : -1;

      // From a secondary button, step from the item it sits beside.
      if (active?.hasAttribute('data-menu-secondary')) {
        currentIndex =
          cycle.filter(
            item =>
              item.compareDocumentPosition(active) &
              Node.DOCUMENT_POSITION_FOLLOWING
          ).length - 1;
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1;

      // From the field, move on from the current choice rather than the top.
      const current = field && active === field ? this.currentItem() : null;
      const currentItemIndex = current ? items.indexOf(current) : -1;

      if (currentItemIndex !== -1) {
        const next = (currentItemIndex + delta + items.length) % items.length;
        items[next].focus();
        return;
      }

      if (currentIndex === -1) {
        // Nothing in the cycle has focus yet: enter it at the first or last item.
        (delta > 0 ? items[0] : items[items.length - 1]).focus();
        return;
      }

      const nextIndex = (currentIndex + delta + cycle.length) % cycle.length;
      cycle[nextIndex].focus();
    },
  },
});
</script>

<style lang="scss" scoped>
.anchored-menu {
  position: relative;
  display: inline-flex;
}

.anchored-menu-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  z-index: 20;

  &.align-start {
    right: auto;
    left: 0;
  }

  &.flip-up {
    top: auto;
    bottom: 100%;
    margin-top: 0;
    margin-bottom: 6px;
  }
}
</style>
