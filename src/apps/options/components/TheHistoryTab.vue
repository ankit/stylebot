<template>
  <div class="history-tab">
    <s-heading as="h1" size="xl">{{ t('history_options') }}</s-heading>
    <s-text variant="muted" class="description">
      {{ t('history_tab_description') }}
    </s-text>

    <the-version-history />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SText } from '@stylebot/components';

import TheVersionHistory from './history/TheVersionHistory.vue';

export default Vue.extend({
  name: 'TheHistoryTab',

  components: {
    SHeading,
    SText,
    TheVersionHistory,
  },
});
</script>

<style lang="scss" scoped>
.history-tab {
  max-width: 860px;
  padding: 20px 22px 26px;
}

.description {
  display: block;
  margin-top: 8px;
  max-width: 520px;
}
</style>
