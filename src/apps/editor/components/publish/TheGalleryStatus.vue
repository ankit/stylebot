<template>
  <div v-if="published" class="gallery-status">
    <span v-if="!hasChanges" class="state">
      <s-status-dot tone="success" />
      {{ t('published') }}
      <span class="separator">·</span>
      <a class="version-link" :href="link" target="_blank" rel="noopener">
        {{ t('version_number', [String(published.version)]) }}
        <span class="arrow">↗</span>
      </a>
    </span>

    <template v-else>
      <span class="state">
        <s-status-dot tone="warning" />
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
import { SButton, SStatusDot } from '@stylebot/components';
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
    SStatusDot,
  },

  computed: {
    published(): GalleryPublished | null {
      return this.$store.state.publishedGalleryStyle;
    },

    hasChanges(): boolean {
      return this.$store.getters.hasUnpublishedChanges;
    },

    link(): string {
      return this.published ? getGalleryStyleUrl(this.published) : '';
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

.version-link {
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

.separator,
.arrow {
  color: var(--text-faint);
}

.gallery-status .button.size-small {
  padding: 7px 10px;
  font-size: 13px;
  font-weight: 500;
}
</style>
