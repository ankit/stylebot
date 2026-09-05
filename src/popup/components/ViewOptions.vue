<template>
  <b-list-group-item button @click="open">
    <gear-icon />
    <span class="pl-2">{{ t('view_options') }}</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';

import GearIcon from './icons/GearIcon.vue';

export default Vue.extend({
  name: 'ViewOptions',

  components: {
    GearIcon,
  },

  methods: {
    open(): void {
      chrome.runtime.openOptionsPage();
      window.close();
    },
  },
});
</script>
