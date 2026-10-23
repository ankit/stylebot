<template>
  <div v-if="published" class="gallery-status">
    <a
      v-if="!hasChanges"
      class="state published-link"
      :href="link"
      target="_blank"
      rel="noopener"
    >
      <tray-out-icon class="status-icon" />
      {{ t('published') }}
    </a>

    <template v-else>
      <span class="state">
        <tray-out-icon class="status-icon changed" />
        {{ t('unpublished_changes') }}
      </span>
      <s-button size="small" @click="openPublishing">
        {{ t('publish_update') }}
      </s-button>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton } from '@stylebot/components';
import { TrayOutIcon } from '@stylebot/icons';
import { getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryPublished } from '@stylebot/types';

/**
 * A published style's Gallery state under the editor: the live version,
 * linking to its Gallery page, or edits the Gallery doesn't have yet with a
 * way to publish them.
 */
export default Vue.extend({
  name: 'TheGalleryStatus',

  components: {
    SButton,
    TrayOutIcon,
  },

  computed: {
    published(): GalleryPublished | null {
      return this.$store.state.publishedGalleryStyle;
    },

    hasChanges(): boolean {
      return this.$store.getters.hasUnpublishedChanges;
    },

    link(): string {
      if (!this.published) {
        return '';
      }

      const { styleId, slug } = this.published;

      return getGalleryStyleUrl({ id: styleId, slug });
    },
  },

  methods: {
    openPublishing(): void {
      this.$store.commit('setPublishing', true);
    },
  },
});
</script>

<style lang="scss" scoped>
.gallery-status {
  flex: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 40px;
  padding: 0 6px 0 14px;
  border-top: 1px solid var(--panel-border);
}

.state {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: 13px;
  line-height: 1;
  color: var(--text-muted);
}

.status-icon {
  flex: none;
  color: var(--success);

  &.changed {
    color: var(--warning-icon);
  }
}

.published-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
  }

  @include focus-ring(2px);
}

.gallery-status .button.size-small {
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 500;
}
</style>
