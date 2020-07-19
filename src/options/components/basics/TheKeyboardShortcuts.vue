<template>
  <div>
    <h5>Keyboard Shortcuts</h5>
    <a href="#" @click="click">Customize</a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { OpenCommandsPageRequest } from '../../../types';

export default Vue.extend({
  name: 'TheKeyboardShortcuts',
  methods: {
    click(event: MouseEvent) {
      event.preventDefault();

      const request: OpenCommandsPageRequest = {
        name: 'openCommandsPage',
      };

      chrome.extension.sendRequest(request);
    },
  },
});
</script>
