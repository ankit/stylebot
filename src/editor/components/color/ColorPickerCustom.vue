<template>
  <div class="custom-tab">
    <color-picker-sv-square
      :saturation="hsva.s"
      :value="hsva.v"
      :hue-color="hueColor"
      :color="opaqueColor"
      @input="onSVInput"
      @change="onSVChange"
    />

    <color-picker-hue-slider
      :hue="hsva.h"
      @input="onHueInput"
      @change="onHueChange"
    />

    <color-picker-alpha-slider
      :alpha="hsva.a"
      :color="opaqueColor"
      @input="onAlphaInput"
      @change="onAlphaChange"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import tinycolor from 'tinycolor2';

import ColorPickerSvSquare from './ColorPickerSVSquare.vue';
import ColorPickerHueSlider from './ColorPickerHueSlider.vue';
import ColorPickerAlphaSlider from './ColorPickerAlphaSlider.vue';
import { parseToHsva, toCssColor, Hsva } from '../../utils/hsv-color';

export default Vue.extend({
  name: 'ColorPickerCustom',

  components: {
    ColorPickerSvSquare,
    ColorPickerHueSlider,
    ColorPickerAlphaSlider,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
  },

  data(): { hsva: Hsva } {
    return {
      hsva: parseToHsva(this.value),
    };
  },

  computed: {
    hueColor(): string {
      return tinycolor({ h: this.hsva.h, s: 1, v: 1 }).toHexString();
    },

    opaqueColor(): string {
      return tinycolor({
        h: this.hsva.h,
        s: this.hsva.s,
        v: this.hsva.v,
      }).toHexString();
    },

    currentColor(): string {
      return toCssColor(this.hsva);
    },
  },

  watch: {
    value(next: string): void {
      if (next !== this.currentColor) {
        this.hsva = parseToHsva(next);
      }
    },
  },

  methods: {
    onSVInput(payload: { saturation: number; value: number }): void {
      this.hsva = { ...this.hsva, s: payload.saturation, v: payload.value };
      this.$emit('input', this.currentColor);
    },

    onSVChange(payload: { saturation: number; value: number }): void {
      this.onSVInput(payload);
      this.$emit('commit', this.currentColor);
    },

    onHueInput(hue: number): void {
      this.hsva = { ...this.hsva, h: hue };
      this.$emit('input', this.currentColor);
    },

    onHueChange(hue: number): void {
      this.onHueInput(hue);
      this.$emit('commit', this.currentColor);
    },

    onAlphaInput(alpha: number): void {
      this.hsva = { ...this.hsva, a: alpha };
      this.$emit('input', this.currentColor);
    },

    onAlphaChange(alpha: number): void {
      this.onAlphaInput(alpha);
      this.$emit('commit', this.currentColor);
    },
  },
});
</script>

<style lang="scss" scoped>
.custom-tab {
  display: flex;
  flex-direction: column;
  gap: 11px;
  padding: 12px 14px 6px;
}
</style>
