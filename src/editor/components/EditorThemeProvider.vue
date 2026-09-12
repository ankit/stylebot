<template>
  <theme-provider class="editor-theme-provider"><slot /></theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import { ThemeProvider } from '@stylebot/components';

export default Vue.extend({
  name: 'EditorThemeProvider',

  components: {
    ThemeProvider,
  },
});
</script>

<style lang="scss" scoped>
.editor-theme-provider {
  --box-model-margin: rgb(255 155 0 / 30%);
  --box-model-border: rgb(255 200 50 / 30%);
  --box-model-padding: rgb(77 200 0 / 30%);
  --box-model-content: rgb(120 170 210 / 70%);
}
</style>
