<template>
  <s-icon-button bordered :tooltip="t('view_options')" @click="openOptions">
    <icon-options />
  </s-icon-button>
</template>

<script lang="ts">
import Vue from 'vue';

import { IconOptions } from '@stylebot/icons';
import { openOptions } from '../utils';
import { SIconButton } from '@stylebot/components';

export default Vue.extend({
  name: 'SettingsButton',

  components: {
    IconOptions,
    SIconButton,
  },

  methods: {
    openOptions,
  },
});
</script>
