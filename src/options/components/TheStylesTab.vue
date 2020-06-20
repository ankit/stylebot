<template>
  <div>
    <h2 class="title">Styles</h2>

    <div class="style-editor-overlay" v-if="showEditor">
      <div class="style-editor">
        <v-text-field
          v-model="editingStyle.url"
          class="style-url-editor"
          placeholder="Enter URL..."
          hide-details
          filled
          label="URL"
        ></v-text-field>

        <MonacoEditor
          language="css"
          v-model="editingStyle.css"
          class="style-monaco-editor"
          @editorDidMount="editorDidMount"
        />

        <v-btn color="blue darken-1" text @click="showEditor = false">Close</v-btn>
      </div>
    </div>

    <v-row no-gutters v-if="!showEditor">
      <v-col cols="6">
        <v-row>
          <v-col cols="10">
            <app-button color="primary" text="Add a new style..." />
            <app-button text="Enable all" />
            <app-button text="Disable all" />
          </v-col>

          <v-col cols="2">
            <app-button text="Delete all" color="red lighten-2" />
          </v-col>
        </v-row>

        <v-row class="search">
          <v-col cols="12">
            <v-text-field placeholder="Search..." hide-details></v-text-field>
          </v-col>
        </v-row>

        <v-row class="style" align="center" justify="end" :key="style.url" v-for="style in styles">
          <v-col cols="10">
            <v-checkbox :value="style.enabled" :label="style.url" :ripple="false" hide-details></v-checkbox>
          </v-col>

          <v-col cols="2">
            <v-row align="center" justify="end">
              <v-btn
                color="primary"
                :ripple="false"
                elevation="0"
                fab
                x-small
                @click="
                  editingStyle = style;
                  showEditor = true;
                "
                class="style-action"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>

              <v-btn color="error" :ripple="false" elevation="0" fab x-small class="style-action">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
// @ts-ignore
import MonacoEditor from 'vue-monaco';
import AppButton from './AppButton.vue';

type Style = {
  url: string;
  css: string;
  enabled: boolean;
};

type StylebotBackgroundPage = {
  cache: {
    styles: {
      get: () => {
        [url: string]: {
          _enabled: boolean;
          _rules: any;
        };
      };
    };
  };
};

export default Vue.extend({
  name: 'TheStylesTab',
  components: {
    AppButton,
    MonacoEditor,
  },

  data(): {
    editingStyle?: Style;
    showEditor: boolean;
    styles: Array<Style>;
  } {
    return {
      styles: [],
      showEditor: false,
    };
  },

  created(): void {
    const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
    const styles = backgroundPage.cache.styles.get();
    const urls = Object.keys(styles);

    const results = urls.map(async url => {
      const style = styles[url];

      // @ts-ignore
      return new Promise(resolve => {
        // @ts-ignore
        CSSUtils.crunchFormattedCSS(
          style._rules,
          false,
          false,
          (css: string) => {
            resolve({
              url,
              css,
              enabled: style._enabled,
            });
          }
        );
      });
    });

    // @ts-ignore
    Promise.all(results).then(styles => {
      this.styles = styles;
    });
  },
  methods: {
    editorDidMount(editor: any): void {
      editor.getModel().updateOptions({ tabSize: 2 });
      editor.focus();
    },
  },
});
</script>

<style scoped>
.style:hover {
  background-color: #eee;
}

.style .v-input {
  margin: 0;
  padding: 0;
}

.style-action {
  margin-right: 8px;
}

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
}

.style-monaco-editor {
  height: calc(100% - 100px);
  width: 100%;
}
</style>
