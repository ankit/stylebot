<template>
  <icon-button :size="24" :title="`${t('close')} (esc)`" @click="onClick">
    <x-icon :size="13" />
  </icon-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { IconButton } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheCloseAction',

  components: {
    IconButton,
    XIcon,
  },

  methods: {
    onClick(): void {
      this.$store.dispatch('closeStylebot');
    },
  },
});
</script>
