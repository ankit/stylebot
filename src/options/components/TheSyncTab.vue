<template>
  <div class="sync-tab">
    <sync-status-banner v-if="showImportSuccessAlert">
      {{ t('import_success') }}
    </sync-status-banner>

    <sync-status-banner v-if="showImportErrorAlert" variant="error">
      {{ t('import_error', [String(importError)]) }}
    </sync-status-banner>

    <sync-status-banner v-if="syncStatus" :variant="syncStatus.type">
      {{ t(syncStatus.messageKey, [syncStatus.detail || '']) }}
    </sync-status-banner>

    <div>
      <heading as="h1">{{ t('sync_options') }}</heading>
      <s-text variant="muted" class="description">
        {{ t('sync_tab_description') }}
      </s-text>

      <the-google-drive-sync />
    </div>

    <div class="section">
      <heading as="h2">{{ t('backup') }}</heading>
      <s-text variant="muted" class="description">
        {{ t('backup_description') }}
      </s-text>

      <div class="buttons">
        <s-button @click="exportJson">{{ t('export') }}</s-button>
        <s-button @click="importJson">{{ t('import') }}</s-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, SText, SButton } from '@stylebot/components';
import TheGoogleDriveSync from './sync/TheGoogleDriveSync.vue';
import SyncStatusBanner from './sync/SyncStatusBanner.vue';

import { importStylesWithFilePicker, exportAsJSONFile } from '../utils';
import { SyncStatus } from '../store/index';

export default Vue.extend({
  name: 'TheSyncTab',

  components: {
    Heading,
    SText,
    SButton,
    TheGoogleDriveSync,
    SyncStatusBanner,
  },

  data(): {
    showImportErrorAlert: boolean;
    showImportSuccessAlert: boolean;
    importError: string | DOMException | null;
  } {
    return {
      importError: null,
      showImportErrorAlert: false,
      showImportSuccessAlert: false,
    };
  },

  computed: {
    syncStatus(): SyncStatus {
      return this.$store.state.syncStatus;
    },
  },

  methods: {
    exportJson(): void {
      exportAsJSONFile(this.$store.state.styles);
    },

    async importJson(): Promise<void> {
      try {
        const styles = await importStylesWithFilePicker();
        this.$store.dispatch('setAllStyles', styles);

        this.showImportErrorAlert = false;
        this.showImportSuccessAlert = true;
      } catch (e) {
        this.importError = e;
        this.showImportErrorAlert = true;
        this.showImportSuccessAlert = false;
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.sync-tab {
  max-width: 760px;
  padding: 20px 22px 26px;
}

.description {
  margin-top: 4px;
  max-width: 520px;
}

.section {
  margin-top: 40px;
}

.buttons {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
</style>
