<template>
  <div>
    <the-stylebot v-if="visible" />
    <the-chrome-listener />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';

import TheStylebot from './TheStylebot.vue';
import TheChromeListener from './TheChromeListener.vue';

import { getOptions } from '../utils/chrome';

export default Vue.extend({
  name: 'App',

  components: {
    TheStylebot,
    TheChromeListener,
  },

  computed: mapState(['visible']),

  async created(): Promise<void> {
    const options = await getOptions();
    this.$store.commit('setOptions', options);
  },
});
</script>
