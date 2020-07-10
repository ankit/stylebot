<template>
  <button
    title="View Options"
    @click="viewOptions"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <b-icon icon="gear" v-if="!isHovered" />
    <b-icon icon="gear-fill" v-if="isHovered" />
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
