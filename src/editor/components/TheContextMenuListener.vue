<template>
  <div />
</template>

<script lang="ts">
import Vue from 'vue';
import { getSelector } from '@stylebot/css';

export default Vue.extend({
  name: 'TheContextMenuListener',

  mounted() {
    this.attach();
  },

  methods: {
    attach(): void {
      document.addEventListener('contextmenu', event => {
        if (event.target) {
          const selector = getSelector(event.target as HTMLElement);
          this.$store.commit('setContextMenuSelector', selector);
        }
      });
    },
  },
});
</script>
