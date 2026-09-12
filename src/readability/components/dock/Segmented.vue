<template>
  <div class="segmented">
    <button
      :disabled="prevDisabled"
      :class="{ active: prevActive }"
      @click="$emit('prev')"
    >
      <slot name="prev" />
    </button>
    <button
      :disabled="nextDisabled"
      :class="{ active: nextActive }"
      @click="$emit('next')"
    >
      <slot name="next" />
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Segmented',

  props: {
    prevDisabled: {
      type: Boolean,
      default: false,
    },

    nextDisabled: {
      type: Boolean,
      default: false,
    },

    prevActive: {
      type: Boolean,
      default: false,
    },

    nextActive: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--border);

  > button {
    all: unset;
    box-sizing: border-box;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--foreground);

    &:first-child {
      border-right: 1px solid var(--border);
      border-radius: 8px 0 0 8px;
    }

    &:last-child {
      border-radius: 0 8px 8px 0;
    }

    &:disabled {
      cursor: default;
      opacity: 0.35;
    }

    &:not(:disabled):hover {
      background: color-mix(in srgb, var(--foreground) 5%, transparent);
    }

    &.active {
      background: color-mix(in srgb, var(--foreground) 6%, transparent);
      color: var(--link-color);
    }

    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--link-color);
    }
  }
}
</style>
