<template>
  <v-list-item
    link
    :ripple="false"
    :disabled="disableToggle"
    :class="{ 'green lighten-4': enabled }"
    @click="toggleStyle"
  >
    <v-list-item-icon class="mr-6">
      <v-icon v-if="enabled" class="green--text text--darken-4">
        {{ icons.enabled }}
      </v-icon>

      <v-icon v-else>{{ icons.disabled }}</v-icon>
    </v-list-item-icon>

    <v-list-item-content>
      <v-list-item-title>{{ url }}</v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { mdiEye, mdiEyeOffOutline } from '@mdi/js';

export default Vue.extend({
  name: 'Style',
  props: ['tab', 'url', 'initialEnabled', 'disableToggle'],

  data(): {
    enabled: boolean;
    icons: {
      enabled: string;
      disabled: string;
    };
  } {
    return {
      enabled: this.initialEnabled,
      icons: {
        enabled: mdiEye,
        disabled: mdiEyeOffOutline,
      },
    };
  },

  methods: {
    toggleStyle(): void {
      if (this.enabled) {
        this.disableStyle();
      } else {
        this.enableStyle();
      }
    },

    enableStyle(): void {
      chrome.extension.sendRequest({
        tab: this.tab,
        styleUrl: this.url,
        name: 'enableStyleUrl',
      });

      this.enabled = true;
    },

    disableStyle(): void {
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
