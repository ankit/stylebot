<template>
  <div class="history-tab">
    <sync-status-banner v-if="restored" @dismiss="restored = false">
      {{ t('restore_success') }}
    </sync-status-banner>

    <s-heading as="h1" size="xl">{{ t('history_options') }}</s-heading>
    <s-text variant="muted" class="description">
      {{ t('history_tab_description') }}
    </s-text>

    <the-version-history @restored="onRestored" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SText } from '@stylebot/components';

import SyncStatusBanner from './sync/SyncStatusBanner.vue';
import TheVersionHistory from './history/TheVersionHistory.vue';

export default Vue.extend({
  name: 'TheHistoryTab',

  components: {
    SHeading,
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
