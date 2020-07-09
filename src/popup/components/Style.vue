<template>
  <b-list-group-item
    button
    @click="toggle"
    :disabled="disableToggle"
    :variant="enabled ? 'success' : 'default'"
  >
    <b-icon v-if="enabled" icon="eye-fill" />
    <b-icon v-else icon="eye-slash" />

    <span class="pl-2">{{ url }}</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';

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
      chrome.extension.sendRequest({
        tab: this.tab,
        styleUrl: this.url,
        name: 'enableStyleUrl',
      });

      this.enabled = true;
    },

    disable(): void {
      chrome.extension.sendRequest({
        tab: this.tab,
        styleUrl: this.url,
        name: 'disableStyleUrl',
      });

      this.enabled = false;
    },
  },
});
</script>
