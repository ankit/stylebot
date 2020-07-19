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
import { EnableStyle, DisableStyle } from '@stylebot/types';

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
      const message: EnableStyle = {
        name: 'EnableStyle',
        url: this.url,
      };

      chrome.runtime.sendMessage(message);
      this.enabled = true;
    },

    disable(): void {
      const message: DisableStyle = {
        name: 'DisableStyle',
        url: this.url,
      };

      chrome.runtime.sendMessage(message);
      this.enabled = false;
    },
  },
});
</script>
