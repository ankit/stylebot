<template>
  <menu-box>
    <theme-picker :theme="theme" @pick="pickTheme" />

    <font-picker :font="font" @pick="pickFont" />

    <segmented
      :prev-disabled="sizeIndex === 0"
      :next-disabled="sizeIndex === SIZES.length - 1"
      @prev="sizeDown"
      @next="sizeUp"
    >
      <template #prev>
        <span style="font: 400 11px/1 system-ui;">A</span>
      </template>
      <template #next>
        <span style="font: 400 17px/1 system-ui;">A</span>
      </template>
    </segmented>

    <segmented
      :prev-disabled="widthIndex === 0"
      :next-disabled="widthIndex === WIDTHS.length - 1"
      @prev="widthDown"
      @next="widthUp"
    >
      <template #prev>
        <span style="font: 400 12px/1 system-ui;">&rarr;&larr;</span>
      </template>
      <template #next>
        <span
          style="
            font: 400 12px/1 system-ui;
            display: inline-block;
            transform: scaleX(2.1);
          "
        >
          &harr;
        </span>
      </template>
    </segmented>

    <justify-toggle :justify="justify" @pick="pickJustify" />

    <div class="reset-row">
      <button class="reset" @click="reset">Reset</button>
    </div>
  </menu-box>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { defaultReadabilitySettings } from '@stylebot/settings';
import { SIZES, WIDTHS, nearestStepIndex } from '@stylebot/readability';
import { ReadabilitySettings, ReadabilityTheme } from '@stylebot/types';

import MenuBox from './MenuBox.vue';
import ThemePicker from './ThemePicker.vue';
import FontPicker from './FontPicker.vue';
import Segmented from './Segmented.vue';
import JustifyToggle from './JustifyToggle.vue';

export default Vue.extend({
  name: 'SettingsMenu',

  components: {
    MenuBox,
    ThemePicker,
    FontPicker,
    Segmented,
    JustifyToggle,
  },

  props: {
    theme: {
      type: String as PropType<ReadabilityTheme>,
      required: true,
    },

    font: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    width: {
      type: Number,
      required: true,
    },

    justify: {
      type: Boolean,
      required: true,
    },

    lineHeight: {
      type: Number,
      required: true,
    },
  },

  computed: {
    SIZES: () => SIZES,
    WIDTHS: () => WIDTHS,

    sizeIndex(): number {
      return nearestStepIndex(SIZES, this.size);
    },

    widthIndex(): number {
      return nearestStepIndex(WIDTHS, this.width);
    },
  },

  methods: {
    emitUpdate(patch: Partial<ReadabilitySettings>): void {
      const value: ReadabilitySettings = {
        theme: this.theme,
        font: this.font,
        size: this.size,
        width: this.width,
        justify: this.justify,
        lineHeight: this.lineHeight,
        ...patch,
      };
      this.$emit('update', value);
    },

    pickTheme(theme: ReadabilityTheme): void {
      this.emitUpdate({ theme });
    },

    pickFont(font: string): void {
      this.emitUpdate({ font });
    },

    pickJustify(justify: boolean): void {
      this.emitUpdate({ justify });
    },

    sizeDown(): void {
      this.emitUpdate({ size: SIZES[Math.max(0, this.sizeIndex - 1)] });
    },

    sizeUp(): void {
      this.emitUpdate({
        size: SIZES[Math.min(SIZES.length - 1, this.sizeIndex + 1)],
      });
    },

    widthDown(): void {
      this.emitUpdate({ width: WIDTHS[Math.max(0, this.widthIndex - 1)] });
    },

    widthUp(): void {
      this.emitUpdate({
        width: WIDTHS[Math.min(WIDTHS.length - 1, this.widthIndex + 1)],
      });
    },

    reset(): void {
      const {
        theme,
        font,
        size,
        width,
        justify,
        lineHeight,
      } = defaultReadabilitySettings;
      this.emitUpdate({ theme, font, size, width, justify, lineHeight });
    },
  },
});
</script>

<style lang="scss" scoped>
.reset-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.reset {
  all: unset;
  font: 400 11px/1.2 system-ui, -apple-system, sans-serif;
  cursor: pointer;
  text-decoration: underline;
  color: var(--muted-foreground);

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: 2px;
  }
}
</style>
