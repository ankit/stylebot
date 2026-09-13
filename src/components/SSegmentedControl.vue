<template>
  <div class="segmented" :class="{ fit }" role="group">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="segment"
      :class="{ active: option.value === value }"
      :title="option.title"
      @click="$emit('change', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Option = {
  value: string | number;
  label: string;
  title?: string;
};

export default Vue.extend({
  name: 'SSegmentedControl',

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: {
      type: [String, Number],
      default: '',
    },

    options: {
      type: Array as PropType<Array<Option>>,
      required: true,
    },

    // Segments hug their own label instead of sharing equal width — for
    // text options of varying length (icon-based segments want equal width).
    fit: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.segmented {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--accent);

  &.fit .segment {
    flex: none;
    padding: 4px 10px;
  }
}

.segment {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  padding: 4px 0;
  border: none;
  border-radius: 6px;
  background: none;
  font-family: inherit;
  font-size: 12px;
  color: var(--muted-foreground);
  outline: none;
  cursor: pointer;

  &.active {
    font-weight: 600;
    color: var(--foreground);
    background: var(--background);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    color: var(--foreground);
  }

  @include focus-ring;
}
</style>
