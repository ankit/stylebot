<template>
  <button
    title="View Options"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    v-b-tooltip.hover.nofade.ds1000="{ customClass: 'stylebot-tooltip' }"
  >
    <b-icon icon="gear" v-if="!isHovered" />
    <b-icon icon="gear-fill" v-if="isHovered" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheOptionsAction',

  data(): any {
    return {
      isHovered: false,
    };
  },
});
</script>
