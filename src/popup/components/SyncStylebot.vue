<template>
  <s-tooltip grow :text="t('sync_description')">
    <popup-row button :disabled="syncInProgress" @click="sync">
      <span class="sync-icon">
        <arrow-repeat-icon :spinning="syncInProgress" />
      </span>

      <span class="row-label">
        {{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}

        <span
          v-if="!syncInProgress && errorKey"
          class="popup-caption sync-error"
        >
          {{ t(errorKey) }}
        </span>

        <span v-else class="popup-caption sync-metadata">
          {{ syncInProgress ? undefined : syncTime }}
        </span>
      </span>
    </popup-row>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';

// Bypasses @stylebot/sync, whose barrel also drags in runGoogleDriveSync's postcss dependency chain.
import { getLastSyncedAt } from '../../sync/google-drive/sync-metadata';
import {
  RunGoogleDriveSync,
  RunGoogleDriveSyncResponse,
  SyncErrorKey,
} from '@stylebot/types';

import { formatSyncTime } from '@stylebot/utils';
import { ArrowRepeatIcon } from '@stylebot/icons';
import { STooltip } from '@stylebot/components';
import PopupRow from './PopupRow.vue';

export default Vue.extend({
  name: 'SyncStylebot',

  components: {
    ArrowRepeatIcon,
    STooltip,
    PopupRow,
  },

  data(): {
    syncTime: string;
    syncInProgress: boolean;
    errorKey: SyncErrorKey | null;
  } {
    return {
      syncTime: '',
      syncInProgress: false,
      errorKey: null,
    };
  },

  created() {
    this.updateSyncTime();
  },

  methods: {
    async updateSyncTime() {
      this.syncTime = formatSyncTime(await getLastSyncedAt());
    },

    sync() {
      const message: RunGoogleDriveSync = {
        name: 'RunGoogleDriveSync',
      };

      this.syncInProgress = true;
      this.errorKey = null;

      chrome.runtime.sendMessage(
        message,
        (response?: RunGoogleDriveSyncResponse) => {
          // A service worker torn down mid-sync answers with undefined and
          // sets lastError, which would otherwise hang the spinner.
          if (chrome.runtime.lastError || !response) {
            this.errorKey = 'sync_error_unknown';
          } else if (!response.ok) {
            this.errorKey = response.errorKey;
          }

          this.updateSyncTime();
          this.syncInProgress = false;
        }
      );
    },
  },
});
</script>

<style lang="scss">
.sync-metadata {
  margin-left: 4px;
  font-style: italic;
}

.sync-error {
  margin-left: 4px;
  color: var(--danger);
}

.sync-icon {
  display: inline-flex;
  flex: none;
  justify-content: center;
  width: 28px;
}
</style>
