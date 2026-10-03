<template>
  <div class="number-field" :class="{ disabled }">
    <span v-if="prefix" class="number-prefix">{{ prefix }}</span>

    <input
      ref="input"
      class="number-input"
      :value="value"
      :disabled="disabled"
      :placeholder="placeholder || '—'"
      inputmode="decimal"
      @focus="onFocus"
      @keydown="onKeydown"
      @input="$emit('input', $event.target.value)"
    />

    <div v-if="unit" class="number-unit">{{ unit }}</div>

    <s-anchored-menu v-if="presets.length" class="number-presets">
      <template #trigger="{ toggle, open }">
        <button
          type="button"
          class="number-chevron"
          :class="{ open }"
          :disabled="disabled"
          @click="toggle"
        >
          <chevron-down-icon :size="10" />
        </button>
      </template>

      <template #default="{ close }">
        <s-menu dense :min-width="menuMinWidth" :max-height="260">
          <s-menu-item
            v-for="preset in presets"
            :key="preset"
            @click="
              pick(preset);
              close();
            "
          >
            {{ preset }}
          </s-menu-item>
        </s-menu>
      </template>
    </s-anchored-menu>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { ChevronDownIcon } from '@stylebot/icons';

import SAnchoredMenu from './SAnchoredMenu.vue';
import SMenu from './SMenu.vue';
import SMenuItem from './SMenuItem.vue';

export default Vue.extend({
  name: 'SNumberField',

  components: {
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    ChevronDownIcon,
  },

  props: {
    value: {
      type: String,
      default: '',
    },

    // Short label shown before the value (e.g. 'X' or 'T').
    prefix: {
      type: String,
      default: '',
    },

    // Unit label shown after the value (e.g. 'px'); omit for unitless values.
    unit: {
      type: String,
      default: '',
    },

    // Quick-pick values shown in the chevron dropdown.
    presets: {
      type: Array as PropType<Array<string | number>>,
      default: () => [],
    },

    // Shown while empty (e.g. the page's current value), and where arrow
    // keys step from.
    placeholder: {
      type: String,
      default: '',
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    menuMinWidth: {
      type: Number,
      default: 108,
    },
  },

  methods: {
    onFocus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    pick(value: string | number): void {
      this.$emit('input', `${value}`);
    },

    step(delta: number): void {
      const base = this.value
        ? parseInt(this.value, 10)
        : Math.round(parseFloat(this.placeholder));
      const next = Number.isNaN(base) ? delta : base + delta;
      this.$emit('input', `${next}`);
    },

    onKeydown(event: KeyboardEvent): void {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        this.step(1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        this.step(-1);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.number-field {
  @include field-fill;

  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: stretch;
  width: 96px;
  height: 28px;
  font-size: 13px;
  line-height: 1.2;

  // Only the numeric input highlights the whole field — the chevron button
  // gets its own focus ring instead (see .number-chevron).
  &:has(.number-input:focus) {
    @include field-active-border;
  }

  &.disabled {
    opacity: 0.6;
  }
}

.number-prefix {
  flex: none;
  display: flex;
  align-items: center;
  padding-left: 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);

  + .number-input {
    padding-left: 9px;
  }
}

.number-input {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  box-sizing: border-box;
  border-radius: 7px 0 0 7px;
  margin: 0;
  border: none;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.2;
  color: var(--field-ink);
  cursor: text;

  &::placeholder {
    color: var(--field-placeholder);
  }

  &:disabled {
    cursor: default;
  }
}

.number-unit {
  flex: none;
  display: flex;
  align-items: center;
  padding: 5px 7px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
}

.number-presets {
  flex: none;
  display: flex;
}

.number-chevron {
  @include button-reset;

  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  border-radius: 0 6px 6px 0;
  outline: none;
  color: var(--text-muted);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--hover-tint);
    color: var(--text-primary);
  }

  @include focus-ring;

  &:disabled {
    cursor: default;
  }
}
</style>
