<template>
  <s-tooltip :text="t('close')" shortcut="esc">
    <icon-button :size="20" :aria-label="t('close')" @click="onClick">
      <icon-x :size="14" />
    </icon-button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { IconButton, STooltip } from '@stylebot/components';
import { IconX } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheCloseAction',

  components: {
    IconButton,
    STooltip,
    IconX,
  },

  methods: {
    onClick(): void {
      this.$store.dispatch('closeStylebot');
    },
  },
});
</script>
