<template>
  <div class="tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="tab"
      :class="{ active: tab.value === value }"
      :disabled="tab.disabled"
      role="tab"
      :aria-selected="tab.value === value"
      :title="tab.title"
      @click="$emit('change', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Tab = {
  value: string | number;
  label: string;
  title?: string;
  disabled?: boolean;
};

export default Vue.extend({
  name: 'STabs',

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: {
      type: [String, Number],
      default: '',
    },

    tabs: {
      type: Array as PropType<Array<Tab>>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  gap: 6px;
  padding: 0 10px;
  border-bottom: 1px solid var(--panel-border);
}

.tab {
  padding: 4px 6px 3px;
  border: none;
  border-radius: 0;
  background: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--text-muted);
  outline: none;
  cursor: pointer;
  box-shadow: inset 0 -2px 0 transparent;

  &:hover:not(:disabled):not(.active) {
    color: var(--text-primary);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    font-weight: 600;
    color: var(--text-primary);
    box-shadow: inset 0 -2px 0 var(--accent);
  }

  &:focus-visible {
    border-radius: 6px;
  }

  @include focus-ring;
}
</style>
