<template>
  <div ref="root" class="anchored-menu">
    <slot name="trigger" :toggle="toggleOpen" :open="open" :show="show" :hide="close" />

    <div v-if="open" ref="panel" class="anchored-menu-panel">
      <slot :close="close" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AnchoredMenu',

  props: {
    // For combobox-style triggers (a text input), keep focus in the trigger
    // when the menu opens instead of moving it to the first item.
    retainFocus: {
      type: Boolean,
      default: false,
    },
  },

  data(): { open: boolean; previouslyFocused: HTMLElement | null } {
    return {
      open: false,
      // So Escape/item-select/click-outside all return focus to the
      // trigger, rather than leaving it wherever it happened to land.
      previouslyFocused: null,
    };
  },

  watch: {
    open(isOpen: boolean): void {
      if (isOpen) {
        this.previouslyFocused = this.activeElement();
        document.addEventListener('mousedown', this.onDocMousedown);
        // Capture phase so Escape closes this menu before the editor's
        // global keydown handler (bubble phase) treats it as "close editor".
        document.addEventListener('keydown', this.onDocKeydown, true);
        this.$emit('open');
        if (!this.retainFocus) {
          this.$nextTick(() => this.focusableItems()[0]?.focus());
        }
      } else {
        document.removeEventListener('mousedown', this.onDocMousedown);
        document.removeEventListener('keydown', this.onDocKeydown, true);
        this.$emit('close');
        this.previouslyFocused?.focus();
      }
    },
  },

  beforeDestroy() {
    document.removeEventListener('mousedown', this.onDocMousedown);
    document.removeEventListener('keydown', this.onDocKeydown, true);
  },

  methods: {
    toggleOpen(): void {
      this.open = !this.open;
    },

    show(): void {
      this.open = true;
    },

    close(): void {
      this.open = false;
    },

    focusableItems(): Array<HTMLElement> {
      const panel = this.$refs.panel as HTMLElement | undefined;
      return panel ? Array.from(panel.querySelectorAll<HTMLElement>('button, a[href], [tabindex]')) : [];
    },

    onDocMousedown(event: MouseEvent): void {
      const origin = event.composedPath()[0];
      if (!(origin instanceof Node && this.$el.contains(origin))) {
        this.$emit('dismiss');
        this.close();
      }
    },

    activeElement(): HTMLElement | null {
      const root = this.$el.getRootNode();
      const active = root instanceof ShadowRoot ? root.activeElement : document.activeElement;
      return active instanceof HTMLElement ? active : null;
    },

    onDocKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.$emit('dismiss');
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

      const active = this.activeElement();
      const currentIndex = active ? items.indexOf(active) : -1;
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (currentIndex + delta + items.length) % items.length;
      items[nextIndex].focus();
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
}
</style>
