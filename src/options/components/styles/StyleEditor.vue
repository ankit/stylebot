<template>
  <div class="style-editor">
    <div class="style-editor-header px-5 py-4">
      <b-form-input
        v-model="url"
        placeholder="Enter URL..."
        label="URL"
        autofocus
        style="max-width: 600px;"
      />
    </div>

    <monaco-editor :css="css" @update="css = $event" />

    <div class="style-editor-footer p-5">
      <app-button
        class="ml-3 mr-3"
        variant="primary"
        :disabled="!url || !css"
        @click="$emit('save', { initialUrl, url, css })"
      >
        {{ t('save') }}
      </app-button>

      <app-button @click="$emit('cancel')">{{ t('cancel') }}</app-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from '../AppButton.vue';
import MonacoEditor from './MonacoEditor.vue';

export default Vue.extend({
  name: 'StyleEditor',

  components: {
    AppButton,
    MonacoEditor,
  },

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
});
</script>

<style lang="scss">
.style-editor {
  background: #fff;
  height: 100%;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100000;
}

.style-editor-header {
  border-bottom: 1px solid #eee;
}

.style-editor-footer {
  left: 0;
  bottom: 0;
  width: 100%;
  position: fixed;

  border-top: 1px solid #eee;

  button {
    float: right;
  }
}
</style>
