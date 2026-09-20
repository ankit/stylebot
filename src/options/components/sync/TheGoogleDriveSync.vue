<template>
  <div>
    <div class="card">
      <div class="text">
        <heading as="h2" size="sm">{{ t('google_drive') }}</heading>

        <s-text
          v-if="!googleDriveSyncEnabled"
          size="caption"
          variant="muted"
          class="description"
        >
          {{ t('sync_not_connected') }}
          {{ t('sync_drive_location', [syncFilePath]) }}
        </s-text>

        <s-text v-else size="caption" variant="muted" class="description">
          <template v-if="googleDriveSyncLastModifiedTime">
            {{ t('synced_at_time', [googleDriveSyncLastModifiedTime]) }}
          </template>
          <template v-if="syncInProgress">
            · {{ t('sync_in_progress') }}
          </template>
          <template v-if="googleDriveSyncViewLink">
            ·
            <template v-if="account">{{ account.email }} ›</template>
            <a
              :href="googleDriveSyncViewLink"
              :title="t('view_synced_file')"
              target="_blank"
            >
              {{ syncFilePath }}
            </a>
            ·
            <a :href="googleDriveSyncDownloadLink" target="_blank">
              {{ t('download_synced_file') }}
            </a>
          </template>
        </s-text>

        <s-text
          v-if="googleDriveSyncEnabled && needsAuth"
          size="caption"
          class="description needs-auth"
        >
          {{ t('sync_needs_sign_in') }}
        </s-text>

        <s-text
          v-else-if="googleDriveSyncEnabled"
          size="caption"
          variant="muted"
          class="description"
        >
          {{ t('sync_auto_caption', [String(syncPeriodMinutes)]) }}
        </s-text>
      </div>

      <s-button
        v-if="googleDriveSyncEnabled"
        :disabled="syncInProgress"
        @click="syncWithGoogleDrive"
      >
        <arrow-repeat-icon :spinning="syncInProgress" />
        <span>
          {{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}
        </span>
      </s-button>

      <s-button
        v-if="googleDriveSyncEnabled"
        @click="googleDriveSyncEnabled = false"
      >
        {{ t('disable_google_drive_sync') }}
      </s-button>

      <s-button
        v-if="!googleDriveSyncEnabled"
        @click="googleDriveSyncEnabled = true"
      >
        {{ t('enable_google_drive_sync') }}
      </s-button>
    </div>

    <div v-if="conflicts.length" class="conflicts">
      <heading as="h3" size="sm">{{ t('sync_conflicts_title') }}</heading>
      <s-text size="caption" variant="muted" class="description">
        {{ t('sync_conflicts_description') }}
      </s-text>

      <ul class="conflict-list">
        <li v-for="conflict in conflicts" :key="conflict.url" class="conflict">
          <span class="conflict-url">{{ conflict.url }}</span>
          <s-button variant="ghost" @click="$emit('edit', conflict.url)">
            {{ t('sync_conflict_review') }}
          </s-button>
          <s-button variant="ghost" @click="dismissConflict(conflict.url)">
            {{ t('sync_conflict_dismiss') }}
          </s-button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, SText, SButton } from '@stylebot/components';
import { ArrowRepeatIcon } from '@stylebot/icons';
import { SyncAccount, SyncConflict } from '@stylebot/types';
import { formatSyncTime } from '@stylebot/utils';
import { SYNC_PERIOD_MINUTES } from '../../../background/sync-scheduler';
import { SYNC_FILE_PATH } from '../../../sync/google-drive/constants';

export default Vue.extend({
  name: 'TheGoogleDriveSync',

  components: {
    SButton,
    ArrowRepeatIcon,
    Heading,
    SText,
  },

  data(): { syncPeriodMinutes: number; syncFilePath: string } {
    return {
      syncPeriodMinutes: SYNC_PERIOD_MINUTES,
      syncFilePath: SYNC_FILE_PATH,
    };
  },

  computed: {
    syncInProgress(): boolean {
      return this.$store.state.syncInProgress;
    },

    needsAuth(): boolean {
      return this.$store.state.googleDriveSyncNeedsAuth;
    },

    conflicts(): Array<SyncConflict> {
      return this.$store.state.googleDriveSyncState?.conflicts ?? [];
    },

    googleDriveSyncEnabled: {
      get(): boolean {
        return this.$store.state.googleDriveSyncEnabled;
      },

      set(val: boolean) {
        this.$store.dispatch('setGoogleDriveSyncEnabled', val);
      },
    },

    account(): SyncAccount | undefined {
      return this.$store.state.googleDriveSyncState?.account;
    },

    googleDriveSyncViewLink(): string {
      return this.$store.state.googleDriveSyncState?.metadata.webViewLink ?? '';
    },

    googleDriveSyncDownloadLink(): string {
      return (
        this.$store.state.googleDriveSyncState?.metadata.webContentLink ?? ''
      );
    },

    // lastSyncedAt, not the file's modifiedTime: the latter is Drive's revision
    // marker and can predate the last time this machine actually checked.
    googleDriveSyncLastModifiedTime(): string {
      return formatSyncTime(
        this.$store.state.googleDriveSyncState?.lastSyncedAt
      );
    },
  },

  methods: {
    syncWithGoogleDrive() {
      return this.$store.dispatch('syncWithGoogleDrive');
    },

    dismissConflict(url: string) {
      return this.$store.dispatch('dismissSyncConflict', url);
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
}

.text {
  flex: 1;
  min-width: 0;
}

.description {
  margin-top: 2px;
}

.needs-auth {
  color: var(--danger);
}

.conflicts {
  margin-top: 16px;
  padding: 14px;
  background: var(--info);
  border: 1px solid var(--info-border);
  border-radius: 10px;
}

.conflict-list {
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.conflict {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.conflict-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
</style>
