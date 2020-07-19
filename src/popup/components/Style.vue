<template>
  <b-list-group-item>
    <b-form-checkbox
      v-model="enabled"
      switch
      :disabled="disableToggle"
      @change="toggle"
    >
      {{ url }}
    </b-form-checkbox>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { EnableStyleRequest, DisableStyleRequest } from '@stylebot/types';

export default Vue.extend({
  name: 'Style',
  props: {
    url: {
      type: String,
      required: true,
    },
    disableToggle: {
      type: Boolean,
    },
    initialEnabled: {
      type: Boolean,
    },
  },

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
