<template>
  <b-list-group-item button @click="open">
    <b-icon icon="gear" />
    <span class="pl-2">{{ t('view_options') }}</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ViewOptions',

  methods: {
    open(): void {
      chrome.runtime.openOptionsPage();
    },
  },
});
</script>
