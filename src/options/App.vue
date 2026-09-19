<template>
  <theme-provider class="options-app" :mode="appearance">
    <the-navigation
      class="nav"
      :tabs="tabs"
      :current-tab="currentTab"
      @select="selectTab"
    />

    <div class="content">
      <router-view
        v-if="stylesLoaded"
        :key="$route.fullPath"
        @edit="editStyle"
        @back="navigate({ name: 'styles' })"
        @save="onSaveStyle"
      />
    </div>

    <div class="nav-footer">
      <the-navigation-footer />
    </div>
  </theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import { RawLocation } from 'vue-router';

import { StylebotAppearance } from '@stylebot/types';
import { ThemeProvider } from '@stylebot/components';

import TheNavigation from './components/TheNavigation.vue';
import TheNavigationFooter from './components/navigation/TheNavigationFooter.vue';
import { TABS } from './router';

export default Vue.extend({
  name: 'App',

  components: {
    TheNavigation,
    TheNavigationFooter,
    ThemeProvider,
  },

  data(): {
    tabs: Array<string>;
    stylesLoaded: boolean;
  } {
    return {
      tabs: [...TABS],
      stylesLoaded: false,
    };
  },

  computed: {
    currentTab(): string {
      return (this.$route.meta?.tab as string | undefined) ?? 'basics';
    },

    appearance(): StylebotAppearance {
      return this.$store.state.options?.appearance ?? 'system';
    },
  },

  created() {
    this.$store.dispatch('getAllStyles').then(() => {
      this.stylesLoaded = true;
    });

    this.$store.dispatch('getAllOptions');
    this.$store.dispatch('getCommands');
    this.$store.dispatch('getGoogleDriveSyncMetadata');
  },

  methods: {
    navigate(location: RawLocation): void {
      this.$router.push(location).catch(() => undefined);
    },

    selectTab(tab: string): void {
      if (this.$route.name !== tab) {
        this.navigate({ name: tab });
      }
    },

    editStyle(url: string): void {
      this.navigate(
        url ? { name: 'style-edit', query: { url } } : { name: 'style-edit' }
      );
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
      this.navigate({ name: 'styles' });
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
  font-family: 'Geist', system-ui, sans-serif;
}

#app {
  height: 100%;
}

a {
  color: var(--accent);
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
  border-right: 1px solid var(--panel-border);
}

.content {
  grid-column: 2;
  grid-row: 1 / -1;
  min-width: 0;
}
</style>
