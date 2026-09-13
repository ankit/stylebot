<template>
  <div class="spacing-field">
    <s-text variant="muted" class="spacing-field-label">{{ label }}</s-text>

    <s-number-field
      unit="px"
      :value="value"
      :disabled="disabled"
      @input="$emit('input', $event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SNumberField, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'SpacingField',

  components: {
    SNumberField,
    SText,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    value: {
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
.spacing-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.spacing-field ::v-deep .number-field {
  width: 100%;
}
</style>
