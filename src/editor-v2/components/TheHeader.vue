<template>
  <div class="stylebot-header">
    <the-inspector />

    <div class="stylebot-window-controls">
      <cog-outline :size="20" />
      <close-circle-outline :size="20" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TheInspector from './TheInspector.vue';
import CogOutline from 'vue-material-design-icons/CogOutline.vue';
import CloseCircleOutline from 'vue-material-design-icons/CloseCircleOutline.vue';

export default Vue.extend({
  name: 'TheHeader',
  components: {
    TheInspector,
    CogOutline,
    CloseCircleOutline,
  },
});
</script>

<style scoped>
.stylebot-header {
  height: 50px;
  padding: 5px;
  background: #eee;
}

.stylebot-window-controls {
  float: right;
}
</style>
