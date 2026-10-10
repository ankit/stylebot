<template>
  <div
    ref="root"
    class="dialog-backdrop"
    :class="{ contained }"
    @click.self="$emit('cancel')"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SDialog',

  props: {
    // Covers only the nearest positioned ancestor, e.g. the editor panel,
    // instead of the whole viewport.
    contained: {
      type: Boolean,
      default: false,
    },
  },

  data(): { previouslyFocused: HTMLElement | null } {
    return {
      // So focus returns to whatever opened the dialog once it closes,
      // instead of falling back to <body>.
      previouslyFocused: null,
    };
  },

  mounted() {
    document.addEventListener('keydown', this.onKeydown);

    this.previouslyFocused = this.activeElement();

    // Deferred a tick so it wins over a closing menu's own focus-restore,
    // which runs in the same reactivity flush and would otherwise steal it back.
    this.$nextTick(() => {
      const root = this.$refs.root as HTMLElement;
      const preferred = root.querySelector<HTMLElement>('[autofocus]');

      if (preferred) {
        // Ring it even after a mouse click, so Enter's target is visible.
        preferred.focus({ focusVisible: true } as FocusOptions);
      } else {
        this.focusableElements()[0]?.focus();
      }
    });
  },

  beforeDestroy() {
    document.removeEventListener('keydown', this.onKeydown);

    // The trigger may have been removed from the DOM by the confirmed action.
    if (this.previouslyFocused?.isConnected) {
      this.previouslyFocused.focus();
    } else {
      document.body.focus();
    }
  },

  methods: {
    focusableElements(): Array<HTMLElement> {
      const root = this.$refs.root as HTMLElement;
      return Array.from(
        root.querySelectorAll<HTMLElement>('button, a[href], [tabindex]')
      );
    },

    activeElement(): HTMLElement | null {
      const root = this.$el.getRootNode();
      const active =
        root instanceof ShadowRoot
          ? root.activeElement
          : document.activeElement;
      return active instanceof HTMLElement ? active : null;
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.$emit('cancel');
        return;
      }

      // Traps Tab within the dialog — without this, Tab walks out into the
      // (still-present) page behind the backdrop.
      if (event.key !== 'Tab') {
        return;
      }

      const focusable = this.focusableElements();
      if (!focusable.length) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = this.activeElement();

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.dialog-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2147483647;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  padding: min(160px, 20vh) 20px 20px;
  overflow: auto;
  background: rgba(20, 22, 26, 0.4);

  @include dark-mode {
    background: rgba(0, 0, 0, 0.6);
  }

  &.contained {
    position: absolute;
    inset: 0;
    z-index: 30;
    align-items: center;
    width: auto;
    height: auto;
    padding: 16px;
    border-radius: 13px;
  }
}
</style>
