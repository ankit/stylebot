<template>
  <div>
    <h2 class="title">Styles</h2>

    <div v-if="!!currentlyEditedStyle">
      <style-editor
        @save="saveStyle"
        @cancel="cancelEditStyle"
        :initialUrl="currentlyEditedStyle.url"
        :initialCss="currentlyEditedStyle.css"
      ></style-editor>
    </div>

    <v-row no-gutters v-if="!currentlyEditedStyle">
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

        <v-row
          class="style"
          align="center"
          justify="end"
          :key="style.url"
          v-for="style in styles"
        >
          <v-col cols="10">
            <v-checkbox
              :value="style.enabled"
              :label="style.url"
              :ripple="false"
              hide-details
            ></v-checkbox>
          </v-col>

          <v-col cols="2">
            <v-row align="center" justify="end">
              <style-edit-button @click="editStyle(style)"></style-edit-button>
              <style-delete-button
                @click="deleteStyle(style)"
              ></style-delete-button>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from './AppButton.vue';
import StyleEditor from './StyleEditor.vue';
import StyleEditButton from './StyleEditButton.vue';
import StyleDeleteButton from './StyleDeleteButton.vue';

import { StylebotBackgroundPage } from '../types';

type Style = {
  url: string;
  css: string;
  enabled: boolean;
};

export default Vue.extend({
  name: 'TheStylesTab',
  components: {
    AppButton,
    StyleEditButton,
    StyleDeleteButton,
    StyleEditor,
  },

  data(): {
    styles: Array<Style>;
    currentlyEditedStyle: Style | null;
  } {
    return {
      styles: [],
      currentlyEditedStyle: null,
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
    editStyle(style: Style): void {
      this.currentlyEditedStyle = style;
    },
    cancelEditStyle(): void {
      this.currentlyEditedStyle = null;
    },
    saveStyle(url: string, css: string): void {
      console.log(url, css);
      this.currentlyEditedStyle = null;
    },
    deleteStyle(): void {
      //
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
</style>
