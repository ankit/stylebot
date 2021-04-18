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
    resizing(): boolean {
      return this.$store.state.resizing;
    },
  },

  methods: {
    toggleResize(): void {
      this.$store.commit('setResizing', !this.resizing);
    },
  },
});
</script>
