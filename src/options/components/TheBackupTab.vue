<template>
  <div>
    <h2 class="title">Backup</h2>

    <v-dialog persistent max-width="800" transition="fade-transition" v-model="exportDialog">
      <v-card>
        <v-card-title class="headline">Copy/paste the following into a JSON file</v-card-title>
        <v-card-text>
          Keep the JSON safe to import it later until we support automatic sync/backup
          <v-textarea outlined v-model="exportedJSONString" auto-grow autofocus class="json"></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-button @click="copyToClipboard" color="primary" text="Copy to Clipboard"></app-button>

          <app-button @click="
              exportDialog = false;
            " text="Close"></app-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent max-width="800" transition="fade-transition" v-model="importDialog">
      <v-card>
        <v-card-title class="headline">Paste previously exported JSON</v-card-title>
        <v-card-text>
          <v-alert
            text
            dense
            type="info"
            class="alert"
            v-if="!importError"
          >Existing styles will be overwritten.</v-alert>

          <v-alert
            text
            dense
            type="error"
            class="alert"
            v-if="importError"
          >We encountered an error importing the JSON. Please ensure it is properly formatted and try again.</v-alert>

          <v-textarea
            outlined
            auto-grow
            autofocus
            class="json"
            @input="importError = false"
            v-model="jsonStringForImport"
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-button
            text="Import"
            color="primary"
            @click="importJSONString"
            :disabled="!jsonStringForImport"
          ></app-button>

          <app-button
            @click="
              importDialog = false;
              importError = false;
              jsonStringForImport = ''
            "
            text="Cancel"
          ></app-button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-row>
      <v-col>
        <app-button color="primary" text="Export..." class="export" @click="exportDialog = true"></app-button>
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

<style scoped>
.export {
  margin-right: 10px;
}

.alert,
.json {
  margin-top: 10px !important;
}
</style>