<template>
  <ul v-if="tab && tab.id">
    <li>
      <button v-on:click="openStylebot">Open Stylebot...</button>
    </li>

    <li v-for="item in styleUrlMetadata" :key="item.url">
      <button v-if="item.enabled" v-on:click="disableStyleUrl(item)">
        Disable Styling for
        <strong>{{ item.url }}</strong>
      </button>

      <button v-else v-on:click="enableStyleUrl(item)">
        Enable Styling for
        <strong>{{ item.url }}</strong>
      </button>
    </li>

    <li>
      <button v-on:click="openOptions">Options...</button>
    </li>
  </ul>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'App',

  data(): {
    tab?: chrome.tabs.Tab;
    styleUrlMetadata: Array<{ url: string; enabled: boolean }>;
  } {
    return {
      tab: undefined,
      styleUrlMetadata: [],
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
        console.log(styleUrlMetadata);
        this.styleUrlMetadata = styleUrlMetadata;
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

    enableStyleUrl(styleUrlMetadata: { url: string; enabled: boolean }): void {
      chrome.extension.sendRequest({
        tab: this.tab,
        name: 'enableStyleUrl',
        styleUrl: styleUrlMetadata.url,
      });

      styleUrlMetadata.enabled = true;
    },

    disableStyleUrl(styleUrlMetadata: { url: string; enabled: boolean }): void {
      chrome.extension.sendRequest({
        tab: this.tab,
        name: 'disableStyleUrl',
        styleUrl: styleUrlMetadata.url,
      });

      styleUrlMetadata.enabled = false;
    },
  },
});
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
