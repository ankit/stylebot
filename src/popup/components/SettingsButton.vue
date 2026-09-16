<template>
  <s-tooltip :text="t('view_options')">
    <icon-button bordered @click="openOptions">
      <icon-options />
    </icon-button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';

import { IconOptions } from '@stylebot/icons';
import { openOptions } from '../utils';
import { IconButton, STooltip } from '@stylebot/components';

export default Vue.extend({
  name: 'SettingsButton',

  components: {
    IconOptions,
    IconButton,
    STooltip,
  },

  methods: {
    openOptions,
  },
});
</script>
