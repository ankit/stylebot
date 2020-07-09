<template>
  <b-list-group-item button @click="open">
    <b-icon icon="gear" />
    <span class="pl-2">Options...</span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { viewOptions } from '../utils';

export default Vue.extend({
  name: 'ViewOptions',

  methods: {
    open(): void {
      viewOptions();
    },
  },
});
</script>
