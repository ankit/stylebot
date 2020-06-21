<template>
  <v-app>
    <v-card class="mx-auto" width="320">
      <v-list v-if="tab && tab.id" class="py-0">
        <v-list-item link :ripple="false" @click="openStylebot">
          <v-list-item-icon class="mr-6">
            <v-icon>{{ icons.edit }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title v-if="isStylebotOpen">Close Stylebot...</v-list-item-title>

            <v-list-item-title v-else>Open Stylebot...</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <user-style
          :tab="tab"
          :key="style.url"
          :url="style.url"
          :enabled="style.enabled"
          :disabled="isStylebotOpen"
          v-for="style in styleUrlMetadata"
        />

        <v-list-item link :ripple="false" @click="openOptions">
          <v-list-item-icon class="mr-6">
            <v-icon>{{ icons.options }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Options...</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { mdiCog, mdiImageEdit } from '@mdi/js';

import UserStyle from './components/Style.vue';

export default Vue.extend({
  name: 'App',
  components: {
    UserStyle,
  },

  data(): {
    icons: {
      options: string;
      edit: string;
    };
    tab?: chrome.tabs.Tab;
    isStylebotOpen: boolean;
    styleUrlMetadata: Array<{ url: string; enabled: boolean }>;
  } {
    return {
      icons: {
        options: mdiCog,
        edit: mdiImageEdit,
      },
      tab: undefined,
      styleUrlMetadata: [],
      isStylebotOpen: false,
    };
  },

  created() {
    this.getCurrentTab(tab => {
      this.tab = tab;

      const port = chrome.runtime.connect({
        name: 'browserAction',
      });

      port.postMessage({
        tab: tab,
        name: 'activeTab',
      });

      this.getStyleUrlMetadataForTab(styleUrlMetadata => {
        this.styleUrlMetadata = styleUrlMetadata;
      });

      this.getIsStylebotOpen(isStylebotOpen => {
        this.isStylebotOpen = isStylebotOpen;
      });
    });
  },

  methods: {
    getCurrentTab(callback: (tab: chrome.tabs.Tab) => void): void {
      chrome.windows.getCurrent({ populate: true }, ({ tabs }) => {
        if (tabs) {
          for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].active) {
              callback(tabs[i]);
            }
          }
        }
      });
    },

    openStylebot(): void {
      if (this.tab && this.tab.id) {
        chrome.tabs.sendRequest(this.tab.id, {
          name: 'toggle',
        });

        window.close();
      }
    },

    getIsStylebotOpen(callback: (isStylebotOpen: boolean) => void): void {
      if (this.tab && this.tab.id) {
        chrome.tabs.sendRequest(
          this.tab.id,
          {
            name: 'status',
          },
          response => callback(response.status)
        );
      }
    },

    openOptions(): void {
      chrome.tabs.create({
        active: true,
        url: 'options/index.html',
      });

      window.close();
    },

    getStyleUrlMetadataForTab(
      callback: (
        styleUrlMetadata: Array<{ url: string; enabled: boolean }>
      ) => void
    ): void {
      chrome.extension.sendRequest(
        { name: 'getStyleUrlMetadataForTab', tab: this.tab },
        response => {
          if (response && response.success) {
            callback(response.styleUrlMetadata);
            return;
          }

          callback([]);
        }
      );
    },
  },
});
</script>
