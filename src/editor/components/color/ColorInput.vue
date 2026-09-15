<template>
  <input :value="value" type="color" class="color-input" @input="onInput" />
</template>

<script lang="ts">
import Vue from 'vue';
import { debounce } from 'lodash';

export default Vue.extend({
  name: 'ColorInput',

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  data(): { emitInput?: (value: string) => void } {
    return {
      emitInput: undefined,
    };
  },

  created() {
    this.emitInput = debounce((value: string) => this.$emit('input', value), 150);
  },

  methods: {
    onInput(event: Event): void {
      this.emitInput?.((event.target as HTMLInputElement).value);
    },
  },
});
</script>

<style lang="scss" scoped>
.color-input {
  width: 32px;
  height: 30px;
  padding: 2px;
  border: 1px solid var(--field-border);
  border-radius: 7px;
  background: var(--field-fill);
  cursor: pointer;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 5px;
  }
}
</style>
