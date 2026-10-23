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
        v-if="showProfileList"
        :url="styles[0].url"
        :profiles="siteProfiles"
        :active-profile="siteActiveProfile"
        :enabled="siteEnabled"
        :disable-off="isOpen"
        :joined="hasToggleRows"
        :previewing="galleryPreviewing"
        :publish-items="publishItems"
        @pick="pickSiteProfile"
        @edit="editSiteProfile"
        @publish="publishSiteProfile"
        @rename="renameSiteProfile"
        @delete="deleteSiteProfile"
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
        :class="{ 'popup-menu--after-profiles': showProfileList }"
      >
        <style-component
          v-if="showSiteStyle"
          site
          :url="styles[0].url"
          :name="siteProfiles[0].name"
          :shortcut="styleShortcut"
          :disable-toggle="isOpen || (pageReaderable && readability)"
          :initial-enabled="styles[0].enabled"
          :publish-item="publishItems[siteProfiles[0].id] || null"
          @edit="editSiteProfile(siteProfiles[0].id)"
          @rename="renameSiteProfile(siteProfiles[0].id, $event)"
          @publish="publishSiteProfile(siteProfiles[0].id)"
          @delete="deleteSiteStyle"
        />

        <style-component
          v-for="style in rowStyles"
          :key="style.url"
          :url="style.url"
          :disable-toggle="isOpen || (pageReaderable && readability)"
          :initial-enabled="style.enabled"
          :profiles="profilesOf(style)"
          :editable="style.url !== styles[0].url"
        />

        <readability
          v-if="showReadability"
          :tab="tab"
          :initial-readability="readability"
          :shortcut="readabilityShortcut"
          @change="readability = $event"
        />
      </div>

      <the-gallery-suggestions
        ref="gallery"
        :tab="tab"
        :profile-names="siteProfiles.map(profile => profile.name)"
        @preview="galleryPreviewing = $event"
        @installed="loadStyles"
      />

      <div class="popup-divider" />

      <div
        class="popup-footer"
        :class="{ 'popup-footer--above-sync': syncEnabled }"
      >
        <toggle-stylebot
          ref="toggle"
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

      <!-- Asked only on a page the user has styled, where they see it work. -->
      <rating-prompt v-if="styles.length" />
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
import RatingPrompt from './components/notifications/RatingPrompt.vue';
import TheGallerySuggestions from './components/TheGallerySuggestions.vue';

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
  renameProfile,
  deleteProfile,
  deleteStyle,
  getRestoredPageSupport,
  getPublishMenuItem,
} from './utils';
import type { ProfileGalleryItem } from './utils';

import { requestPublishing } from '@stylebot/gallery';

