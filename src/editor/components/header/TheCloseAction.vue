<template>
  <button
    title="Close"
    @click="onClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <b-icon v-if="!isHovered" icon="x-circle" />
    <b-icon v-if="isHovered" icon="x-circle-fill" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheCloseAction',

  data(): { isHovered: boolean } {
    return {
      isHovered: false,
    };
  },

  methods: {
    onClick(): void {
      this.$store.commit('hideStylebot');
    },
  },
});
</script>
