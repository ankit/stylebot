<template>
  <button
    title="Close"
    @click="onClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <b-icon icon="x-circle" v-if="!isHovered" />
    <b-icon icon="x-circle-fill" v-if="isHovered" />
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
