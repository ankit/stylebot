<template>
  <img
    v-if="!failed"
    class="s-thumbnail"
    :class="{ small }"
    :src="src"
    :alt="alt"
    :style="sizeStyle"
    @error="failed = true"
  />
</template>

<script lang="ts">
import Vue from 'vue';

// Up to this width, a thumbnail sits beside text and takes smaller corners.
const SMALL_WIDTH = 120;

/**
 * A screenshot shown as a thumbnail, cropped from the top. Fills its
 * container at 16:10 unless given a size, and hides itself if the image
 * can't load, as when a page's content security policy blocks it.
 */
export default Vue.extend({
  name: 'SThumbnail',

  props: {
    src: {
      type: String,
      required: true,
    },

    alt: {
      type: String,
      default: '',
    },

    width: {
      type: Number,
      default: 0,
    },

    height: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      failed: false,
    };
  },

  computed: {
    small(): boolean {
      return this.width > 0 && this.width <= SMALL_WIDTH;
    },

    sizeStyle(): Record<string, string> {
      return this.width && this.height
        ? { width: `${this.width}px`, height: `${this.height}px` }
        : {};
    },
  },

  watch: {
    src(): void {
      this.failed = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.s-thumbnail {
  display: block;
  flex: none;
  box-sizing: border-box;
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  object-fit: cover;
  object-position: top left;

  &.small {
    border-radius: 6px;
  }
}
</style>
