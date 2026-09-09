<template>
  <segmented
    :prev-active="!justify"
    :next-active="justify"
    @prev="$emit('pick', false)"
    @next="$emit('pick', true)"
  >
    <template #prev><icon-align-left /></template>
    <template #next><icon-align-justify /></template>
  </segmented>
</template>

<script lang="ts">
import Vue from 'vue';

import Segmented from './Segmented.vue';
import { IconAlignLeft, IconAlignJustify } from '@stylebot/icons';

export default Vue.extend({
  name: 'JustifyToggle',

  components: {
    Segmented,
    IconAlignLeft,
    IconAlignJustify,
  },

  props: {
    justify: {
      type: Boolean,
      required: true,
    },
  },
});
</script>
