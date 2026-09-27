<template>
  <s-tooltip v-if="tooltip" :text="tooltip" :shortcut="tooltipShortcut">
    <button
      type="button"
      class="icon-button"
      :class="{ bordered }"
      :style="sizeStyle"
      :title="title"
      v-bind="$attrs"
      :aria-label="ariaLabel"
      @click.stop="$emit('click', $event)"
    >
      <slot />
    </button>
  </s-tooltip>
  <button
    v-else
    type="button"
    class="icon-button"
    :class="{ bordered }"
    :style="sizeStyle"
    :title="title"
    v-bind="$attrs"
    @click.stop="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import STooltip from './STooltip.vue';

export default Vue.extend({
  name: 'SIconButton',

  components: {
    STooltip,
  },

  inheritAttrs: false,

  props: {
    title: {
      type: String,
      default: '',
    },
    // Fixed-size square with a border, for standalone footer buttons (e.g.
    // the "..." more button) rather than an inline dismiss icon.
    bordered: Boolean,
    // Overrides the bordered variant's default 38px square.
    size: {
      type: Number,
      default: 0,
    },
    // Wraps the button in a tooltip and doubles as its aria-label, unless
    // one is passed explicitly.
    tooltip: {
      type: String,
      default: '',
    },
    tooltipShortcut: {
      type: String,
      default: '',
    },
  },

  computed: {
    sizeStyle(): Record<string, string> | undefined {
      return this.size
        ? { width: `${this.size}px`, height: `${this.size}px` }
        : undefined;
    },

    ariaLabel(): string {
      return this.$attrs['aria-label'] ?? this.tooltip;
    },
  },
});
</script>

<style lang="scss" scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  padding: 2px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
  }

  @include focus-ring;

  &.bordered {
    width: 46px;
    padding: 0;
    border: 1px solid var(--field-border);
    border-radius: 8px;
    color: var(--icon-color);
  }
}
</style>
