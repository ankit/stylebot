<template>
  <b-list-group-item
    button
    :title="t('sync_description')"
    :disabled="syncInProgress"
    @click="sync"
  >
    <b-icon
      icon="arrow-repeat"
      :animation="syncInProgress ? 'spin' : undefined"
    />

    <span class="pl-2">
      {{ syncInProgress ? 'Syncing...' : 'Sync Now' }}

      <span class="sync-metadata pl-1">
        {{ syncInProgress ? undefined : syncTime }}
      </span>
    </span>
  </b-list-group-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import { getGoogleDriveSyncMetadata } from '@stylebot/sync';
import { RunGoogleDriveSync } from '@stylebot/types';

export default Vue.extend({
  name: 'SyncStylebot',

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
  color: #777;
  font-size: 12px;
  font-style: italic;
}
</style>
