<template>
  <div class="pt-3">
    <style-editor
      v-if="addStyleDialog"
      @save="
        const response = saveStyle($event);
        // todo: display error stacktrace
        if (response.success) {
          addStyleDialog = false;
        }
      "
      @cancel="addStyleDialog = false"
    />

    <b-row no-gutters class="mt-5">
      <b-col cols="12">
        <b-row>
          <b-col cols="10">
            <app-button
              variant="primary"
              text="Add a new style..."
              @click="addStyleDialog = true"
            />

            <app-button text="Enable all" @click="enableAll" />
            <app-button text="Disable all" @click="disableAll" />
          </b-col>

          <b-col cols="2" align-self="end">
            <b-row justify="end">
              <the-delete-all-styles-button @click="deleteAll" />
            </b-row>
          </b-col>
        </b-row>

        <b-row>
          <b-col cols="12" class="py-3">
            <b-form-input
              class="search"
              placeholder="Search..."
              @input="setUrlFilter"
            />
          </b-col>
        </b-row>

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
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as postcss from 'postcss';

import AppButton from './AppButton.vue';

import StyleComponent from './styles/Style.vue';
import StyleEditor from './styles/StyleEditor.vue';
import TheDeleteAllStylesButton from './styles/TheDeleteAllStylesButton.vue';

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

import { Style } from '../../types';
import { CssSyntaxError } from 'postcss';

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
    addStyleDialogError: any;
  } {
    return {
      styles: [],
      urlFilter: '',
      addStyleDialog: false,
      addStyleDialogError: null,
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

    saveStyle({
      initialUrl,
      url,
      css,
    }: {
      initialUrl: string;
      url: string;
      css: string;
    }): { success: boolean; error?: postcss.CssSyntaxError } {
      const response = saveStyle(initialUrl, url, css);

      if (response.success) {
        this.getStyles();
      }

      return response;
    },

    getStyles(): void {
      const styles = getFormattedStyles();

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

<style lang="scss" scoped>
.search {
  border: none;
  border-bottom: 1px solid #aaa;
  border-radius: 0;
  outline: none;

  &:focus {
    box-shadow: none;
  }
}
</style>
