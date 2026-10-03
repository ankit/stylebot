<template>
  <s-theme-provider class="popup" :mode="appearance">
    <div v-if="restricted">
      <div class="popup-header">
        <s-heading
          as="h1"
          size="md"
          class="popup-header-domain popup-header-domain--muted"
        >
          {{ tab.url }}
        </s-heading>
      </div>

      <div class="popup-divider" />

      <s-text variant="muted" class="popup-restricted-message">
        {{ t('restricted_page_description') }}
      </s-text>

      <div class="popup-divider" />

      <div class="popup-footer">
        <manage-all-styles />
      </div>
    </div>

    <div v-else-if="tab && tab.id">
      <site-profiles
        v-if="siteProfiles.length > 1"
        :url="styles[0].url"
        :profiles="siteProfiles"
        :active-profile="siteActiveProfile"
        :enabled="siteEnabled"
        :disable-off="isOpen"
        @pick="pickSiteProfile"
      />
      <style-component
        v-else-if="styles.length"
        header
        :url="styles[0].url"
        :disable-toggle="isOpen || (pageReaderable && readability)"
        :initial-enabled="styles[0].enabled"
        :shortcut="styleShortcut"
      />
      <div v-else class="popup-header">
        <s-heading as="h1" size="md" class="popup-header-domain">
          {{ domain }}
        </s-heading>
        <s-text variant="muted">
          {{ t('no_style_saved_for_site') }}
        </s-text>
      </div>

      <div class="popup-divider" />

      <div class="popup-menu">
        <readability
          :tab="tab"
          :initial-readability="readability"
          :disabled="!pageReaderable && !readability"
          :shortcut="readabilityShortcut"
          @change="readability = $event"
        />

        <style-component
          v-for="style in styles.slice(1)"
          :key="style.url"
          :url="style.url"
          :disable-toggle="isOpen || (pageReaderable && readability)"
          :initial-enabled="style.enabled"
          :profiles="profilesOf(style)"
        />
      </div>

      <div class="popup-divider" />

      <template v-if="syncNeedsSignIn">
        <sync-stylebot />
        <div class="popup-divider" />
      </template>

      <div class="popup-footer">
        <toggle-stylebot
          :is-open="isOpen"
          :tab="tab"
          :shortcut="stylebotShortcut"
          :side-panel="dockLocation === 'sidepanel'"
          :profile-name="editProfileName"
        />
        <settings-button />
      </div>

      <release-notification />
    </div>
  </s-theme-provider>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, SText, SThemeProvider } from '@stylebot/components';

import StyleComponent from './components/Style.vue';
import SiteProfiles from './components/SiteProfiles.vue';
import SettingsButton from './components/SettingsButton.vue';
import Readability from './components/Readability.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';
import ManageAllStyles from './components/ManageAllStyles.vue';
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

import { getGoogleDriveSyncEnabled, getSyncNeedsAuth } from '@stylebot/sync';
import {
  hasAnyCss,
  isSupportedUrl,
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

export default Vue.extend({
  name: 'App',

  components: {
    SHeading,
    SText,
    SThemeProvider,
    SettingsButton,
    StyleComponent,
    SiteProfiles,
    ToggleStylebot,
    Readability,
    SyncStylebot,
    ManageAllStyles,
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
    syncNeedsSignIn: boolean;
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
      pageReaderable: true,
      syncNeedsSignIn: false,
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

    // Pages the content script can't run on (chrome://, Web Store, PDFs) —
    // same check the background page uses to decide whether it can inject.
    restricted(): boolean {
      return !!this.tab?.url && !isSupportedUrl(this.tab.url);
    },

    siteProfiles(): Array<ProfileSummary> {
      return this.styles.length ? listProfiles(this.styles[0]) : [];
    },

    // Names the profile the editor would open on, once there's a choice.
    editProfileName(): string {
      if (this.siteProfiles.length < 2) {
        return '';
      }

      const profile = this.siteProfiles.find(
        ({ id }) => id === this.siteActiveProfile
      );

      return profile ? profile.name || this.t('profile_default_name') : '';
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
    getCurrentTab(tab => {
      this.tab = tab;

      if (this.restricted) {
        return;
      }

      getIsStylebotOpen(this.tab, isOpen => {
        this.isOpen = isOpen;
      });

      getIsPageReaderable(this.tab, isReaderable => {
        this.pageReaderable = isReaderable;
      });

      getStyles(this.tab, ({ styles, defaultStyle }) => {
        this.styles = styles.filter(hasAnyCss);

        if (this.styles.length) {
          this.siteEnabled = this.styles[0].enabled;
          this.siteActiveProfile =
            listProfiles(this.styles[0]).find(({ active }) => active)?.id ?? '';
        }
        this.readability = !!defaultStyle && defaultStyle.readability;
      });
    });

    Promise.all([getGoogleDriveSyncEnabled(), getSyncNeedsAuth()]).then(
      ([enabled, needsAuth]) => {
        this.syncNeedsSignIn = enabled && needsAuth;
      }
    );

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

.popup-header-domain {
  @include truncate;

  min-width: 0;
  flex: 1;
}

.popup-header-domain.popup-header-domain--muted {
  color: var(--text-muted);
}

.popup-caption {
  font-size: 11.5px;
  color: var(--text-muted);
}

.popup-restricted-message {
  padding: 16px;
}

.popup-divider {
  height: 1px;
  background: var(--panel-border);
}

.popup-menu {
  padding: 6px;
}

.popup-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px 12px;
}

.row-label {
  min-width: 0;
  flex: 1;
  font-size: 13.5px;
}
</style>
