<template>
  <s-icon-button
    :size="20"
    :tooltip="t('close')"
    :tooltip-shortcut="shortcut"
    @click="onClick"
  >
    <x-icon :size="14" />
  </s-icon-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { SIconButton, isMac } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheCloseAction',

  components: {
    SIconButton,
    XIcon,
  },

  computed: {
    shortcut(): string {
      if (this.$store.state.host === 'window') {
        return isMac() ? 'meta+w' : 'ctrl+w';
      }

      return 'esc';
    },
  },

  methods: {
    onClick(): void {
      this.$store.dispatch('closeStylebot');
    },
  },
});
</script>
