<template>
  <div v-if="published" class="gallery-status">
    <span class="state">
      <s-status-dot :tone="hasChanges ? 'warning' : 'success'" />
      <a
        v-if="!hasChanges && link"
        class="published-link"
        :href="link"
        target="_blank"
        rel="noopener"
        :title="t('view_in_gallery')"
      >
        <s-text as="span" variant="muted">{{ t('published') }}</s-text>
      </a>
      <s-text v-else as="span" variant="muted">{{ stateText }}</s-text>
    </span>

    <s-button v-if="hasChanges" size="small" @click="openPublishing">
      {{ t('publish') }}
    </s-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SStatusDot, SText } from '@stylebot/components';
import { getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryPublished } from '@stylebot/types';

/**
 * A published style's gallery state under the editor: published, linking to
 * its gallery page, or with edits the gallery doesn't have yet.
 */
export default Vue.extend({
  name: 'TheGalleryStatus',

  components: {
    SButton,
    SStatusDot,
    SText,
  },

  computed: {
    published(): GalleryPublished | null {
      return this.$store.state.publishedGalleryStyle;
    },

    hasChanges(): boolean {
      return this.$store.getters.hasUnpublishedChanges;
    },

    stateText(): string {
      if (this.hasChanges) {
        return this.t('unpublished_changes');
      }

      return this.t('published');
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
  gap: 10px;
  min-height: 52px;
  padding: 10px 10px 10px 14px;
  border-top: 1px solid var(--panel-border);
  background: var(--panel-surface);
}

.state {
  display: flex;
  align-items: center;
  gap: 6px;
}

.published-link {
  text-decoration: none;

  &:hover .text {
    color: var(--text-primary);
    text-decoration: underline;
  }

  @include focus-ring(2px);
}
</style>
