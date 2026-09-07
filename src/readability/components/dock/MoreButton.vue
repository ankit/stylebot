<template>
  <dock-button
    class="more-btn"
    :class="{ active }"
    aria-haspopup="true"
    :aria-expanded="active"
    @click="$emit('click')"
  >
    &#8942;
  </dock-button>
</template>

<script lang="ts">
import Vue from 'vue';

import DockButton from './DockButton.vue';

export default Vue.extend({
  name: 'MoreButton',

  components: {
    DockButton,
  },

  props: {
    active: {
      type: Boolean,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.more-btn {
  font: 700 18px/1 system-ui, -apple-system, sans-serif;

  &.active {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }
}
</style>
