<template>
  <div class="tooltip" :style="{ top: top + 'px', left: left + 'px' }">
    {{ text }}
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

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
  color: var(--main-foreground);
  border: 1px solid var(--border-color);
  font: 400 11.5px/1.2 system-ui, -apple-system, sans-serif;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.14);
}
</style>
