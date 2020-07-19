<template>
  <b-list-group-item button @click="toggle">
    <b-icon icon="pencil-square" />

    <span v-if="isOpen" class="pl-2">Close Stylebot</span>
    <span v-else class="pl-2">Open Stylebot</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { toggleStylebot } from '../utils';

export default Vue.extend({
  name: 'ToggleStylebot',
  props: {
    tab: {
      type: Object,
      required: true,
    },
    isOpen: Boolean,
  },

  methods: {
    toggle(): void {
      toggleStylebot(this.tab);
    },
  },
});
</script>
