<template>
  <div class="popup">
    <b-list-group v-if="tab && tab.id" class="list-group">
      <style-component
        v-for="style in styles"
        :key="style.url"
        :url="style.url"
        :disable-toggle="isOpen"
        :initial-enabled="style.enabled"
      />

      <readability :initial-readability="readability" />

      <toggle-stylebot :is-open="isOpen" :tab="tab" />

      <sync-stylebot v-if="googleDriveSyncEnabled" />

      <view-options />

      <release-notification />
    </b-list-group>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import StyleComponent from './components/Style.vue';
import ViewOptions from './components/ViewOptions.vue';
import Readability from './components/Readability.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';
import ReleaseNotification from './components/notifications/ReleaseNotification.vue';

import { getStyles, getCurrentTab, getIsStylebotOpen } from './utils';

// Bypasses @stylebot/sync, whose barrel also drags in runGoogleDriveSync's postcss dependency chain.
import { getGoogleDriveSyncEnabled } from '../sync/google-drive/sync-metadata';
import { GoogleDriveSyncMetadata } from '@stylebot/types';

export default Vue.extend({
  name: 'App',

  components: {
    ViewOptions,
    StyleComponent,
    ToggleStylebot,
    Readability,
    SyncStylebot,
    ReleaseNotification,
  },

  data(): {
    isOpen: boolean;
    readability: boolean;
    tab?: chrome.tabs.Tab;
    styles: Array<{ url: string; css: string; enabled: boolean }>;
    googleDriveSyncEnabled: boolean;
    googleDriveSyncMetadata?: GoogleDriveSyncMetadata;
  } {
    return {
      styles: [],
      isOpen: false,
      tab: undefined,
      readability: false,
      googleDriveSyncEnabled: false,
      googleDriveSyncMetadata: undefined,
    };
  },

  created() {
    getCurrentTab(tab => {
      this.tab = tab;

      getIsStylebotOpen(this.tab, isOpen => {
        this.isOpen = isOpen;
      });

      getStyles(this.tab, ({ styles, defaultStyle }) => {
        this.styles = styles.filter(style => style.css);
        this.readability = !!defaultStyle && defaultStyle.readability;
      });
    });

    getGoogleDriveSyncEnabled().then(enabled => {
      this.googleDriveSyncEnabled = enabled;
    });
  },
});
</script>

<style lang="scss">
// Only the pieces this popup's components use, not the full frameworks.
@import '~bootstrap/scss/functions';
@import '~bootstrap/scss/variables';
@import '~bootstrap/scss/mixins';
@import '~bootstrap/scss/root';
@import '~bootstrap/scss/reboot';
@import '~bootstrap/scss/type';
@import '~bootstrap/scss/transitions';
@import '~bootstrap/scss/buttons';
@import '~bootstrap/scss/custom-forms';
@import '~bootstrap/scss/list-group';

@import '~bootstrap-vue/src/variables';
@import '~bootstrap-vue/src/utilities';
@import '~bootstrap-vue/src/custom-controls';
@import '~bootstrap-vue/src/components/form-checkbox/index';

body,
span {
  margin: 0;
  font-size: 15px;
}

.popup {
  width: 280px;
}

.list-group {
  border-radius: 0;

  .list-group-item {
    &:focus {
      outline: none;
    }
  }
}

.popup-icon {
  width: 18px;
  height: 18px;
  margin-left: 5px;
  margin-right: 9px;
  vertical-align: -0.25em;
}

.full-row-toggle {
  cursor: pointer;
}
</style>
