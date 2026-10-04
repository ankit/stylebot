<template>
  <button
    v-if="needsAuth"
    type="button"
    class="sync-strip sync-strip--sign-in"
    @click="openSyncOptions"
  >
    <s-text as="span" class="sync-status">
      {{ t('sync_needs_sign_in') }}
    </s-text>
    <chevron-right-icon :size="14" />
  </button>

  <div v-else class="sync-strip" :class="{ 'sync-strip--error': errorKey }">
    <s-text v-if="errorKey" as="span" class="sync-status">
      {{ t(errorKey, [errorDetail]) }}
    </s-text>
    <s-text v-else-if="syncTime" as="span" variant="muted" class="sync-status">
      <span class="dot" />
      {{ t('synced_at_time', [syncTime]) }}
    </s-text>
    <s-text
      v-else-if="syncInProgress"
      as="span"
      variant="muted"
      class="sync-status"
    >
      {{ t('sync_in_progress') }}
    </s-text>

    <button
      type="button"
      class="sync-button"
      :disabled="syncInProgress"
      @click="sync"
    >
      <arrow-repeat-icon :size="13" :spinning="syncInProgress" />
      <s-text
        as="span"
        size="label"
        :variant="syncInProgress ? 'muted' : 'default'"
      >
        {{ t('sync_now') }}
      </s-text>
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText } from '@stylebot/components';
import { ArrowRepeatIcon, ChevronRightIcon } from '@stylebot/icons';
import {
  formatSyncTime,
  getLastSyncedAt,
  getSyncNeedsAuth,
} from '@stylebot/sync';
import type {
  RunGoogleDriveSync,
  RunGoogleDriveSyncResponse,
  SyncErrorKey,
} from '@stylebot/types';

import { openSyncOptions } from '../utils';

export default Vue.extend({
  name: 'SyncStylebot',

  components: {
    SText,
    ArrowRepeatIcon,
    ChevronRightIcon,
  },

  data(): {
    syncTime: string;
    syncInProgress: boolean;
    needsAuth: boolean;
    errorKey: SyncErrorKey | null;
    errorDetail: string;
  } {
    return {
      syncTime: '',
      syncInProgress: false,
      needsAuth: false,
      errorKey: null,
      errorDetail: '',
    };
  },

  created() {
    this.readSyncState();
  },

  methods: {
    openSyncOptions,

    async readSyncState(): Promise<void> {
      const [lastSyncedAt, needsAuth] = await Promise.all([
        getLastSyncedAt(),
        getSyncNeedsAuth(),
      ]);

      this.syncTime = formatSyncTime(lastSyncedAt);
      this.needsAuth = needsAuth;
    },

    /**
     * Never opens an auth window: the popup would close under it. A run that
     * needs one flags it, and the strip then points to the Sync tab instead.
     * Joins a run already in flight in the background rather than queueing.
     */
    sync(): void {
      const message: RunGoogleDriveSync = {
        name: 'RunGoogleDriveSync',
        interactive: false,
      };

      this.syncInProgress = true;
      this.errorKey = null;

      chrome.runtime.sendMessage(
        message,
        async (response?: RunGoogleDriveSyncResponse) => {
          // A service worker torn down mid-sync answers with undefined and
          // sets lastError, which would otherwise hang the spinner.
          const failed = chrome.runtime.lastError || !response;

          await this.readSyncState();

          if (failed) {
            this.errorKey = 'sync_error_unknown';
            this.errorDetail = '';
          } else if (response && !response.ok) {
            this.errorKey = response.errorKey;
            this.errorDetail = response.errorDetail ?? '';
          }
          this.syncInProgress = false;

          if (response?.ok) {
            this.$emit('synced');
          }
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
  min-height: 44px;
  padding: 6px 10px 6px 16px;
}

.sync-strip--sign-in {
  @include button-reset;

  width: 100%;
  padding-right: 14px;
  text-align: left;
  color: var(--danger);
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
  }

  @include focus-ring;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.sync-strip--sign-in .sync-status,
.sync-strip--error .sync-status {
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
  @include button-reset;

  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 6px 10px;
  border-radius: 7px;
  color: var(--text-primary);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--hover-tint);
  }

  &:disabled {
    cursor: default;
    color: var(--text-muted);
  }

  @include focus-ring;
}
</style>
