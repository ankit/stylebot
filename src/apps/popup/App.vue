<template>
  <s-theme-provider class="popup" :mode="appearance">
    <div v-if="tab && pageSupport && pageSupport !== 'supported'">
      <unsupported-page :url="tab.url || ''" :support="pageSupport" />

      <template v-if="syncEnabled">
        <div class="popup-divider" />
        <sync-stylebot standalone />
      </template>
    </div>

    <div v-else-if="tab && tab.id && pageSupport === 'supported'">
      <site-profiles
        v-if="hasProfiles"
        :url="styles[0].url"
        :profiles="siteProfiles"
        :active-profile="siteActiveProfile"
        :enabled="siteEnabled"
        :disable-off="isOpen"
        :joined="hasToggleRows"
        @pick="pickSiteProfile"
      />
      <template v-else>
        <div class="popup-header">
          <div class="popup-header-title">
            <s-heading as="h1" size="md" class="popup-header-domain">
              {{ styles.length ? styles[0].url : domain }}
            </s-heading>
            <options-button />
          </div>
        </div>

        <div v-if="hasToggleRows" class="popup-divider" />
      </template>

      <div
        v-if="hasToggleRows"
        class="popup-menu"
        :class="{ 'popup-menu--after-profiles': hasProfiles }"
      >
        <style-component
          v-if="showSiteStyle"
          site
          :url="styles[0].url"
          :name="siteProfiles[0].name"
          :shortcut="styleShortcut"
          :disable-toggle="isOpen || (pageReaderable && readability)"
          :initial-enabled="styles[0].enabled"
        />

        <readability
          v-if="showReadability"
          :tab="tab"
          :initial-readability="readability"
          :shortcut="readabilityShortcut"
          :indent="hasProfiles"
          @change="readability = $event"
        />

        <style-component
          v-for="style in otherStyles"
          :key="style.url"
          :url="style.url"
          :disable-toggle="isOpen || (pageReaderable && readability)"
          :initial-enabled="style.enabled"
          :profiles="profilesOf(style)"
        />
      </div>

      <div class="popup-divider" />

      <div
        class="popup-footer"
        :class="{ 'popup-footer--above-sync': syncEnabled }"
      >
        <toggle-stylebot
          :is-open="isOpen"
          :tab="tab"
          :shortcut="stylebotShortcut"
          :side-panel="dockLocation === 'sidepanel'"
          :profile-name="editProfileName"
          :has-style="styles.length > 0"
        />
      </div>

      <sync-stylebot v-if="syncEnabled" @synced="loadStyles" />

      <release-notification />
    </div>
  </s-theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, SThemeProvider } from '@stylebot/components';

import StyleComponent from './components/Style.vue';
import SiteProfiles from './components/SiteProfiles.vue';
import OptionsButton from './components/OptionsButton.vue';
import Readability from './components/Readability.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';
import UnsupportedPage from './components/UnsupportedPage.vue';
import ReleaseNotification from './components/notifications/ReleaseNotification.vue';

import {
  getStyles,
  getCommands,
  getOption,
  getCurrentTab,
  getIsStylebotOpen,
  getIsPageReaderable,
  enableStyle,
  disableStyle,
  setActiveProfile,
} from './utils';

import { getGoogleDriveSyncEnabled } from '@stylebot/sync';
import {
  expandProfiles,
  hasAnyCss,
  listProfiles,
} from '@stylebot/saved-styles';
import type { ProfileSummary } from '@stylebot/saved-styles';
import type {
  GetCommandsResponse,
  Style,
  StylebotAppearance,
  StylebotLayout,
  StylebotDockLocation,
} from '@stylebot/types';
import { getPageSupport } from '@stylebot/utils';
import type { PageSupport } from '@stylebot/utils';

