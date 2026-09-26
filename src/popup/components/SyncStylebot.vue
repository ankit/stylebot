<template>
  <div class="sync-strip" :class="{ error: hasError }">
    <span v-if="syncInProgress" class="sync-status">
      {{ t('sync_in_progress') }}
    </span>
    <span v-else-if="errorKey" class="sync-status">
      {{ t(errorKey) }}
    </span>
    <span v-else-if="needsAuth" class="sync-status">
      {{ t('sync_needs_sign_in') }}
    </span>
    <span v-else class="sync-status">
      <span class="dot" />
      {{ syncTime ? t('synced_at_time', [syncTime]) : t('sync_never') }}
    </span>

    <button
      type="button"
      class="sync-button"
      :title="t('sync_now')"
      :disabled="syncInProgress"
      @click="sync"
    >
      <arrow-repeat-icon :size="13" :spinning="syncInProgress" />
      {{ t('sync_action') }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

// Bypasses @stylebot/sync, whose barrel also drags in runGoogleDriveSync's postcss dependency chain.
import {
  getLastSyncedAt,
  getSyncNeedsAuth,
} from '../../sync/google-drive/sync-metadata';
import type {
  RunGoogleDriveSync,
  RunGoogleDriveSyncResponse,
  SyncErrorKey,
} from '@stylebot/types';

import { formatSyncTime } from '@stylebot/utils';
import { ArrowRepeatIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'SyncStylebot',

  components: {
    ArrowRepeatIcon,
  },

  data(): {
    syncTime: string;
    syncInProgress: boolean;
    errorKey: SyncErrorKey | null;
    needsAuth: boolean;
  } {
    return {
      syncTime: '',
      syncInProgress: false,
      errorKey: null,
      needsAuth: false,
    };
  },

  computed: {
    hasError(): boolean {
      return !this.syncInProgress && (!!this.errorKey || this.needsAuth);
    },
  },

  created() {
    this.updateSyncTime();
  },

  methods: {
    async updateSyncTime() {
      this.syncTime = formatSyncTime(await getLastSyncedAt());
      this.needsAuth = await getSyncNeedsAuth();
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

<style lang="scss" scoped>
.sync-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px 8px 16px;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  line-height: 1.35;
  color: var(--text-muted);
}

.error .sync-status {
  color: var(--danger);
}

.dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--success);
}

.sync-button {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1;
  color: var(--text-primary);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--hover-tint);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  &:disabled {
    cursor: default;
    color: var(--text-muted);
  }
}
</style>
