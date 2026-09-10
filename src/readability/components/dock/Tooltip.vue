<template>
  <div ref="el" class="tooltip" :style="{ top: `${top}px`, left: `${left + offsetX}px` }">
    {{ text }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

// Minimum gap kept between the tooltip and the viewport edge.
const EDGE_MARGIN = 8;

export default Vue.extend({
  name: 'Tooltip',

  props: {
    text: {
      type: String,
      required: true,
    },

    top: {
      type: Number,
      required: true,
    },

    left: {
      type: Number,
      required: true,
    },
  },

  data(): {
    offsetX: number;
  } {
    return {
      offsetX: 0,
    };
  },

  mounted() {
    // Centered under the trigger by default (see the .tooltip transform);
    // nudge back on-screen if that would run past a viewport edge.
    this.$nextTick(() => {
      const el = this.$refs.el as HTMLElement;
      const rect = el.getBoundingClientRect();

      if (rect.right > window.innerWidth - EDGE_MARGIN) {
        this.offsetX = window.innerWidth - EDGE_MARGIN - rect.right;
      } else if (rect.left < EDGE_MARGIN) {
        this.offsetX = EDGE_MARGIN - rect.left;
      }
    });
  },
});
</script>

<style lang="scss" scoped>
.tooltip {
  position: fixed;
  transform: translateX(-50%);
  z-index: 70;
  pointer-events: none;
  white-space: nowrap;
  padding: 4px 7px;
  border-radius: 6px;
  background: var(--main-background);
  color: var(--foreground);
  border: 1px solid var(--border-color);
  font-weight: 400;
  font-size: 11.5px;
  line-height: 1.2;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.14);
}
</style>
