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
        v-for="style in styles"
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

import { getStyles, getCurrentTab, getIsStylebotOpen } from './utils';

export default Vue.extend({
  name: 'App',

  components: {
    ViewOptions,
    StyleComponent,
    ToggleStylebot,
  },

  data(): {
    isOpen: boolean;
    tab?: chrome.tabs.Tab;
    styles: Array<{ url: string; css: string; enabled: boolean }>;
  } {
    return {
      styles: [],
      isOpen: false,
      tab: undefined,
    };
  },

  created() {
    getCurrentTab(tab => {
      this.tab = tab;

      getIsStylebotOpen(this.tab, isOpen => {
        this.isOpen = isOpen;
      });

      getStyles(this.tab, styles => {
        this.styles = styles;
      });
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
