<template>
  <dock-button :disabled="disabled" @click="$emit('click')">
    <toggle-icon />
  </dock-button>
</template>

<script lang="ts">
import Vue from 'vue';

import DockButton from './DockButton.vue';
import { ToggleIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'CloseButton',

  components: {
    DockButton,
    ToggleIcon,
  },

  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
