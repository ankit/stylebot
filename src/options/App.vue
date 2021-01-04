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
import TheSyncTab from './components/TheSyncTab.vue';
import TheHelpTab from './components/TheHelpTab.vue';
import TheNavigation from './components/TheNavigation.vue';
import InjectMonacoEditorIframe from './components/styles/InjectMonacoEditorIframe.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheBasicsTab,
    TheStylesTab,
    TheSyncTab,
    TheHelpTab,
    TheNavigation,
    InjectMonacoEditorIframe,
  },

  data(): {
    currentTab: string;
    tabs: Array<string>;
  } {
    return {
      currentTab: 'basics',
      tabs: ['basics', 'styles', 'sync', 'help'],
    };
  },

  computed: {
    currentTabComponent(): string {
      return `the-${this.currentTab}-tab`;
    },
  },

  created() {
    this.$store.dispatch('getAllStyles');
    this.$store.dispatch('getAllOptions');
    this.$store.dispatch('getCommands');
    this.$store.dispatch('getGoogleDriveSyncMetadata');
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
  font-size: 20px;
  font-weight: 500;
}

h3 {
  font-size: 16px;
  font-weight: 500;
}
</style>
