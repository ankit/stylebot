<template>
  <div class="sync-tab">
    <sync-status-banner
      v-if="showRestoreSuccess"
      @dismiss="showRestoreSuccess = false"
    >
      {{ t('restore_success') }}
    </sync-status-banner>

    <sync-status-banner
      v-if="importedCount !== null"
      @dismiss="importedCount = null"
    >
      {{ importedMessage }}
    </sync-status-banner>

    <sync-status-banner v-if="showUpToDate" @dismiss="showUpToDate = false">
      {{ t('import_up_to_date') }}
    </sync-status-banner>

    <sync-status-banner
      v-if="importErrorKey"
      variant="error"
      @dismiss="importErrorKey = null"
    >
      {{ t('import_error', [t(importErrorKey)]) }}
    </sync-status-banner>

    <sync-status-banner
      v-if="syncStatus"
      :variant="syncStatus.type"
      :title="syncStatus.detail"
      @dismiss="$store.dispatch('dismissSyncStatus')"
    >
      {{ t(syncStatus.messageKey, [syncStatus.detail || '']) }}
    </sync-status-banner>

    <div>
      <s-heading as="h1" size="xl">{{ t('sync_options') }}</s-heading>
      <s-text variant="muted" size="large" class="description">
        {{ t('sync_tab_description') }}
      </s-text>

      <the-google-drive-sync
        @edit="$emit('edit', $event)"
        @restored="onRestored"
      />
    </div>

    <div class="section">
      <s-heading as="h2" size="lg">{{ t('backup') }}</s-heading>
      <s-text variant="muted" size="large" class="description">
        {{ t('backup_description') }}
      </s-text>

      <div class="buttons">
        <s-button :disabled="!hasStyles" @click="exportJson">
          {{ t('export') }}
        </s-button>
        <s-button @click="importJson">{{ t('import') }}</s-button>
      </div>
    </div>

    <import-backup-dialog
      v-if="pendingImport"
      :preview="pendingImport.preview"
      @cancel="pendingImport = null"
      @merge="applyImport('merge')"
      @replace="applyImport('replace')"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SText, SButton } from '@stylebot/components';
import type { ImportPreview } from '@stylebot/saved-styles';
import {
  mergeBackup,
  parseBackup,
  previewImport,
} from '@stylebot/saved-styles';
import type { StyleMap } from '@stylebot/types';
import TheGoogleDriveSync from './sync/TheGoogleDriveSync.vue';
import SyncStatusBanner from './sync/SyncStatusBanner.vue';
import ImportBackupDialog from './sync/ImportBackupDialog.vue';

import { downloadBackup, pickBackupFile } from '../backup';
import type { SyncStatus } from '../store/index';

type PendingImport = {
  styles: StyleMap;
  preview: ImportPreview;
};

export default Vue.extend({
  name: 'TheSyncTab',

  components: {
    SHeading,
    SText,
    SButton,
    TheGoogleDriveSync,
    SyncStatusBanner,
    ImportBackupDialog,
  },

  data(): {
    importErrorKey: string | null;
    importedCount: number | null;
    pendingImport: PendingImport | null;
    showRestoreSuccess: boolean;
    showUpToDate: boolean;
  } {
    return {
      importErrorKey: null,
      importedCount: null,
      pendingImport: null,
      showRestoreSuccess: false,
      showUpToDate: false,
    };
  },

  computed: {
    hasStyles(): boolean {
      return Object.keys(this.$store.state.styles).length > 0;
    },

    syncStatus(): SyncStatus {
      return this.$store.state.syncStatus;
    },

    importedMessage(): string {
      const count = this.importedCount ?? 0;
      const imported = this.t(
        count === 1 ? 'imported_styles_one' : 'imported_styles_other',
        [String(count)]
      );

      return `${imported} ${this.t('import_undo_hint')}`;
    },
  },

  methods: {
    exportJson(): void {
      downloadBackup(this.$store.state.styles);
    },

    onRestored(): void {
      this.showRestoreSuccess = true;
    },

    async importJson(): Promise<void> {
      this.clearImportStatus();

      let text: string | null;

      try {
        text = await pickBackupFile();
      } catch {
        this.showImportError('import_error_unreadable');
        return;
      }

      if (text === null) {
        return;
      }

      const parsed = parseBackup(text);

      if (!parsed.ok) {
        this.showImportError(parsed.errorKey);
        return;
      }

      const preview = previewImport(this.$store.state.styles, parsed.styles);

      if (preview.added + preview.updated === 0) {
        this.showUpToDate = true;
        return;
      }

      this.pendingImport = { styles: parsed.styles, preview };
    },

    async applyImport(mode: 'merge' | 'replace'): Promise<void> {
      if (!this.pendingImport) {
        return;
      }

      const { styles, preview } = this.pendingImport;
      this.pendingImport = null;

      const next =
        mode === 'merge'
          ? mergeBackup(this.$store.state.styles, styles)
          : styles;
      const ok: boolean = await this.$store.dispatch('importStyles', next);

      if (!ok) {
        this.showImportError('import_error_not_saved');
        return;
      }

      this.importedCount =
        mode === 'merge'
          ? preview.added + preview.updated
          : Object.keys(styles).length;
    },

    showImportError(key: string): void {
      this.clearImportStatus();
      this.importErrorKey = key;
    },

    clearImportStatus(): void {
      this.showUpToDate = false;
      this.importErrorKey = null;
      this.importedCount = null;
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
