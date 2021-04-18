<template>
  <b-form-input
    v-model="value"
    size="sm"
    class="color-picker-input"
    :debounce="150"
    :disabled="disabled"
    @focus="focus"
  />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ColorInput',

  props: {
    value: {
      type: String,
      required: true,
    },
  },

  computed: {
    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  watch: {
    value() {
      this.$emit('input', this.value);
    },
  },

  methods: {
    focus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker-input {
  &.form-control {
    float: left;
    width: 100px;
  }
}
</style>
