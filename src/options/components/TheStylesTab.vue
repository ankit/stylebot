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

          <v-col cols="2" align-self="end">
            <v-row justify="end">
              <app-button text="Delete all" color="red lighten-2" />
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
            ></v-text-field>
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

import { saveStyle, getFormattedStyles } from '../utilities';

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
    urlFilter: string;
    styles: Array<Style>;
    currentlyEditedStyle: Style | null;
  } {
    return {
      styles: [],
      urlFilter: '',
      currentlyEditedStyle: null,
    };
  },

  async created() {
    this.getStyles();
  },

  methods: {
    editStyle(style: Style): void {
      this.currentlyEditedStyle = style;
    },
    cancelEditStyle(): void {
      this.currentlyEditedStyle = null;
    },
    setUrlFilter(str: string): void {
      this.urlFilter = str;
      this.getStyles();
    },
    async saveStyle(
      initialUrl: string,
      url: string,
      css: string
    ): Promise<void> {
      // TODO: Handle error
      if (saveStyle(initialUrl, url, css)) {
        this.getStyles();
      }

      this.currentlyEditedStyle = null;
    },
    deleteStyle(): void {
      //
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
