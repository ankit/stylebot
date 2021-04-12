<template>
  <div class="pt-3">
    <b-alert v-model="showImportSuccessAlert" variant="success" dismissible>
      {{ t('import_success') }}
    </b-alert>

    <b-alert v-model="showImportErrorAlert" variant="danger" dismissible>
      {{ t('import_error', [importError]) }}
    </b-alert>

    <b-row no-gutters class="mt-5 mb-1">
      <h2>{{ t('sync_via_google_drive') }}</h2>
    </b-row>

    <b-row no-gutters class="description mb-1">
      <div v-if="googleDriveSyncLastModifiedTime && !syncInProgress">
        {{
          t('synced_at_time', [googleDriveSyncLastModifiedTime])
        }}&nbsp;·&nbsp;

        <a :href="googleDriveSyncViewLink" target="_blank">
          {{ t('view_synced_file') }}
        </a>

        &nbsp;·&nbsp;
        <a :href="googleDriveSyncDownloadLink" target="_blank">
          {{ t('download_synced_file') }}
        </a>
      </div>

      <div v-if="googleDriveSyncLastModifiedtime && syncInProgress">
        {{ t('sync_in_progress') }}&nbsp;·&nbsp;
        <a :href="googleDriveSyncViewLink" target="_blank">
          {{ t('view_synced_file') }}
        </a>
        &nbsp;·&nbsp;

        <a :href="googleDriveSyncDownloadLink" target="_blank">
          {{ t('download_synced_file') }}
        </a>
      </div>
    </b-row>

    <b-row v-if="googleDriveSyncEnabled" no-gutters class="description mb-4">
      {{ t('sync_description') }}
    </b-row>

    <b-row no-gutters>
      <app-button
        v-if="googleDriveSyncEnabled"
        class="mr-4"
        variant="primary"
        :disabled="syncInProgress"
        @click="syncWithGoogleDrive"
      >
        <b-icon
          icon="arrow-repeat"
          :animation="syncInProgress ? 'spin' : undefined"
        />

        <span class="pl-2">
          {{ syncInProgress ? t('sync_in_progress') : t('sync_now') }}
        </span>
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

    <b-row no-gutters class="mt-5 mb-1">
      <h2>{{ t('backup') }}</h2>
    </b-row>

    <b-row no-gutters class="description mb-4">
      {{ t('backup_description') }}
    </b-row>

    <b-row no-gutters>
      <b-col>
        <app-button class="mr-4" variant="primary" @click="exportJson">
          {{ t('export') }}
        </app-button>

        <app-button @click="importJson">
          {{ t('import') }}
        </app-button>
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import AppButton from './AppButton.vue';

export default Vue.extend({
  name: 'TheBackupTab',

  components: {
    AppButton,
  },

  data(): {
    syncInProgress: boolean;
    showImportErrorAlert: boolean;
    showImportSuccessAlert: boolean;
    importError: string | DOMException | null;
  } {
    return {
      importError: null,
      syncInProgress: false,
      showImportErrorAlert: false,
      showImportSuccessAlert: false,
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

    exportJson(): void {
      const json = JSON.stringify(this.$store.state.styles);
      const dataStr =
        'data:text/json;charset=utf-8,' + encodeURIComponent(json);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute('download', 'stylebot_backup.json');
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    },

    importJson(): void {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';

      fileInput.addEventListener('change', (event: Event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files && files[0]) {
          const file = files[0];
          if (file.type && file.type !== 'application/json') {
            this.importError = 'Only JSON format is supported.';
            this.showImportErrorAlert = true;
            this.showImportSuccessAlert = false;
            return;
          }

          const reader = new FileReader();
          reader.readAsText(file);

          reader.onload = () => {
            try {
              const styles = JSON.parse(reader.result as string);
              this.$store.dispatch('setAllStyles', styles);
              this.showImportErrorAlert = false;
              this.showImportSuccessAlert = true;
            } catch (e) {
              this.importError = e;
              this.showImportErrorAlert = true;
              this.showImportSuccessAlert = false;
            }
          };

          reader.onerror = () => {
            this.importError = reader.error;
            this.showImportErrorAlert = true;
            this.showImportSuccessAlert = false;
          };
        }
      });

      document.body.appendChild(fileInput);
      fileInput.click();
      fileInput.remove();
    },
  },
});
</script>

<style lang="scss" scoped>
.description {
  color: #555;
  font-size: 15px;
}
</style>
