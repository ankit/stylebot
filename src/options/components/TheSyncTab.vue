<template>
  <div class="pt-3">
    <b-row no-gutters class="mt-5">
      <h2>{{ t('sync_via_google_drive') }}</h2>
    </b-row>

    <b-row
      v-if="googleDriveSyncLastModifiedTime && !syncInProgress"
      no-gutters
      class="sync-metadata"
    >
      {{ t('synced_at_time', [googleDriveSyncLastModifiedTime]) }}&nbsp;·&nbsp;
      <a :href="googleDriveSyncViewLink" target="_blank">
        {{ t('view_synced_file') }}
      </a>
      &nbsp;·&nbsp;
      <a :href="googleDriveSyncDownloadLink" target="_blank">
        {{ t('download_synced_file') }}
      </a>
    </b-row>

    <b-row
      v-if="googleDriveSyncLastModifiedTime && syncInProgress"
      no-gutters
      class="sync-metadata"
    >
      {{ t('sync_in_progress') }}&nbsp;·&nbsp;
      <a :href="googleDriveSyncViewLink" target="_blank">
        {{ t('view_synced_file') }}
      </a>
      &nbsp;·&nbsp;
      <a :href="googleDriveSyncDownloadLink" target="_blank">
        {{ t('download_synced_file') }}
      </a>
    </b-row>

    <b-row v-if="googleDriveSyncEnabled" no-gutters class="sync-metadata">
      {{ t('sync_enabled_description') }}
    </b-row>

    <b-row no-gutters class="mt-2">
      <app-button
        v-if="googleDriveSyncEnabled"
        class="mr-4"
        variant="primary"
        :disabled="syncInProgress"
        @click="syncWithGoogleDrive"
      >
        {{ t('sync_now') }}
      </app-button>

      <app-button
        v-if="googleDriveSyncEnabled"
        class="mr-4"
        variant="secondary"
        @click="googleDriveSyncEnabled = false"
      >
        {{ t('disable_google_drive_sync') }}
      </app-button>

      <app-button
        v-if="!googleDriveSyncEnabled"
        class="mr-4"
        variant="primary"
        @click="googleDriveSyncEnabled = true"
      >
        {{ t('enable_google_drive_sync') }}
      </app-button>
    </b-row>

    <the-import-modal v-model="importModal" @close="importModal = false" />
    <the-export-modal v-model="exportModal" @close="exportModal = false" />

    <b-row no-gutters class="mt-5">
      <h2>{{ t('manual_backup') }}</h2>
    </b-row>

    <b-row no-gutters>
      <b-col>
        <app-button class="mr-4" variant="primary" @click="exportModal = true">
          {{ t('open_export_dialog') }}
        </app-button>

        <app-button @click="importModal = true">
          {{ t('open_import_dialog') }}
        </app-button>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import AppButton from './AppButton.vue';

import TheImportModal from './backup/TheImportModal.vue';
import TheExportModal from './backup/TheExportModal.vue';

export default Vue.extend({
  name: 'TheBackupTab',

  components: {
    AppButton,
    TheImportModal,
    TheExportModal,
  },

  data(): {
    importModal: boolean;
    exportModal: boolean;
    syncInProgress: boolean;
  } {
    return {
      importModal: false,
      exportModal: false,
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
.sync-metadata {
  color: #555;
  font-size: 12px;
}
</style>
