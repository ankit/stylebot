<template>
  <menu-box>
    <theme-picker :theme="theme" @pick="pickTheme" />

    <font-picker :font="font" @pick="pickFont" />

    <font-size-picker :size="size" @pick="pickSize" />

    <width-picker :width="width" @pick="pickWidth" />

    <justify-toggle :justify="justify" @pick="pickJustify" />

    <div class="reset-row">
      <button class="reset" @click="reset">Reset</button>
    </div>
  </menu-box>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { defaultReadabilitySettings } from '@stylebot/settings';
import { ReadabilitySettings, ReadabilityTheme } from '@stylebot/types';

import { MenuBox } from '@stylebot/components';
import ThemePicker from './ThemePicker.vue';
import FontPicker from './FontPicker.vue';
import FontSizePicker from './FontSizePicker.vue';
import WidthPicker from './WidthPicker.vue';
import JustifyToggle from './JustifyToggle.vue';

export default Vue.extend({
  name: 'SettingsMenu',

  components: {
    MenuBox,
    ThemePicker,
    FontPicker,
    FontSizePicker,
    WidthPicker,
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

    pickSize(size: number): void {
      this.emitUpdate({ size });
    },

    pickWidth(width: number): void {
      this.emitUpdate({ width });
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
  font-weight: 400;
  font-size: 11px;
  line-height: 1.2;
  cursor: pointer;
  text-decoration: underline;
  color: var(--muted-foreground);

  &:focus-visible {
    outline: 2px solid var(--link-color);
    outline-offset: 2px;
  }
}
</style>
