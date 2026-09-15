<template>
  <div class="footer">
    <input
      class="value-field"
      spellcheck="false"
      :value="focused ? draft : displayValue"
      @focus="onFocus"
      @input="onInput"
      @blur="onBlur"
    />

    <s-segmented-control v-model="format" fit class="format-toggle" :options="formatOptions" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import tinycolor from 'tinycolor2';
import { SSegmentedControl } from '@stylebot/components';

type Format = 'hex' | 'rgb';

export default Vue.extend({
  name: 'ColorPickerFooter',

  components: {
    SSegmentedControl,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data(): { format: Format; focused: boolean; draft: string } {
    return {
      format: 'hex',
      focused: false,
      draft: '',
    };
  },

  computed: {
    formatOptions(): Array<{ value: Format; label: string }> {
      return [
        { value: 'hex', label: this.t('color_picker_format_hex') },
        { value: 'rgb', label: this.t('color_picker_format_rgb') },
      ];
    },

    displayValue(): string {
      const color = tinycolor(this.value);
      if (!color.isValid()) {
        return this.value;
      }

      return this.format === 'rgb' ? color.toRgbString() : color.toHexString();
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
        this.$emit('input', this.toCssColor(color));
      }
    },

    onBlur(): void {
      this.focused = false;

      const color = tinycolor(this.draft);
      if (color.isValid()) {
        this.$emit('commit', this.toCssColor(color));
      }
    },

    toCssColor(color: tinycolor.Instance): string {
      return color.getAlpha() < 1 ? color.toRgbString() : color.toHexString();
    },
  },
});
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
}

.value-field {
  @include button-reset;
  @include field-border(8px);
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font: 400 13px/1.2 var(--font-mono);
  color: var(--text-primary);

  &:focus {
    @include field-active-border;
  }
}

.format-toggle {
  flex: none;
}
</style>
