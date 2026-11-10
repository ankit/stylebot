<template>
  <s-theme-provider class="options-app" :mode="appearance">
    <div class="sidebar">
      <the-navigation
        class="nav"
        :tabs="tabs"
        :current-tab="currentTab"
        @select="selectTab"
      />

      <div class="nav-footer">
        <the-navigation-footer />
      </div>
    </div>

    <div class="content">
      <router-view
        v-if="stylesLoaded"
        :key="$route.fullPath"
        @edit="editStyle"
        @back="navigate({ name: 'styles' })"
        @save="onSaveStyle"
      />
    </div>
  </s-theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import type { RawLocation } from 'vue-router';

import type { StylebotAppearance } from '@stylebot/types';
import { SThemeProvider } from '@stylebot/components';

import TheNavigation from './components/TheNavigation.vue';
import TheNavigationFooter from './components/navigation/TheNavigationFooter.vue';
import { TABS } from './router';
import { provideSupportsEditor } from './supports-editor';

export default Vue.extend({
  name: 'App',

  components: {
    TheNavigation,
    TheNavigationFooter,
    SThemeProvider,
  },

  provide: provideSupportsEditor,

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

    // Scheduled syncs run in the background while this page is open: re-read
    // what they change so "Synced … ago" and the styles list stay true.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') {
        return;
      }

      if (
        'google-drive-sync-state' in changes ||
        'google-drive-sync-needs-auth' in changes
      ) {
        this.$store.dispatch('getGoogleDriveSyncMetadata');
      }

      if ('styles' in changes) {
        this.$store.dispatch('getAllStyles');
      }
    });
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
      drafts,
    }: {
      initialUrl: string;
      url: string;
      drafts: Record<string, string>;
    }): void {
      this.$store.dispatch('saveStyle', { initialUrl, url, drafts });

      if (url !== initialUrl && this.$store.state.styles[url]) {
        this.$router
          .replace({
            name: 'style-edit',
            query: { url },
            params: { justSaved: 'true' },
          })
          .catch(() => undefined);
      }
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
  font-family: var(--font-ui, 'Geist', system-ui, sans-serif);
}

#app {
  height: 100%;
}

a {
  color: var(--accent-text);
  text-decoration: none;

  @include hover-capable {
    &:hover {
      text-decoration: underline;
    }
  }
}

.options-app {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;

  @media (max-width: 600px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;

    --options-nav-padding: 0 8px;
    --options-nav-direction: row;
    --options-nav-border: 0 0 1px;
    --options-nav-logo-display: none;
    --options-nav-item-width: auto;
    --options-nav-item-padding: 0 12px;
    --options-nav-item-line-height: 44px;
    --options-nav-item-font-size: 15px;
    --options-nav-item-white-space: nowrap;
    --options-tab-padding: 16px 16px 24px;
    --list-item-wrapped-columns: minmax(0, 1fr);
    --list-item-meta-wrap: wrap;
    --list-item-padding-y: 10px;
    --options-label-wrap: wrap;
    --options-label-width: 100%;
    --options-sync-row-basis: 100%;
    --options-sync-action-grow: 1;
    --options-version-counts-display: none;
    --options-version-details-indent: 20px;
  }

  @include touch {
    --options-field-height: 44px;
    --options-input-font-size: 16px;
  }
}

.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--panel-border);

  @media (max-width: 600px) {
    display: contents;
  }
}

.nav {
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  @media (max-width: 600px) {
    position: sticky;
    top: 0;
    z-index: 1;
    grid-column: 1;
    grid-row: 1;
  }
}

.nav-footer {
  flex: none;
  padding: 0 12px 16px;

  @media (max-width: 600px) {
    grid-column: 1;
    grid-row: 3;
    padding: 16px 4px 24px;
    border-top: 1px solid var(--panel-border);
  }
}

.content {
  min-width: 0;

  @media (max-width: 600px) {
    grid-column: 1;
    grid-row: 2;
  }
}
</style>
