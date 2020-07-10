<template>
  <div class="pt-3">
    <style-editor
      v-if="addStyleDialog"
      @save="
        saveStyle($event);
        addStyleDialog = false;
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
          v-for="style in styles"
          :key="style.url"
          :css="style.css"
          :url="style.url"
          :initial-enabled="style.enabled"
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

import AppButton from './AppButton.vue';

import StyleComponent from './styles/Style.vue';
import StyleEditor from './styles/StyleEditor.vue';
import TheDeleteAllStylesButton from './styles/TheDeleteAllStylesButton.vue';

import { Style } from '../../types';

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
    addStyleDialog: boolean;
    addStyleDialogError: any;
  } {
    return {
      urlFilter: '',
      addStyleDialog: false,
      addStyleDialogError: null,
    };
  },

  computed: {
    styles(): Array<Style> {
      const stylesObj = this.$store.state.styles;
      const styles: Array<Style> = [];

      for (const url in stylesObj) {
        if (url.indexOf(this.urlFilter) !== -1) {
          styles.push({
            url,
            css: stylesObj[url].css,
            enabled: stylesObj[url].enabled,
          });
        }
      }

      return styles;
    },
  },

  methods: {
    setUrlFilter(str: string): void {
      this.urlFilter = str;
    },

    deleteStyle(style: Style): void {
      this.$store.dispatch('deleteStyle', style.url);
    },

    toggleStyle(style: Style): void {
      if (style.enabled) {
        this.$store.dispatch('disableStyle', style.url);
      } else {
        this.$store.dispatch('enableStyle', style.url);
      }
    },

    enableAll(): void {
      this.$store.dispatch('enableAllStyles');
    },

    disableAll(): void {
      this.$store.dispatch('disableAllStyles');
    },

    deleteAll(): void {
      this.$store.dispatch('deleteAllStyles');
    },

    saveStyle({
      initialUrl,
      url,
      css,
    }: {
      initialUrl: string;
      url: string;
      css: string;
    }): void {
      this.$store.dispatch('saveStyle', { initialUrl, url, css });
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
