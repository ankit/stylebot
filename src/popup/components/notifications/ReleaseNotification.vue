<template>
  <div
    v-if="!seen"
    class="release-banner"
    role="button"
    tabindex="0"
    @click="open"
    @keydown="onKeydown"
  >
    <span class="release-dot" />

    <span class="release-text">
      {{ t('new_in_version', [version]) }}
      <span class="release-sep">—</span>
      <span class="release-link">{{ t('see_what_changed') }}</span>
    </span>

    <icon-button class="release-dismiss" :title="t('hide')" @click="dismiss">
      <x-icon :scale="1.2" />
    </icon-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  getNotification,
  setNotification,
  getReleaseVersion,
  getReleaseNotificationId,
} from '@stylebot/utils';

import { onEnterOrSpace } from '../../utils';
import { XIcon } from '@stylebot/icons';
import IconButton from '../IconButton.vue';

export default Vue.extend({
  name: 'ReleaseNotification',

  components: {
    XIcon,
    IconButton,
  },

  data(): {
    seen?: boolean;
    version: string;
  } {
    return {
      seen: false,
      version: getReleaseVersion(),
    };
  },

  async created() {
    this.seen = await getNotification(getReleaseNotificationId());
  },

  methods: {
    open(): void {
      chrome.tabs.create({
        url: `https://stylebot.dev/releases/${this.version}`,
      });

      window.close();
      this.markAsSeen();
    },

    onKeydown(event: KeyboardEvent): void {
      onEnterOrSpace(event, () => this.open());
    },

    dismiss(e: MouseEvent): void {
      e.preventDefault();
      e.stopPropagation();

      this.markAsSeen();
    },

    markAsSeen(): void {
      this.seen = true;
      setNotification(getReleaseNotificationId(), true);
    },
  },
});
</script>

<style lang="scss" scoped>
.release-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--popup-notification-bg);
  border-top: 1px solid var(--popup-notification-border);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--popup-focus-ring);
    outline-offset: -2px;
  }
}

.release-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--popup-accent);
}

.release-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}

.release-sep {
  color: var(--popup-fg-muted);
  margin: 0 2px;
}

.release-link {
  color: var(--popup-accent);
}

.release-dismiss {
  flex: none;
}
</style>
