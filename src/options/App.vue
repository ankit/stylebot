<template>
  <b-container fluid="lg" class="container">
    <b-row class="main">
      <b-col cols="4">
        <the-navigation
          :tabs="tabs"
          :current-tab="currentTab"
          @select="currentTab = $event"
        />
      </b-col>

      <b-col cols="8" class="mt-2">
        <component :is="currentTabComponent" />
      </b-col>
    </b-row>

    <InjectMonacoEditorIframe />
  </b-container>
</template>

<script lang="ts">
import Vue from 'vue';

import TheBasicsTab from './components/TheBasicsTab.vue';
import TheStylesTab from './components/TheStylesTab.vue';
import TheBackupTab from './components/TheBackupTab.vue';
import TheHelpTab from './components/TheHelpTab.vue';
import TheNavigation from './components/TheNavigation.vue';
import InjectMonacoEditorIframe from './components/styles/InjectMonacoEditorIframe.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheBasicsTab,
    TheStylesTab,
    TheBackupTab,
    TheHelpTab,
    TheNavigation,
    InjectMonacoEditorIframe,
  },

  data(): {
    currentTab: string;
    tabs: Array<string>;
  } {
    return {
      currentTab: 'Basics',
      tabs: ['Basics', 'Styles', 'Backup', 'Help'],
    };
  },

  computed: {
    currentTabComponent(): string {
      return `the-${this.currentTab.toLowerCase()}-tab`;
    },
  },

  created() {
    this.$store.dispatch('getAllStyles');
    this.$store.dispatch('getAllOptions');
  },
});
</script>

<style lang="scss">
@import '~bootstrap';
@import '~bootstrap-vue';

.main {
  height: calc(100% - 50px);
}

.container {
  min-width: 880px;
}

h2 {
  font-weight: 300;
}
</style>
