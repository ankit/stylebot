<template>
  <button
    title="View Options"
    @click="viewOptions"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <b-icon v-if="!isHovered" icon="gear" />
    <b-icon v-if="isHovered" icon="gear-fill" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheOptionsAction',

  data(): { isHovered: boolean } {
    return {
      isHovered: false,
    };
  },

  methods: {
    viewOptions(): void {
      openOptionsPage();
    },
  },
});
</script>
