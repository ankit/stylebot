<template>
  <button
    @click="toggle"
    class="stylebot-inspector"
    :class="{ enabled: enabled }"
    v-b-tooltip.hover.nofade="{ customClass: 'stylebot-tooltip' }"
    title="Select an element in the page to style it"
  >
    <b-icon icon="cursor" font-scale="2" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import Highlighter from '../highlighter/Highlighter';

export default Vue.extend({
  name: 'TheInspector',
  data(): {
    enabled: boolean;
    highlighter: Highlighter;
  } {
    return {
      enabled: false,
      highlighter: new Highlighter(),
    };
  },

  methods: {
    toggle(): void {
      if (this.enabled) {
        this.enabled = false;
        this.highlighter.stopInspecting();
      } else {
        this.enabled = true;
        this.highlighter.startInspecting();
      }
    },
  },
});
</script>

<style scoped>
.stylebot-inspector {
  width: 50px;
  padding: 4px;
  border: 1px solid #ddd;
}

.stylebot-inspector:hover {
  border: 1px solid #333;
  cursor: pointer;
}
</style>
