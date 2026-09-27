<template>
  <s-pill-button @click="openOptions">
    {{ t('manage_all_styles') }}
  </s-pill-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { openOptions } from '../utils';
import { SPillButton } from '@stylebot/components';

export default Vue.extend({
  name: 'ManageAllStyles',

  components: {
    SPillButton,
  },

  methods: {
    openOptions,
  },
});
</script>
