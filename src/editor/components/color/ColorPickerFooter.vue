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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import tinycolor from 'tinycolor2';
import { tinycolorToCssColor } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerFooter',

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data(): { focused: boolean; draft: string } {
    return {
      focused: false,
      draft: '',
    };
  },

  computed: {
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
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.footer {
  padding: 10px 14px;
}

.value-field {
  @include button-reset;
  @include field-border(8px);
  display: block;
  width: 100%;
  padding: 6px 10px;
  font: 400 13px/1.2 var(--font-mono);
  color: var(--text-primary);

  &:focus {
    @include field-active-border;
  }
}
</style>
