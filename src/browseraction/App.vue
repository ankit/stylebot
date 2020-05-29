<template>
  <ul v-if="tab && tab.id">
    <li>
      <button v-on:click="openStylebot">Open Stylebot...</button>
    </li>

    <li>
      <button v-if="isEnabled" v-on:click="disableStyle">Disable Styling</button>
      <button v-else v-on:click="enableStyle">Enable Styling</button>
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
    isEnabled: boolean;
    computedStyleUrl?: string;
  } {
    return {
      tab: undefined,
      isEnabled: false,
      computedStyleUrl: undefined,
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

      this.getComputedStyleUrl(url => {
        this.computedStyleUrl = url;

        const backgroundPage = chrome.extension.getBackgroundPage() as any;
        this.isEnabled = backgroundPage.cache.styles.isEnabled(
          this.computedStyleUrl
        );
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

    getComputedStyleUrl(callback: (url?: string) => void): void {
      if (this.tab && this.tab.url) {
        chrome.extension.sendRequest(
          { name: 'getComputedStyleUrlForTab', url: this.tab.url },
          response => {
            if (response && response.success) {
              callback(response.url);
              return;
            }

            callback();
          }
        );
      } else {
        callback();
      }
    },

    enableStyle(): void {
      const backgroundPage = chrome.extension.getBackgroundPage() as any;
      backgroundPage.cache.styles.toggle(this.computedStyleUrl, true, true);
      this.isEnabled = true;
    },

    disableStyle(): void {
      const backgroundPage = chrome.extension.getBackgroundPage() as any;
      backgroundPage.cache.styles.toggle(this.computedStyleUrl, false, true);
      this.isEnabled = false;
    },
  },
});
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
