<template>
  <div class="spacing-field">
    <s-number-field
      unit="px"
      :prefix="prefix"
      :value="value"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('input', $event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SNumberField } from '@stylebot/components';

export default Vue.extend({
  name: 'SpacingField',

  components: {
    SNumberField,
  },

  props: {
    prefix: {
      type: String,
      default: '',
    },

    value: {
      type: String,
      default: '',
    },

    placeholder: {
      type: String,
      default: '',
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.spacing-field ::v-deep .number-field {
  width: 100%;
}
</style>
