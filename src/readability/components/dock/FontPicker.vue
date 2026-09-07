<template>
  <div class="fonts">
    <button
      v-for="fontOption in fontList"
      :key="fontOption"
      class="font"
      :class="{ selected: fontOption === font }"
      :style="{ fontFamily: fontOption }"
      @click="$emit('pick', fontOption)"
    >
      {{ fontOption }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { StylebotFonts } from '@stylebot/types';
import {
  addGoogleWebFont,
  getCssWithExpandedImports,
  injectCSSIntoDocument,
} from '@stylebot/css';

// Kept apart from `defaultOptions.fonts`, which also powers the
// general-purpose Text panel and needs display/code fonts too.
const READABILITY_FONTS: StylebotFonts = [
  'Merriweather',
  'Georgia',
  'Lora',
  'Helvetica',
];

export default Vue.extend({
  name: 'FontPicker',

  props: {
    font: {
      type: String,
      required: true,
    },
  },

  computed: {
    fontList: () => READABILITY_FONTS,
  },

  // The list renders every font in its own face, not just the active one —
  // load them all as soon as the picker is shown, not upfront.
  mounted() {
    this.preloadFonts();
  },

  methods: {
    async preloadFonts(): Promise<void> {
      READABILITY_FONTS.forEach(async fontOption => {
        // No-op for non-Google-hosted names (e.g. Georgia, Helvetica) —
        // addGoogleWebFont resolves with the input CSS unchanged on a 400.
        const css = await addGoogleWebFont(fontOption, '');
        const expandedCss = await getCssWithExpandedImports(css);
        await injectCSSIntoDocument(
          expandedCss,
          `reader-font-preview-${fontOption}`
        );
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.fonts {
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.font {
  all: unset;
  box-sizing: border-box;
  padding: 7px 8px;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  color: var(--main-foreground);

  & + & {
    border-top: 1px solid var(--border-color);
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  &.selected {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--link-color);
  }

  &:focus-visible {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--link-color);
  }
}
</style>
