<template>
  <popup-row
    button
    :title="t('sync_description')"
    :disabled="syncInProgress"
    @click="sync"
  >
    <arrow-repeat-icon :spinning="syncInProgress" />

    <span class="row-label">
      {{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}

      <span class="popup-caption sync-metadata">
        {{ syncInProgress ? undefined : syncTime }}
      </span>
    </span>
  </popup-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

// Bypasses @stylebot/sync, whose barrel also drags in runGoogleDriveSync's postcss dependency chain.
import { getGoogleDriveSyncMetadata } from '../../sync/google-drive/sync-metadata';
import { RunGoogleDriveSync } from '@stylebot/types';

import ArrowRepeatIcon from './icons/ArrowRepeatIcon.vue';
import PopupRow from './PopupRow.vue';

export default Vue.extend({
  name: 'SyncStylebot',

  components: {
    ArrowRepeatIcon,
    PopupRow,
  },

  data(): {
    syncTime: string;
    syncInProgress: boolean;
  } {
    return {
      syncTime: '',
      syncInProgress: false,
    };
  },

  created() {
    this.updateSyncTime();
  },

  methods: {
    async updateSyncTime() {
      const googleDriveSyncMetadata = await getGoogleDriveSyncMetadata();

      if (googleDriveSyncMetadata) {
        this.syncTime = formatDistanceToNow(
          new Date(googleDriveSyncMetadata.modifiedTime),
          { addSuffix: true }
        );
      }
    },

    sync() {
      const message: RunGoogleDriveSync = {
        name: 'RunGoogleDriveSync',
      };

      this.syncInProgress = true;

      chrome.runtime.sendMessage(message, () => {
        this.updateSyncTime();
        this.syncInProgress = false;
      });
    },
  },
});
</script>

<style lang="scss">
.sync-metadata {
  margin-left: 4px;
  font-style: italic;
}
</style>
