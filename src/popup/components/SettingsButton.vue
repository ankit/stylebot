<template>
  <icon-button bordered :title="t('view_options')" @click="openOptions">
    <icon-options />
  </icon-button>
</template>

<script lang="ts">
import Vue from 'vue';

import { IconOptions } from '@stylebot/icons';
import { openOptions } from '../utils';
import IconButton from './IconButton.vue';

export default Vue.extend({
  name: 'SettingsButton',

  components: {
    IconOptions,
    IconButton,
  },

  methods: {
    openOptions,
  },
});
</script>
