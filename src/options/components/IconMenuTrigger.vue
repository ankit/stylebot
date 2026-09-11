<template>
  <icon-button :bordered="bordered" :size="size" :title="title" @click="$emit('click', $event)">
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

    // Per-row triggers sit next to Edit and don't need a border; the
    // standalone bulk-actions trigger has no neighbor, so it keeps one.
    bordered: {
      type: Boolean,
      default: true,
    },
  },
});
</script>
