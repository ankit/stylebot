<template>
  <b-list-group-item>
    <b-form-checkbox v-model="readability" switch @change="toggle">
      Readability
    </b-form-checkbox>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';

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
    toggle(): void {
      chrome.tabs.getSelected(tab => {
        if (tab.id) {
          chrome.tabs.sendRequest(tab.id, {
            name: 'toggleReadability',
          });
        }
      });
    },
  },
});
</script>
