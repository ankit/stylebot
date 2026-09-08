<template>
  <dock-button
    class="more-btn"
    :class="{ active }"
    :disabled="disabled"
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

    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.more-btn {
  font-weight: 700;
  font-size: 18px;
  line-height: 1;

  &.active {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }
}
</style>
