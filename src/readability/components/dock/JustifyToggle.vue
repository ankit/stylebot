<template>
  <segmented
    :prev-active="!justify"
    :next-active="justify"
    @prev="$emit('pick', false)"
    @next="$emit('pick', true)"
  >
    <template #prev><align-left-bars-icon /></template>
    <template #next><align-justify-icon /></template>
  </segmented>
</template>

<script lang="ts">
import Vue from 'vue';

import Segmented from './Segmented.vue';
import { AlignLeftBarsIcon, AlignJustifyIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'JustifyToggle',

  components: {
    Segmented,
    AlignLeftBarsIcon,
    AlignJustifyIcon,
  },

  props: {
    justify: {
      type: Boolean,
      required: true,
    },
  },
});
</script>
