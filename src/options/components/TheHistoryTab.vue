<template>
  <div class="history-tab">
    <sync-status-banner v-if="restored">
      {{ t('restore_success') }}
    </sync-status-banner>

    <heading as="h1">{{ t('history_options') }}</heading>
    <s-text variant="muted" class="description">
      {{ t('history_tab_description') }}
    </s-text>

    <the-version-history @restored="onRestored" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, SText } from '@stylebot/components';

import SyncStatusBanner from './sync/SyncStatusBanner.vue';
import TheVersionHistory from './history/TheVersionHistory.vue';

export default Vue.extend({
  name: 'TheHistoryTab',

  components: {
    Heading,
    SText,
    SyncStatusBanner,
    TheVersionHistory,
  },

  data(): { restored: boolean } {
    return { restored: false };
  },

  methods: {
    onRestored(): void {
      this.restored = true;
    },
  },
});
</script>

<style lang="scss" scoped>
.history-tab {
  max-width: 760px;
  padding: 20px 22px 26px;
}

.description {
  display: block;
  margin-top: 4px;
  max-width: 520px;
}
</style>
