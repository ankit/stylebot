<template>
  <div>
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { formatDistanceToNow } from 'date-fns';

import AppButton from '../AppButton.vue';

export default Vue.extend({
  name: 'TheBackupTab',

  components: {
    AppButton,
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
.description {
  color: #555;
  font-size: 15px;
}
</style>
