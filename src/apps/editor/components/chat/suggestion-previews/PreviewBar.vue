<template>
  <span class="preview-bar" :class="{ accent }" :style="style" />
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A line of text in a suggestion preview, in the color the preview sets
 * with --bar, or --bar-accent for a link or headline.
 */
export default Vue.extend({
  name: 'PreviewBar',

  props: {
    // As a percentage of the space it sits in.
    width: {
      type: Number,
      default: 100,
    },

    height: {
      type: Number,
      default: 3,
    },

    accent: Boolean,

    fade: {
      type: Number,
      default: 1,
    },
  },

  computed: {
    style(): Record<string, string | number> {
      return {
        width: `${this.width}%`,
        height: `${this.height}px`,
        ...(this.fade < 1 ? { opacity: this.fade } : {}),
      };
    },
  },
});
</script>

<style lang="scss" scoped>
.preview-bar {
  display: block;
  flex: none;
  border-radius: var(--bar-radius, 2px);
  background: var(--bar, var(--muted));
}

.accent {
  background: var(--bar-accent);
}
</style>
