<template>
  <button
    @click="onClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    :title="right ? 'Move Left' : 'Move Right'"
  >
    <b-icon icon="arrow-left-circle" v-if="right && !isHovered" />
    <b-icon icon="arrow-left-circle-fill" v-if="right && isHovered" />

    <b-icon icon="arrow-right-circle" v-if="!right && !isHovered" />
    <b-icon icon="arrow-right-circle-fill" v-if="!right && isHovered" />
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
