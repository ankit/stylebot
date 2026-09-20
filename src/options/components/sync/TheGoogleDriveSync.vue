<template>
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
      </s-text>

      <s-text v-else size="caption" variant="muted" class="description">
        <template v-if="googleDriveSyncLastModifiedTime">
          {{ t('synced_at_time', [googleDriveSyncLastModifiedTime]) }}
        </template>
        <template v-if="syncInProgress">· {{ t('sync_in_progress') }}</template>
        <template v-if="googleDriveSyncViewLink">
          ·
          <a :href="googleDriveSyncViewLink" target="_blank">
            {{ t('view_synced_file') }}
          </a>
          ·
          <a :href="googleDriveSyncDownloadLink" target="_blank">
            {{ t('download_synced_file') }}
          </a>
        </template>
      </s-text>
    </div>

    <s-button
      v-if="googleDriveSyncEnabled"
      :disabled="syncInProgress"
      @click="syncWithGoogleDrive"
    >
      <arrow-repeat-icon :spinning="syncInProgress" />
      <span>{{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}</span>
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
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, SText, SButton } from '@stylebot/components';
import { ArrowRepeatIcon } from '@stylebot/icons';
import { formatSyncTime } from '@stylebot/utils';

export default Vue.extend({
  name: 'TheGoogleDriveSync',

  components: {
    SButton,
    ArrowRepeatIcon,
    Heading,
    SText,
  },

  computed: {
    syncInProgress(): boolean {
      return this.$store.state.syncInProgress;
    },

    googleDriveSyncEnabled: {
      get(): boolean {
        return this.$store.state.googleDriveSyncEnabled;
      },

      set(val: boolean) {
        this.$store.dispatch('setGoogleDriveSyncEnabled', val);
      },
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
</style>
