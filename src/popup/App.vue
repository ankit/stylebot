<template>
  <div class="popup">
    <div v-if="restricted">
      <div class="popup-header">
        <heading as="h1" size="sm" class="popup-header-domain popup-header-domain--muted">
          {{ tab.url }}
        </heading>
      </div>

      <div class="popup-divider" />

      <text-block class="popup-restricted-message">
        {{ t('restricted_page_description') }}
      </text-block>

      <div class="popup-divider" />

      <div class="popup-footer">
        <manage-all-styles />
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
        <text-block size="caption">
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
        <settings-button />
      </div>

      <release-notification />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, TextBlock } from '@stylebot/components';

import StyleComponent from './components/Style.vue';
import SettingsButton from './components/SettingsButton.vue';
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
    SettingsButton,
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
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.popup-header-domain {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.popup-header-domain.popup-header-domain--muted {
  color: var(--muted-foreground);
}

.popup-caption {
  font-size: 11.5px;
  color: var(--muted-foreground);
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
</style>