export default Vue.extend({
  name: 'App',

  components: {
    SHeading,
    SThemeProvider,
    OptionsButton,
    StyleComponent,
    SiteProfiles,
    ToggleStylebot,
    Readability,
    SyncStylebot,
    UnsupportedPage,
    ReleaseNotification,
  },

  data(): {
    isOpen: boolean;
    readability: boolean;
    pageReaderable: boolean;
    tab?: chrome.tabs.Tab;
    styles: Array<Style>;
    // The site's own style, as picked here since the popup opened.
    siteActiveProfile: string;
    siteEnabled: boolean;
    syncEnabled: boolean;
    // Null until the tab answers, so neither view shows before it does.
    pageSupport: PageSupport | null;
    commands?: GetCommandsResponse;
    appearance: StylebotAppearance;
    dockLocation: StylebotDockLocation | '';
  } {
    return {
      styles: [],
      siteActiveProfile: '',
      siteEnabled: true,
      isOpen: false,
      tab: undefined,
      readability: false,
      pageReaderable: false,
      syncEnabled: false,
      pageSupport: null,
      commands: undefined,
      appearance: 'system',
      dockLocation: '',
    };
  },

  computed: {
    domain(): string {
      try {
        return this.tab?.url ? new URL(this.tab.url).hostname : '';
      } catch {
        return '';
      }
    },

    siteProfiles(): Array<ProfileSummary> {
      return this.styles.length ? listProfiles(this.styles[0]) : [];
    },

    hasProfiles(): boolean {
      return this.siteProfiles.length > 1;
    },

    // Offered only where it applies, or to turn it back off.
    showReadability(): boolean {
      return this.pageReaderable || this.readability;
    },

    // The site's one style, as an on/off row rather than a profile list.
    showSiteStyle(): boolean {
      return this.styles.length > 0 && !this.hasProfiles;
    },

    // Styles of broader patterns that also match the page, e.g. *.example.com.
    otherStyles(): Array<Style> {
      return this.styles.slice(1);
    },

    hasToggleRows(): boolean {
      return (
        this.showSiteStyle ||
        this.showReadability ||
        this.otherStyles.length > 0
      );
    },

    // Names the profile the editor would open on, once it has a name: a
    // single style left unnamed is just "the style".
    editProfileName(): string {
      const profile = this.siteProfiles.find(
        ({ id }) => id === this.siteActiveProfile
      );

      if (!profile) {
        return '';
      }

      return this.hasProfiles
        ? profile.name || this.t('profile_default_name')
        : profile.name;
    },

    styleShortcut(): string {
      return this.commands?.style ?? '';
    },

    readabilityShortcut(): string {
      return this.commands?.readability ?? '';
    },

    stylebotShortcut(): string {
      return this.commands?.stylebot ?? '';
    },
  },

  created() {
    getCurrentTab(async tab => {
      this.tab = tab;
      this.pageSupport = await getPageSupport(tab);

      if (this.pageSupport !== 'supported') {
        return;
      }

      getIsStylebotOpen(this.tab, isOpen => {
        this.isOpen = isOpen;
      });

      getIsPageReaderable(this.tab, isReaderable => {
        this.pageReaderable = isReaderable;
      });

      this.loadStyles();
    });

    getGoogleDriveSyncEnabled().then(enabled => {
      this.syncEnabled = enabled;
    });

    getCommands(commands => {
      this.commands = commands;
    });

    getOption('appearance', appearance => {
      this.appearance = (appearance as StylebotAppearance) ?? 'system';
    });

    getOption('layout', layout => {
      this.dockLocation = (layout as StylebotLayout).dockLocation;
    });
  },

  methods: {
    /**
     * Reads the tab's styles; again after a sync, which may have brought in
     * styles or profiles edited on another device.
     */
    loadStyles(): void {
      if (!this.tab) {
        return;
      }

      getStyles(this.tab, ({ styles, defaultStyle }) => {
        this.styles = styles.filter(hasAnyCss);

        const [site] = this.styles;

        if (site) {
          this.siteEnabled = site.enabled;
          this.siteActiveProfile = expandProfiles(site).active;
        }
        this.readability = !!defaultStyle && defaultStyle.readability;
      });
    },

    profilesOf(style: Style): Array<ProfileSummary> {
      return listProfiles(style);
    },

    /**
     * Applies a profile picked for the site, turning its style back on if
     * it was off, or turns the style off when no profile is picked.
     */
    pickSiteProfile(id: string | null): void {
      const { url } = this.styles[0];

      if (id === null) {
        if (this.siteEnabled) {
          disableStyle(url);
        }
        this.siteEnabled = false;
        return;
      }

      if (id !== this.siteActiveProfile) {
        setActiveProfile(url, id);
      }
      if (!this.siteEnabled) {
        enableStyle(url);
      }

      this.siteActiveProfile = id;
      this.siteEnabled = true;
    },
  },
});
</script>

<style lang="scss">
html,
body {
  color-scheme: light dark;
}

* {
  box-sizing: border-box;
}

button {
  font-family: inherit;
  color: inherit;
}

body {
  margin: 0;
  font-family: var(--font-ui, 'Geist', system-ui, sans-serif);
  font-size: 14px;
}

.popup {
  width: 320px;
}

.popup-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.popup-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.popup-header-domain {
  @include truncate;

  min-width: 0;
  flex: 1;
}

.popup-divider {
  height: 1px;
  background: var(--panel-border);
}

.popup-menu {
  padding: 8px 6px;
}

.popup-menu.popup-menu--after-profiles {
  padding-top: 0;
}

.popup-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px 12px;
}

.popup-footer.popup-footer--above-sync {
  padding-bottom: 8px;
}

.row-label {
  min-width: 0;
  flex: 1;
  font-size: 13.5px;
}
</style>
