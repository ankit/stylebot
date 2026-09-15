<template>
  <icon-button :size="20" :title="`${t('close')} (esc)`" @click="onClick">
    <icon-x :size="14" />
  </icon-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { IconButton } from '@stylebot/components';
import { IconX } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheCloseAction',

  components: {
    IconButton,
    IconX,
  },

  methods: {
    onClick(): void {
      this.$store.dispatch('closeStylebot');
    },
  },
});
</script>
