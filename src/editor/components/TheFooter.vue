<template>
  <div class="stylebot-footer justify-content-md-between" no-gutters>
    <the-editor-mode-actions
      :mode="mode"
      @update="$emit('updateMode', $event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheEditorModeActions from './footer/TheEditorModeActions.vue';

export default Vue.extend({
  name: 'TheFooter',

  components: {
    TheEditorModeActions,
  },

  props: ['mode'],
});
</script>

<style scoped>
.stylebot-footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 20px;
  text-align: center;
  background: #eee;
}
</style>
