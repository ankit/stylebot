<template>
  <b-list-group-item class="full-row-toggle" @click="onRowClick">
    <b-form-checkbox
      ref="checkbox"
      v-model="enabled"
      switch
      :disabled="disableToggle"
      @change="onChange"
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
    onRowClick(event: MouseEvent): void {
      if (this.disableToggle) {
        return;
      }

      const target = event.target as HTMLElement;

      // Already handled natively by the label/input itself.
      if (target.closest('label, input')) {
        return;
      }

      const checkbox = this.$refs.checkbox as Vue;
      const input = checkbox.$el.querySelector('input');
      input?.click();
    },

    onChange(): void {
      if (this.enabled) {
        this.enable();
      } else {
        this.disable();
      }
    },

    enable(): void {
      const message: EnableStyle = {
        name: 'EnableStyle',
        url: this.url,
      };

      chrome.runtime.sendMessage(message);
    },

    disable(): void {
      const message: DisableStyle = {
        name: 'DisableStyle',
        url: this.url,
      };

      chrome.runtime.sendMessage(message);
    },
  },
});
</script>
