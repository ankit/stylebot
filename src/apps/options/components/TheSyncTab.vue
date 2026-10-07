<template>
  <div class="sync-tab">
    <sync-status-banner v-if="migrationsFailed" variant="error">
      {{ t('some_of_your_saved_data_could_not_be_updated') }}
      <s-link-button @click="reportIssue">
        {{ t('report_an_issue') }}
      </s-link-button>
    </sync-status-banner>

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
        <template v-if="stylesBeforeV4">
          <s-button @click="restoreStylesBeforeV4">
            {{ t('restore_styles_from_before_4_0') }}
          </s-button>
          <s-text as="span" size="caption" variant="muted">
            {{ t('backed_up_time', [backedUpTime]) }}
          </s-text>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SText, SButton, SLinkButton } from '@stylebot/components';
import { formatSyncTime } from '@stylebot/sync';
import { openReportIssuePage } from '@stylebot/utils';
import TheGoogleDriveSync from './sync/TheGoogleDriveSync.vue';
import SyncStatusBanner from './sync/SyncStatusBanner.vue';

import {
  importStylesWithFilePicker,
  exportAsJSONFile,
  getStylesBeforeV4,
  getMigrationsFailed,
} from '../utils';
import type { StylesBeforeV4 } from '../utils';
import type { SyncStatus } from '../store/index';

export default Vue.extend({
  name: 'TheSyncTab',

  components: {
    SHeading,
    SText,
    SButton,
    SLinkButton,
    TheGoogleDriveSync,
    SyncStatusBanner,
  },

  data(): {
    showImportErrorAlert: boolean;
    showImportSuccessAlert: boolean;
    importError: string | DOMException | null;
    showRestoreSuccess: boolean;
    stylesBeforeV4: StylesBeforeV4 | null;
    migrationsFailed: boolean;
  } {
    return {
      importError: null,
      showImportErrorAlert: false,
      showImportSuccessAlert: false,
      showRestoreSuccess: false,
      stylesBeforeV4: null,
      migrationsFailed: false,
    };
  },

  computed: {
    syncStatus(): SyncStatus {
      return this.$store.state.syncStatus;
    },

    backedUpTime(): string {
      return formatSyncTime(this.stylesBeforeV4?.createdAt);
    },
  },

  async created(): Promise<void> {
    [this.stylesBeforeV4, this.migrationsFailed] = await Promise.all([
      getStylesBeforeV4(),
      getMigrationsFailed(),
    ]);
  },

  methods: {
    exportJson(): void {
      exportAsJSONFile(this.$store.state.styles);
    },

    reportIssue(): void {
      openReportIssuePage();
    },

    onRestored(): void {
      this.showRestoreSuccess = true;
    },

    restoreStylesBeforeV4(): void {
      this.$store.dispatch('setAllStyles', this.stylesBeforeV4?.styles);

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
  align-items: center;
  gap: 8px;
  margin-top: 14px;
}
</style>
