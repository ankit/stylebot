<template>
  <button :title="`${t('dock_to_right')}`" @click="onClick">
    <b-icon icon="box-arrow-right" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheDockToRightAction',

  methods: {
    onClick(): void {
      this.$store.dispatch('resetCoordinates');
    },
  },
});
</script>
