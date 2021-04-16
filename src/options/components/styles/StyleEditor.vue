<template>
  <div class="style-editor">
    <div class="style-editor-overlay" />
    <div class="style-editor-modal">
      <div class="px-3 py-4">
        <b-form-input
          v-model="url"
          placeholder="Enter URL..."
          label="URL"
          autofocus
          style="max-width: 600px;"
        />
      </div>

      <div class="style-editor-code mx-3">
        <code-editor :css="css" @update="css = $event" />
      </div>

      <div class="style-editor-footer py-5 px-3">
        <app-button
          class="ml-3"
          variant="primary"
          :disabled="!url || !css"
          @click="$emit('save', { initialUrl, url, css })"
        >
          {{ t('save') }}
        </app-button>

        <app-button @click="$emit('cancel')">{{ t('cancel') }}</app-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from '../AppButton.vue';
import CodeEditor from './CodeEditor.vue';

export default Vue.extend({
  name: 'StyleEditor',

  components: {
    AppButton,
    CodeEditor,
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
  z-index: 100000;
}

.style-editor-overlay {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  background: #00000091;
}

.style-editor-modal {
  background: #fff;
  height: 80%;
  width: 80%;
  padding: 20px;
  position: fixed;
  top: 10%;
  left: 10%;
}

.style-editor-code {
  height: 75%;
  border: 1px solid #eee;
  border-right-width: 2px;
}

.style-editor-footer {
  button {
    float: right;
  }
}
</style>
