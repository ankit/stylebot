<template>
  <dock-button
    class="typography"
    :class="{ active }"
    aria-haspopup="true"
    :aria-expanded="active"
    @click="$emit('click')"
    @hover="$emit('hover', $event)"
    @unhover="$emit('unhover')"
  >
    Aa
  </dock-button>
</template>

<script lang="ts">
import Vue from 'vue';

import DockButton from './DockButton.vue';

export default Vue.extend({
  name: 'TypographyButton',

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
.typography {
  font: 500 15px/1 system-ui, -apple-system, sans-serif;

  &.active {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }
}
</style>
