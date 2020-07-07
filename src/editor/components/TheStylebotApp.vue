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

import { getOptions, getComputedStylesForTab } from '../utils/chrome';

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
    const options = await getOptions();
    const { url, css } = await getComputedStylesForTab();

    this.$store.commit('setOptions', options);

    if (url) {
      this.$store.commit('setUrl', url);
    }

    if (css) {
      this.$store.dispatch('setCss', css);
    }
  },
});
</script>
