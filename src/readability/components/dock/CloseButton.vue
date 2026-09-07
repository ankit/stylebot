<template>
  <dock-button @click="$emit('click')" @hover="$emit('hover', $event)" @unhover="$emit('unhover')">
    <icon-close />
  </dock-button>
</template>

<script lang="ts">
import Vue from 'vue';

import DockButton from './DockButton.vue';
import IconClose from '../icons/IconClose.vue';

export default Vue.extend({
  name: 'CloseButton',

  components: {
    DockButton,
    IconClose,
  },
});
</script>
