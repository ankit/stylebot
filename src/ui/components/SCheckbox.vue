<template>
  <input
    type="checkbox"
    class="checkbox"
    :checked="value"
    :disabled="disabled"
    @change="onChange"
  />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SCheckbox',

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: Boolean,
    disabled: Boolean,
  },

  methods: {
    onChange(event: Event): void {
      this.$emit('change', (event.target as HTMLInputElement).checked);
    },
  },
});
</script>

<style lang="scss" scoped>
.checkbox {
  --checkbox-border: #9aa0ab;

  appearance: none;
  flex: none;
  box-sizing: border-box;
  width: 17px;
  height: 17px;
  margin: 0;
  border: 1.5px solid var(--checkbox-border);
  border-radius: 5px;
  background: none;
  cursor: pointer;

  @include dark-mode {
    --checkbox-border: #6b6d74;
  }

  &:checked {
    border-color: var(--accent);
    background: var(--accent) center / 11px no-repeat
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.5 12 13 4.5"/></svg>');
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  @include focus-ring(2px);
}
</style>
