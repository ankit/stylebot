<template>
  <div class="popup">
    <popup-more-menu v-if="showMore" @back="showMore = false" />

    <template v-else>
      <div v-if="restricted">
        <div class="popup-header">
          <heading as="h1" size="sm" class="popup-header-domain popup-header-domain--muted">
            {{ tab.url }}
          </heading>
        </div>

        <div class="popup-divider" />

        <text-block variant="muted" class="popup-restricted-message">
          {{ t('restricted_page_description') }}
        </text-block>

        <div class="popup-divider" />

        <div class="popup-footer">
          <manage-all-styles />
          <more-button @click="showMore = true" />
        </div>
      </div>

      <div v-else-if="tab && tab.id">
        <style-component
          v-if="styles.length"
          header
          :url="styles[0].url"
          :disable-toggle="isOpen || (pageReaderable && readability)"
          :initial-enabled="styles[0].enabled"
          :shortcut="styleShortcut"
        />
        <div v-else class="popup-header">
          <heading as="h1" size="sm" class="popup-header-domain">{{ domain }}</heading>
          <text-block size="caption" variant="muted" class="popup-header-subtitle">
            {{ t('no_style_saved_for_site') }}
          </text-block>
        </div>

        <div class="popup-divider" />

        <div class="popup-menu">
          <readability
            :initial-readability="pageReaderable && readability"
            :disabled="!pageReaderable"
            :shortcut="readabilityShortcut"
            @change="readability = $event"
          />

          <style-component
            v-for="style in styles.slice(1)"
            :key="style.url"
            :url="style.url"
            :disable-toggle="isOpen || (pageReaderable && readability)"
            :initial-enabled="style.enabled"
          />

          <sync-stylebot v-if="googleDriveSyncEnabled" />
        </div>

        <div class="popup-divider" />

        <div class="popup-footer">
          <toggle-stylebot
            :is-open="isOpen"
            :tab="tab"
            :shortcut="stylebotShortcut"
          />
          <more-button @click="showMore = true" />
        </div>

        <release-notification />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, TextBlock } from '@stylebot/components';

import StyleComponent from './components/Style.vue';
import MoreButton from './components/MoreButton.vue';
import PopupMoreMenu from './components/PopupMoreMenu.vue';
import Readability from './components/Readability.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';
import ManageAllStyles from './components/ManageAllStyles.vue';
import ReleaseNotification from './components/notifications/ReleaseNotification.vue';

import {
  getStyles,
  getCommands,
  getCurrentTab,
  getIsStylebotOpen,
  getIsPageReaderable,
} from './utils';

// Bypasses @stylebot/sync, whose barrel also drags in runGoogleDriveSync's postcss dependency chain.
import { getGoogleDriveSyncEnabled } from '../sync/google-drive/sync-metadata';
// Bypasses @stylebot/styles' barrel, whose page.ts export drags in @stylebot/css's postcss chain.
import BackgroundPageUtils from '../styles/utils';
import { GoogleDriveSyncMetadata, GetCommandsResponse } from '@stylebot/types';

export default Vue.extend({
  name: 'App',

  components: {
    Heading,
    TextBlock,
    MoreButton,
    PopupMoreMenu,
    StyleComponent,
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
    styles: Array<{ url: string; css: string; enabled: boolean }>;
    googleDriveSyncEnabled: boolean;
    googleDriveSyncMetadata?: GoogleDriveSyncMetadata;
    commands?: GetCommandsResponse;
    showMore: boolean;
  } {
    return {
      styles: [],
      isOpen: false,
      tab: undefined,
      readability: false,
      pageReaderable: true,
      googleDriveSyncEnabled: false,
      googleDriveSyncMetadata: undefined,
      commands: undefined,
      showMore: false,
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

    // Pages Stylebot's content script can't run on (chrome://, the Chrome
    // Web Store, PDFs, JSON/XML documents) — same check the background page
    // uses to decide whether it can inject styles at all.
    restricted(): boolean {
      return !!this.tab?.url && !BackgroundPageUtils.isValidUrl(this.tab.url);
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
        this.styles = styles.filter(style => style.css);
        this.readability = !!defaultStyle && defaultStyle.readability;
      });
    });

    getGoogleDriveSyncEnabled().then(enabled => {
      this.googleDriveSyncEnabled = enabled;
    });

    getCommands(commands => {
      this.commands = commands;
    });
  },
});
</script>

<style lang="scss">
@import '../styles/theme';

* {
  box-sizing: border-box;
}

// Buttons don't inherit font-family or color from the page by default.
button {
  font-family: inherit;
  color: inherit;
}

body {
  margin: 0;
  font-family: 'Public Sans', system-ui, sans-serif;
  font-size: 14px;
  background: var(--background);
  color: var(--foreground);
}

.popup {
  width: 320px;
}

.popup-header {
  padding: 14px 16px;
}

.popup-header-domain {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Compound selector so this beats Heading's own scoped color rule
// regardless of stylesheet order (same specificity would otherwise tie).
.popup-header-domain.popup-header-domain--muted {
  color: var(--muted-foreground);
}

// Small muted caption/meta text — trailing hints, subtitles, timestamps.
// Also used (as a plain span) by Readability.vue and SyncStylebot.vue.
.popup-caption {
  font-size: 11.5px;
  color: var(--muted-foreground);
}

.popup-header-subtitle {
  margin-top: 3px;
}

.popup-restricted-message {
  padding: 16px;
}

.popup-divider {
  height: 1px;
  background: var(--border);
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

.popup-icon {
  width: 18px;
  height: 18px;
  flex: none;
  vertical-align: -0.25em;
}
</style>
