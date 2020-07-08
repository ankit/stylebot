<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'InjectMonacoEditorIframe',

  created() {
    this.injectIframe();
  },

  methods: {
    injectIframe(): void {
      const iframe = document.createElement('iframe');

      iframe.id = 'stylebot-monaco-editor';
      iframe.setAttribute(
        'src',
        chrome.runtime.getURL('monaco-editor/iframe/index.html')
      );

      iframe.classList.add('hidden');
      document.body.appendChild(iframe);
    },
  },
});
</script>

<style lang="scss">
#stylebot-monaco-editor {
  border: none;
  position: absolute;
  top: 115px;
  left: 0px;
  width: 100%;
  height: calc(100% - 250px);
  z-index: 100000000000;

  &.hidden {
    display: none;
  }
}
</style>
