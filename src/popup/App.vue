<template>
  <div class="popup">
    <b-list-group v-if="tab && tab.id" class="list-group">
      <toggle-stylebot :isOpen="isOpen" :tab="tab" />

      <style-component
        :tab="tab"
        :key="style.url"
        :url="style.url"
        :disableToggle="isOpen"
        :initialEnabled="style.enabled"
        v-for="style in styleUrlMetadata"
      />

      <view-options />
    </b-list-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import StyleComponent from './components/Style.vue';
import ViewOptions from './components/ViewOptions.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';

import {
  getCurrentTab,
  setAsActiveTab,
  getIsStylebotOpen,
  getStyleUrlMetadataForTab,
} from './utils';

export default Vue.extend({
  name: 'App',

  components: {
    ViewOptions,
    StyleComponent,
    ToggleStylebot,
  },

  data(): {
    tab?: chrome.tabs.Tab;
    isOpen: boolean;
    styleUrlMetadata: Array<{ url: string; enabled: boolean }>;
  } {
    return {
      isOpen: false,
      tab: undefined,
      styleUrlMetadata: [],
    };
  },

  created() {
    getCurrentTab(tab => {
      this.tab = tab;

      getIsStylebotOpen(this.tab, isOpen => {
        this.isOpen = isOpen;
      });

      getStyleUrlMetadataForTab(this.tab, styleUrlMetadata => {
        this.styleUrlMetadata = styleUrlMetadata;
      });

      setAsActiveTab(tab);
    });
  },
});
</script>

<style lang="scss">
@import '~bootstrap';
@import '~bootstrap-vue';

body,
span {
  margin: 0;
  font-size: 15px;
}

.popup {
  width: 250px;
}

.list-group {
  border-radius: 0;

  .list-group-item {
    &:focus {
      outline: none;
    }
  }
}
</style>
