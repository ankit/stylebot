<template>
  <span class="spinner" aria-hidden="true">{{ frame }}</span>
</template>

<script lang="ts">
import Vue from 'vue';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAME_MS = 80;

/**
 * A terminal's braille spinner, while the agent runs commands.
 */
export default Vue.extend({
  name: 'CliSpinner',

  data() {
    return { tick: 0, timer: 0 };
  },

  computed: {
    frame(): string {
      return FRAMES[this.tick % FRAMES.length];
    },
  },

  mounted() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.timer = window.setInterval(() => this.tick++, FRAME_MS);
    }
  },

  beforeDestroy() {
    clearInterval(this.timer);
  },
});
</script>

<style lang="scss" scoped>
.spinner {
  color: var(--term-accent);
}
</style>
