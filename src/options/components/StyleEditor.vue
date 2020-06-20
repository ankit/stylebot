<template>
  <div class="style-editor-overlay">
    <div class="style-editor">
      <v-text-field
        v-model="url"
        placeholder="Enter URL..."
        hide-details
        filled
        solo
        flat
        label="URL"
      ></v-text-field>

      <vue-monaco
        language="css"
        v-model="css"
        class="style-monaco-editor"
        @editorDidMount="editorDidMount"
      />

      <v-row justify="end">
        <v-col cols="3">
          <v-row justify="end" no-gutters dense>
            <v-col cols="4">
              <app-button
                text="Save"
                color="primary"
                :disabled="!url"
                @click="$emit('save', initialUrl, url, css)"
              ></app-button>
            </v-col>

            <v-col cols="4">
              <app-button text="Cancel" @click="$emit('cancel')"></app-button>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import VueMonaco from 'vue-monaco';
import * as MonacoEditor from 'monaco-editor';

import AppButton from './AppButton.vue';

export default Vue.extend({
  name: 'StyleEditor',
  props: ['initialUrl', 'initialCss'],

  data(): {
    url: string;
    css: string;
  } {
    return {
      url: this.initialUrl,
      css: this.initialCss,
    };
  },

  components: {
    AppButton,
    VueMonaco,
  },

  methods: {
    editorDidMount(editor: MonacoEditor.editor.IEditor): void {
      (editor.getModel() as MonacoEditor.editor.ITextModel).updateOptions({
        tabSize: 2,
      });

      editor.focus();
    },
  },
});
</script>

<style scoped>
.style-editor-overlay {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: fixed;
  z-index: 1000000;
  background: rgba(0, 0, 0, 0.87);
}

.style-editor {
  margin: 120px auto;
  height: 640px;
  width: 1024px;
  background: #fff;
  padding: 20px;
}

.style-monaco-editor {
  width: 100%;
  margin-top: 5px;
  height: calc(100% - 110px);
}
</style>
