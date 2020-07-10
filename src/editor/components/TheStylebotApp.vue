<template>
  <div>
    <the-stylebot v-if="visible" />
    <the-chrome-listener />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheStylebot from './TheStylebot.vue';
import TheChromeListener from './TheChromeListener.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheStylebot,
    TheChromeListener,
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
