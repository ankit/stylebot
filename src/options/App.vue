<template>
  <theme-provider class="options-app">
    <the-navigation
      class="nav"
      :tabs="tabs"
      :current-tab="currentTab"
      @select="selectTab"
    />

    <div class="content">
      <the-style-editor-page
        v-if="currentTab === 'styles' && editingUrl !== null"
        ref="editorPage"
        :initial-url="editingUrl"
        @back="editingUrl = null"
        @save="onSaveStyle"
      />

      <component :is="currentTabComponent" v-else @edit="editingUrl = $event" />
    </div>

    <div class="nav-footer">
      <the-navigation-footer />
    </div>

    <confirm-dialog
      v-if="pendingTab !== null"
      :title="t('discard_changes')"
      :message="t('unsaved_changes_warning')"
      :confirm-label="t('discard_changes')"
      @cancel="pendingTab = null"
      @confirm="confirmSwitchTab"
    />
  </theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';

import TheBasicsTab from './components/TheBasicsTab.vue';
import TheStylesTab from './components/TheStylesTab.vue';
import TheSyncTab from './components/TheSyncTab.vue';
import TheNavigation from './components/TheNavigation.vue';
import TheNavigationFooter from './components/navigation/TheNavigationFooter.vue';
import TheStyleEditorPage from './components/styles/TheStyleEditorPage.vue';

import { ConfirmDialog, ThemeProvider } from '@stylebot/components';

export default Vue.extend({
  name: 'App',

  components: {
    TheBasicsTab,
    TheStylesTab,
    TheSyncTab,
    TheNavigation,
    TheNavigationFooter,
    ConfirmDialog,
    ThemeProvider,
    TheStyleEditorPage,
  },

  data(): {
    currentTab: string;
    tabs: Array<string>;
    // null = styles list, '' = new style, else the url being edited.
    editingUrl: string | null;
    pendingTab: string | null;
  } {
    return {
      currentTab: 'basics',
      tabs: ['basics', 'styles', 'sync'],
      editingUrl: null,
      pendingTab: null,
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

  methods: {
    selectTab(tab: string): void {
      const editorPage = this.$refs.editorPage as { isDirty: boolean } | undefined;

      if (this.editingUrl !== null && editorPage?.isDirty) {
        this.pendingTab = tab;
        return;
      }

      this.currentTab = tab;
      this.editingUrl = null;
    },

    confirmSwitchTab(): void {
      this.currentTab = this.pendingTab as string;
      this.editingUrl = null;
      this.pendingTab = null;
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
html,
body {
  margin: 0;
  height: 100%;
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

body {
  font-family: 'Public Sans', system-ui, sans-serif;
}

#app {
  height: 100%;
}

a {
  color: var(--primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.options-app {
  display: grid;
  grid-template-columns: 216px 1fr;
  grid-template-rows: 1fr auto;
  min-height: 100vh;
}

.nav {
  grid-column: 1;
  grid-row: 1;
}

.nav-footer {
  grid-column: 1;
  grid-row: 2;
  padding: 0 12px 16px;
  border-right: 1px solid var(--border);
}

.content {
  grid-column: 2;
  grid-row: 1 / -1;
  min-width: 0;
}
</style>
