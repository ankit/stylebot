<template>
  <popup-button @click="openOptions">
    {{ t('manage_all_styles') }}
  </popup-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { openOptions } from '../utils';
import { PopupButton } from '@stylebot/components';

export default Vue.extend({
  name: 'ManageAllStyles',

  components: {
    PopupButton,
  },

  methods: {
    openOptions,
  },
});
</script>
