<template>
  <div class="sync-strip" :class="{ 'sync-strip--standalone': standalone }">
    <component
      :is="syncTime ? 's-tooltip' : 'span'"
      v-if="issueText"
      :text="t('last_synced_time', [syncTime])"
      class="sync-status-tooltip"
    >
      <s-text as="span" class="sync-status">
        <span class="dot dot--danger" />
        {{ issueText }}
      </s-text>
    </component>
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
      v-if="needsAuth"
      type="button"
      class="sync-button"
      @click="openSyncOptions"
    >
      <s-text as="span" size="label" variant="muted" class="sync-button-label">
        {{ t('sign_in') }}
      </s-text>
    </button>
    <button
      v-else
      type="button"
      class="sync-button"
      :disabled="syncInProgress"
      @click="sync"
    >
      <arrow-repeat-icon :size="13" :spinning="syncInProgress" />
      <s-text as="span" size="label" variant="muted" class="sync-button-label">
        {{ errorKey ? t('retry') : t('sync_now') }}
      </s-text>
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SText, STooltip } from '@stylebot/components';
import { ArrowRepeatIcon } from '@stylebot/icons';
import {
  formatSyncTime,
  getLastSyncedAt,
  getSyncError,
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
    STooltip,
    ArrowRepeatIcon,
  },

  props: {
    // On its own below a header, rather than tucked under the footer buttons.
    standalone: Boolean,
  },

  data(): {
    syncTime: string;
    syncInProgress: boolean;
    needsAuth: boolean;
    errorKey: SyncErrorKey | null;
  } {
    return {
      syncTime: '',
      syncInProgress: false,
      needsAuth: false,
      errorKey: null,
    };
  },

  computed: {
    // One short line; the Sync tab has the full explanation.
    issueText(): string {
      if (this.needsAuth) {
        return this.t('sign_in_to_keep_syncing');
      }

      if (this.errorKey === 'sync_error_network') {
        return this.t('couldnt_reach_google_drive');
      }

      return this.errorKey ? this.t('couldnt_sync') : '';
    },
  },

  created() {
    this.readSyncState();
  },

  methods: {
    openSyncOptions,

    async readSyncState(): Promise<void> {
      const [lastSyncedAt, needsAuth, errorKey] = await Promise.all([
        getLastSyncedAt(),
        getSyncNeedsAuth(),
        getSyncError(),
      ]);

      this.syncTime = formatSyncTime(lastSyncedAt);
      this.needsAuth = needsAuth;
      this.errorKey = errorKey;
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
          } else if (response && !response.ok) {
            this.errorKey = response.errorKey;
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
  gap: 8px;
  min-height: 32px;
  padding: 0 10px 6px 16px;
}

.sync-strip--standalone {
  min-height: 40px;
  padding: 0 10px 0 16px;
}

.sync-status-tooltip {
  display: flex;
  flex: 1;
  min-width: 0;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--success);
}

.dot--danger {
  background: var(--danger);
}

.sync-button {
  @include button-reset;

  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  height: 24px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  @include focus-ring;
}

.sync-button:hover:not(:disabled),
.sync-button:hover:not(:disabled) .sync-button-label {
  color: var(--text-primary);
}
</style>
