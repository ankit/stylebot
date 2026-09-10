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

  --track-off: #d3d6dd;
  --thumb-on: #fff;
  --thumb-off: #fff;
  --track-disabled: #f0f1f3;
  --track-disabled-border: #e3e5ea;
  --thumb-disabled: #c7cad0;

  &.disabled {
    cursor: default;
  }
}

@media (prefers-color-scheme: dark) {
  .switch {
    --track-off: #3d4048;
    --thumb-on: #fff;
    --thumb-off: #9aa1ae;
    --track-disabled: #24262b;
    --track-disabled-border: #34363d;
    --thumb-disabled: #4a4d55;
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
  background: var(--track-off);
  transition: background 0.15s ease;
}

.thumb {
  display: block;
  position: absolute;
  border-radius: 50%;
  background: var(--thumb-off);
  transition: transform 0.15s ease;
}

input:checked:not(:disabled) ~ .track {
  background: var(--primary);
}

input:checked:not(:disabled) ~ .track .thumb {
  background: var(--thumb-on);
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
  background: var(--track-disabled);
  border: 1px solid var(--track-disabled-border);
}

.disabled .thumb {
  background: var(--thumb-disabled);
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
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.label {
  min-width: 0;
  flex: 1;
}
</style>
