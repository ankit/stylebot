<template>
  <button
    title="Move Left"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    v-b-tooltip.hover.nofade.ds1000="{ customClass: 'stylebot-tooltip' }"
  >
    <b-icon icon="arrow-left-circle" v-if="!isHovered" />
    <b-icon icon="arrow-left-circle-fill" v-if="isHovered" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheMoveAction',

  data(): any {
    return {
      isHovered: false,
    };
  },
});
</script>
