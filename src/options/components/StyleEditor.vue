<template>
  <div class="style-editor-overlay">
    <div class="style-editor">
      <v-text-field
        v-model="url"
        placeholder="Enter URL..."
        filled
        solo
        flat
        label="URL"
        hide-details
        dense
      />

      <div class="caption px-3 mb-5 grey--text">
        See supported
        <a
          target="_blank"
          href="https://github.com/ankit/stylebot#pattern-matching"
        >
          URL patterns
        </a>
      </div>

      <vue-monaco
        language="css"
        v-model="css"
        class="style-monaco-editor"
        @editorDidMount="editorDidMount"
      />

      <v-row justify="end">
        <v-col cols="3">
          <v-row justify="end">
            <v-col cols="4">
              <app-button text="Cancel" @click="$emit('cancel')" />
            </v-col>

            <v-col cols="4">
              <app-button
                text="Save"
                color="primary"
                :outlined="false"
                :disabled="!url || !css"
                @click="$emit('save', { initialUrl, url, css })"
              />
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
  props: {
    initialUrl: {
      type: String,
      required: false,
      default: '',
    },
    initialCss: {
      type: String,
      required: false,
      default: '',
    },
  },

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
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 1000000;
  background: rgba(0, 0, 0, 0.87);
}

.style-editor {
  height: 640px;
  width: 1024px;
  padding: 20px;
  margin: 120px auto;
  background: #fff;
}

.style-monaco-editor {
  width: calc(100% + 18px);
  margin-top: 5px;
  margin-left: -18px;
  height: calc(100% - 150px);
}
</style>
