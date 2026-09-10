<template>
  <dock-button
    class="typography"
    :class="{ active }"
    :disabled="disabled"
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

    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.typography {
  font-weight: 500;
  font-size: 15px;
  line-height: 1;

  &.active {
    background: color-mix(in srgb, var(--foreground) 6%, transparent);
    color: var(--foreground);
  }
}
</style>
