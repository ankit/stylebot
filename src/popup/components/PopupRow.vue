<template>
  <div
    class="popup-row"
    :class="{ button, hover, disabled }"
    :role="button ? 'button' : undefined"
    :tabindex="button && !disabled ? 0 : undefined"
    @click="onClick"
    @keydown="onKeydown"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { onEnterOrSpace } from '../utils';

export default Vue.extend({
  name: 'PopupRow',

  props: {
    // The row itself is the sole clickable/focusable target (no nested control).
    button: Boolean,
    // CSS-only hover/rounded treatment for rows that wrap their own focusable
    // control (e.g. a ToggleSwitch) — no extra role/tabindex/click-forwarding.
    hover: Boolean,
    disabled: Boolean,
  },

  methods: {
    onClick(event: MouseEvent): void {
      if (this.disabled) {
        return;
      }

      if (this.hover) {
        const target = event.target as HTMLElement;

        if (!target.closest('label, input')) {
          const input = this.$el.querySelector('input') as HTMLInputElement | null;
          input?.click();
        }

        return;
      }

      this.$emit('click', event);
    },

    onKeydown(event: KeyboardEvent): void {
      if (!this.button || this.disabled) {
        return;
      }

      onEnterOrSpace(event, () => this.$emit('click', event));
    },
  },
});
</script>

<style lang="scss" scoped>
.popup-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border-radius: 8px;

  &.button:not(.disabled),
  &.hover:not(.disabled) {
    cursor: pointer;

    &:hover {
      background: var(--accent);
    }
  }

  &.button:not(.disabled):focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }

  &.disabled {
    cursor: default;
    color: var(--muted-foreground);
  }
}
</style>
