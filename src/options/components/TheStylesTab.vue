<template>
  <div>
    <h2 class="title">
      Styles
      <span v-if="styles.length !== 0" class="grey--text text--lighter-1">
        ({{ styles.length }})
      </span>
    </h2>

    <style-editor
      v-if="addStyleDialog"
      @save="
        addStyleDialog = false;
        saveStyle($event);
      "
      @cancel="addStyleDialog = false"
    />

    <v-row no-gutters>
      <v-col cols="6">
        <v-row>
          <v-col cols="10">
            <app-button
              color="primary"
              text="Add a new style..."
              @click="addStyleDialog = true"
            />

            <app-button text="Enable all" @click="enableAll" />
            <app-button text="Disable all" @click="disableAll" />
          </v-col>

          <v-col cols="2" align-self="end">
            <v-row justify="end">
              <the-delete-all-styles-button @click="deleteAll" />
            </v-row>
          </v-col>
        </v-row>

        <v-row class="search">
          <v-col cols="12">
            <v-text-field
              clearable
              hide-details
              placeholder="Search..."
              @input="setUrlFilter"
            />
          </v-col>
        </v-row>

        <style-component
          :key="style.url"
          :css="style.css"
          :url="style.url"
          :initialEnabled="style.enabled"
          v-for="style in styles"
          @save="saveStyle"
          @delete="deleteStyle(style)"
          @toggle="toggleStyle(style)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import AppButton from './AppButton.vue';
import StyleComponent from './Style.vue';
import StyleEditor from './StyleEditor.vue';
import TheDeleteAllStylesButton from './TheDeleteAllStylesButton.vue';

import {
  saveStyle,
  deleteStyle,
  enableStyle,
  disableStyle,
  getFormattedStyles,
  enableAllStyles,
  disableAllStyles,
  deleteAllStyles,
} from '../utilities';

import { Style } from '../types';

export default Vue.extend({
  name: 'TheStylesTab',

  components: {
    AppButton,
    StyleEditor,
    StyleComponent,
    TheDeleteAllStylesButton,
  },

  data(): {
    urlFilter: string;
    styles: Array<Style>;
    addStyleDialog: boolean;
  } {
    return {
      styles: [],
      urlFilter: '',
      addStyleDialog: false,
    };
  },

  async created() {
    this.getStyles();
  },

  methods: {
    setUrlFilter(str: string): void {
      this.urlFilter = str;
      this.getStyles();
    },

    deleteStyle(style: Style): void {
      deleteStyle(style.url);
      this.getStyles();
    },

    toggleStyle(style: Style): void {
      if (style.enabled) {
        disableStyle(style.url);
      } else {
        enableStyle(style.url);
      }

      this.getStyles();
    },

    enableAll(): void {
      enableAllStyles();
      this.getStyles();
    },

    disableAll(): void {
      disableAllStyles();
      this.getStyles();
    },

    deleteAll(): void {
      deleteAllStyles();
      this.getStyles();
    },

    async saveStyle({
      initialUrl,
      url,
      css,
    }: {
      initialUrl: string;
      url: string;
      css: string;
    }): Promise<void> {
      if (saveStyle(initialUrl, url, css)) {
        this.getStyles();
      }
    },

    async getStyles(): Promise<void> {
      const styles = await getFormattedStyles();

      if (this.urlFilter) {
        this.styles = styles.filter(style =>
          style.url.includes(this.urlFilter)
        );
      } else {
        this.styles = styles;
      }
    },
  },
});
</script>
