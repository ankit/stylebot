<template>
  <s-tooltip :text="t('view_options')">
    <s-icon-button bordered @click="openOptions">
      <icon-options />
    </s-icon-button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';

import { IconOptions } from '@stylebot/icons';
import { openOptions } from '../utils';
import { SIconButton, STooltip } from '@stylebot/components';

export default Vue.extend({
  name: 'SettingsButton',

  components: {
    IconOptions,
    SIconButton,
    STooltip,
  },

  methods: {
    openOptions,
  },
});
</script>
