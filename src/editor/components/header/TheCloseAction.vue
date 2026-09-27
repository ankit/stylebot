<template>
  <s-tooltip :text="t('close')" :shortcut="shortcut">
    <s-icon-button :size="20" :aria-label="t('close')" @click="onClick">
      <icon-x :size="14" />
    </s-icon-button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { SIconButton, isMac, STooltip } from '@stylebot/components';
import { IconX } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheCloseAction',

  components: {
    SIconButton,
    STooltip,
    IconX,
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
