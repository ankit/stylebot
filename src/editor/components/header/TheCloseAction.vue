<template>
  <b-button :title="`${t('close')} (esc)`" variant="sm" @click="onClick">
    <b-icon icon="x-circle" />
  </b-button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheCloseAction',

  methods: {
    onClick(): void {
      this.$store.dispatch('closeStylebot');
    },
  },
});
</script>
