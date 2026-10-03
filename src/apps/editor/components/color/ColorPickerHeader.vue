<template>
  <div class="header">
    <label class="hex-field">
      <span
        class="hex-swatch"
        :class="{ empty: !value }"
        :style="value ? { background: value } : undefined"
      />
      <input
        class="hex-input"
        spellcheck="false"
        :value="focused ? draft : displayValue"
        :placeholder="t('not_set')"
        :aria-label="roleLabel"
        @focus="onFocus"
        @input="onInput"
        @blur="onBlur"
        @keydown.enter="$event.target.blur()"
      />
    </label>

    <button
      v-if="eyeDropperSupported"
      type="button"
      class="header-action pick"
      :title="t('pick_from_page')"
      :aria-label="t('pick_from_page')"
      @click="pick"
    >
      <eyedropper-icon :size="14" />
    </button>

    <button
      v-if="value"
      type="button"
      class="header-action clear"
      :title="t('color_picker_clear')"
      :aria-label="t('color_picker_clear')"
      @click="$emit('clear')"
    >
      <x-icon :size="14" />
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import tinycolor from 'tinycolor2';
import { EyedropperIcon, XIcon } from '@stylebot/icons';

import { tinycolorToCssColor } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerHeader',

  components: {
    EyedropperIcon,
    XIcon,
  },

  props: {
    value: {
      type: String,
      default: '',
    },

    roleLabel: {
      type: String,
      required: true,
    },
  },

  data(): { focused: boolean; draft: string } {
    return {
      focused: false,
      draft: '',
    };
  },

  computed: {
    eyeDropperSupported(): boolean {
      return typeof window.EyeDropper !== 'undefined';
    },

    displayValue(): string {
      const color = tinycolor(this.value);
      return color.isValid() ? tinycolorToCssColor(color) : this.value;
    },
  },

  methods: {
    onFocus(event: FocusEvent): void {
      this.focused = true;
      this.draft = this.displayValue;
      (event.target as HTMLInputElement).select();
    },

    onInput(event: Event): void {
      this.draft = (event.target as HTMLInputElement).value;

      const color = tinycolor(this.draft);
      if (color.isValid()) {
        this.$emit('input', tinycolorToCssColor(color));
      }
    },

    onBlur(): void {
      this.focused = false;

      const color = tinycolor(this.draft);
      if (color.isValid()) {
        this.$emit('commit', tinycolorToCssColor(color));
      } else if (!this.draft.trim() && this.value) {
        this.$emit('clear');
      }
    },

    async pick(): Promise<void> {
      if (!window.EyeDropper) {
        return;
      }

      try {
        const result = await new window.EyeDropper().open();
        this.$emit('commit', result.sRGBHex);
      } catch {
        // The user cancelled the pick (Escape) — nothing to do.
      }
    },
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.header {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: -8px;
}

.hex-field {
  @include field-fill;

  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 0 0 10px;
  cursor: text;

  &:hover {
    background: var(--field-surface-hover);
  }

  &:focus-within {
    @include field-active-border;
  }

  @include dark-mode {
    background: var(--field-surface-hover);

    &:hover {
      background: var(--field-surface-active);
    }
  }
}

.hex-swatch {
  @include swatch-edge(12%);

  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 4px;

  &.empty {
    @include empty-swatch;
  }
}

.hex-input {
  @include button-reset;

  flex: 1;
  min-width: 0;
  padding: 1px 10px 0 0;
  line-height: 26px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--field-ink);
  outline: none;

  &::placeholder {
    color: var(--field-placeholder);
  }
}

.header-action {
  @include button-reset;

  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;

  &:first-of-type {
    margin-left: 2px;
  }
  color: var(--icon-color);
  cursor: pointer;

  &:hover {
    background: var(--field-surface-hover);
    color: var(--field-ink);
  }

  @include focus-ring;
}
</style>
