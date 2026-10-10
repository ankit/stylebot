<template>
  <s-list-item compact>
    <template #meta>
      <s-text as="span" size="large" medium class="label">{{ label }}</s-text>
    </template>
    <template #trailing><slot /></template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

import { SListItem, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'ShortcutRow',

  components: {
    SListItem,
    SText,
  },

  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.label {
  @include truncate;
}
</style>
