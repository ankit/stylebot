<template>
  <div v-if="optionsLoaded" class="pt-2">
    <b-row no-gutters class="mt-5">
      <the-context-menu />
    </b-row>

    <b-row no-gutters class="mt-5">
      <the-keyboard-shortcuts />
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheContextMenu from './basics/TheContextMenu.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    TheContextMenu,
    TheKeyboardShortcuts,
  },

  computed: {
    optionsLoaded(): boolean {
      return !!this.$store.state.options;
    },
  },
});
</script>
