<template>
  <div>
    <h2 class="title">Backup</h2>
    <v-row>
      <v-col>
        <div
          class="body-1"
        >Until we support automated sync/backup, please manually backup your work.</div>
      </v-col>
    </v-row>

    <v-dialog persistent max-width="800" transition="fade-transition" v-model="exportDialog">
      <v-card>
        <v-card-title class="headline">Copy/paste into a JSON file</v-card-title>

        <v-card-text class="pb-0">
          Keep the JSON safe to import it later until we support automatic sync/backup
          <v-textarea
            outlined
            v-model="exportedJSONString"
            auto-grow
            autofocus
            hide-details
            class="mt-4"
          ></v-textarea>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />

          <app-button @click="
              exportDialog = false;
            " text="Close"></app-button>

          <app-button
            @click="copyToClipboard"
            color="primary"
            text="Copy to Clipboard"
            :outlined="false"
          ></app-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent max-width="800" transition="fade-transition" v-model="importDialog">
      <v-card>
        <v-card-title class="headline">Paste previously exported JSON</v-card-title>

        <v-card-text class="pb-0">
          <v-alert
            text
            type="warning"
            class="mt-4"
            v-if="!importError"
          >This will overwrite your existing styles. You can't undo this.</v-alert>

          <v-alert
            text
            type="error"
            class="mt-4"
            v-if="importError"
          >We encountered an error importing the JSON. Please ensure it is properly formatted and try again.</v-alert>

          <v-textarea
            outlined
            auto-grow
            autofocus
            class="json"
            hide-details
            @input="importError = false"
            v-model="jsonStringForImport"
          ></v-textarea>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer />

          <app-button
            @click="
              importDialog = false;
              importError = false;
              jsonStringForImport = ''
            "
            text="Cancel"
          ></app-button>

          <app-button
            text="Import"
            color="primary"
            :outlined="false"
            @click="importJSONString"
            :disabled="!jsonStringForImport"
          ></app-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row>
      <v-col>
        <app-button color="primary" text="Export..." class="mr-4" @click="exportDialog = true"></app-button>
        <app-button text="Import..." @click="importDialog = true"></app-button>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import AppButton from './AppButton.vue';
import {
  exportStylesAsJSONString,
  importStylesFromJSONString,
  copyToClipboard,
} from '../utilities';

export default {
  name: 'TheBackupTab',
  components: {
    AppButton,
  },

  data(): {
    importError: boolean;
    importDialog: boolean;
    exportDialog: boolean;
    exportedJSONString: string;
    jsonStringForImport: string;
  } {
    return {
      importError: false,
      importDialog: false,
      exportDialog: false,
      exportedJSONString: exportStylesAsJSONString(),
      jsonStringForImport: '',
    };
  },

  methods: {
    copyToClipboard(): void {
      copyToClipboard(this.exportedJSONString);
    },

    importJSONString(): void {
      if (importStylesFromJSONString(this.jsonStringForImport)) {
        this.importDialog = false;
        this.jsonStringForImport = '';
        this.importError = false;
        this.exportedJSONString = exportStylesAsJSONString();
      } else {
        this.importError = true;
      }
    },
  },
};
</script>
