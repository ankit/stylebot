<template>
  <b-list-group-item class="full-row-toggle" @click="onRowClick">
    <b-form-checkbox
      ref="checkbox"
      v-model="readability"
      switch
      @change="onChange"
    >
      {{ t('readability') }}
    </b-form-checkbox>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleReadabilityForTab } from '@stylebot/types';

export default Vue.extend({
  name: 'Readability',
  props: {
    initialReadability: Boolean,
  },

  data(): {
    readability: boolean;
  } {
    return {
      readability: this.initialReadability,
    };
  },

  watch: {
    initialReadability(newVal: boolean): void {
      this.readability = newVal;
    },
  },

  methods: {
    onRowClick(event: MouseEvent): void {
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
      chrome.tabs.query({ active: true }, ([tab]) => {
        if (tab.id) {
          const message: ToggleReadabilityForTab = {
            name: 'ToggleReadabilityForTab',
          };

          chrome.tabs.sendMessage(tab.id, message);
        }
      });
    },
  },
});
</script>
