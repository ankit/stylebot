<template>
  <b-form-input
    v-model="value"
    size="sm"
    type="color"
    class="color-input"
    :debounce="150"
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

  watch: {
    value() {
      this.$emit('input', this.value);
    },
  },
});
</script>

<style lang="scss" scoped>
.color-input {
  &.form-control {
    width: 50px;
  }
}
</style>
