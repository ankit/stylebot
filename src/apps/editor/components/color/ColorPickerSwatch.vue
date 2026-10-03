<template>
  <button
    type="button"
    class="swatch"
    :class="{ selected }"
    :style="{ background: color }"
    :title="color"
    :aria-label="color"
    :aria-pressed="selected ? 'true' : 'false'"
    @click="$emit('select', color)"
  >
    <svg
      v-if="selected"
      class="swatch-check"
      :class="{ ink: checkColor !== '#ffffff' }"
      viewBox="0 0 12 12"
      width="12"
      height="12"
      fill="none"
      :stroke="checkColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 6.3 5.1 8.4 9 4.2" />
    </svg>
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { checkMarkColor } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerSwatch',

  props: {
    color: {
      type: String,
      required: true,
    },

    selected: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    checkColor(): string {
      return checkMarkColor(this.color);
    },
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.swatch {
  @include button-reset;
  @include swatch-edge;

  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    box-shadow: inset 0 0 0 1px
        color-mix(in srgb, var(--text-primary) 10%, transparent),
      0 0 0 2px var(--menu-surface), 0 0 0 4px var(--field-border-hover);
  }

  @include focus-ring(2px);
}
.swatch-check {
  pointer-events: none;
  filter: drop-shadow(0 1px 1px rgb(0 0 0 / 35%));

  &.ink {
    filter: none;
  }
}
</style>
