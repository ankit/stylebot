<template>
  <div class="footer justify-content-md-between" no-gutters>
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
  width: 100%;
  padding: 20px;
  text-align: center;
  background: #eee;
}
</style>
