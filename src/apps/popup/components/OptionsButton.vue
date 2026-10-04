<template>
  <span class="options-button">
    <s-icon-button :size="28" :tooltip="t('view_options')" @click="openOptions">
      <gear-icon />
    </s-icon-button>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import { GearIcon } from '@stylebot/icons';
import { openOptions } from '../utils';
import { SIconButton } from '@stylebot/components';

export default Vue.extend({
  name: 'OptionsButton',

  components: {
    GearIcon,
    SIconButton,
  },

  methods: {
    openOptions,
  },
});
</script>

<style lang="scss" scoped>
.options-button {
  display: flex;
  flex: none;
  margin: -6px -8px -6px auto;
  color: var(--icon-color);
}
</style>
