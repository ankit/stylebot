<template>
  <div class="options-app">
    <the-navigation
      :tabs="tabs"
      :current-tab="currentTab"
      @select="selectTab"
    />

    <div class="content">
      <the-style-editor-page
        v-if="currentTab === 'styles' && editingUrl !== null"
        :initial-url="editingUrl"
        @back="editingUrl = null"
        @save="onSaveStyle"
      />

      <component :is="currentTabComponent" v-else @edit="editingUrl = $event" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheBasicsTab from './components/TheBasicsTab.vue';
import TheStylesTab from './components/TheStylesTab.vue';
import TheSyncTab from './components/TheSyncTab.vue';
import TheNavigation from './components/TheNavigation.vue';
import TheStyleEditorPage from './components/styles/TheStyleEditorPage.vue';

export default Vue.extend({
  name: 'App',

  components: {
    TheBasicsTab,
    TheStylesTab,
    TheSyncTab,
    TheNavigation,
    TheStyleEditorPage,
  },

  data(): {
    currentTab: string;
    tabs: Array<string>;
    // null = styles list, '' = new style, else the url being edited.
    editingUrl: string | null;
  } {
    return {
      currentTab: 'basics',
      tabs: ['basics', 'styles', 'sync'],
      editingUrl: null,
    };
  },

  computed: {
    currentTabComponent(): string {
      return `the-${this.currentTab}-tab`;
    },

    theme(): string {
      return this.$store.state.options?.theme ?? 'auto';
    },
  },

  watch: {
    theme: {
      immediate: true,
      handler(value: string): void {
        if (value === 'auto') {
          delete document.documentElement.dataset.theme;
        } else {
          document.documentElement.dataset.theme = value;
        }
      },
    },
  },

  created() {
    this.$store.dispatch('getAllStyles');
    this.$store.dispatch('getAllOptions');
    this.$store.dispatch('getCommands');
    this.$store.dispatch('getGoogleDriveSyncMetadata');
  },

  methods: {
    selectTab(tab: string): void {
      this.currentTab = tab;
      this.editingUrl = null;
    },

    onSaveStyle({
      initialUrl,
      url,
      css,
    }: {
      initialUrl: string;
      url: string;
      css: string;
    }): void {
      this.$store.dispatch('saveStyle', { initialUrl, url, css });
      this.editingUrl = null;
    },
  },
});
</script>

<style lang="scss">
@import '../styles/theme';

html,
body {
  margin: 0;
  height: 100%;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Public Sans', system-ui, sans-serif;
  background: var(--ui-bg);
  color: var(--ui-fg);
}

#app {
  height: 100%;
}

a {
  color: var(--ui-accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.options-app {
  display: flex;
  min-height: 100vh;
}

.content {
  flex: 1;
  min-width: 0;
}
</style>
