<template>
  <button
    @click="onClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    id="stylebot-move-action"
  >
    <b-icon icon="arrow-left-circle" v-if="right && !isHovered" />
    <b-icon icon="arrow-left-circle-fill" v-if="right && isHovered" />

    <b-icon icon="arrow-right-circle" v-if="!right && !isHovered" />
    <b-icon icon="arrow-right-circle-fill" v-if="!right && isHovered" />

    <b-tooltip
      no-fade
      triggers="hover"
      :delay="{ show: 1000 }"
      target="stylebot-move-action"
      custom-class="stylebot-tooltip"
    >
      {{ right ? 'Move Left' : 'Move Right' }}
    </b-tooltip>
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
      this.$root.$emit('bv::hide::tooltip');
      this.$store.commit('togglePlacement');
    },
  },
});
</script>
