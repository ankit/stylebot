<template>
  <button
    type="button"
    class="sticker-card"
    :class="[`tilt-${tilt}`, { selected }]"
    :aria-pressed="selected === undefined ? undefined : String(selected)"
    v-on="$listeners"
  >
    <span class="sticker-card-preview"><slot name="preview" /></span>
    <s-text as="span" size="label" class="sticker-card-label">
      <slot />
    </s-text>
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';

import SText from './SText.vue';

/**
 * A card with a small picture above a label, set at a slight angle like a
 * sticker; it straightens and lifts on hover. Cards in a row take turns
 * through the three tilts.
 */
export default Vue.extend({
  name: 'SStickerCard',

  components: {
    SText,
  },

  props: {
    tilt: {
      type: Number as PropType<0 | 1 | 2>,
      default: 0,
    },

    // Set for a card that stays picked; left out, the card is a plain button.
    selected: {
      type: Boolean,
      default: undefined,
    },
  },
});
</script>

<style lang="scss" scoped>
.sticker-card {
  @include button-reset;

  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--pill-border);
  border-radius: 12px;
  background: var(--pill-surface);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.3, 1.6, 0.5, 1), border-color 0.2s;

  &.tilt-0 {
    transform: rotate(-2deg);
  }

  &.tilt-1 {
    transform: rotate(1.5deg) translateY(4px);
  }

  &.tilt-2 {
    transform: rotate(-1deg);
  }

  &:hover:not(:disabled),
  &:focus-visible {
    transform: translateY(-4px) scale(1.04);
    border-color: var(--field-border-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &.selected {
    transform: translateY(-4px) scale(1.04);
    border-color: var(--accent);
    box-shadow: 0 0 0 1px var(--accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover:not(:disabled),
    &:focus-visible,
    &:active:not(:disabled),
    &.selected {
      transform: none;
    }
  }

  @include focus-ring;
}

.sticker-card-preview {
  display: block;
  height: 54px;
  border-radius: 7px;
  overflow: hidden;
}

.sticker-card-label {
  min-height: 2.6em;
  text-wrap: pretty;
}
</style>
