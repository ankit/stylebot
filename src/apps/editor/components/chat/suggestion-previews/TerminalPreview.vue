<template>
  <span class="terminal" :style="palette">
    <span class="prompt">&gt;</span>
    <span class="cursor" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

// Phosphor green, then the editor themes Terminal takes turns with.
const PALETTES: Record<string, Record<string, string>> = {
  '': {
    '--screen': '#0c0f0c',
    '--frame': '#1f4a2a',
    '--prompt': '#3fdc6a',
    '--cursor': '#3fdc6a',
  },
  Dracula: {
    '--screen': '#282a36',
    '--frame': '#44475a',
    '--prompt': '#ff79c6',
    '--cursor': '#bd93f9',
  },
  Everforest: {
    '--screen': '#2d353b',
    '--frame': '#475258',
    '--prompt': '#e69875',
    '--cursor': '#a7c080',
  },
};

export default Vue.extend({
  name: 'TerminalPreview',

  props: {
    theme: {
      type: String,
      default: '',
    },
  },

  computed: {
    palette(): Record<string, string> {
      return PALETTES[this.theme] ?? PALETTES[''];
    },
  },
});
</script>

<style lang="scss" scoped>
.terminal {
  border: 1px solid var(--frame);
  background: var(--screen);
}

.prompt {
  font: 600 18px/1 var(--font-mono);
  color: var(--prompt);
}

.cursor {
  width: 9px;
  height: 17px;
  background: var(--cursor);
  box-shadow: 0 0 8px var(--cursor);
}
</style>
