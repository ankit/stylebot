<template>
  <div class="card">
    <div class="text">
      <heading as="h2" size="sm">Google Drive</heading>

      <text-block v-if="!googleDriveSyncEnabled" size="caption" class="description">
        Not connected. Styles stay on this computer only.
      </text-block>

      <text-block v-else size="caption" class="description">
        {{ t('synced_at_time', [googleDriveSyncLastModifiedTime]) }}
        <template v-if="syncInProgress"> · {{ t('sync_in_progress') }}</template>
        <template v-if="googleDriveSyncViewLink">
          ·
          <a :href="googleDriveSyncViewLink" target="_blank">{{ t('view_synced_file') }}</a>
          ·
          <a :href="googleDriveSyncDownloadLink" target="_blank">{{ t('download_synced_file') }}</a>
        </template>
      </text-block>
    </div>

    <app-button v-if="googleDriveSyncEnabled" :disabled="syncInProgress" @click="syncWithGoogleDrive">
      <arrow-repeat-icon :spinning="syncInProgress" />
      <span>{{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}</span>
    </app-button>

    <app-button v-if="googleDriveSyncEnabled" @click="googleDriveSyncEnabled = false">
      {{ t('disable_google_drive_sync') }}
    </app-button>

    <app-button v-if="!googleDriveSyncEnabled" @click="googleDriveSyncEnabled = true">
      {{ t('enable_google_drive_sync') }}
    </app-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { Heading, TextBlock } from '@stylebot/components';
import { ArrowRepeatIcon } from '@stylebot/icons';

import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'TheGoogleDriveSync',

  components: {
    AppButton,
    ArrowRepeatIcon,
    Heading,
    TextBlock,
  },

  data(): {
    syncInProgress: boolean;
  } {
    return {
      syncInProgress: false,
    };
  },

  computed: {
    googleDriveSyncEnabled: {
      get(): boolean {
        return this.$store.state.googleDriveSyncEnabled;
      },

      set(val: boolean) {
        this.$store.dispatch('setGoogleDriveSyncEnabled', val);
      },
    },

    googleDriveSyncViewLink(): string {
      if (this.$store.state.googleDriveSyncMetadata) {
        return this.$store.state.googleDriveSyncMetadata.webViewLink;
      }

      return '';
    },

    googleDriveSyncDownloadLink(): string {
      if (this.$store.state.googleDriveSyncMetadata) {
        return this.$store.state.googleDriveSyncMetadata.webContentLink;
      }

      return '';
    },

    googleDriveSyncLastModifiedTime(): string {
      if (this.$store.state.googleDriveSyncMetadata) {
        return formatDistanceToNow(
          new Date(this.$store.state.googleDriveSyncMetadata.modifiedTime),
          { addSuffix: true }
        );
      }

      return '';
    },
  },

  methods: {
    async syncWithGoogleDrive() {
      this.syncInProgress = true;
      await this.$store.dispatch('syncWithGoogleDrive');
      this.syncInProgress = false;
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
  border: 1px solid var(--ui-border);
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
