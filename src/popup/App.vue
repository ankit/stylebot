<template>
  <div class="popup">
    <b-list-group v-if="tab && tab.id" class="list-group">
      <style-component
        v-for="style in styles"
        :key="style.url"
        :url="style.url"
        :disable-toggle="isOpen"
        :initial-enabled="style.enabled"
      />

      <readability :initial-readability="readability" />

      <toggle-stylebot :is-open="isOpen" :tab="tab" />
      <view-options />
    </b-list-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import StyleComponent from './components/Style.vue';
import ViewOptions from './components/ViewOptions.vue';
import Readability from './components/Readability.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';

import { getStyles, getCurrentTab, getIsStylebotOpen } from './utils';

export default Vue.extend({
  name: 'App',

  components: {
    ViewOptions,
    StyleComponent,
    ToggleStylebot,
    Readability,
  },

  data(): {
    isOpen: boolean;
    readability: boolean;
    tab?: chrome.tabs.Tab;
    styles: Array<{ url: string; css: string; enabled: boolean }>;
  } {
    return {
      styles: [],
      isOpen: false,
      tab: undefined,
      readability: false,
    };
  },

  created() {
    getCurrentTab(tab => {
      this.tab = tab;

      getIsStylebotOpen(this.tab, isOpen => {
        this.isOpen = isOpen;
      });

      getStyles(this.tab, ({ styles, defaultStyle }) => {
        this.styles = styles.filter(style => style.css);
        this.readability = !!defaultStyle && defaultStyle.readability;
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
