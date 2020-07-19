<template>
  <button
    :title="right ? 'Move Left (P)' : 'Move Right (P)'"
    @click="onClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <b-icon v-if="right && !isHovered" icon="arrow-left-circle" />
    <b-icon v-if="right && isHovered" icon="arrow-left-circle-fill" />

    <b-icon v-if="!right && !isHovered" icon="arrow-right-circle" />
    <b-icon v-if="!right && isHovered" icon="arrow-right-circle-fill" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheMoveAction',

  data(): { isHovered: boolean } {
    return {
      isHovered: false,
    };
  },

  computed: {
    right(): boolean {
      return this.$store.state.position === 'right';
    },
  },

  methods: {
    onClick(): void {
      this.isHovered = false;

      if (this.right) {
        this.$store.commit('setPosition', 'left');
      } else {
        this.$store.commit('setPosition', 'right');
      }
    },
  },
});
</script>
