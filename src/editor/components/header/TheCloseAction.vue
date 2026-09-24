<template>
  <s-tooltip :text="t('close')" :shortcut="shortcut">
    <icon-button :size="20" :aria-label="t('close')" @click="onClick">
      <icon-x :size="14" />
    </icon-button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { IconButton, isMac, STooltip } from '@stylebot/components';
import { IconX } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheCloseAction',

  components: {
    IconButton,
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
