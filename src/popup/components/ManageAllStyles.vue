<template>
  <pill-button @click="openOptions">
    {{ t('manage_all_styles') }}
  </pill-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { openOptions } from '../utils';
import { PillButton } from '@stylebot/components';

export default Vue.extend({
  name: 'ManageAllStyles',

  components: {
    PillButton,
  },

  methods: {
    openOptions,
  },
});
</script>
