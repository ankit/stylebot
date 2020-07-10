<template>
  <b-list-group-item
    button
    :disabled="disableToggle"
    :variant="enabled ? 'success' : 'default'"
    @click="toggle"
  >
    <b-icon v-if="enabled" icon="eye-fill" />
    <b-icon v-else icon="eye-slash" />

    <span class="pl-2">{{ url }}</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  EnableStyleRequest,
  DisableStyleRequest,
} from '../../types/BackgroundPageRequest';

export default Vue.extend({
  name: 'Style',
  props: ['tab', 'url', 'initialEnabled', 'disableToggle'],

  data(): {
    enabled: boolean;
  } {
    return {
      enabled: this.initialEnabled,
    };
  },

  methods: {
    toggle(): void {
      if (this.enabled) {
        this.disable();
      } else {
        this.enable();
      }
    },

    enable(): void {
      const request: EnableStyleRequest = {
        name: 'enableStyle',
        url: this.url,
      };

      chrome.extension.sendRequest(request);
      this.enabled = true;
    },

    disable(): void {
      const request: DisableStyleRequest = {
        name: 'disableStyle',
        url: this.url,
      };

      chrome.extension.sendRequest(request);
      this.enabled = false;
    },
  },
});
</script>
