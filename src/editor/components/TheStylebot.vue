<template>
  <b-container class="stylebot" :class="position">
    <the-header />

    <the-basic-editor v-if="mode === 'Basic'" />
    <the-page-css-editor v-if="mode === 'Advanced'" />
    <the-selector-css-editor v-if="mode === 'Edit CSS'" />

    <the-footer :mode="mode" @updateMode="mode = $event" />
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './TheHeader.vue';
import TheFooter from './TheFooter.vue';

import TheBasicEditor from './TheBasicEditor.vue';
import ThePageCssEditor from './ThePageCssEditor.vue';
import TheSelectorCssEditor from './TheSelectorCssEditor.vue';

import { StylebotPlacement } from '../../types';

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    ThePageCssEditor,
    TheSelectorCssEditor,
  },

  computed: {
    mode(): string {
      return this.$store.state.options.mode;
    },

    position(): StylebotPlacement {
      return this.$store.state.position;
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot {
  top: 0;
  height: 100%;
  position: fixed;
  background: #fff;
  width: 350px;
  z-index: 100000000;
  border: 1px solid #ccc;
  box-shadow: 1px solid #eee;

  &.left {
    left: 0;
  }

  &.right {
    right: 0;
  }
}
</style>
