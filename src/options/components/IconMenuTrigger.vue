<template>
  <icon-button bordered :size="size" :title="title" @click="$emit('click', $event)">
    <more-icon />
  </icon-button>
</template>

<script lang="ts">
import Vue from 'vue';

import { IconButton } from '@stylebot/components';
import { MoreIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'IconMenuTrigger',

  components: {
    IconButton,
    MoreIcon,
  },

  props: {
    // 38 for the bulk-actions trigger next to search, 30 for per-row/editor triggers.
    size: {
      type: Number,
      default: 38,
    },

    title: {
      type: String,
      default: '',
    },
  },
});
</script>
