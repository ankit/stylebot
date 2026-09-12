<template>
  <div class="footer">
    <the-editor-mode-actions />
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
});
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60px;
  background: var(--accent);
  border-top: 1px solid var(--border);
}
</style>
