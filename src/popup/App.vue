<template>
  <div class="popup">
    <popup-more-menu v-if="showMore" @back="showMore = false" />

    <template v-else>
      <div v-if="restricted">
        <div class="popup-header">
          <div class="popup-header-domain popup-header-domain--muted">
            {{ tab.url }}
          </div>
        </div>

        <div class="popup-divider" />

        <div class="popup-restricted-message">
          {{ t('restricted_page_description') }}
        </div>

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
          <div class="popup-header-domain">{{ domain }}</div>
          <div class="popup-caption popup-header-subtitle">
            {{ t('no_style_saved_for_site') }}
          </div>
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
:root {
  color-scheme: light dark;

  --popup-bg: #fff;
  --popup-fg: #191b1f;
  --popup-fg-muted: #767676;
  --popup-border: #e9eaee;
  --popup-hover-bg: #f2f3f6;

  --popup-accent: #2a5fd6;

  --popup-icon-btn-border: #dfe1e6;
  --popup-icon-btn-fg: #6a7180;

  --popup-notification-bg: #eef3ff;
  --popup-notification-border: #dbe4fb;

  --popup-focus-ring: var(--popup-accent);

  // ShortcutChip (shared with the readability dock) reads these directly.
  --main-foreground: var(--popup-fg);
  --muted-foreground: var(--popup-fg-muted);
}

@media (prefers-color-scheme: dark) {
  :root {
    --popup-bg: #1c1d21;
    --popup-fg: #eceef2;
    --popup-fg-muted: #7d838f;
    --popup-border: #2c2e34;
    --popup-hover-bg: #26282e;

    --popup-accent: #4d80f0;

    --popup-icon-btn-border: #34363d;
    --popup-icon-btn-fg: #9aa1ae;

    --popup-notification-bg: #1f2740;
    --popup-notification-border: #2b3654;
  }
}

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
  background: var(--popup-bg);
  color: var(--popup-fg);
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
  font-weight: 600;
  font-size: 14px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-header-domain--muted {
  color: var(--popup-fg-muted);
}

// Small muted caption/meta text — trailing hints, subtitles, timestamps.
.popup-caption {
  font-size: 11.5px;
  color: var(--popup-fg-muted);
}

.popup-header-subtitle {
  line-height: 1.4;
  margin-top: 3px;
}

.popup-restricted-message {
  padding: 16px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--popup-fg-muted);
}

.popup-divider {
  height: 1px;
  background: var(--popup-border);
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
