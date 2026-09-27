<template>
  <s-icon-button bordered :tooltip="t('view_options')" @click="openOptions">
    <options-icon />
  </s-icon-button>
</template>

<script lang="ts">
import Vue from 'vue';

import { OptionsIcon } from '@stylebot/icons';
import { openOptions } from '../utils';
import { SIconButton } from '@stylebot/components';

export default Vue.extend({
  name: 'SettingsButton',

  components: {
    OptionsIcon,
    SIconButton,
  },

  methods: {
    openOptions,
  },
});
</script>
