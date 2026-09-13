<template>
  <div class="spacing-field">
    <span class="spacing-field-label">{{ label }}</span>

    <s-number-field
      unit="px"
      :value="value"
      :presets="sizes"
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

  data(): { sizes: Array<string> } {
    return {
      sizes: ['0', '2', '4', '8', '12', '16', '24', '32'],
    };
  },
});
</script>

<style lang="scss" scoped>
.spacing-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.spacing-field-label {
  font-size: 12.5px;
  color: var(--muted-foreground);
}

.spacing-field ::v-deep .number-field {
  width: 100%;
  max-width: 108px;
}
</style>
