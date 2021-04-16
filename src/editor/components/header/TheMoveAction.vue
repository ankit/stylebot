<template>
  <button
    :title="`${t('move_and_resize')}`"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <b-icon v-if="!isHovered" icon="arrows-move" />
    <b-icon v-if="isHovered" icon="arrows-move" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheMoveAction',

  data(): { isHovered: boolean } {
    return {
      isHovered: false,
    };
  },
});
</script>
