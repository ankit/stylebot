<template>
  <div class="pt-3">
    <b-row no-gutters class="mt-5">
      <h2>Sync via Google Drive</h2>
    </b-row>

    <b-row no-gutters>
      <app-button class="mr-4" variant="primary" @click="syncGoogleDrive">
        Sync Now
      </app-button>

      <app-button class="mr-4" variant="primary" @click="toggleGoogleDriveSync">
        Enable Sync
      </app-button>
    </b-row>

    <the-import-modal v-model="importModal" @close="importModal = false" />
    <the-export-modal v-model="exportModal" @close="exportModal = false" />

    <b-row no-gutters class="mt-5">
      <h2>Backup</h2>
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
import { setGoogleDriveSyncEnabled, runGoogleDriveSync } from '@stylebot/sync';

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
  } {
    return {
      importModal: false,
      exportModal: false,
    };
  },

  computed: {
    googleDriveSyncEnabled: {
      get(): boolean {
        return this.googleDriveSyncEnabled;
      },
    },
  },

  methods: {
    syncGoogleDrive() {
      runGoogleDriveSync(this.$store.state.styles);
    },

    toggleGoogleDriveSync() {
      setGoogleDriveSyncEnabled(true);
      runGoogleDriveSync(this.$store.state.styles);
    },
  },
});
</script>
