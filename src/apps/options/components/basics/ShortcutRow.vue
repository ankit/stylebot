<template>
  <s-list-item compact>
    <template #title>{{ label }}</template>
    <template #trailing><slot /></template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

import { SListItem } from '@stylebot/components';

export default Vue.extend({
  name: 'ShortcutRow',

  components: {
    SListItem,
  },

  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>
