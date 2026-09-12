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

    <text-block class="release-text">
      {{ t('new_in_version', [version]) }}
      <span class="release-sep">—</span>
      <span class="release-link">{{ t('see_what_changed') }}</span>
    </text-block>

    <icon-button class="release-dismiss" :title="t('hide')" @click="dismiss">
      <x-icon :size="22" />
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
import { IconButton, TextBlock } from '@stylebot/components';

export default Vue.extend({
  name: 'ReleaseNotification',

  components: {
    XIcon,
    IconButton,
    TextBlock,
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
  padding: 12px 8px 12px 16px;
  background: var(--info);
  border-top: 1px solid var(--info-border);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }
}

.release-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
}

.release-text {
  flex: 1;
  min-width: 0;
}

.release-sep {
  color: var(--muted-foreground);
  margin: 0 2px;
}

.release-link {
  color: var(--primary);
}

.release-dismiss {
  flex: none;
}

.release-banner .release-dismiss:hover {
  background: var(--info-border);
}
</style>
