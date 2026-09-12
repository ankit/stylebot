<template>
  <div class="number-field" :class="{ disabled }">
    <input
      ref="input"
      class="number-input"
      :value="value"
      :disabled="disabled"
      placeholder="—"
      inputmode="decimal"
      @focus="onFocus"
      @keydown="onKeydown"
      @input="$emit('input', $event.target.value)"
    />

    <div v-if="unit" class="number-unit">{{ unit }}</div>

    <anchored-menu v-if="presets.length" class="number-presets">
      <template #trigger="{ toggle, open }">
        <button type="button" class="number-chevron" :class="{ open }" :disabled="disabled" @click="toggle">
          <chevron-down-icon :size="10" />
        </button>
      </template>

      <template #default="{ close }">
        <s-menu dense :min-width="menuMinWidth">
          <menu-item
            v-for="preset in presets"
            :key="preset"
            @click="pick(preset); close();"
          >
            {{ preset }}
          </menu-item>
        </s-menu>
      </template>
    </anchored-menu>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { ChevronDownIcon } from '@stylebot/icons';

import AnchoredMenu from './AnchoredMenu.vue';
import SMenu from './SMenu.vue';
import MenuItem from './MenuItem.vue';

export default Vue.extend({
  name: 'SNumberField',

  components: {
    AnchoredMenu,
    SMenu,
    MenuItem,
    ChevronDownIcon,
  },

  props: {
    value: {
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
      const next = this.value ? parseInt(this.value, 10) + delta : delta;
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
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  min-width: 108px;
  border: 1px solid var(--input);
  border-radius: 7px;
  overflow: hidden;

  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent);
  }

  &.disabled {
    opacity: 0.6;
  }
}

.number-input {
  @include button-reset;
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.2;
  color: var(--foreground);
  cursor: text;

  &::placeholder {
    color: var(--muted-foreground);
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
  border-left: 1px solid var(--border);
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--muted-foreground);
}

.number-chevron {
  @include button-reset;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  border-left: 1px solid var(--border);
  color: var(--muted-foreground);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--accent);
    color: var(--foreground);
  }

  &:disabled {
    cursor: default;
  }
}
</style>
