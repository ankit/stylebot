<template>
  <button
    @click="toggle"
    class="stylebot-inspector"
    :class="{ enabled: enabled }"
  >
    <select-search
      :size="36"
      v-tooltip="'Select an element in the page to style it'"
    />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import Highlighter from '../highlighter/Highlighter';
import SelectSearch from 'vue-material-design-icons/SelectSearch.vue';

export default Vue.extend({
  name: 'TheInspector',
  components: {
    SelectSearch,
  },
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
  float: left;
  border: 1px solid #ddd;
}

.stylebot-inspector:hover {
  border: 1px solid #333;
  cursor: pointer;
}
</style>
