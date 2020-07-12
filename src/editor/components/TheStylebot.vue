<template>
  <b-container class="stylebot" :class="position">
    <the-header />

    <div class="stylebot-body">
      <the-basic-editor v-if="mode === 'basic'" />
      <the-magic-editor v-else-if="mode === 'magic'" />
      <the-code-editor v-else-if="mode === 'code'" />
    </div>

    <the-footer />
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './TheHeader.vue';
import TheFooter from './TheFooter.vue';

import TheBasicEditor from './TheBasicEditor.vue';
import TheMagicEditor from './TheMagicEditor.vue';
import TheCodeEditor from './TheCodeEditor.vue';

import { StylebotPlacement, StylebotEditingMode } from '../../types';

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    TheMagicEditor,
    TheCodeEditor,
  },

  computed: {
    mode(): StylebotEditingMode {
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
  color: #000;
  height: 100%;
  position: fixed;
  padding: 0;
  background: #fff;
  width: 375px;
  z-index: 100000000;
  border: 1px solid #ccc;

  &.left {
    left: 0;
  }

  &.right {
    right: 0;
  }
}

.stylebot-body {
  overflow: auto;
  padding-bottom: 50px;
  height: calc(100% - 154px);
}
</style>
