<template>
  <ul v-if="tab && tab.id">
    <li>
      <button v-on:click="openStylebot">Open Stylebot...</button>
    </li>

    <li>
      <button v-on:click="disableStyling">Disable Styling</button>

      <button v-on:click="enableStyling">Enable Styling</button>
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

  data(): { tab?: chrome.tabs.Tab; stylingEnabled: boolean } {
    return {
      tab: undefined,
      stylingEnabled: false,
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

      this.getStylesForTab(style => {});
    });
  },

  methods: {
    getStylesForTab(callback: (style?: any) => void): void {
      console.log(this.tab);
      if (this.tab) {
        chrome.extension.sendRequest(
          { name: 'getCombinedRulesForPage', url: this.tab.url, tab: this.tab },
          response => {
            console.log('response', response);
            if (response && response.success) {
              callback(response);
            }
          }
        );
      }

      callback();
    },

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

    disableStyling(): void {
      if (this.tab && this.tab.id) {
        chrome.tabs.sendRequest(this.tab.id, { name: 'disableStyling' });
      }
    },

    enableStyling(): void {
      if (this.tab && this.tab.id) {
        chrome.tabs.sendRequest(this.tab.id, { name: 'enableStyling' });
      }
    },
  },
});
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
