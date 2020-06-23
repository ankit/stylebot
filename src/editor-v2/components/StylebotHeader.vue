<template>
  <div class="stylebot-header">
    <button class="stylebot-element-selection">
      <select-search size="36" />
    </button>

    <div class="stylebot-window-controls">
      <cog-outline size="20" />
      <close-circle-outline size="20" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CloseCircleOutline from 'vue-material-design-icons/CloseCircleOutline.vue';
import CogOutline from 'vue-material-design-icons/CogOutline.vue';
import SelectSearch from 'vue-material-design-icons/SelectSearch.vue';

export default Vue.extend({
  name: 'StylebotHeader',
  components: {
    CloseCircleOutline,
    CogOutline,
    SelectSearch,
  },
});
</script>

<style scoped>
.stylebot-header {
  height: 50px;
  padding: 5px;
  background: #eee;
}

.stylebot-element-selection {
  width: 50px;
  padding: 4px;
  float: left;
  border: 1px solid #ddd;
}

.stylebot-element-selection:hover {
  border: 1px solid #333;
  cursor: pointer;
}

.stylebot-window-controls {
  float: right;
}
</style>
