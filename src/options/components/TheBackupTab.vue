<template>
  <div class="pt-3">
    <b-row class="mt-5">
      <b-col>
        {{ t('backup_description') }}
      </b-col>
    </b-row>

    <the-import-modal v-model="importModal" @close="importModal = false" />
    <the-export-modal v-model="exportModal" @close="exportModal = false" />

    <b-row class="mt-4">
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
});
</script>
