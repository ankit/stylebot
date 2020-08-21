<template>
  <b-row class="footer" align-v="center" no-gutters>
    <b-col><the-editor-mode-actions /></b-col>
  </b-row>
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
  height: 62px;
  text-align: center;
  background: #eee;
}
</style>
