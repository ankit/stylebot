<template>
  <button :title="`${t('close')} (esc)`" @click="onClick">
    <b-icon icon="x-circle" />
  </button>
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
