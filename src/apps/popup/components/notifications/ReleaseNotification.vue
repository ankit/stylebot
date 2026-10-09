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

    <s-text class="release-text">
      {{ t('new_in_version', [version]) }}
      <span class="release-sep">—</span>
      <span class="release-link">{{ t('see_what_changed') }}</span>
    </s-text>

    <s-icon-button
      class="release-dismiss"
      :tooltip="t('hide')"
      @click="dismiss"
    >
      <x-icon :size="16" />
    </s-icon-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  getNotification,
  setNotification,
  getReleaseVersion,
  getReleaseNotificationId,
  getReleaseUrl,
} from '@stylebot/utils';

import { onEnterOrSpace } from '../../utils';
import { XIcon } from '@stylebot/icons';
import { SIconButton, SText } from '@stylebot/components';

export default Vue.extend({
  name: 'ReleaseNotification',

  components: {
    XIcon,
    SIconButton,
    SText,
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
        url: getReleaseUrl(),
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

  @include focus-ring;
}

.release-dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.release-text {
  flex: 1;
  min-width: 0;
}

.release-sep {
  color: var(--text-muted);
  margin: 0 2px;
}

.release-link {
  color: var(--accent-text);
}

.release-dismiss {
  flex: none;

  ::v-deep .icon-button {
    padding: 5px;

    &:hover {
      background: var(--info-border);
    }
  }
}
</style>
