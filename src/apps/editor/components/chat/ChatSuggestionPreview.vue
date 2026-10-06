<template>
  <span class="preview" aria-hidden="true">
    <component
      :is="preview"
      v-if="preview"
      class="drawing"
      :theme="theme || undefined"
    />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import type { VueConstructor } from 'vue';

import { SUGGESTION_PREVIEWS } from './suggestion-previews';

/**
 * A small picture of what a suggestion does: a mark in each look's own
 * colors, or a sketch of the page change for the practical ones. Sets the
 * palette the drawings share.
 */
export default Vue.extend({
  name: 'ChatSuggestionPreview',

  props: {
    id: {
      type: String,
      required: true,
    },

    // The named theme's name, for its palette.
    theme: {
      type: String,
      default: '',
    },
  },

  computed: {
    preview(): VueConstructor | undefined {
      return SUGGESTION_PREVIEWS[this.id];
    },
  },
});
</script>

<style lang="scss" scoped>
.preview {
  --lightness: 0.62;
  --green: oklch(var(--lightness) 0.12 150);
  --yellow: oklch(var(--lightness) 0.12 85);
  --pink: oklch(var(--lightness) 0.12 350);
  --muted: #c4c8cf;

  display: block;
  height: 100%;
  background: var(--hover-tint);

  @include dark-mode {
    --lightness: 0.78;
    --muted: #5a5e66;

    background: #2c2e33;
  }
}

.drawing {
  position: relative;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 6%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap, 6px);
  height: 100%;
  box-sizing: border-box;
}
</style>
