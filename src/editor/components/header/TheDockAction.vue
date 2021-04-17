<template>
  <button
    v-if="coordinates.dockLocation === 'left'"
    :title="`${t('dock_to_right')}`"
    @click="dockToRight"
  >
    <b-icon icon="box-arrow-right" />
  </button>

  <button v-else :title="`${t('dock_to_left')}`" @click="dockToLeft">
    <b-icon icon="box-arrow-left" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCoordinates } from '@stylebot/types';

export default Vue.extend({
  name: 'TheDockAction',

  computed: {
    coordinates(): StylebotCoordinates {
      return this.$store.state.options.coordinates;
    },
  },

  methods: {
    dockToRight(): void {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        dockLocation: 'right',
      });
    },

    dockToLeft(): void {
      this.$store.dispatch('setCoordinates', {
        ...this.coordinates,
        dockLocation: 'left',
      });
    },
  },
});
</script>
