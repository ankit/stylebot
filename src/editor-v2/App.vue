<template>
  <b-container class="stylebot">
    <the-header />

    <the-basic-editor v-if="mode === 'basic'" />
    <the-page-css-editor v-if="mode === 'page'" />
    <the-selector-css-editor v-if="mode === 'selector'" />

    <the-footer :mode="mode" @updateMode="mode = $event" />
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './components/TheHeader.vue';
import TheFooter from './components/TheFooter.vue';

import TheBasicEditor from './components/TheBasicEditor.vue';
import ThePageCssEditor from './components/ThePageCssEditor.vue';
import TheSelectorCssEditor from './components/TheSelectorCssEditor.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    ThePageCssEditor,
    TheSelectorCssEditor,
  },

  data(): any {
    return {
      mode: 'basic',
    };
  },
});
</script>

<style scoped>
.stylebot {
  top: 0;
  right: 0;
  height: 100%;
  position: fixed;
  background: #fff;
  width: 350px;
  z-index: 100000000;
  border: 1px solid #ccc;
  box-shadow: 1px solid #eee;
}
</style>
