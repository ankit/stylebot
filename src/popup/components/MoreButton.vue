<template>
  <icon-button bordered :title="t('more')" @click="$emit('click')">
    <more-icon />
  </icon-button>
</template>

<script lang="ts">
import Vue from 'vue';

import { MoreIcon } from '@stylebot/icons';
import IconButton from './IconButton.vue';

export default Vue.extend({
  name: 'MoreButton',

  components: {
    MoreIcon,
    IconButton,
  },
});
</script>
