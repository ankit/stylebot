<template>
  <the-stylebot-resizer>
    <the-header />

    <div class="stylebot-body">
      <the-basic-editor v-if="mode === 'basic'" />
      <the-magic-editor v-else-if="mode === 'magic'" />
      <the-code-editor v-else-if="mode === 'code' && !resizing" />
    </div>

    <the-footer />
  </the-stylebot-resizer>
</template>

<script lang="ts">
import Vue from 'vue';

import TheHeader from './TheHeader.vue';
import TheFooter from './TheFooter.vue';
import TheCodeEditor from './TheCodeEditor.vue';
import TheBasicEditor from './TheBasicEditor.vue';
import TheMagicEditor from './TheMagicEditor.vue';
import TheStylebotResizer from './TheStylebotResizer.vue';

import { StylebotCoordinates, StylebotEditingMode } from '@stylebot/types';

export default Vue.extend({
  name: 'TheStylebot',

  components: {
    TheHeader,
    TheFooter,
    TheBasicEditor,
    TheMagicEditor,
    TheCodeEditor,
    TheStylebotResizer,
  },

  computed: {
    mode(): StylebotEditingMode {
      return this.$store.state.options.mode;
    },
  },
});
</script>

<style lang="scss">
.stylebot {
  top: 0;
  padding: 0;
  color: #000;
  line-height: 20px;
  background: #fff;
}

.stylebot-body {
  overflow: auto;
  height: calc(100% - 131px);
}
</style>