import { getGoogleDriveSyncEnabled } from '@stylebot/sync';
import {
  expandProfiles,
  hasAnyCss,
  listProfiles,
  removeProfile,
  renameProfile as renameStyleProfile,
} from '@stylebot/saved-styles';
import type { ProfileSummary } from '@stylebot/saved-styles';
import type {
  GetCommandsResponse,
  Style,
  StylebotAppearance,
  StylebotLayout,
  StylebotDockLocation,
} from '@stylebot/types';
import { detectChromiumVariant } from '@stylebot/utils';
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
    RatingPrompt,
    TheGallerySuggestions,
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
    // A gallery style is shown on the page in place of the site's own.
    galleryPreviewing: boolean;
    // Each site profile's way into publishing, once known.
    publishItems: Record<string, ProfileGalleryItem | null>;
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
      galleryPreviewing: false,
      publishItems: {},
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

    // Several matching styles each get the same row instead, so the list
    // can't be read as turning off the whole page.
    showProfileList(): boolean {
      return this.styles.length === 1 && this.siteProfiles.length > 1;
    },

    // Offered only where it applies, or to turn it back off.
    showReadability(): boolean {
      return this.pageReaderable || this.readability;
    },

    // The site's one style, as an on/off row rather than a profile list.
    showSiteStyle(): boolean {
      return this.styles.length === 1 && !this.showProfileList;
    },

    // With broader patterns also matching the page, e.g. *.example.com,
    // every matching style is a row named by its url.
    rowStyles(): Array<Style> {
      return this.styles.length > 1 ? this.styles : [];
    },

    hasToggleRows(): boolean {
      return (
        this.showSiteStyle || this.showReadability || this.rowStyles.length > 0
      );
    },

    // Names the profile the editor would open on, once it has a name: a
    // single style left unnamed is just "the style". With several styles
    // matching, it names the style instead, whose row shows the profile.
    editProfileName(): string {
      if (this.rowStyles.length) {
        return this.styles[0].url;
      }

      const profile = this.siteProfiles.find(
        ({ id }) => id === this.siteActiveProfile
      );

      if (!profile) {
        return '';
      }

      return this.showProfileList
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
    detectChromiumVariant();

    getCurrentTab(async tab => {
      this.tab = tab;
      this.pageSupport = await getRestoredPageSupport(tab);

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
        // Matches come in save order, so the page's own style is moved first.
        this.styles = styles
          .filter(hasAnyCss)
          .sort(
            (a, b) =>
              Number(b.url === defaultStyle?.url) -
              Number(a.url === defaultStyle?.url)
          );

        const [site] = this.styles;

        if (site) {
          this.siteEnabled = site.enabled;
          this.siteActiveProfile = expandProfiles(site).active;
          this.loadPublishItems(site);
        }
        this.readability = !!defaultStyle && defaultStyle.readability;
      });
    },

    async loadPublishItems(site: Style): Promise<void> {
      const { sheets } = expandProfiles(site);
      const entries = await Promise.all(
        Object.entries(sheets).map(async ([id, { css }]) => {
          const item = await getPublishMenuItem(site.url, id, css);

          return [id, item] as const;
        })
      );

      this.publishItems = Object.fromEntries(entries);
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

      // Picking a profile ends a gallery preview, so the pick shows.
      (
        this.$refs.gallery as InstanceType<typeof TheGallerySuggestions>
      )?.cancel();

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

    /**
     * Switches the site to a profile and opens the editor on it.
     */
    editSiteProfile(id: string): void {
      this.pickSiteProfile(id);

      if (!this.isOpen) {
        (this.$refs.toggle as InstanceType<typeof ToggleStylebot>).toggle();
      }
    },

    /**
     * Opens an installed profile's page in the Gallery, or the editor on a
     * profile of yours, straight into publishing it.
     */
    publishSiteProfile(id: string): void {
      const galleryUrl = this.publishItems[id]?.url;

      if (galleryUrl) {
        chrome.tabs.create({ url: galleryUrl });
        window.close();
        return;
      }

      requestPublishing(this.styles[0].url, id);

      if (this.isOpen) {
        this.pickSiteProfile(id);
        window.close();
      } else {
        this.editSiteProfile(id);
      }
    },

    renameSiteProfile(id: string, name: string): void {
      const [site, ...rest] = this.styles;

      renameProfile(site.url, id, name);
      this.styles = [renameStyleProfile(site, id, name), ...rest];
    },

    /**
     * Deletes a profile. Deleting the one that's on turns the site's style
     * off, unless the open editor is keeping it on.
     */
    deleteSiteProfile(id: string): void {
      const [site, ...rest] = this.styles;
      const turnOff =
        this.siteEnabled && id === this.siteActiveProfile && !this.isOpen;

      deleteProfile(site.url, id);

      if (turnOff) {
        disableStyle(site.url);
        this.siteEnabled = false;
      }

      const updated = { ...removeProfile(site, id), enabled: this.siteEnabled };

      this.styles = [updated, ...rest];
      this.siteActiveProfile = expandProfiles(updated).active;
    },

    /**
     * Deletes the site's style, leaving the page unstyled.
     */
    deleteSiteStyle(): void {
      const [site, ...rest] = this.styles;

      deleteStyle(site.url);
      this.styles = rest;
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
  padding: 10px 16px 12px;
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
