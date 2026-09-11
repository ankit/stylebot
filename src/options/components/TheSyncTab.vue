<template>
  <div class="sync-tab">
    <div v-if="showImportSuccessAlert" class="banner success">
      {{ t('import_success') }}
    </div>

    <div v-if="showImportErrorAlert" class="banner error">
      {{ t('import_error', [String(importError)]) }}
    </div>

    <div>
      <heading as="h1">{{ t('sync_options') }}</heading>
      <text-block variant="muted" class="description">Keep your styles on every computer you sign in to.</text-block>

      <the-google-drive-sync />
    </div>

    <div class="section">
      <heading as="h2">{{ t('backup') }}</heading>
      <text-block variant="muted" class="description">{{ t('backup_description') }}</text-block>

      <div class="buttons">
        <app-button @click="exportJson">{{ t('export') }}</app-button>
        <app-button @click="importJson">{{ t('import') }}</app-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading, TextBlock } from '@stylebot/components';
import AppButton from './AppButton.vue';
import TheGoogleDriveSync from './sync/TheGoogleDriveSync.vue';

import { importStylesWithFilePicker, exportAsJSONFile } from '../utils';

export default Vue.extend({
  name: 'TheSyncTab',

  components: {
    Heading,
    TextBlock,
    AppButton,
    TheGoogleDriveSync,
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

.banner {
  padding: 10px 14px;
  border-radius: 9px;
  font-size: 13px;
  margin-bottom: 16px;
}

.banner.success {
  background: var(--info);
  border: 1px solid var(--info-border);
  color: var(--foreground);
}

.banner.error {
  background: #fdf1f0;
  border: 1px solid #f6cfcb;
  color: #b3261e;
}
</style>
