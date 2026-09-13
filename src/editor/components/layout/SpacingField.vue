<template>
  <div class="spacing-field" :class="{ disabled }">
    <span class="spacing-field-label">{{ label }}</span>

    <div class="spacing-field-value">
      <input
        :value="value"
        :disabled="disabled"
        inputmode="decimal"
        placeholder="0"
        @focus="onFocus"
        @keydown="onKeydown"
        @input="$emit('input', $event.target.value)"
      />
      <span class="spacing-field-unit">px</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SpacingField',

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

  methods: {
    onFocus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        this.$emit('input', `${this.value ? parseInt(this.value, 10) + 1 : 1}`);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        this.$emit('input', `${this.value ? parseInt(this.value, 10) - 1 : -1}`);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.spacing-field {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid var(--input);
  border-radius: 9px;
  background: var(--background);

  &:focus-within {
    border-color: var(--primary);
    box-shadow: inset 0 0 0 1px var(--primary);
  }

  &.disabled {
    opacity: 0.6;
  }
}

.spacing-field-label {
  min-width: 0;
  font-size: 12.5px;
  color: var(--muted-foreground);
}

.spacing-field-value {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.spacing-field-value input {
  width: 32px;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.2;
  color: var(--foreground);

  &::placeholder {
    color: var(--muted-foreground);
  }
}

.spacing-field-unit {
  font-size: 11.5px;
  color: var(--muted-foreground);
}
</style>
