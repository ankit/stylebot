<template>
  <b-button :title="`${t('resize')} (r)`" variant="sm" @click="toggleResize">
    <b-icon icon="arrows-expand" rotate="90" />
  </b-button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheResizeAction',

  computed: {
    resize(): boolean {
      return this.$store.state.resize;
    },
  },

  methods: {
    toggleResize(): void {
      this.$store.commit('setResize', !this.resize);
    },
  },
});
</script>
