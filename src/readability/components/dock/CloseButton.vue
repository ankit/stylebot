<template>
  <dock-button
    :disabled="disabled"
    @click="$emit('click')"
    @hover="$emit('hover', $event)"
    @unhover="$emit('unhover')"
  >
    <icon-toggle />
  </dock-button>
</template>

<script lang="ts">
import Vue from 'vue';

import DockButton from './DockButton.vue';
import { IconToggle } from '@stylebot/icons';

export default Vue.extend({
  name: 'CloseButton',

  components: {
    DockButton,
    IconToggle,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
