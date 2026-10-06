<template>
  <div class="sync-tab">
    <sync-status-banner v-if="showRestoreSuccess">
      {{ t('restore_success') }}
    </sync-status-banner>

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
      <s-heading as="h1" size="xl">{{ t('sync_options') }}</s-heading>
      <s-text variant="muted" class="description">
        {{ t('sync_tab_description') }}
      </s-text>

      <the-google-drive-sync
        @edit="$emit('edit', $event)"
        @restored="onRestored"
      />
    </div>

    <div class="section">
      <s-heading as="h2" size="lg">{{ t('backup') }}</s-heading>
      <s-text variant="muted" class="description">
        {{ t('backup_description') }}
      </s-text>

      <div class="buttons">
        <s-button @click="exportJson">{{ t('export') }}</s-button>
        <s-button @click="importJson">{{ t('import') }}</s-button>
        <s-button v-if="stylesBeforeV4" @click="restoreStylesBeforeV4">
          {{ t('restore_styles_from_before_4_0') }}
        </s-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SText, SButton } from '@stylebot/components';
import TheGoogleDriveSync from './sync/TheGoogleDriveSync.vue';
import SyncStatusBanner from './sync/SyncStatusBanner.vue';

import {
  importStylesWithFilePicker,
  exportAsJSONFile,
  getStylesBeforeV4,
} from '../utils';
import type { SyncStatus } from '../store/index';
import type { StyleMap } from '@stylebot/types';

export default Vue.extend({
  name: 'TheSyncTab',

  components: {
    SHeading,
    SText,
    SButton,
    TheGoogleDriveSync,
    SyncStatusBanner,
  },

  data(): {
    showImportErrorAlert: boolean;
    showImportSuccessAlert: boolean;
    importError: string | DOMException | null;
    showRestoreSuccess: boolean;
    stylesBeforeV4: StyleMap | null;
  } {
    return {
      importError: null,
      showImportErrorAlert: false,
      showImportSuccessAlert: false,
      showRestoreSuccess: false,
      stylesBeforeV4: null,
    };
  },

  computed: {
    syncStatus(): SyncStatus {
      return this.$store.state.syncStatus;
    },
  },

  async created(): Promise<void> {
    this.stylesBeforeV4 = await getStylesBeforeV4();
  },

  methods: {
    exportJson(): void {
      exportAsJSONFile(this.$store.state.styles);
    },

    onRestored(): void {
      this.showRestoreSuccess = true;
    },

    restoreStylesBeforeV4(): void {
      this.$store.dispatch('setAllStyles', this.stylesBeforeV4);

      this.showImportErrorAlert = false;
      this.showImportSuccessAlert = false;
      this.showRestoreSuccess = true;
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
