<template>
  <div>
    <the-stylebot v-if="visible" />

    <the-chrome-listener />
    <the-keyboard-shortcuts />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheStylebot from './TheStylebot.vue';
import TheChromeListener from './TheChromeListener.vue';
import TheKeyboardShortcuts from './shortcuts/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheStylebot,
    TheChromeListener,
    TheKeyboardShortcuts,
  },

  computed: {
    visible(): boolean {
      return this.$store.state.visible;
    },
  },

  async created(): Promise<void> {
    this.$store.dispatch('initialize');
  },
});
</script>
