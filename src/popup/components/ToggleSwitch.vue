<template>
  <label class="switch" :class="[`switch--${size}`, { disabled }]">
    <input
      ref="input"
      type="checkbox"
      :checked="value"
      :disabled="disabled"
      @change="onChange"
    />
    <span class="track"><span class="thumb" /></span>
    <span class="label"><slot /></span>
    <slot name="trailing" />
  </label>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Size = 'sm' | 'lg';

export default Vue.extend({
  name: 'ToggleSwitch',

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: Boolean,
    disabled: Boolean,
    size: {
      type: String as PropType<Size>,
      default: 'sm',
    },
  },

  methods: {
    focusInput(): void {
      (this.$refs.input as HTMLInputElement)?.focus();
    },

    onChange(event: Event): void {
      this.$emit('change', (event.target as HTMLInputElement).checked);
    },
  },
});
</script>

<style lang="scss" scoped>
.switch {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  cursor: pointer;

  &.disabled {
    cursor: default;
  }
}

input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.track {
  flex-shrink: 0;
  position: relative;
  background: var(--popup-switch-track-off);
  transition: background 0.15s ease;
}

.thumb {
  display: block;
  position: absolute;
  border-radius: 50%;
  background: var(--popup-switch-thumb-off);
  transition: transform 0.15s ease;
}

input:checked ~ .track {
  background: var(--popup-accent);
}

input:checked ~ .track .thumb {
  background: var(--popup-switch-thumb-on);
}

.switch--sm .track {
  width: 28px;
  height: 16px;
  border-radius: 8px;
}

.switch--sm .thumb {
  width: 12px;
  height: 12px;
  top: 2px;
  left: 2px;
}

.switch--sm input:checked ~ .track .thumb {
  transform: translateX(12px);
}

.switch--lg .track {
  width: 36px;
  height: 20px;
  border-radius: 10px;
}

.switch--lg .thumb {
  width: 16px;
  height: 16px;
  top: 2px;
  left: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.switch--lg input:checked ~ .track .thumb {
  transform: translateX(16px);
  box-shadow: none;
}

.disabled .track {
  background: var(--popup-switch-track-disabled);
  border: 1px solid var(--popup-switch-track-disabled-border);
}

.disabled .thumb {
  background: var(--popup-switch-thumb-disabled);
  top: 1px;
  left: 1px;
}

.disabled.switch--sm input:checked ~ .track .thumb {
  transform: translateX(11px);
}

.disabled.switch--lg input:checked ~ .track .thumb {
  transform: translateX(15px);
  box-shadow: none;
}

input:focus-visible ~ .track {
  outline: 2px solid var(--popup-focus-ring);
  outline-offset: 2px;
}

.label {
  min-width: 0;
  flex: 1;
}
</style>
